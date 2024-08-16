const config = require('./config')
const nodeConfig = require(config.app.nodeConfig)
const ws = require(nodeConfig.app.ws)
const wsmysql = require(nodeConfig.app.wsmysql)
const wslogger = require(nodeConfig.app.wslogger)(config.app.logPath, 'hushsbay')
const { Server } = require('socket.io')
const Redis = require('ioredis') //not redis npm => redisAdapter로 할 수 없는 것들을 각 서버별로 store.publish를 통해 모두 처리
const redisAdapter = require('@socket.io/redis-adapter')
const { Worker } = require('worker_threads')
const cors = require('cors')

const DIR_PUBSUB = './pubsub/', DIR_SOCKET = './socket/'
const PING_TIMEOUT = 5000, PING_INTERVAL = 25000 //default

global.logger = wslogger //global이므로 global.을 빼고 사용해도 되나 모두 명시적으로 붙여서 사용하기로 함
global.pool = wsmysql.createPool(config.mysql.schema, true)

console.log('version:', process.version)
console.log('projPath:', __dirname)					
console.log('logPath:', config.app.logPath)
console.log('jwtExpiry:', nodeConfig.jwt.expiry)

//1. Was Server
const app = ws.util.initExpressApp('public')
const wasServer = ws.util.createWas(app, config.http.method) //프로젝트 hushsbay는 aws 기반(https는 로드밸런서 CLB 이용)이므로 여기서는 https가 아닌 http로 설정
wasServer.listen(config.http.port, () => { console.log('wasServer listening on ' + config.http.port) })

//2. Redis(ioredis) Server
const redisOpt = { host : nodeConfig.redis.host, port : nodeConfig.redis.port, password : nodeConfig.redis.pwd, db : config.redis.db }
global.store = new Redis(redisOpt)
global.pub = new Redis(redisOpt)
const sub = new Redis(redisOpt)
global.pub.on('error', err => console.error('ioredis pub error :', err.stack))
sub.psubscribe(ws.cons.pattern, (err, count) => { console.log('ioredis psubscribe pattern : ' + ws.cons.pattern) })
sub.on('pmessage', (pattern, channel, message) => { require(DIR_PUBSUB + 'pmessage')(pattern, channel, message) })
sub.on('error', err => { console.error('ioredis sub error:', err.stack) })
if (config.app.mainserver == 'Y') global.store.flushdb(function(err, result) { console.log('redis db flushed :', result) })
//현재 Redis가 멀티서버에서의 소켓연결정보 관리에만 사용중이므로 NodeJS 재시작시 해당 redis데이터베이스내 데이터를 모두 지우는 것이 가비지 정리 등 좋을 것 (다른 곳에 사용시 문제없는지 테스트 필요)

//3. Socket Server (with Redis Adapter)
const appSocket = ws.util.initExpressApp()
const socketServer = ws.util.createWas(appSocket, config.http.method) //not https (because of aws elastic load balancer)
const io = new Server(socketServer, { //여기 Server는 socket.io
	//autoConnect to false (모바일 connect후 로그인/로깅시 http호출 여러번 발생해서 false로 변경) : 웹은 끊어지면 다른 탭에서 연결, 모바일도 SocketIO.invoke 새로하므로 false로 해도 무방
	allowEIO3: false, autoConnect: false, pingTimeout: PING_TIMEOUT, pingInterval: PING_INTERVAL, cors: { origin: config.app.corsSocket, methods: ["GET", "POST"] }
})
io.adapter(redisAdapter(global.pub, sub))
io.listen(config.sock.port)
global.jay = io.of('/' + config.sock.namespace)

//const sockets = await global.jay.adapter.sockets(new Set()) //https://socket.io/docs/v4/adapter/
//const sockets = await global.jay.sockets //위 아래 둘 다 각 서버의 소켓 카운트만 가능 (따라서, 아래 코딩으로 사용하기)
/* https://socket.io/docs/v4/server-api/
const sockets = await global.jay.fetchSockets() //모든 소켓서버에 있는 정보 가져오기
console.log('socket count :', sockets.length)
for (let item of sockets) {
	const sock = await global.jay.in(item.id).fetchSockets() //소켓 한 개 //console.log(item.id, "=========", sock[0].id)	
}
const sockets = await global.jay.in("room1").fetchSockets() // return all Socket instances in the "room1" room of the main namespace
await global.jay.in(_socketid).socketsJoin(_roomid)
await global.jay.in(_socketid).socketsLeave(_roomid) */

global.jay.on('connection', async (socket) => {
	const _logTitle = 'connect'	
	try {
		const queryParam = socket.handshake.query
		if (queryParam && queryParam.userid && queryParam.userkey && queryParam.winid && queryParam.userip) {
			socket.userid = queryParam.userid
			socket.userkey = queryParam.userkey
			socket.winid = queryParam.winid
			socket.userip = queryParam.userip
		} else {
			ws.sock.warn(ws.cons.sock_ev_alert, socket, _logTitle, 'userid/userkey/winid/userip 모두 필요합니다.')
			socket.disconnect()
			return
		}
		if (queryParam.token) {
			if (!socket.usertoken) {
				const tokenInfo = { userid : queryParam.userid, token : queryParam.token }
				const jwtRet = await ws.jwt.verify(tokenInfo)
				if (jwtRet.code != ws.cons.CODE_OK) {
					ws.sock.warn(ws.cons.sock_ev_alert, socket, _logTitle, jwtRet.msg)
					socket.disconnect()
					return
				}
				socket.usertoken = queryParam.token
			}
		} else {
			ws.sock.warn(ws.cons.sock_ev_alert, socket, _logTitle, '소켓 연결시 인증 토큰이 필요합니다.') 
			socket.disconnect()
			return
		}
		await ws.redis.multiSetForUserkeySocket(socket)
		const pattern = ws.cons.key_str_socket + socket.userkey + ws.cons.easydeli //예) $$SW__userid;
		const stream = store.scanStream({ match : pattern + '*', count : ws.cons.scan_stream_cnt })
		stream.on('data', (resultKeys) => { //비동기 //call pmessage()
			for (let item of resultKeys) {
				const _sockid = item.split(ws.cons.easydeli)[1]
				if (_sockid != socket.id) { //PC웹과 모바일 구분 (모바일이라면 모바일 userkey로만 찾아 현재 소켓이 아니면 이전 소켓이므로 모두 kill)
					//기존 소켓 연결 끊기. adapter.remoteDisconnect 사용하지 않음 : 추가로 처리할 내용이 있어서 그대로 사용하기로 함
					ws.redis.pub('disconnect_prev_sock', { prevkey : item, socketid : socket.id, userkey : socket.userkey, userip : socket.userip }) //call pmessage()
				}
			}
		})
		ws.sock.broadcast(ws.cons.sock_ev_show_on, socket.userkey, 'all') //서버로 들어오는 것이 없고 클라이언트로 나가는 것만 있을 것임
		socket.on(ws.cons.sock_ev_disconnect, (reason) => require(DIR_SOCKET + ws.cons.sock_ev_disconnect)(socket, reason))
		socket.on(ws.cons.sock_ev_common, (param) => require(DIR_SOCKET + param.ev)(socket, param))
		socket.on('error', (err) => global.logger.error('socket error\n' + err.toString()))
	} catch (ex) {
		ws.sock.warn(ws.cons.sock_ev_alert, socket, _logTitle, ex)
		socket.disconnect() //setTimeout(() => socket.disconnect(), 1000)
	}
})
console.log('socketServer listening on ' + config.sock.port)

//cors는 엄밀히 말하면 웹브라우저 이슈인 것으로 보임. 예를 들어, 도메인이 없는 앱에서는 사이트URL(origin)이 없기 때문에 통제안됨
//실제로, 웹브라우저에서 요청시 그 도메인을 아래 config.app.corsRestful에 넣어 주면 통과되나 앱에서 요청시는 없어도 통과됨
//cors(corsOptions)을 빼면 웹에서는 CORS로 인해 Block되지만 앱에서는 잘 통과됨 (예를 들어, 노드같은 서버에서 호출해도 앱과 동일할 것임)
//결론적으로, cors는 설정하는 것으로 함 (웹이든 서버든 필요시 통과하도록 처리. 다만 서버는 최소한 IP 정도는 체크해서 허용하도록 해야 할 것임)
const corsOptions = { //for Rest
	origin : function (origin, callback) {
		if (!origin || config.app.corsRestful.indexOf(origin) > -1) { //!origin = in case of same origin
			callback(null, true)
		} else {
			const _msg = 'Not allowed by CORS : ' + origin
			global.logger.info(_msg)
			callback(new Error(_msg))
		}
	}
}

let rt = ['login', 'refresh_token']
for (let i = 0; i < rt.length; i++) app.use('/auth/' + rt[i], require('./route/auth/' + rt[i]))

rt = ['userlist', 'getuser', 'setuser']
for (let i = 0; i < rt.length; i++) app.use('/user/' + rt[i], require('./route/user/' + rt[i]))

rt = ['orgtree', 'empsearch', 'deptsearch', 'interfaceKeys', 'applyDept', 'applyUser']  
for (let i = 0; i < rt.length; i++) app.use('/org/' + rt[i], require('./route/org/' + rt[i])) 
app.use('/org/interfaceToDept', cors(corsOptions), require('./route/org/interfaceToDept')) //외부 인터페이스
app.use('/org/interfaceToUser', cors(corsOptions), require('./route/org/interfaceToUser')) //외부 인터페이스

rt = [
	'append_log', 'chk_redis', 'get_userinfo', 'qry_unread', 'qry_userlist', 'qry_orgtree', 'qry_portal', 'qry_msglist', 'get_roominfo',
	'proc_file', 'proc_image', 'get_msginfo', 'get_opengraph', 'proc_env', 'proc_picture'
] 
for (let i = 0; i < rt.length; i++) app.use('/msngr/' + rt[i], require('./route/msngr/' + rt[i])) 

if (config.app.mainserver == 'Y') {
	const worker = new Worker('./thread/worker.js')
	//현재는 리턴되는 메시지 없음 : 만료된 파일, 가비지 등 주기적 삭제 처리
}

ws.util.watchProcessError()

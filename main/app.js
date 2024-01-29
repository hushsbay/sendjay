const config = require('./config')
const nodeConfig = require(config.app.nodeConfig)
const ws = require(config.app.ws)
const wsmysql = require(config.app.wsmysql)
const wslogger = require(config.app.wslogger)(config.app.logPath, 'hushsbay')
const Redis = require('ioredis') //not redis npm => redisAdapter로 할 수 없는 과업을 각 서버별로 store.publish를 통해 모두 처리하는 개념임
const { Server } = require('socket.io')
const redisAdapter = require('@socket.io/redis-adapter') //특히, sockets set에서 각 socket을 바로 뽑기 힘들어 ioredis의 global.store.scanStream으로 처리

const DIR_PUBSUB = './pubsub/', DIR_SOCKET = './socket/'
const PING_TIMEOUT = 5000, PING_INTERVAL = 25000 //default

global.nodeConfig = nodeConfig
global.logger = wslogger
global.pool = wsmysql.createPool(config.mysql.schema, true)

console.log('version:', process.version)
console.log('projPath:', __dirname)					
console.log('logPath:', config.app.logPath)
console.log('jwtExpiry:', nodeConfig.jwt.expiry)

//1. Was Server
const app = ws.util.initExpressApp('public')
const wasServer = ws.util.createWas(app, config.http.method) //프로젝트 hushsbay는 aws 기반(https는 로드밸런서CLB 이용)이므로 여기서는 https가 아닌 http로 설정
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
//현재 Redis가 멀티서버에서의 소켓연결정보 관리에만 사용중이므로 NodeJS 재시작시 해당 redis데이터베이스내 데이터를 모두 지우는 것이 가비지정리 등에도 좋을 것임
if (config.redis.flush == 'Y') global.store.flushdb(function(err, result) { console.log('redis db flushed :', result) }) //Only one server flushes db (config.redis.flush == 'Y')

//3. Socket Server (with Redis Adapter)
const appSocket = ws.util.initExpressApp()
const socketServer = ws.util.createWas(appSocket, config.http.method) //not https (because of aws elastic load balancer)
const io = new Server(socketServer, { allowEIO3: false, autoConnect: true, pingTimeout: PING_TIMEOUT, pingInterval: PING_INTERVAL, cors: { origin: config.app.corsSocket, methods: ["GET", "POST"] }})
io.adapter(redisAdapter(global.pub, sub))
io.listen(config.sock.port)
global.jay = io.of('/' + config.sock.namespace)
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
		const pattern = ws.cons.key_str_socket + socket.userkey + ws.cons.easydeli
		const stream = store.scanStream({ match : pattern + '*', count : ws.cons.scan_stream_cnt })
		stream.on('data', (resultKeys) => { //아래는 비동기처리됨. //call pmessage()
			for (let item of resultKeys) {
				const _sockid = item.split(ws.cons.easydeli)[1]
				if (_sockid != socket.id) { //PC웹과 모바일 구분 (모바일이라면 모바일 userkey로만 찾아 현재 소켓이 아니면 이전 소켓이므로 모두 kill)
					//adapter.remoteDisconnect 사용하지 않음 : 추가로 처리할 내용이 있어서 그대로 사용하기로 함
					ws.redis.pub('disconnect_prev_sock', { prevkey : item, socketid : socket.id, userkey : socket.userkey, userip : socket.userip }) //call pmessage()
				}
			}
		})
		//ws.sock.broadcast(socket, ws.cons.sock_ev_show_on, socket.userkey, 'all') //서버로 들어오는 것이 없고 클라이언트로 나가는 것만 있을 것임
		socket.on(ws.cons.sock_ev_disconnect, (reason) => require(DIR_SOCKET + ws.cons.sock_ev_disconnect)(socket, reason))
		socket.on(ws.cons.sock_ev_common, (param) => require(DIR_SOCKET + param.ev)(socket, param))
		socket.on('error', (err) => global.logger.error('socket error\n' + err.toString()))
	} catch (ex) {
		ws.sock.warn(ws.cons.sock_ev_alert, socket, _logTitle, ex)
		socket.disconnect() //setTimeout(() => socket.disconnect(), 1000)
	}
})
console.log('socketServer listening on ' + config.sock.port)

// const cors = require('cors')
// const corsOptions = { //for Rest => 현재는 사용하지 않으나 향후 사용위해 그대로 두기
// 	origin : function (origin, callback) {
// 		if (!origin || config.app.corsRestful.indexOf(origin) > -1) { //!origin = in case of same origin
// 			callback(null, true)
// 		} else {
// 			const _msg = 'Not allowed by CORS : ' + origin
// 			global.logger.info(_msg)
// 			callback(new Error(_msg))
// 		}
// 	}
// }

app.use('/auth/login', require('./route/auth/login'))

let rt = ['userlist', 'getuser', 'setuser']
for (let i = 0; i < rt.length; i++) app.use('/user/' + rt[i], require('./route/user/' + rt[i]))

rt = ['orgtree', 'empsearch', 'deptsearch']
for (let i = 0; i < rt.length; i++) app.use('/org/' + rt[i], require('./route/org/' + rt[i])) 

rt = ['chk_redis']
for (let i = 0; i < rt.length; i++) app.use('/msngr/' + rt[i], require('./route/msngr/' + rt[i])) 

proc()
async function proc() {
    const sockets = await global.jay.adapter.sockets(new Set()) //https://socket.io/docs/v4/adapter/
	//const sockets1 = await global.jay.sockets //위 아래 둘 다 각 서버의 소켓 카운트만 가능
    console.log('socket count :', sockets.size) //, sockets1.size)
	const stream = global.store.scanStream({ match : ws.cons.key_str_socket + '*', count: ws.cons.scan_stream_cnt })
	stream.on('data', (resultKeys) => {
		for (let key of resultKeys) {
			const obj = ws.redis.getUserkeySocketidFromKey(key)
			if (sockets.has(obj.socketid)) {
				const socket = global.jay.sockets.get(obj.socketid)
				console.log('socket :', socket.id, socket.userkey, socket.userip, socket.winid)
			}
		}
	})
    setTimeout(() => { proc() }, 5000)
}

ws.util.watchProcessError()

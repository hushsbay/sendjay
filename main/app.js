const config = require('./config')
const nodeConfig = require(config.app.nodeConfig)
const ws = require(config.app.ws)
const wsmysql = require(config.app.wsmysql)
const wslogger = require(config.app.wslogger)(config.app.logPath, 'hushsbay')
const com = require('./common')

const DIR_PUBSUB = './pubsub/'
const PING_TIMEOUT = 5000, PING_INTERVAL = 25000 //default

global.nodeConfig = nodeConfig
global.logger = wslogger
global.pool = wsmysql.createPool(config.mysql.schema, true)

console.log('version:', process.version)
console.log('projPath:', __dirname)					
console.log('logPath:', config.app.logPath)

const app = ws.util.initExpressApp('public')
const wasServer = ws.util.createWas(app, config.http.method) //프로젝트 hushsbay는 aws 기반(https는 로드밸런서CLB 이용)이므로 여기서는 https가 아닌 http로 설정
wasServer.listen(config.http.port, () => { console.log('wasServer listening on ' + config.http.port) })

// const socketio = require('socket.io')
// const Redis = require('ioredis')
// const redisAdapter = require('socket.io-redis')

// const redisOpt = { host : nodeConfig.redis.host, port : nodeConfig.redis.port, password : nodeConfig.redis.pwd, db : config.redis.db }
// global.store = new Redis(redisOpt)
// global.pub = new Redis(redisOpt)
// const sub = new Redis(redisOpt)
// global.pub.on('error', err => console.error('ioredis pub error :', err.stack))
// //현재로선, Redis가 멀티서버에서의 소켓연결정보 관리에만 사용중이므로 NodeJS 재시작시 해당 redis데이터베이스내 데이터를 모두 지우는 것이 가비지정리 등에도 좋을 것임
// if (config.redis.flush == 'Y') global.store.flushdb(function(err, result) { console.log('redis db flushed :', result) }) //Only one server flushes db

// const appSocket = ws.util.initExpressApp()
// const socketServer = ws.util.createWas(appSocket, config.http.method) //not https (because of aws elastic load balancer)
// socketServer.listen(config.sock.port, () => { console.log('socketServer (namespace : ' + config.sock.namespace + ') listening on ' + config.sock.port) })
// const io = socketio(socketServer, { allowEIO3: false, autoConnect: true, pingTimeout: PING_TIMEOUT, pingInterval: PING_INTERVAL, cors: { origin: config.app.corsSocket, methods: ["GET", "POST"] }})
// io.adapter(redisAdapter({ host: nodeConfig.redis.host, port: nodeConfig.redis.port, password : nodeConfig.redis.pwd }))
// global.jay = io.of('/' + config.sock.namespace)

const cors = require('cors')
const { Server } = require('socket.io');
const { createClient } = require('redis');
const { createAdapter } = require('@socket.io/redis-adapter');

const appSocket = ws.util.initExpressApp()
const socketServer = ws.util.createWas(appSocket, config.http.method) //not https (because of aws elastic load balancer)
const io = new Server(socketServer, { allowEIO3: false, autoConnect: true, pingTimeout: PING_TIMEOUT, pingInterval: PING_INTERVAL, cors: { origin: config.app.corsSocket, methods: ["GET", "POST"] }})
global.store = createClient({ host: nodeConfig.redis.host, port: nodeConfig.redis.port, password : nodeConfig.redis.pwd, db : config.redis.db })
console.log("111")
global.pub = global.store.duplicate()
console.log("111222")
const sub = global.store.duplicate()
console.log("111333")
if (config.redis.flush == 'Y') global.store.flushdb(function(err, result) { console.log('redis db flushed :', result) }) //Only one server flushes db
//sub.psubscribe(com.cons.pattern, (err, count) => { console.log('ioredis psubscribe pattern : ' + com.cons.pattern) }) //ioredis (not socket.io-redis)
//sub.on('pmessage', (pattern, channel, message) => { require(DIR_PUBSUB + 'pmessage')(pattern, channel, message) })
//sub.on('error', err => { console.error('ioredis sub error:', err.stack) })

Promise.all([global.store.connect(), global.pub.connect(), sub.connect()]).then(() => {
    console.log("111333444")
    io.adapter(createAdapter(global.store, global.pub, sub))
    console.log("111333666")
    io.listen(config.sock.port, () => { console.log('socketServer listening on ' + config.sock.port) })
    global.jay = io.of('/' + config.sock.namespace)
    global.jay.on('connection', async (socket) => {
        console.log("@@@@@@@@@@@@@@@22222222222222")
    })
})

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

app.use('/auth/login', require('./route/auth/login'))

let rt = ['userlist', 'getuser', 'setuser']
for (let i = 0; i < rt.length; i++) app.use('/user/' + rt[i], require('./route/user/' + rt[i]))

rt = ['orgtree', 'empsearch', 'deptsearch']
for (let i = 0; i < rt.length; i++) app.use('/org/' + rt[i], require('./route/org/' + rt[i])) 

ws.util.watchProcessError()

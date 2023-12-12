const config = require('./config')
//const nodeConfig = require(config.app.nodeConfig)
const ws = require(config.app.ws)
const wslogger = require(config.app.wslogger)(config.app.logPath, 'hushsbay')

global.logger = wslogger
const app = ws.util.initExpressApp('public')
const wasServer = ws.util.createWas(app, config.http.method) //not https (because of aws load balancer)
wasServer.listen(config.http.port, () => { console.log('wasServer listening on ' + config.http.port) })

app.use('/org/orgtree', require('./route/org/orgtree')) 

const config = require('../config')
const nodeConfig = require(config.app.nodeConfig)
const ws = require(nodeConfig.app.ws)

module.exports = function(socket, param) {
	const _logTitle = param.ev
	try { //com.procWarn(null, socket, _logTitle, com.cons.rq + JSON.stringify(param))
		ws.sock.sendToMyOtherSocket(socket, param) //웹은 앱으로 요청하고 앱은 웹으로 응답함 (웹->앱 단방향 요청)
	} catch (ex) {
		ws.sock.warn(ws.cons.sock_ev_alert, socket, _logTitle, ex)
	}
}

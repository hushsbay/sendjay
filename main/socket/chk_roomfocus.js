const config = require('../config')
const ws = require(config.app.ws)

module.exports = function(socket, param) {
	const _logTitle = param.ev
	try { //com.procWarn(null, socket, _logTitle, com.cons.rq + JSON.stringify(param))
		console.log("44444444444"+JSON.stringify(param))
		ws.sock.sendToMyOtherSocket(socket, param) //웹은 앱으로 보내고(요청) 앱은 웹으로 보냄(응답)
	} catch (ex) {
		ws.sock.warn(ws.cons.sock_ev_alert, socket, _logTitle, ex)
	}
}

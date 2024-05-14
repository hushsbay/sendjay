const config = require('../config')
const ws = require(config.app.ws)

module.exports = function(socket, param) {
	const _logTitle = param.ev
	try { //com.procWarn(null, socket, _logTitle, com.cons.rq + JSON.stringify(param))
		console.log("1111111111"+JSON.stringify(param))
		socket.emit(ws.cons.sock_ev_common, param)
	} catch (ex) {
		ws.sock.warn(ws.cons.sock_ev_alert, socket, _logTitle, ex)
	}
}

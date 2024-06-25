const config = require('../config')
const ws = require(nodeConfig.app.ws)

module.exports = function(socket, param) {
	const _logTitle = param.ev, _roomid = param.returnTo
	try { //com.procWarn(null, socket, _logTitle, com.cons.rq + JSON.stringify(param))
		ws.sock.sendToRoom(socket, _roomid, param)
	} catch (ex) {
		ws.sock.warn(ws.cons.sock_ev_alert, socket, _logTitle, ex)
	}
}

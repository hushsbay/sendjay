const config = require('../config')
const ws = require(config.app.ws)

module.exports = async function(socket, param) {
	const _logTitle = param.ev
	try {
		socket.emit(ws.cons.sock_ev_common, param)
	} catch (ex) {
		ws.sock.warn(ws.cons.sock_ev_alert, socket, _logTitle, ex)
	}
}

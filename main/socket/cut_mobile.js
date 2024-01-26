const config = require('../../config')
const ws = require(config.app.ws)

module.exports = function(socket, param) {
	const _logTitle = param.ev
	try { //ws.sock.warn(null, socket, _logTitle, com.cons.rq + JSON.stringify(param))	
		const resVeri = ws.sock.compareUserId(param.data.userid, socket.userid)
		if (resVeri != '') throw new Error(resVeri)
		if (socket.userkey.startsWith(ws.cons.m_key)) throw new Error("Mobile userkey cannot do this job.")
		socket.emit(com.cons.sock_ev_common, param) //returns to web with no result
		ws.redis.sendToMyOtherSocket(socket, param) //goes to mobile app (for logout)
	} catch (ex) {
		ws.sock.warn(ws.cons.sock_ev_alert, socket, _logTitle, ex)
	}
}

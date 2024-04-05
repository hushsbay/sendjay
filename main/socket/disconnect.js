const config = require('../config')
const ws = require(config.app.ws)
//normal reason : 1. server namespace disconnect (from server) 2. client namespace disconnect (from client) 3. transport close (browser's page closed)
//abnormal reason : 1. ping timeout 2. transport error

module.exports = async function(socket, reason) {	
	const _logTitle = ws.cons.sock_ev_disconnect
	try { //userkey made to null when prevsocket disconnect
		if (socket.userkey) { //이전 소켓을 끊으려고 하는 pmessage에서 socket.prev=true로 주는데 sock_ev_show_off가 sock_ev_show_on보다 늦게 처리되어 on/off가 off로 보이는 걸 막기 위함
			if (!socket.prev) ws.sock.broadcast(socket, ws.cons.sock_ev_show_off, socket.userkey, 'all')
			await ws.redis.multiDelForUserkeySocket(socket)
		} //ws.sock.warn(null, socket, _logTitle, socket.userkey, socket.winid, socket.id, reason)
	} catch (ex) {
		console.log(ex.message)
		ws.sock.warn(ws.cons.sock_ev_alert, socket, _logTitle, ex) //disconnect이므로 끊어진 클라이언트로 소켓으로 오류가 전달되지 않을 수도 있을 것임
	}
}

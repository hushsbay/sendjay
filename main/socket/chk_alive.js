const config = require('../config')
const ws = require(config.app.ws)

module.exports = async function(socket, param) {
	const _logTitle = param.ev
	try { //ws.sock.warn(null, socket, _logTitle, JSON.stringify(param))	
		let userkeySocketArr = [], userkeyArr = []
		for (let userkey of param.data.userkeys) { //[userkey1,userkey2..]
			const arr = await ws.redis.getUserkeySocket(userkey) //redis에 있는 userkey 관련 정보 읽어옴			
			if (arr.length > 0) userkeySocketArr = userkeySocketArr.concat(arr)
		}
		const sockets = await global.jay.adapter.sockets(new Set()) //현재 살아 있는 소켓
		for (let key of userkeySocketArr) {
			const _obj = ws.redis.getUserkeySocketIdFromKey(key) //userkey와 socketid를 분리해서 _obj에 담기
			if (sockets.has(_obj.socketid)) userkeyArr.push(_obj.userkey) //해당 socketid가 연결되어 있는 소켓목록에 있으면 userkey 담아서 리턴하면 됨
		}
		param.data = userkeyArr
		socket.emit(ws.cons.sock_ev_common, param)	
	} catch (ex) {
		ws.sock.warn(ws.cons.sock_ev_alert, socket, _logTitle, ex)
	}
}

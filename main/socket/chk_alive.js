const config = require('../config')
const ws = require(nodeConfig.app.ws)

module.exports = async function(socket, param) {
	const _logTitle = param.ev
	try {  //ws.sock.warn(null, socket, _logTitle, JSON.stringify(param))	
		let userkeySocketArr = [], userkeyArr = []
		for (let userkey of param.data.userkeys) { //[userkey1,userkey2..]
			const arr = await ws.redis.getUserkeySocket(userkey) //redis에 있는 userkey 관련 정보 읽어옴			
			if (arr.length > 0) userkeySocketArr = userkeySocketArr.concat(arr) //예) $$SW__xxxx;~
		}
		//아래를 막는 것은 global.jay.adapter.sockets()가 multi server의 sockets를 모두 가지고 오는 것이 아닌
		//현재 서버의 것만 가지고 온다는 것임 (이전 버전에서는 모두 가져와서 처리했던 기억이 나는데 아무래도 변경된 것 같은 느낌임)
		//어쨋든, 방법을 찾지 못해서, sockets를 가져오지 않고 redis에 있는 정보를 그냥 믿고 사용하기로 함
		//어차피, redis에 있는 소켓 정보는 소켓이 disconnect될 때 제거되므로 실시간 관리된다고 보면 되는데
		//sockets로 한번 더 체크하려고 했던 것이었음
		// const sockets = await global.jay.adapter.sockets(new Set()) //현재 살아 있는 소켓
		// for (let key of userkeySocketArr) { //redis에 있는 특정 userkey들의 소켓 정보를 읽어 와서
		// 	const _obj = ws.redis.getUserkeySocketIdFromKey(key) //userkey와 socketid를 분리
		// 	console.log(key, _obj.socketid, "============")
		// 	if (sockets.has(_obj.socketid)) {
		// 		userkeyArr.push(_obj.userkey) //해당 socketid가 연결되어 있는 소켓목록에 있으면 userkey 담아서 리턴하면 됨
		// 		console.log(_obj.userkey, "@@@@@@@@")
		// 	}
		// }
		for (let key of userkeySocketArr) { //redis에 있는 특정 userkey들의 소켓 정보를 읽어 와서
			const _obj = ws.redis.getUserkeySocketIdFromKey(key) //userkey와 socketid를 분리
			userkeyArr.push(_obj.userkey) //userkey 담아서 리턴하면 됨
		}
		param.data = userkeyArr
		console.log(userkeyArr.toString()+"====")
		socket.emit(ws.cons.sock_ev_common, param)
	} catch (ex) {
		ws.sock.warn(ws.cons.sock_ev_alert, socket, _logTitle, ex)
	}
}

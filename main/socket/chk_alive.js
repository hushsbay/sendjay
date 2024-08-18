const config = require('../config')
const nodeConfig = require(config.app.nodeConfig)
const ws = require(nodeConfig.app.ws)

module.exports = async function(socket, param) {
	const _logTitle = param.ev
	try {  //ws.sock.warn(null, socket, _logTitle, JSON.stringify(param))	
		let userkeySocketArr = [], userkeyArr = [] //console.log(param.data.userkeys.toString())
		for (let userkey of param.data.userkeys) { //[userkey1,userkey2..]
			const arr = await ws.redis.getUserkeySocket(userkey) //redis에 있는 userkey 관련 정보 읽어옴			
			if (arr.length > 0) userkeySocketArr = userkeySocketArr.concat(arr) //예) $$SW__xxxx;~
		}
		//아래를 막는 것은 global.jay.adapter.sockets()가 multi server의 sockets를 모두 가지고 오는 것이 아닌 현재 서버의 것만 가지고 온다는 것임
		//어쨋든, 방법을 찾지 못해서, sockets를 가져오지 않고 redis에 있는 정보를 그냥 믿고 사용하기로 함
		//어차피, redis에 있는 소켓 정보는 소켓이 disconnect될 때 제거되므로 실시간 관리된다고 보면 되는데 sockets로 한번 더 체크하려고 했던 것이었음
		// const sockets = await global.jay.adapter.sockets(new Set()) //현재 살아 있는 소켓
		// for (let key of userkeySocketArr) { //redis에 있는 특정 userkey들의 소켓 정보를 읽어 와서
		// 	const _obj = ws.redis.getUserkeySocketIdFromKey(key) //userkey와 socketid를 분리
		// 	if (sockets.has(_obj.socketid)) userkeyArr.push(_obj.userkey) //해당 socketid가 연결되어 있는 소켓목록에 있으면 userkey 담아서 리턴하면 됨
		// } => app.js에 설명되어 있는 fetchSockets()을 이용해 더 정확한 소켓정보를 가져올 수 있겠으나 일단 아래 코딩으로 유지
		for (let key of userkeySocketArr) { //redis에 있는 특정 userkey들의 소켓 정보를 읽어 와서
			const _obj = ws.redis.getUserkeySocketIdFromKey(key) //userkey와 socketid를 분리
			userkeyArr.push(_obj.userkey) //userkey 담아서 리턴하면 됨
		}
		console.log("param.data.token", JSON.stringify(param))	
		if (param.data.token) {
			//app.js에서 바로 호출한 것임 (모바일만 적용) console.log("param.data.token", param.data.token)
		} else {
			param.data = userkeyArr
		}
		socket.emit(ws.cons.sock_ev_common, param)
	} catch (ex) {
		ws.sock.warn(ws.cons.sock_ev_alert, socket, _logTitle, ex)
	}
}

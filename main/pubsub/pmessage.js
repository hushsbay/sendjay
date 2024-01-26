const config = require('../../config')
const ws = require(config.app.ws)
//ioredis with sub.psubscribe() : 특정 socket서버로 전달된 메시지로 그 서버내에서 처리

module.exports = async (pattern, channel, message) => {
	
	const _chan = channel.replace(ws.cons.prefix, '') //console.log(pattern, channel, message) = $$S, $$disconnect_prev_sock, {"prevkey" ~}
	const _logTitle = _chan
	let obj //const obj = JSON.parse(message) //{"prevkey":"$$SD__q;/sendjay#fNVceK6CERrueMCpAAAC","socketid":"/sendjay#7psRJ_F6lf6_FB6nAAAA",~}

	try {
        obj = JSON.parse(message)
		if (_chan == 'disconnect_prev_sock') { //adapter.remoteDisconnect 사용하지 않음 : 아래 코딩처럼 처리할 내용이 있어서 그대로 사용하기로 함
			const prevsocketid = obj.prevkey.split(ws.cons.easydeli)[1]
			const prevSocket = global.jay.sockets.get(prevsocketid)
			if (prevSocket) { //Previous socket for current userkey exists in this server. 해당서버에 이전 소켓이 있으므로 연결 끊기.
				if (prevSocket.userkey.startsWith(ws.cons.m_key)) { //Mobile App
					if (prevSocket.userip != obj.userip) { //obj.userip might be undefined when it comes from worker01.js
						const param = { ev : ws.cons.sock_ev_cut_mobile, data : { userid : prevSocket.userid }, returnTo : "parent" }
						prevSocket.emit(ws.cons.sock_ev_common, param) //emit to client directly
						//가끔, 'connect - connect - disconnect(ping timeout)' 문제가 발생하며 아직 원인파악이 안됨 (async).
						//그런데 여기서 emit되어야 할 prevSocket.emit(cut_mobile)은 emit되지 않음. 
						//1) socket connect option인 forceNew를 false로 변경한 후엔 발생하지 않고는 있으나
						//   sendjay가 소켓 인스턴스 한개만 사용하므로 forceNew는 상관없다고 생각하였는데 이해는 안되는 상태임
						//2) 추가로, if userip 비교 넣어서 문제발생 안되도록 함
					} //ws.sock.warn(null, prevSocket, _logTitle, 'telling previous Mobile socket to finish ChatService =>', prevsocketid, obj.userkey)
				} else { //PC Web
					prevSocket.prev = true //prevSocket은 true로 해야 disconnect시 sock_ev_show_off emit하지 않음
					prevSocket.disconnect() //redis 데이터 처리(multiDelForUserkeySocket())는 disconnect.js에서 담당
				} //ws.sock.warn(null, prevSocket, _logTitle, 'telling previous Web socket to disconnect =>', prevsocketid, obj.userkey)
			} else { //ws.sock.warn(null, null, _logTitle, 'no socket in this server =>', prevsocketid, obj.userkey)
				await ws.redis.multiDelGarbageForUserkeySocket(obj.prevkey, true) //소켓정보 없으므로 가비지로 처리 (every socket server)
			}
		} else if (_chan == 'sendto_myother_socket') { //from read_msg.js, delete_msg.js
			const othersocketid = obj.otherkey.split(ws.cons.easydeli)[1]
			const otherSocket = global.jay.sockets.get(othersocketid)
			if (otherSocket) otherSocket.emit(ws.cons.sock_ev_common, obj.param)
		}
	} catch (ex) {
		const curSocket = global.jay.sockets.get(obj.socketid)
		if (curSocket) ws.sock.warn(ws.cons.sock_ev_toast, curSocket, _logTitle, ex) //only to socket server who published this message
	}

}

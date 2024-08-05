const config = require('../config')
const nodeConfig = require(config.app.nodeConfig)
const ws = require(nodeConfig.app.ws)
const wsmysql = require(nodeConfig.app.wsmysql)

module.exports = async function(socket, param) {
	const _logTitle = param.ev
	let conn, sql, data, len
	try { 
		const autokey_app = param.data.autokey_app
		const userid = socket.userid //param.data.userid
		console.log(autokey_app, userid, "%%%%")
		conn = await wsmysql.getConnFromPool(global.pool)
		if (socket.userkey.startsWith(ws.cons.w_key)) { //웹 -> 서버 -> 앱 (분실된 디바이스의 기존 연결된 소켓) 
			sql = "UPDATE Z_USER_TBL SET AUTOKEY_APP = ? WHERE USER_ID = ? "
			await wsmysql.query(conn, sql, [autokey_app, userid]) //나중에 분실된 노트북인 경우도 수동로그인 유도
			ws.sock.sendToMyOtherSocket(socket, param) //모바일기기 자동로그인 해제
			socket.emit(ws.cons.sock_ev_common, param) //단순 통지
		} else { //앱 (현재 소켓) -> 앱 (분실은 아니지만 중지하고자 하는 디바이스의 기존 연결된 소켓)
			//socket.emit(ws.cons.sock_ev_common, param) //pmessage.js에서 바로 모바일디바이스로 내려 보냄
		}
	} catch (ex) {
		ws.sock.warn(ws.cons.sock_ev_alert, socket, _logTitle, ex)
	} finally {
		wsmysql.closeConn(conn, _logTitle)
	}
}

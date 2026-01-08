const config = require('../config')
const nodeConfig = require(config.app.nodeConfig)
const ws = require(nodeConfig.app.ws)
const wsmysql = require(nodeConfig.app.wsmysql)

//get_roominfo.js는 rest통신을 위한 route/msngr 폴더에도 있는데 맨 처음 모바일 네이티브앱에서도 rest로 호출하다가
//디바이스가 대기모드나 슬립모드에 들어가면 jwt 갱신을 주기적으로 하는 것이 block되므로 토큰이 만료되는 상황이 와서
//모바일 네이티브앱에서는 /msngr/qry_unread는 (연결시 호출하는데 연결할 때 토큰이 새로 생성되므로) 문제가 없고
//나머지는 rest로 호출하는 것을 억제하고자 함 (그래서, 기존 get_roominfo.js를 socket 통신으로도 만들어 아래와 같이 사용)
//결론적으로, jwt 갱신을 위한 모바일 네이티브앱에서 http 호출은 없음. 자세한 내용은 route/auth/refresh_token.js에 설명되어 있음

module.exports = async function(socket, param) {
	const _logTitle = param.ev
	let conn, sql, data, len
	try {
		const userid = socket.userid
		const roomid = param.data.roomid
		conn = await wsmysql.getConnFromPool(global.pool)
		const ret = await ws.util.chkAccessUserWithTarget(conn, userid, roomid, "room")
		if (ret != "") throw new Error(ret)		
		sql = "SELECT A.NICKNM MAINNM, B.NICKNM NICKNM, A.ROOMNM, B.NOTI "
		sql += " FROM a_roommst_tbl A, a_roomdtl_tbl B "
		sql += "WHERE A.ROOMID = B.ROOMID "
		sql += "  AND A.ROOMID = ? AND B.USERID = ? "
		data = await wsmysql.query(conn, sql, [roomid, userid])
		if (data.length == 0) throw new Error(ws.cons.MSG_NO_DATA)
		//다른 소켓통신과 응답이 다르게 route/get_roominfo와 동일하게 넘어가야 함
		const rs = ws.http.resInit()
		rs.list = data
		rs.roomid = roomid
		param.data = rs
		socket.emit(ws.cons.sock_ev_common, param)
	} catch (ex) {
		ws.sock.warn(ws.cons.sock_ev_alert, socket, _logTitle, ex)
	} finally {
		wsmysql.closeConn(conn, _logTitle)
	}
}

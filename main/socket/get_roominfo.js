const config = require('../config')
const nodeConfig = require(config.app.nodeConfig)
const ws = require(nodeConfig.app.ws)
const wsmysql = require(nodeConfig.app.wsmysql)

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
		sql += " FROM A_ROOMMST_TBL A, A_ROOMDTL_TBL B "
		sql += "WHERE A.ROOMID = B.ROOMID "
		sql += "  AND A.ROOMID = ? AND B.USERID = ? "
		data = await wsmysql.query(conn, sql, [roomid, userid])
		if (data.length == 0) throw new Error(ws.cons.MSG_NO_DATA)
		param.data = data[0] 
		socket.emit(ws.cons.sock_ev_common, param)
	} catch (ex) {
		ws.sock.warn(ws.cons.sock_ev_alert, socket, _logTitle, ex)
	} finally {
		wsmysql.closeConn(conn, _logTitle)
	}
}

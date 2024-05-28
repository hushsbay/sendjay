const config = require('../config')
const ws = require(config.app.ws)
const wsmysql = require(config.app.wsmysql)

module.exports = async function(socket, param) {
	const _logTitle = param.ev
	let conn, sql, data, len
	try { //ws.sock.warn(null, socket, _logTitle, com.cons.rq + JSON.stringify(param), _roomid)
		const _msgid = param.data.msgid
		conn = await wsmysql.getConnFromPool(global.pool)
		const ret = await ws.util.chkAccessUserWithTarget(conn, socket.userid, _msgid, '')
		if (ret != '') throw new Error(ret)
		sql = "SELECT MSGID, ROOMID, CASE WHEN STATE2 = 'C' THEN " + ws.cons.cell_revoked + " ELSE BODY END BODY, BUFFER, TYP TYPE, STATE, FILESTATE FROM A_MSGMST_TBL WHERE MSGID = ? "
		data = await wsmysql.query(conn, sql, [_msgid]) //다른 room의 msgid 조회도 하므로 where 조건에 roomid 제외해야 함
		param.data.result = data //BUFFER not good for mobile since it is transmitted through App -> WebView by text data.
		socket.emit(ws.cons.sock_ev_common, param)
	} catch (ex) { //ws.sock.warn(null, socket, _logTitle, com.cons.rs + JSON.stringify(param), _roomid) //watch out for buffer data
		ws.sock.warn(ws.cons.sock_ev_alert, socket, _logTitle, ex, _roomid)
	} finally {
		wsmysql.closeConn(conn, _logTitle)
	}
}

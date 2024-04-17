const config = require('../../config')
const ws = require(config.app.ws)
const wsmysql = require(config.app.wsmysql)
const express = require('express')
const router = express.Router()

router.use(function(req, res, next) {
	req.title = 'qry_unread'
	next() //next('error')는 아래 ws.util.watchRouterError()로 연결
})

router.post('/', async function(req, res) {
	let conn, sql, data, len, userid
	try {
		const rs = ws.http.resInit()
		const dateFr = ws.util.setDateAdd(new Date(), ws.cons.max_days_to_fetch)
		const { roomid, msgid, type } = req.body
		conn = await wsmysql.getConnFromPool(global.pool)
		userid = await ws.jwt.chkToken(req, res) //사용자 부서 위변조체크 필요없으면 세번째 인자인 conn을 빼면 됨
		if (!userid) return
		if (roomid) {
			if (msgid) { //from mobile (before noti)
				sql = "SELECT COUNT(*) UNREAD "
				sql += " FROM A_MSGDTL_TBL "
				sql += "WHERE MSGID = ? AND ROOMID = ? AND RECEIVERID = ? AND STATE = '' AND RECEIVERID <> SENDERID "
				rs.list = await wsmysql.query(conn, sql, [msgid, roomid, userid])
			} else { //no unread display in case of invite/leave msg
				sql = "SELECT COUNT(*) UNREAD "
				sql += " FROM A_MSGDTL_TBL A "
				sql += "WHERE ROOMID = ? AND RECEIVERID = ? AND STATE = '' AND CDT >= ? AND RECEIVERID <> SENDERID "
				sql += "  AND (SELECT TYP FROM A_MSGMST_TBL WHERE MSGID = A.MSGID) NOT IN ('invite', 'leave') "
				rs.list = await wsmysql.query(conn, sql, [roomid, userid, dateFr])
			}
		} else if (type == 'U') { //from ChatService.kt. LASTCHKDT field below is for reconnecting socket on Mobile.
			await wsmysql.query(conn, "UPDATE Z_USER_TBL SET LASTCHKDT = sysdate(6) WHERE USER_ID = ? ", [userid])
		} else { //roomid가 없을 때는 최종 메시지 도착 일시 이후만 읽으면 됨 (재연결시 필요)
			data = await wsmysql.query(conn, "SELECT LASTCHKDT FROM Z_USER_TBL WHERE USER_ID = ? ", [userid])
			const dt = (data.length > 0 && data[0].LASTCHKDT != null) ? data[0].LASTCHKDT : dateFr
			sql = "SELECT ROOMID, COUNT(*) UNREAD, " //ADDINFO = for mobile only
			sql += "	  (SELECT CONCAT(MSGID, '" + ws.cons.deli + "', CONCAT(CDT, '" + ws.cons.deli + "', CONCAT(TYP, '" + ws.cons.deli + "', BODY))) " 
			sql += "	     FROM A_MSGMST_TBL WHERE ROOMID = A.ROOMID AND STATE = '' AND CDT >= '" + dt + "' ORDER BY CDT DESC LIMIT 1) ADDINFO "
			sql += " FROM A_MSGDTL_TBL A "
			sql += "WHERE RECEIVERID = ? AND STATE = '' AND CDT >= ? AND RECEIVERID <> SENDERID "
			sql += "GROUP BY ROOMID "
			rs.list = await wsmysql.query(conn, sql, [userid, dt]) //console.log(rs.list.length+"====qry_unread====reconnect")
		}
		ws.http.resJson(res, rs) //세번째 인자가 있으면 token 생성(갱신)해 내림
	} catch (ex) {
		ws.http.resException(req, res, ex)
	} finally {
		wsmysql.closeConn(conn, req.title)
	}
})

ws.util.watchRouterError(router)

module.exports = router

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
	let conn, sql, data, len
	try {
		const rs = ws.http.resInit()
		let dateFr = ws.util.setDateAdd(new Date(), ws.cons.max_days_to_fetch) //예) 1년전(-365)으로 설정
		const { roomid, msgid, type } = req.body
		conn = await wsmysql.getConnFromPool(global.pool)
		const objToken = await ws.jwt.chkToken(req, res) //res : 오류시 바로 클라이언트로 응답. conn : 사용자 조직정보 위변조체크
		const userid = objToken.userid
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
		} else if (type == 'U') { //모바일에서만 호출. from ChatService.kt. LASTCHKDT 필드는 재연결시만 사용
			await wsmysql.query(conn, "UPDATE Z_USER_TBL SET LASTCHKDT = sysdate(6) WHERE USER_ID = ? ", [userid])
		} else {
			if (type == 'R') { //모바일에서만 호출. from ChatService.kt. LASTCHKDT 필드는 재연결시만 사용
				//웹뷰가 아닌 앱에서의 재연결시 알림을 목적으로 하는 루틴은 사용자가 한번 알림을 보고 나서는 그 다음엔 다시 재연결해도 새로 알림을 표시하지 않아야 성가시지 않음
				data = await wsmysql.query(conn, "SELECT LASTCHKDT FROM Z_USER_TBL WHERE USER_ID = ? ", [userid])
				if (data.length > 0 && data[0].LASTCHKDT != null) dateFr = data[0].LASTCHKDT
				//const dt = (data.length > 0 && data[0].LASTCHKDT != null) ? data[0].LASTCHKDT : dateFr
			} else { 
				//웹브라우저 및 웹뷰에서 호출 (앱 알림과는 다르게 동작해야 함)
				//아래 SQL과 위 roomid 있는 경우는 where 조건이 같아야 같은 결과를 낼 것임 (특히, CDT)
			}
			sql = "SELECT ROOMID, COUNT(*) UNREAD, " //ADDINFO = for mobile only
			sql += "	  (SELECT CONCAT(MSGID, '" + com.cons.deli + "', CONCAT(CDT, '" + com.cons.deli + "', CONCAT(TYP, '" + com.cons.deli + "', BODY))) " //STATE='' 인 경우이므로 아래 CASE WHEN 필요없음
			//sql += "	  (SELECT CONCAT(MSGID, '" + ws.cons.deli + "', CONCAT(CDT, '" + ws.cons.deli + "', CONCAT(TYP, '" + ws.cons.deli + "', CASE WHEN STATE2 = 'C' THEN " + ws.cons.cell_revoked + " ELSE BODY END))) " 
			sql += "	     FROM A_MSGMST_TBL WHERE ROOMID = A.ROOMID AND STATE = '' AND CDT >= '" + dateFr + "' ORDER BY CDT DESC LIMIT 1) ADDINFO "
			sql += " FROM A_MSGDTL_TBL A "
			sql += "WHERE RECEIVERID = ? AND STATE = '' AND CDT >= ? AND RECEIVERID <> SENDERID "
			sql += "GROUP BY ROOMID "
			rs.list = await wsmysql.query(conn, sql, [userid, dateFr]) //console.log(rs.list.length+"====qry_unread====reconnect")
		}
		ws.http.resJson(res, rs) //세번째 인자(userid) 있으면 token 갱신
	} catch (ex) {
		ws.http.resException(req, res, ex)
	} finally {
		wsmysql.closeConn(conn, req.title)
	}
})

ws.util.watchRouterError(router)

module.exports = router

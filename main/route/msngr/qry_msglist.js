const config = require('../../config')
const ws = require(config.app.ws)
const wsmysql = require(config.app.wsmysql)
const express = require('express')
const router = express.Router()

router.use(function(req, res, next) {
	req.title = 'qry_msglist'
	next() //next('error') for going to ws.util.watchRouterError() below
})

router.post('/', async function(req, res) {
	let conn, sql, data, len, userid
	try {
		const rs = ws.http.resInit()
		const dateFr = ws.util.setDateAdd(new Date(), ws.cons.max_days_to_fetch)
		let { type, roomid, keyword, dt, start, end, senderid, cnt } = req.body
		keyword = decodeURIComponent(keyword) || ''
		cnt = parseInt(cnt)
		conn = await wsmysql.getConnFromPool(global.pool)
		userid = await ws.jwt.chkToken(req, res, conn) //사용자 부서 위변조체크 필요없으면 세번째 인자인 conn을 빼면 됨
		if (!userid) return
		if (type == 'after') {
			sql = "SELECT CDT FROM A_MSGMST_TBL WHERE MSGID = ? AND ROOMID = ? "
			data = await wsmysql.query(conn, sql, [keyword, roomid])
			if (data.length == 0) {
				ws.http.resWarn(res, ws.cons.MSG_NO_DATA, true)
				return
				//rs.code = ws.cons.CODE_NO_DATA
				//rs.msg = ws.cons.MSG_NO_DATA
				//ws.http.resJson(res, rs) //세번째 인자가 있으면 token 생성(갱신)해 내림
				//return
			}
			dt = data[0].CDT
		}
		let arg 
		console.log(dateFr, type, userid, roomid, keyword, dt, start, end, senderid, cnt)
		sql = "SELECT A.MSGID, A.CDT, A.SENDERID, A.SENDERNM, B.RECEIVERID, A.BODY, A.BUFFER, A.REPLY, A.TYP TYPE, B.STATE, A.FILESTATE, "
		sql += "		  CASE WHEN A.BUFFER IS NULL THEN NULL ELSE 'Y' END BUFFERSTR, " 
		sql += "          (SELECT COUNT(*) FROM A_MSGDTL_TBL WHERE MSGID = B.MSGID AND ROOMID = B.ROOMID AND STATE = '') CNT "
		sql += "     FROM A_MSGDTL_TBL B "
		sql += "	 LEFT OUTER JOIN A_MSGMST_TBL A ON B.MSGID = A.MSGID "
		sql += "	WHERE B.ROOMID = ? AND B.RECEIVERID = ? AND B.STATE IN ('', 'R') AND A.CDT >= ? "
		if (type == 'search') {
			sql += "  AND A.BODY LIKE '%" + keyword + "%' "
			sql += "ORDER BY A.CDT LIMIT 0, ? "
			arg = [roomid, userid, dateFr, cnt]
			console.log(sql, roomid, userid, dateFr, cnt)
		} else if (type == 'etc') {
			sql += "  AND (A.TYP IN ('file', 'flink', 'image') OR (A.TYP = 'talk' AND (A.BODY LIKE '%http://%' OR A.BODY LIKE '%https://%'))) "
			sql += "  AND A.BODY <> '" + ws.cons.cell_revoked + "' "
			sql += "ORDER BY A.CDT LIMIT 0, ? "
			arg = [roomid, userid, dateFr, cnt]
		} else if (type == 'result') {
			sql += "  AND A.CDT >= ? AND A.CDT < ? "
			sql += "ORDER BY A.CDT DESC "
			arg = [roomid, userid, dateFr, start, end]
		} else if (type == 'onlyone') {
			sql += "  AND A.CDT < ? "
			sql += "  AND B.SENDERID = ? "
			sql += "ORDER BY A.CDT DESC LIMIT 0, ? "
			arg = [roomid, userid, dateFr, dt, senderid, cnt]
		} else if (type == 'after') { //from mobile (before noti). UDT needed for checking revoked msg when connect after disconnect
			sql += "  AND (A.CDT > ? OR A.UDT > ?) "
			sql += "ORDER BY A.CDT "
			arg = [roomid, userid, dateFr, dt, dt]			
		} else { //normal
			sql += "  AND A.CDT < ? "
			sql += "ORDER BY A.CDT DESC LIMIT 0, ? "
			arg = [roomid, userid, dateFr, dt, cnt]
		}
		data = await wsmysql.query(conn, sql, arg)
		len = data.length
		if (data.length == 0) {
			ws.http.resWarn(res, ws.cons.MSG_NO_DATA, true)
			return
		}
		rs.list = data
		ws.http.resJson(res, rs, userid) //세번째 인자가 있으면 token 생성(갱신)해 내림
	} catch (ex) {
		ws.http.resException(req, res, ex)
	} finally {
		wsmysql.closeConn(conn, req.title)
	}
})

ws.util.watchRouterError(router)

module.exports = router

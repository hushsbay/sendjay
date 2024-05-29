const config = require('../../config')
const ws = require(config.app.ws)
const wsmysql = require(config.app.wsmysql)
const express = require('express')
const router = express.Router()

router.use(function(req, res, next) {
	req.title = 'qry_msglist'
	next() //next('error')는 아래 ws.util.watchRouterError()로 연결
})

router.post('/', async function(req, res) {
	let conn, sql, data, len
	try {
		const rs = ws.http.resInit()
		const dateFr = ws.util.setDateAdd(new Date(), ws.cons.max_days_to_fetch)
		let { type, roomid, keyword, dt, start, end, senderid, cnt } = req.body
		keyword = decodeURIComponent(keyword) || ''
		cnt = parseInt(cnt)
		conn = await wsmysql.getConnFromPool(global.pool)
		const objToken = await ws.jwt.chkToken(req, res) //res : 오류시 바로 클라이언트로 응답. conn : 사용자 조직정보 위변조체크
		const userid = objToken.userid
		if (!userid) return
		const ret = await ws.util.chkAccessUserWithTarget(conn, userid, roomid, 'room')
		if (ret != '') throw new Error(ret)
		if (type == 'after') {
			sql = "SELECT CDT FROM A_MSGMST_TBL WHERE MSGID = ? AND ROOMID = ? "
			data = await wsmysql.query(conn, sql, [keyword, roomid])
			if (data.length == 0) {
				ws.http.resWarn(res, ws.cons.MSG_NO_DATA, true)
				return
			}
			dt = data[0].CDT
		}
		let arg //console.log(dateFr, type, userid, roomid, keyword, dt, start, end, senderid, cnt)
		sql = "SELECT A.MSGID, A.CDT, A.SENDERID, A.SENDERNM, B.RECEIVERID, CASE WHEN STATE2 = 'C' THEN '" + ws.cons.cell_revoked + "' ELSE A.BODY END BODY, "
		sql += "      A.BUFFER, A.REPLY, A.TYP TYPE, B.STATE, A.FILESTATE, CASE WHEN A.BUFFER IS NULL THEN NULL ELSE 'Y' END BUFFERSTR, " 
		sql += "      (SELECT COUNT(*) FROM A_MSGDTL_TBL WHERE MSGID = B.MSGID AND ROOMID = B.ROOMID AND STATE = '') CNT "
		sql += " FROM A_MSGDTL_TBL B "
		sql += " LEFT OUTER JOIN A_MSGMST_TBL A ON B.MSGID = A.MSGID "
		sql += "WHERE B.ROOMID = ? AND B.RECEIVERID = ? AND B.STATE IN ('', 'R') AND A.CDT >= ? "
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
		console.log(sql+"====")
		data = await wsmysql.query(conn, sql, arg)
		len = data.length
		if (data.length == 0) {
			ws.http.resWarn(res, ws.cons.MSG_NO_DATA, true)
			return
		}
		rs.list = data
		ws.http.resJson(res, rs, userid) //세번째 인자(userid) 있으면 token 갱신
	} catch (ex) {
		ws.http.resException(req, res, ex)
	} finally {
		wsmysql.closeConn(conn, req.title)
	}
})

ws.util.watchRouterError(router)

module.exports = router

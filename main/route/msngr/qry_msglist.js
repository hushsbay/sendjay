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
		let { _type, _roomid, _keyword, _dt, _start, _end, _senderid, _cnt } = req.body
		_keyword = decodeURIComponent(_keyword) || ''
		_cnt = parseInt(_cnt)
		//const _type = req.query.type
		//const _userid = req.cookies.userid
		//const _roomid = req.query.roomid
		//const _keyword = decodeURIComponent(req.query.keyword) || ''
		// let _dt = req.query.dt
		// const _start = req.query.start
		// const _end = req.query.end
		// const _senderid = req.query.senderid
		// const _cnt = parseInt(req.query.cnt)
		conn = await wsmysql.getConnFromPool(global.pool)
		userid = await ws.jwt.chkToken(req, res, conn) //사용자 부서 위변조체크 필요없으면 세번째 인자인 conn을 빼면 됨
		if (!userid) return
		if (_type == 'after') {
			const qryA = "SELECT CDT FROM A_MSGMST_TBL WHERE MSGID = ? AND ROOMID = ? "
			const dataA = await wsmysql.query(conn, qryA, [_keyword, _roomid])
			if (dataA.length == 0) {
				rs.code = ws.cons.WARN_NOT_EXIST
				rs.msg = ws.cons.MSG_NO_DATA
				resolve(rs)
			}
			_dt = dataA[0].CDT
		}
		let arg //console.log(dateFr, _type, userid, _roomid, _keyword, _dt, _start, _end, _senderid, _cnt)
		sql = "SELECT A.MSGID, A.CDT, A.SENDERID, A.SENDERNM, B.RECEIVERID, A.BODY, A.BUFFER, A.REPLY, A.TYP TYPE, B.STATE, A.FILESTATE, "
		sql += "		  CASE WHEN A.BUFFER IS NULL THEN NULL ELSE 'Y' END BUFFERSTR, " 
		sql += "          (SELECT COUNT(*) FROM A_MSGDTL_TBL WHERE MSGID = B.MSGID AND ROOMID = B.ROOMID AND STATE = '') CNT "
		sql += "     FROM A_MSGDTL_TBL B "
		sql += "	 LEFT OUTER JOIN A_MSGMST_TBL A ON B.MSGID = A.MSGID "
		sql += "	WHERE B.ROOMID = ? AND B.RECEIVERID = ? AND B.STATE IN ('', 'R') AND A.CDT >= ? "
		if (_type == 'search') {
			sql += "  AND A.BODY LIKE '%" + _keyword + "%' "
			sql += "ORDER BY A.CDT LIMIT 0, ? "
			arg = [_roomid, userid, dateFr, _cnt]
			console.log(sql, _roomid, userid, dateFr, _cnt)
		} else if (_type == 'etc') {
			sql += "  AND (A.TYP IN ('file', 'flink', 'image') OR (A.TYP = 'talk' AND (A.BODY LIKE '%http://%' OR A.BODY LIKE '%https://%'))) "
			sql += "  AND A.BODY <> '" + ws.cons.cell_revoked + "' "
			sql += "ORDER BY A.CDT LIMIT 0, ? "
			arg = [_roomid, userid, dateFr, _cnt]
		} else if (_type == 'result') {
			sql += "  AND A.CDT >= ? AND A.CDT < ? "
			sql += "ORDER BY A.CDT DESC "
			arg = [_roomid, userid, dateFr, _start, _end]
		} else if (_type == 'onlyone') {
			sql += "  AND A.CDT < ? "
			sql += "  AND B.SENDERID = ? "
			sql += "ORDER BY A.CDT DESC LIMIT 0, ? "
			arg = [_roomid, userid, dateFr, _dt, _senderid, _cnt]
		} else if (_type == 'after') { //from mobile (before noti). UDT needed for checking revoked msg when connect after disconnect
			sql += "  AND (A.CDT > ? OR A.UDT > ?) "
			sql += "ORDER BY A.CDT "
			arg = [_roomid, userid, dateFr, _dt, _dt]			
		} else { //normal
			sql += "  AND A.CDT < ? "
			sql += "ORDER BY A.CDT DESC LIMIT 0, ? "
			arg = [_roomid, userid, dateFr, _dt, _cnt]
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

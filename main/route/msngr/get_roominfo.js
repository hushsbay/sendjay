const config = require('../../config')
const ws = require(config.app.ws)
const wsmysql = require(config.app.wsmysql)
const express = require('express')
const router = express.Router()

router.use(function(req, res, next) {
	req.title = 'get_roominfo'
	next() //next('error')는 아래 ws.util.watchRouterError()로 연결
})

router.post('/', async function(req, res) {
	let conn, sql, data, len
	try {
		const rs = ws.http.resInit()	
		const roomid = req.body.roomid
		conn = await wsmysql.getConnFromPool(global.pool)
		const objToken = await ws.jwt.chkToken(req, res) //res : 오류시 바로 클라이언트로 응답. conn : 사용자 조직정보 위변조체크
		const userid = objToken.userid
		if (!userid) return
		sql = "SELECT A.NICKNM MAINNM, B.NICKNM NICKNM, A.ROOMNM, B.NOTI "
		sql += " FROM A_ROOMMST_TBL A, A_ROOMDTL_TBL B "
		sql += "WHERE A.ROOMID = B.ROOMID "
		sql += "  AND A.ROOMID = '" + roomid + "' AND B.USERID = '" + userid + "' "
		data = await wsmysql.query(conn, sql, null)
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

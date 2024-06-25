const config = require('../../config')
const ws = require(nodeConfig.app.ws)
const wsmysql = require(nodeConfig.app.wsmysql)
const express = require('express')
const router = express.Router()

router.use(function(req, res, next) {
	req.title = 'append_log'
	next() //next('error')는 아래 ws.util.watchRouterError()로 연결
})

router.post('/', async function(req, res) {
	let conn, sql, data, len
	try {
		const rs = ws.http.resInit()
		const { device, work, state, dur, cdt, udt } = req.body
		console.log(cdt, udt, dur)
		conn = await wsmysql.getConnFromPool(global.pool)
		const objToken = await ws.jwt.chkToken(req, res) //res : 오류시 바로 클라이언트로 응답. conn : 사용자 조직정보 위변조체크
		const userid = objToken.userid
		if (!userid) return
		sql = "INSERT Z_ACTLOG_TBL (USER_ID, DEVICE, WORK, STATE, DUR, CDT, UDT, ISUDT) values (?, ?, ?, ?, ?, ?, ?, sysdate(6)) "
		await wsmysql.query(conn, sql, [userid, device, work, state, dur, cdt, udt])
		ws.http.resJson(res, rs) //세번째 인자(userid) 있으면 token 갱신
	} catch (ex) {
		ws.http.resException(req, res, ex)
	} finally {
		wsmysql.closeConn(conn, req.title)
	}
})

ws.util.watchRouterError(router)

module.exports = router

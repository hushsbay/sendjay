const config = require('../../config')
const nodeConfig = require(config.app.nodeConfig)
const ws = require(nodeConfig.app.ws)
const wsmysql = require(nodeConfig.app.wsmysql)
const express = require('express')
const router = express.Router()

router.use(function(req, res, next) {
	req.title = 'interfaceKeys'
	next() //next('error')는 아래 ws.util.watchRouterError()로 연결
})

router.post('/', async function(req, res) {
	let conn, sql, data, len
	try {
		const rs = ws.http.resInit()
		rs.dept = []
		rs.user = []
		conn = await wsmysql.getConnFromPool(global.pool)
		sql = "SELECT DISTINCT DTKEY FROM Z_INTORG_TBL ORDER BY DTKEY DESC LIMIT 0, 10 "
		data = await wsmysql.query(conn, sql, null)
		if (data.length > 0) rs.dept = data
		sql = "SELECT DISTINCT DTKEY FROM Z_INTUSER_TBL ORDER BY DTKEY DESC LIMIT 0, 10 "
		data = await wsmysql.query(conn, sql, null)
		if (data.length > 0) rs.user = data
		ws.http.resJson(res, rs) //세번째 인자(userid) 있으면 token 갱신
	} catch (ex) {
		ws.http.resException(req, res, ex)
	} finally {
		wsmysql.closeConn(conn, req.title)
	}
})

ws.util.watchRouterError(router)

module.exports = router

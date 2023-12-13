const config = require('../../config')
const ws = require(config.app.ws)
//const wsmysql = require(config.app.wsmysql)
const express = require('express')
const router = express.Router()

const title = 'orgtree'

router.use(function(req, res, next) { //필요시 next("오류내용")으로 오류 watchRouterError(아래)로 전달
	next()
})

router.post('/', async function(req, res, next) {
	let conn, sql, data, len
	const rs = ws.http.resInit()
	try {
		//ws.util.logi('111')
		ws.http.resWarn(res, '222', true)
		return
		//res.json(rs)
	} catch (ex) {
		ws.util.loge(ex, title)
		ws.http.resJson(res, '-1', ex, title)
	} finally {
		ws.util.mysqlDisconnect(conn, title)
	}
})

ws.util.watchRouterError(router, title)

module.exports = router
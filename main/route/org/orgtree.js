const config = require('../../config')
const ws = require(config.app.ws)
//const wsmysql = require(config.app.wsmysql)
const express = require('express')
const router = express.Router()

const logtitle = "orgtree"

router.use(async function(req, res, next) {
	//try {
		throw new Error00("4444")
	//	next()
	//} catch (ex) {
	//	ws.util.logi(ex, "#####")
	//}
})

router.post('/', async function(req, res, next) {
	let conn, sql, data, len
	const rs = ws.http.resInit()
	try {
		ws.util.logi('후후후000')
		ws.http.resWarn(res, '가나다000')
		return
		console.log("안찍혀야 함...")
		res.json(rs)
	} catch (ex) {
		ws.util.loge(ex, logtitle)
		ws.http.resJson(res, '-1', ex, logtitle)
	} finally {
		//try { conn.release() } catch (ex) { ws.util.loge(ws.cons.mysql_close_error, logtitle) }
		ws.util.mysqlDisconnect(conn, logtitle)
	}
})

router.use(function(err, req, res, next) {
	ws.util.loge(err, logtitle)
	ws.http.resJson(res, '-1', err, logtitle)
})

module.exports = router
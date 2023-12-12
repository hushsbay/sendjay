const config = require('../../config')
const ws = require(config.app.ws)
//const wsmysql = require(config.app.wsmysql)
const express = require('express')
const router = express.Router()

const logTitle = "orgtree"

router.post('/', async function(req, res, next) {
	let conn, sql, data, len
	const rs = ws.http.resInit()
	try {
		console.log(router.path, "=======")
		res.json(rs)
	} catch (ex) {
		//ws.log.ex(req, ex, logTitle)
		console.log(logTitle, ex.message)
		ws.http.resJson(res, '-1', ex.message, logTitle)
	} finally {
		//try { conn.release() } catch (ex) { console.log(ws.cons.mysql_close_error) }
	}
})

router.use(function(err, req, res, next) {
	//global.log.error(logTitle, err.message)
	console.log(logTitle, err.message)
	ws.http.resJson(res, '-1', err.message, logTitle)
})

module.exports = router
const config = require('../../config')
const ws = require(config.app.ws)
//const wsmysql = require(config.app.wsmysql)
const express = require('express')
const router = express.Router()

const logtitle = "orgtree"

router.post('/', async function(req, res, next) {
	let conn, sql, data, len
	const rs = ws.http.resInit()
	try {
		//global.logger.info(logTitle+"=============111")
		//global.logger.info(logTitle+"=============", { message:'0000하하하'})
		ws.util.logi('후후후')
		ws.util.warnError("없음..!!!!")
		console.log("안찍혀야 함...")
		res.json(rs)
	} catch (ex) {
		//global.logger.error(ex.message + '======')
		ws.util.loge(ex, logtitle)
		ws.http.resJson(res, '-1', ex, logtitle)
	} finally {
		//try { conn.release() } catch (ex) { console.log(ws.cons.mysql_close_error) }
	}
})

router.use(function(err, req, res, next) {
	//global.logger.error(err.message + '####')
	ws.util.loge(err, logtitle)
	ws.http.resJson(res, '-1', err, logtitle)
})

module.exports = router
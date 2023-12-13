const config = require('../../config')
const ws = require(config.app.ws)
//const wsmysql = require(config.app.wsmysql)
const express = require('express')
const router = express.Router()

const logtitle = "orgtree"

router.post('/', async function(req1, res, next) {
	let conn, sql, data, len
	const rs = ws.http.resInit()
	try {
		//global.logger.info(logTitle+"=============111")
		//global.logger.info(logTitle+"=============", { message:'0000하하하'})
		hush.util.logi('후후후')
		res00.json(rs)
	} catch (ex) {
		//global.logger.error(ex.message + '======')
		hush.util.loge('후후후111', logtitle)
		ws.http.resJson(res, '-1', ex.message, logtitle)
	} finally {
		//try { conn.release() } catch (ex) { console.log(ws.cons.mysql_close_error) }
	}
})

router.use(function(err, req, res, next) {
	//global.logger.error(err.message + '####')
	hush.util.loge('후후후222', logtitle)
	ws.http.resJson(res, '-1', err.message, logTitle)
})

module.exports = router
const config = require('../../config')
const ws = require(config.app.ws)
const wsmysql = require(config.app.wsmysql)
const multer  = require('multer')
const express = require('express')
const router = express.Router()

const title = 'getuser'

router.post('/', async function(req, res) {
	let conn, sql, data, len
	const rs = ws.http.resInit()
	try {
		const id = req.body.id
		conn = await wsmysql.getConnFromPool(global.pool)
		sql =  "SELECT ORG_CD, ORG_NM, TOP_ORG_CD, TOP_ORG_NM, USER_ID, USER_NM, NICK_NM, JOB, TEL_NO, AB_CD, AB_NM, PICTURE "
		sql += "  FROM JAY.Z_USER_TBL "
        sql += " WHERE USER_ID = ? "
		data = await wsmysql.query(conn, sql, [id])
		len = data.length
        if (len == 0) {
			ws.http.resWarn(res, ws.cons.MSG_NO_DATA, true) //true=toast
			return
		}
       	rs.list = data
		res.json(rs)
	} catch (ex) {
		ws.http.resException(res, ex, title)
	} finally {
		wsmysql.closeConn(conn, title)
	}
})

ws.util.watchRouterError(router, title)

module.exports = router
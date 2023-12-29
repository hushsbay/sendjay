const config = require('../../config')
const ws = require(config.app.ws)
const wsmysql = require(config.app.wsmysql)
const express = require('express')
const router = express.Router()

const title = 'login'

router.post('/', async function(req, res) {
	let conn, sql, data, len
	const rs = ws.http.resInit()
	try {
		const id = req.body.id
		const pwd = req.body.pwd
		conn = await wsmysql.getConnFromPool(global.pool)
		sql =  "SELECT ORG_CD, ORG_NM, TOP_ORG_CD, TOP_ORG_NM, USER_ID, PWD, USER_NM, NICK_NM, JOB, TEL_NO, AB_CD, AB_NM FROM JAY.Z_USER_TBL WHERE USER_ID = ? "
		data = await wsmysql.query(conn, sql, [id])
		if (data.length == 0) {
			ws.http.resWarn(res, ws.cons.MSG_NO_DATA)
			return
		}
		const _dec = ws.util.decrypt(data[0].PWD, nodeConfig.crypto.key)
		if (pwd != _dec) {
			ws.http.resWarn(res, '비번이 다릅니다.')
			return
		}
		const userInfo = { userid : data[0].USER_ID, orgcd : data[0].ORG_CD, toporgcd : data[0].TOP_ORG_CD }
		rs.token = ws.jwt.make(userInfo) //모바일앱 등 고려해서 편의상 쿠키로 처리하지 않음
		data[0].PWD = ''
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
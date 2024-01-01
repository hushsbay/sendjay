const config = require('../../config')
const ws = require(config.app.ws)
const wsmysql = require(config.app.wsmysql)
const express = require('express')
const router = express.Router()

router.use(function(req, res, next) {
	req.title = 'login'
	next() //next('error') for going to ws.util.watchRouterError() below
})

router.post('/', async function(req, res) {
	let conn, sql, data, len
	const rs = ws.http.resInit()
	try {
		const userid = req.body.userid
		const pwd = req.body.pwd
		const token = req.body.token
		if (token) { //index.html(포털)에서 인증체크하는 것임
			rs.token = await ws.jwt.chkVerify(req, res, { token : token, userid : userid })
			if (rs.token == '') return //모바일앱 등 고려해서 편의상 쿠키로 처리하지 않음
		}
		conn = await wsmysql.getConnFromPool(global.pool)
		sql =  "SELECT ORG_CD, ORG_NM, TOP_ORG_CD, TOP_ORG_NM, USER_ID, PWD, USER_NM, NICK_NM, JOB, TEL_NO, AB_CD, AB_NM FROM JAY.Z_USER_TBL WHERE USER_ID = ? "
		data = await wsmysql.query(conn, sql, [userid])
		if (data.length == 0) {
			ws.http.resWarn(res, ws.cons.MSG_NO_DATA)
			return
		}
		if (!token) { //login.html에서 인증하는 것임
			const _dec = ws.util.decrypt(data[0].PWD, nodeConfig.crypto.key)
			if (pwd != _dec) {
				ws.http.resWarn(res, '비번이 다릅니다.')
				return
			}
		}
		data[0].PWD = ''
		Object.assign(rs, data[0])	
		res.json(rs)
	} catch (ex) {
		ws.http.resException(req, res, ex)
	} finally {
		wsmysql.closeConn(conn, req.title)
	}
})

ws.util.watchRouterError(router)

module.exports = router
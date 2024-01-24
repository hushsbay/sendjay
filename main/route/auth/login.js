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
	try { //console.log(userid, pwd, token, "===========", req.body.toString(), JSON.stringify(req.body))
		const { uid, pwd } = req.body //사용자가 인증을 위해 입력한 사용자아이디
		const { userid, token } = req.cookies //login.html을 제외하고 웹 또는 앱에서 항상 넘어오는 쿠키
		var source = req.headers['user-agent'] //String
		console.log(source)
		console.log(uid, pwd, userid, token)
		let useridReal
		if (!uid) {
			useridReal = userid
			rs.token = await ws.jwt.chkVerify(req, res, { token : token, userid : useridReal })
			if (rs.token == '') return			
		} else {
			useridReal = uid
		}
		conn = await wsmysql.getConnFromPool(global.pool)
		sql =  "SELECT USER_ID, PWD, USER_NM, ORG_CD, TOP_ORG_CD "
		sql += "  FROM JAY.Z_USER_TBL "
		sql += " WHERE USER_ID = ? "
		data = await wsmysql.query(conn, sql, [useridReal])
		if (data.length == 0) {
			ws.http.resWarn(res, '사용자아이디가 없습니다.')
			return
		}
		if (uid) { //login.html에서 인증하는 것임
			const _dec = ws.util.decrypt(data[0].PWD, nodeConfig.crypto.key)
			if (pwd != _dec) {
				ws.http.resWarn(res, '비번이 다릅니다.')
				return
			}
		} //data[0].PWD = '' //Object.assign(rs, data[0])
		ws.http.resCookieForUser(res, data[0])
		ws.http.resCookieForTokenRefresh(res, useridReal) 
		res.json(rs)
	} catch (ex) {
		ws.http.resException(req, res, ex)
	} finally {
		wsmysql.closeConn(conn, req.title)
	}
})

ws.util.watchRouterError(router)

module.exports = router
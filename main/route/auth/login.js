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
		const uid = req.body.uid //사용자가 인증을 위해 입력한 사용자아이디
		const pwd = req.body.pwd //사용자가 인증을 위해 입력한 사용자비번
		const userid = req.cookies.userid //웹 또는 앱에서 항상 넘어오는 쿠키
		const token = req.cookies.token //웹 또는 앱에서 항상 넘어오는 쿠키

		var source = req.headers['user-agent']
		console.log(source)

		console.log(uid, pwd, "===========", userid, token)
		let useridReal
		if (!uid) { //index.html(포털)에서 인증체크하는 것임 : 아래에서 ws.jwt.make()으로 갱신함
			useridReal = userid
			rs.token = await ws.jwt.chkVerify(req, res, { token : token, userid : useridReal })
			if (rs.token == '') return //모바일앱 등 고려해서 편의상 쿠키로 처리하지 않음			
		} else {
			useridReal = uid
		}
		conn = await wsmysql.getConnFromPool(global.pool)
		sql =  "SELECT ORG_CD, ORG_NM, TOP_ORG_CD, TOP_ORG_NM, USER_ID, PWD, USER_NM, NICK_NM, JOB, TEL_NO, AB_CD, AB_NM "
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
			rs.token = ws.jwt.make({ userid : uid }) //모바일앱 등 고려해서 편의상 쿠키로 처리하지 않음
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
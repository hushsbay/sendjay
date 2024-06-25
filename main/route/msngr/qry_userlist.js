const config = require('../../config')
const nodeConfig = require(config.app.nodeConfig)
const ws = require(nodeConfig.app.ws)
const wsmysql = require(nodeConfig.app.wsmysql)
const express = require('express')
const router = express.Router()

router.use(function(req, res, next) {
	req.title = 'qry_userlist'
	next() //next('error')는 아래 ws.util.watchRouterError()로 연결
})

router.post('/', async function(req, res) {
	let conn, sql, data, len
	try {
		const rs = ws.http.resInit()
		const type = req.body.type //list(userlist.html), userid(user.html), orgcd(main.html), search(main.html), userids(chat.html)	
		const keyword = decodeURIComponent(req.body.keyword) || ''
		conn = await wsmysql.getConnFromPool(global.pool)
		const objToken = await ws.jwt.chkToken(req, res) //res : 오류시 바로 클라이언트로 응답. conn : 사용자 조직정보 위변조체크
		const userid = objToken.userid
		if (!userid) return
		sql = "SELECT USER_ID, USER_NM, NICK_NM, ORG_CD, JOB, TEL_NO, AB_CD, AB_NM, ORG_CD, ORG_NM, TOP_ORG_CD, TOP_ORG_NM "
		sql += " FROM Z_USER_TBL "
		if (type == 'list') { //qry += "WHERE TOP_ORG_NM NOT LIKE 'COMPANY%' "
			sql += "ORDER BY TOP_ORG_NM, ORG_NM, USER_NM, USER_ID "
		} else if (type == 'userid') {
			sql += "WHERE USER_ID = '" + userid + "' "
		} else if (type == 'orgcd') {
			sql += "WHERE ORG_CD = '" + keyword + "' "
			sql += "ORDER BY USER_NM, USER_ID "
		} else if (type == 'search') {
			sql += "WHERE USER_NM LIKE '%" + keyword + "%' OR NICK_NM LIKE '%" + keyword + "%' OR TEL_NO LIKE '%" + keyword + "%' "
			sql += "ORDER BY USER_NM, USER_ID "
		} else if (type == 'userids') {
			sql += "WHERE USER_ID IN ('" + keyword + "') "
			sql += "ORDER BY USER_NM, USER_ID "
		} else {
			sql += "WHERE USER_ID = 'none' "
		}
		const data = await wsmysql.query(conn, sql, null)
		if (data.length == 0) {
			ws.http.resWarn(res, ws.cons.MSG_NO_DATA, true, ws.cons.CODE_NO_DATA)
			return
		}
		rs.list = data
		ws.http.resJson(res, rs, userid) //세번째 인자(userid) 있으면 token 갱신
	} catch (ex) {
		ws.http.resException(req, res, ex)
	} finally {
		wsmysql.closeConn(conn, req.title)
	}
})

ws.util.watchRouterError(router)

module.exports = router

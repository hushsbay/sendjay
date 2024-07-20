const config = require('../../config')
const nodeConfig = require(config.app.nodeConfig)
const ws = require(nodeConfig.app.ws)
const wsmysql = require(nodeConfig.app.wsmysql)
const express = require('express')
const router = express.Router()

router.use(function(req, res, next) {
	req.title = 'userlist'
	next() //next('error')는 아래 ws.util.watchRouterError()로 연결
})

router.post('/', async function(req, res) {
	let conn, sql, data, len
	try {
		const rs = ws.http.resInit()
		const { keyword, sort } = req.body
		conn = await wsmysql.getConnFromPool(global.pool) //의도적으로 인증체크하지 않음
		sql =  "SELECT ID_KIND, ORG_CD, ORG_NM, TOP_ORG_CD, TOP_ORG_NM, USER_ID, USER_NM, NICK_NM, JOB, TEL_NO, AB_CD, AB_NM "
		sql += "  FROM JAY.Z_USER_TBL "
        if (keyword) sql += " WHERE USER_ID LIKE '%" + keyword + "%' OR USER_NM LIKE '%" + keyword + "%' OR ORG_NM LIKE '%" + keyword + "%' "
		if (sort == 'N') {
			sql += " ORDER BY USER_NM, USER_ID "
		} else { //1
			sql += " ORDER BY TOP_ORG_NM, ORG_NM, USER_NM, USER_ID "
		}
		data = await wsmysql.query(conn, sql, null)
        if (data.length == 0) {
			ws.http.resWarn(res, ws.cons.MSG_NO_DATA, true, ws.cons.CODE_NO_DATA) //true=toast
			return
		}
       	rs.list = data
		ws.http.resJson(res, rs) //세번째 인자가 있으면 token 생성(갱신)해 내림
	} catch (ex) {
		ws.http.resException(req, res, ex)
	} finally {
		wsmysql.closeConn(conn, req.title)
	}
})

ws.util.watchRouterError(router)

module.exports = router
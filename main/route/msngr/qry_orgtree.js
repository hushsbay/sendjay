const config = require('../../config')
const ws = require(config.app.ws)
const wsmysql = require(config.app.wsmysql)
const express = require('express')
const router = express.Router()

router.use(function(req, res, next) {
	req.title = 'qry_orgtree'
	next() //next('error') for going to ws.util.watchRouterError() below
})

router.post('/', async function(req, res) {
	let conn, sql, data, len, userid
	try {
		const rs = ws.http.resInit()
		const _keyword = decodeURIComponent(req.body.keyword) || ''
		conn = await wsmysql.getConnFromPool(global.pool)
		userid = await ws.jwt.chkToken(req, res, conn) //사용자 부서 위변조체크 필요없으면 세번째 인자인 conn을 빼면 됨
		if (!userid) return
		sql = "SELECT ORG_CD, ORG_NM, LVL, (SELECT COUNT(*) FROM Z_USER_TBL WHERE ORG_CD = A.ORG_CD) MEMCNT FROM Z_ORG_TBL A "		
        if (_keyword) sql += "AND ORG_CD = '" + _keyword + "' "
		sql += "ORDER BY SEQ "
		data = await wsmysql.query(conn, sql, null)
		if (data.length == 0) {
			ws.http.resWarn(res, ws.cons.MSG_NO_DATA, true)
			return
		}
		rs.list = data
		ws.http.resJson(res, rs, userid) //세번째 인자가 있으면 token 생성(갱신)해 내림
	} catch (ex) {
		ws.http.resException(req, res, ex)
	} finally {
		wsmysql.closeConn(conn, req.title)
	}
})

ws.util.watchRouterError(router)

module.exports = router

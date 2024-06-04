const config = require('../../config')
const ws = require(config.app.ws)
const wsmysql = require(config.app.wsmysql)
const express = require('express')
const router = express.Router()

router.use(function(req, res, next) {
	req.title = 'qry_orgtree'
	next() //next('error')는 아래 ws.util.watchRouterError()로 연결
})

router.post('/', async function(req, res) {
	let conn, sql, data, len
	try {
		const rs = ws.http.resInit()
		const _keyword = decodeURIComponent(req.body.keyword) || ''
		conn = await wsmysql.getConnFromPool(global.pool)
		const objToken = await ws.jwt.chkToken(req, res) //res : 오류시 바로 클라이언트로 응답. conn : 사용자 조직정보 위변조체크
		const userid = objToken.userid
		if (!userid) return
		sql = "SELECT ORG_CD, ORG_NM, LVL, (SELECT COUNT(*) FROM Z_USER_TBL WHERE ORG_CD = A.ORG_CD) MEMCNT FROM Z_ORG_TBL A "		
        if (_keyword) sql += "AND ORG_CD = '" + _keyword + "' "
		sql += "ORDER BY SEQ "
		data = await wsmysql.query(conn, sql, null)
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

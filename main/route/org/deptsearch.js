const config = require('../../config')
const nodeConfig = require(config.app.nodeConfig)
const ws = require(nodeConfig.app.ws)
const wsmysql = require(nodeConfig.app.wsmysql)
const express = require('express')
const router = express.Router()

router.use(function(req, res, next) {
	req.title = 'deptsearch'
	next() //next('error')는 아래 ws.util.watchRouterError()로 연결
})

router.post('/', async function(req, res) {
	let conn, sql, data, len
	try {
		const rs = ws.http.resInit()
		const { keyword, _comp } = req.body
		const comp = (!_comp || _comp.toLowerCase() == 'all') ? 'all' : ws.util.toStringForInClause(_comp)
		conn = await wsmysql.getConnFromPool(global.pool) //의도적으로 인증체크하지 않음
		sql =  "SELECT A.ORG_CD, A.ORG_NM, B.ORG_CD TOP_ORG_CD, B.ORG_NM TOP_ORG_NM "
		sql += "  FROM JAY.Z_ORG_TBL A "
		sql += "  LEFT OUTER JOIN JAY.Z_ORG_TBL B ON B.SEQ = CONCAT(LEFT(A.SEQ, 1), '00') "
		sql += " WHERE A.ORG_CD IS NOT NULL " //바로 아래 조건이 where는 고려하지 말고 and만 편하게 사용하기 위한 dummy where절임
        if (comp != 'all') sql += " AND B.ORG_CD IN ('" + comp + "') "
		sql += " AND A.INUSE = 'Y' "
        sql += " AND A.LVL > 0 " //회사 검색은 제외
		sql += " AND A.ORG_NM LIKE '%" + keyword + "%' "
        sql += " ORDER BY A.ORG_NM, A.ORG_CD "
		data = await wsmysql.query(conn, sql, null)
		len = data.length
        if (len == 0) {
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
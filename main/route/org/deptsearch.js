const config = require('../../config')
const ws = require(config.app.ws)
const wsmysql = require(config.app.wsmysql)
const express = require('express')
const router = express.Router()

const title = 'deptsearch'

router.post('/', async function(req, res) {
	let conn, sql, data, len
	const rs = ws.http.resInit()
	try {
		const keyword = req.body.keyword
		const comp = (!req.body.comp || req.body.comp.toLowerCase() == 'all') ? 'all' : ws.util.toStringForInClause(req.body.comp)
		conn = await wsmysql.getConnFromPool(global.pool)
		sql =  "SELECT A.ORG_CD, A.ORG_NM, B.ORG_CD TOP_ORG_CD, B.ORG_NM TOP_ORG_NM "
		sql += "  FROM JAY.Z_ORG_TBL A "
		sql += "  LEFT OUTER JOIN JAY.Z_ORG_TBL B ON B.SEQ = CONCAT(LEFT(A.SEQ, 1), '00') "
		sql += " WHERE A.ORG_CD IS NOT NULL " //바로 아래 조건이 where는 고려하지 말고 and만 편하게 사용하기 위한 dummy where절임
        if (comp != 'all') sql += " AND B.ORG_CD IN ('" + comp + "') "
        sql += " AND A.LVL > 0 " //회사 검색은 제외
		sql += " AND A.ORG_NM LIKE '%" + keyword + "%' "
        sql += " ORDER BY A.ORG_NM, A.ORG_CD "
		data = await wsmysql.query(conn, sql, null)
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
		ws.util.mysqlDisconnect(conn, title)
	}
})

ws.util.watchRouterError(router, title)

module.exports = router
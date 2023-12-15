const config = require('../../config')
const ws = require(config.app.ws)
const wsmysql = require(config.app.wsmysql)
const express = require('express')
const router = express.Router()

const title = 'deptsearch'

router.use(function(req, res, next) {
	next() //next('blabla') for going to ws.util.watchRouterError() below
})

router.post('/', async function(req, res, next) {
	let conn, sql, data, len
	const rs = ws.http.resInit()
	try {
		const keyword = req.body.keyword
		const comp = (!req.body.comp || req.body.comp.toLowerCase() == 'all') ? 'all' : ws.util.toStringForInClause(req.body.comp)
		conn = await wsmysql.getConnFromPool(global.pool)
		sql =  "SELECT ORG_CD, ORG_NM, TOP_ORG_CD, TOP_ORG_NM "
		sql += "  FROM JAY.Z_ORG_TBL "
		sql += " WHERE ORG_CD IS NOT NULL " //바로 아래 조건이 where는 고려하지 말고 and만 편하게 사용하기 위한 dummy where절임
        if (comp != 'all') sql += " AND TOP_ORG_CD IN ('" + comp + "') "
        sql += " AND LVL > 0 " //회사 검색은 제외
		sql += " AND ORG_NM LIKE '%" + keyword + "%' "
        sql += " ORDER BY ORG_NM, ORG_CD "
		data = await wsmysql.query(conn, sql, null)
		len = data.length
        if (len == 0) {
			ws.http.resWarn(res, ws.cons.MSG_NO_DATA, true, ws.cons.CODE_NO_DATA, title) //true=toast
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
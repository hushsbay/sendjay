const config = require('../../config')
const ws = require(config.app.ws)
const wsmysql = require(config.app.wsmysql)
const express = require('express')
const router = express.Router()

const title = 'orgtree'

router.use(function(req, res, next) {
	next() //next('blabla') for going to ws.util.watchRouterError() below
})

router.post('/', async function(req, res, next) {
	let conn, sql, data, len
	const rs = ws.http.resInit()
	try {
		const rqObj = req.body.obj
		const comp = (!rqObj.comp || rqObj.comp.toLowerCase() == 'all') ? 'all' : ws.util.toStringForInClause(rqObj.comp)
		conn = await wsmysql.getConnFromPool(global.pool)
		sql =  "SELECT A.SEQ, A.LVL, A.ORG_CD, A.ORG_NM, B.ORG_CD TOP_ORG_CD, B.ORG_NM TOP_ORG_NM, '' USER_ID, '' USER_NM, '' NICK_NM, '' JOB, '' TEL_NO, '' AB_CD, '' AB_NM, "
		sql += "       (SELECT COUNT(*) FROM JAY.Z_USER_TBL WHERE ORG_CD = A.ORG_CD) MEM_CNT "
		sql += "  FROM JAY.Z_ORG_TBL A "
		sql += "  LEFT OUTER JOIN JAY.Z_ORG_TBL B ON B.SEQ = CONCAT(LEFT(A.SEQ, 1), '00') "
		if (comp != 'all') {
			sql += " WHERE B.ORG_CD IN ('" + comp + "') "
		} else {
			sql += " WHERE B.ORG_CD IS NOT NULL " //나중에 테이블 가비지 정리후엔 제거
		}
		sql += " UNION ALL "
		sql += "SELECT B.SEQ, (B.LVL + 1) LVL, A.ORG_CD, A.ORG_NM, A.TOP_ORG_CD, A.TOP_ORG_NM, A.USER_ID, A.USER_NM, A.NICK_NM, A.JOB, A.TEL_NO, A.AB_CD, A.AB_NM, '' MEM_CNT "
		sql += "  FROM JAY.Z_USER_TBL A "
		sql += "  LEFT OUTER JOIN JAY.Z_ORG_TBL B ON A.ORG_CD = B.ORG_CD "
		if (comp != 'all') sql += " WHERE A.TOP_ORG_CD IN ('" + comp + "') "
		sql += " ORDER BY SEQ, LVL, USER_NM "
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
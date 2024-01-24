const config = require('../../config')
const ws = require(config.app.ws)
const wsmysql = require(config.app.wsmysql)
const express = require('express')
const router = express.Router()

router.use(function(req, res, next) {
	req.title = 'orgtree'
	next() //next('error') for going to ws.util.watchRouterError() below
})

router.post('/', async function(req, res) {
	let conn, sql, data, len
	const rs = ws.http.resInit()
	try {
		const nodeToGet = req.body.nodeToGet
		const comp = (!req.body.comp || req.body.comp.toLowerCase() == 'all') ? 'all' : ws.util.toStringForInClause(req.body.comp)
		conn = await wsmysql.getConnFromPool(global.pool)
		if (nodeToGet == 'U') { //사용자(U)일 경우만 인증체크함
			const userid = await ws.jwt.chkToken(req, res, conn)
			if (!userid) return
		}
		sql =  "SELECT A.SEQ, A.LVL, A.ORG_CD, A.ORG_NM, B.ORG_CD TOP_ORG_CD, B.ORG_NM TOP_ORG_NM, '' USER_ID, '' USER_NM, '' NICK_NM, '' JOB, '' TEL_NO, '' AB_CD, '' AB_NM, "
		sql += "       (SELECT COUNT(*) FROM JAY.Z_USER_TBL WHERE ORG_CD = A.ORG_CD) MEM_CNT "
		sql += "  FROM JAY.Z_ORG_TBL A "
		sql += "  LEFT OUTER JOIN JAY.Z_ORG_TBL B ON B.SEQ = CONCAT(LEFT(A.SEQ, 1), '00') "
		sql += " WHERE B.ORG_CD IS NOT NULL " //바로 아래 조건이 where는 고려하지 말고 and만 편하게 사용하기 위한 dummy where절임
		if (nodeToGet == 'C') sql += " AND A.LVL = 0 "
		if (comp != 'all') sql += " AND B.ORG_CD IN ('" + comp + "') "
		if (nodeToGet == 'U') { 
			sql += " UNION ALL "
			sql += "SELECT B.SEQ, (B.LVL + 1) LVL, A.ORG_CD, A.ORG_NM, A.TOP_ORG_CD, A.TOP_ORG_NM, A.USER_ID, A.USER_NM, A.NICK_NM, A.JOB, A.TEL_NO, A.AB_CD, A.AB_NM, 0 MEM_CNT "
			sql += "  FROM JAY.Z_USER_TBL A "
			sql += "  LEFT OUTER JOIN JAY.Z_ORG_TBL B ON A.ORG_CD = B.ORG_CD "
			if (comp != 'all') sql += " WHERE A.TOP_ORG_CD IN ('" + comp + "') "
		}
		sql += " ORDER BY SEQ, LVL, USER_NM "
		data = await wsmysql.query(conn, sql, null)
		len = data.length
        if (len == 0) {
			ws.http.resWarn(res, ws.cons.MSG_NO_DATA, true, ws.cons.CODE_NO_DATA, req.title) //true=toast
			return
		}
       	rs.list = data
		res.json(rs)
	} catch (ex) {
		ws.http.resException(req, res, ex)
	} finally {
		wsmysql.closeConn(conn, req.title)
	}
})

ws.util.watchRouterError(router)

module.exports = router
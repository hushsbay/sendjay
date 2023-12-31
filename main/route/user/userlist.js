const config = require('../../config')
const ws = require(config.app.ws)
const wsmysql = require(config.app.wsmysql)
const express = require('express')
const router = express.Router()

const title = 'userlist'

router.post('/', async function(req, res) {
	let conn, sql, data, len
	const rs = ws.http.resInit()
	try {
		const keyword = req.body.keyword
		const sort = req.body.sort
		//if (!(await ws.jwt.chkVerify(res, req.body.tokenInfo))) return //의도적으로 인증체크하지 않음
		conn = await wsmysql.getConnFromPool(global.pool)
		sql =  "SELECT ORG_CD, ORG_NM, TOP_ORG_CD, TOP_ORG_NM, USER_ID, USER_NM, NICK_NM, JOB, TEL_NO, AB_CD, AB_NM "
		sql += "  FROM JAY.Z_USER_TBL "
        if (keyword) sql += " WHERE USER_ID LIKE '%" + keyword + "%' OR USER_NM LIKE '%" + keyword + "%' OR ORG_NM LIKE '%" + keyword + "%' "
		if (sort == 'N') {
			sql += " ORDER BY USER_NM, USER_ID "
		} else { //1
			sql += " ORDER BY TOP_ORG_NM, ORG_NM, USER_NM, USER_ID "
		}
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
		wsmysql.closeConn(conn, title)
	}
})

ws.util.watchRouterError(router, title)

module.exports = router
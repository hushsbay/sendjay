const config = require('../../config')
const nodeConfig = require(config.app.nodeConfig)
const ws = require(nodeConfig.app.ws)
const wsmysql = require(nodeConfig.app.wsmysql)
const express = require('express')
const router = express.Router()

router.use(function(req, res, next) {
	req.title = 'userlist_test'
	next() //next('error')는 아래 ws.util.watchRouterError()로 연결
})

router.post('/', async function(req, res) {
	let conn, sql, sqlCnt, sqlWhere, data, len
	try {
		const rs = ws.http.resInit()
		const { keyword, sort, paging } = req.body
		const rowStart = (parseInt(paging.curPage) - 1) * parseInt(paging.rowPerPage)
		console.log(keyword, sort, "===========", paging.curPage, paging.rowPerPage, rowStart)
		conn = await wsmysql.getConnFromPool(global.pool) //의도적으로 인증체크하지 않음
		sql =  "SELECT ID_KIND, ORG_CD, ORG_NM, TOP_ORG_CD, TOP_ORG_NM, USER_ID, USER_NM, NICK_NM, JOB, TEL_NO, AB_CD, AB_NM "
		sql += "  FROM Z_USER_TBL "
		sqlCnt = "SELECT COUNT(*) CNT FROM Z_USER_TBL "
		sqlWhere = " WHERE IS_SYNC <> 'Y' "
        if (keyword) sqlWhere += " AND USER_ID LIKE '%" + keyword + "%' OR USER_NM LIKE '%" + keyword + "%' OR ORG_NM LIKE '%" + keyword + "%' "
		sql += sqlWhere
		sqlCnt += sqlWhere
		if (sort == 'N') {
			sql += " ORDER BY USER_NM, USER_ID "
		} else {
			sql += " ORDER BY TOP_ORG_NM, ORG_NM, USER_NM, USER_ID "
		}
		sql += " LIMIT " + rowStart + ", " + parseInt(paging.rowPerPage)
		data = await wsmysql.query(conn, sql, null)
        if (data.length == 0) {
			ws.http.resWarn(res, ws.cons.MSG_NO_DATA, true, ws.cons.CODE_NO_DATA) //true=toast
			return
		}
       	rs.list = data
		data = await wsmysql.query(conn, sqlCnt, null)
		rs.totalRow = data[0].CNT
		ws.http.resJson(res, rs) //세번째 인자가 있으면 token 생성(갱신)해 내림
	} catch (ex) {
		ws.http.resException(req, res, ex)
	} finally {
		wsmysql.closeConn(conn, req.title)
	}
})

ws.util.watchRouterError(router)

module.exports = router
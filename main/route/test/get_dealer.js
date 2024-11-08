const config = require('../../config')
const nodeConfig = require(config.app.nodeConfig)
const ws = require(nodeConfig.app.ws)
const wsmysql = require(nodeConfig.app.wsmysql)
const express = require('express')
const router = express.Router()

router.use(function(req, res, next) {
	req.title = 'get_dealer'
	next() //next('error')는 아래 ws.util.watchRouterError()로 연결
})

router.post('/', async function(req, res) {
	let conn, sql, sqlCnt, sqlWhere, data, len
	try {
		const rs = ws.http.resInit()
		const { kind, sort, pageRq } = req.body
		//const rowStart = (parseInt(pageRq.curPage) - 1) * parseInt(pageRq.rowPerPage)
		//console.log(kind, "====", sort, "====", pageRq.curPage, "====", pageRq.rowPerPage, "====", rowStart)
        console.log(kind, "====", sort)
		conn = await wsmysql.getConnFromPool(global.pool) //의도적으로 인증체크하지 않음
		sql =  "SELECT ERN, TAX_TYP, DEAL_CO_NM, RPST_NM, TEL_NO, FAX_NO, ZIP_CD, BASE_ADDR, DTL_ADDR, CO_ITEM_NM, CRTE_DT "
		sql += "  FROM Z_DEALER_TBL "
		//sql += " WHERE IS_SYNC <> 'Y' "
        //if (keyword) sqlWhere += " AND USER_ID LIKE '%" + keyword + "%' OR USER_NM LIKE '%" + keyword + "%' OR ORG_NM LIKE '%" + keyword + "%' "
		// if (sort == 'N') {
		// 	sql += " ORDER BY USER_NM, USER_ID "
		// } else {
		// 	sql += " ORDER BY TOP_ORG_NM, ORG_NM, USER_NM, USER_ID "
		// }
		// sql += " LIMIT " + rowStart + ", " + parseInt(pageRq.rowPerPage)
		data = await wsmysql.query(conn, sql, null)
        if (data.length == 0) {
			ws.http.resWarn(res, ws.cons.MSG_NO_DATA, true, ws.cons.CODE_NO_DATA) //true=toast
			return
		}
        rs.list = data
		//data = await wsmysql.query(conn, sqlCnt, null)
		//rs.totalRow = data[0].CNT
		ws.http.resJson(res, rs) //세번째 인자가 있으면 token 생성(갱신)해 내림
	} catch (ex) {
		ws.http.resException(req, res, ex)
	} finally {
		wsmysql.closeConn(conn, req.title)
	}
})

ws.util.watchRouterError(router)

module.exports = router
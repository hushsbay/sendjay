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
		const { kind, sort, search, pageRq } = req.body
		const rowStart = (parseInt(pageRq.curPage) - 1) * parseInt(pageRq.rowPerPage)
        console.log(kind, "====", sort, "====", search, "@@@@", pageRq.curPage, "@@@@", pageRq.rowPerPage, "@@@@", rowStart)
		conn = await wsmysql.getConnFromPool(global.pool) //의도적으로 인증체크하지 않음
		sql = "SELECT ERN, TAX_TYP, DEAL_CO_NM, RPST_NM, TEL_NO, FAX_NO, ZIP_CD, BASE_ADDR, DTL_ADDR, CO_ITEM_NM, CRTE_DT "
		sql += " FROM z_dealer_tbl "
        sqlCnt = "SELECT COUNT(*) CNT FROM z_dealer_tbl " //sqlCnt
        if (kind == '01') {
		    sqlWhere = " WHERE TAX_TYP = '01' "
        } else if (kind == 'etc') {
		    sqlWhere = " WHERE TAX_TYP <> '01' "
        } else {
            sqlWhere = " WHERE BASE_ADDR LIKE '서울%' "
        }
        if (search != '') sqlWhere += " AND (ERN LIKE '%" + search + "%' OR DEAL_CO_NM LIKE '%" + search + "%' OR CO_ITEM_NM LIKE '%" + search + "%' OR BASE_ADDR LIKE '%" + search + "%') "
		sql += sqlWhere
        //////////////////////////////////////////////sqlCnt
        sqlCnt += sqlWhere
        data = await wsmysql.query(conn, sqlCnt, null)
		rs.totalRow = data[0].CNT
        //////////////////////////////////////////////
        if (sort == 'N') {
		 	sql += " ORDER BY DEAL_CO_NM "
        } else if (sort == 'I') {
		 	sql += " ORDER BY CO_ITEM_NM "
        } else {
            sql += " ORDER BY BASE_ADDR "
        }
		sql += " LIMIT " + rowStart + ", " + parseInt(pageRq.rowPerPage)
		data = await wsmysql.query(conn, sql, null)
        if (data.length == 0) {
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
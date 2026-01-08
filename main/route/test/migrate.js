const config = require('../../config')
const nodeConfig = require(config.app.nodeConfig)
const ws = require(nodeConfig.app.ws)
const wsmysql = require(nodeConfig.app.wsmysql)
const express = require('express')
const router = express.Router()
const xlsx = require('xlsx-js-style')

//브라우저에서 테스트 버튼 누르면 요청받아서 서버 폴더에 있는 엑셀파일 읽어서 테이블에 INSERT하는 테스트 코딩임
//테스트 완료되어 app.js에서 app.use() 막은 상태임

router.use(function(req, res, next) {
	req.title = 'migrate'
	next() //next('error')는 아래 ws.util.watchRouterError()로 연결
})

router.post('/', async function(req, res) {
	let conn, sql, data, len
	try {
		const rs = ws.http.resInit()
		conn = await wsmysql.getConnFromPool(global.pool)
		const _file = xlsx.readFile('c:/temp/dealer1000.xlsx')
		const sheet = _file.Sheets[_file.SheetNames[0]]
		for (let i = 2; i <= 1136; i++) {
			cellA = sheet['A' + i.toString()]
			cellB = sheet['B' + i.toString()]
			cellC = sheet['C' + i.toString()]
			cellD = sheet['D' + i.toString()]
			cellE = sheet['E' + i.toString()]
			cellF = sheet['F' + i.toString()]
			cellG = sheet['G' + i.toString()]
			cellH = sheet['H' + i.toString()]
			cellI = sheet['I' + i.toString()]
			cellJ = sheet['J' + i.toString()]
			sql = "INSERT INTO z_dealer_tbl (ERN, TAX_TYP, DEAL_CO_NM, RPST_NM, TEL_NO, ZIP_CD, BASE_ADDR, DTL_ADDR, CO_ITEM_NM, CRTE_DT) "
			sql += "                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?) "
			await wsmysql.query(conn, sql, [cellA.w.trim(), cellB.w.trim(), cellC.w.trim(), cellD.w.trim(), cellE.w.trim(), cellF.w.trim(), cellG.w.trim(), cellH.w.trim(), cellI.w.trim(), cellJ.w.trim()])
			console.log(i.toString(), "##############")
		}
		ws.http.resJson(res, rs)
	} catch (ex) {
		ws.http.resException(req, res, ex)
	} finally {
		wsmysql.closeConn(conn, req.title)
	}
})

ws.util.watchRouterError(router)

module.exports = router
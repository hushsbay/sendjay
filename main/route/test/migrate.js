const config = require('../../config')
const nodeConfig = require(config.app.nodeConfig)
const ws = require(nodeConfig.app.ws)
const wsmysql = require(nodeConfig.app.wsmysql)
const express = require('express')
const router = express.Router()
const xlsx = require('xlsx-js-style')

router.use(function(req, res, next) {
	req.title = 'migrate'
	next() //next('error')는 아래 ws.util.watchRouterError()로 연결
})

router.post('/', async function(req, res) {
	let conn, sql, data, len
	try {
		const rs = ws.http.resInit()
		const _file = xlsx.readFile('c:/temp/dealer10.xlsx')
		const sheet = _file.Sheets[_file.SheetNames[0]]
		const cell = sheet['A1']
		const _val = cell ? cell.w.trim() : 'none'
		console.log(_val,"@@@@@")
		// conn = await wsmysql.getConnFromPool(global.pool)
		// sql = "INSERT INTO Z_USER_TBL (USER_ID, ID_KIND, PWD, USER_NM, ORG_CD, ORG_NM, TOP_ORG_CD, TOP_ORG_NM, PICTURE, MIMETYPE, NICK_NM, IS_SYNC, ISUDT) "
		// sql += "                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, sysdate(6)) "
		// await wsmysql.query(conn, sql, [id, _kind, _enc, nm, orgcd, orgnm, toporgcd, toporgnm, buf, mimetype, alias, 'N'])
		ws.http.resJson(res, rs)
	} catch (ex) {
		ws.http.resException(req, res, ex)
	} finally {
		wsmysql.closeConn(conn, req.title)
	}
})

ws.util.watchRouterError(router)

module.exports = router
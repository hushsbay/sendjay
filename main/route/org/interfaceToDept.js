const config = require('../../config')
const nodeConfig = require(config.app.nodeConfig)
const ws = require(nodeConfig.app.ws)
const wsmysql = require(nodeConfig.app.wsmysql)
const express = require('express')
const router = express.Router()

router.use(function(req, res, next) {
	req.title = 'interfaceToDept'
	next() //next('error')는 아래 ws.util.watchRouterError()로 연결
})

router.post('/', async function(req, res) {
	let conn, sql, data, len
	try {
		const rs = ws.http.resInit()	
		conn = await wsmysql.getConnFromPool(global.pool)
		const dept = req.body.dept
		const objToken = await ws.jwt.chkToken(req, res) //res : 오류시 바로 클라이언트로 응답. conn : 사용자 조직정보 위변조체크
		const userid = objToken.userid
		if (!userid) {
			ws.http.resWarn(res, objToken.msg, false, objToken.code, req.title)
			return
		} //console.log(config.app.ipAccess, req.clientIp)
		if (!ws.http.ipChk(config.app.ipAccess, req.clientIp)) throw new Error('client ip not allowed')
		if (!Array.isArray(dept)) throw new Error('dept 파라미터는 배열이어야 합니다.') 
		if (dept.length == 0) throw new Error('배열의 길이가 0입니다.')
		await wsmysql.txBegin(conn)
		let dtkey = dept[0].DTKEY ? dept[0].DTKEY : ws.util.getCurDateTimeStr()
		sql = "SELECT COUNT(*) CNT FROM z_intorg_tbl WHERE DTKEY = ? "
		data = await wsmysql.query(conn, sql, [dtkey])
		if (data[0].CNT > 0) {
			sql = "DELETE FROM z_intorg_tbl WHERE DTKEY = ? "
			await wsmysql.query(conn, sql, [dtkey])
		}
		len = dept.length
		for (let i = 0; i < len; i++) {			
			sql = "INSERT INTO z_intorg_tbl (DTKEY, ORG_CD, ORG_NM, SEQ, LVL) "
			sql += " VALUES (?, ?, ?, ?, ?) "
			await wsmysql.query(conn, sql, [dtkey, dept[i].ORG_CD, dept[i].ORG_NM, dept[i].SEQ, dept[i].LVL])
		}
		rs.dtkey = dtkey
		await wsmysql.txCommit(conn)
		ws.http.resJson(res, rs, userid) //세번째 인자(userid) 있으면 token 갱신
	} catch (ex) {
		if (conn) await wsmysql.txRollback(conn)
		ws.http.resException(req, res, ex)
	} finally {
		wsmysql.closeConn(conn, req.title)
	}
})

ws.util.watchRouterError(router)

module.exports = router

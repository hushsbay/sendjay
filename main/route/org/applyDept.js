const config = require('../../config')
const nodeConfig = require(config.app.nodeConfig)
const ws = require(nodeConfig.app.ws)
const wsmysql = require(nodeConfig.app.wsmysql)
const express = require('express')
const router = express.Router()

router.use(function(req, res, next) {
	req.title = 'applyDept'
	next() //next('error')는 아래 ws.util.watchRouterError()로 연결
})

router.post('/', async function(req, res) {
	let conn, sql, data, len
	try {
		const rs = ws.http.resInit()	
		conn = await wsmysql.getConnFromPool(global.pool)
		const dtkey = req.body.key
		const objToken = await ws.jwt.chkToken(req, res) //res : 오류시 바로 클라이언트로 응답. conn : 사용자 조직정보 위변조체크
		const userid = objToken.userid
		if (!userid) {
			ws.http.resWarn(res, objToken.msg, false, objToken.code, req.title)
			return
		}
		if (userid != 'admin') {
			ws.http.resWarn(res, 'admin만 가능한 작업입니다.')
			return
	   	}
		await wsmysql.txBegin(conn)
		sql = "SELECT COUNT(*) CNT FROM Z_INTORG_TBL WHERE DTKEY = ? "
		data = await wsmysql.query(conn, sql, [dtkey])
		if (data[0].CNT == 0) throw new Error('해당 키가 테이블에 없습니다 : ' + dtkey)
		sql = "SELECT COUNT(*) CNT FROM Z_ORG_TBL "
		data = await wsmysql.query(conn, sql, null)
		if (data[0].CNT > 0) {
			sql = "DELETE FROM Z_ORG_TBL "
			data = await wsmysql.query(conn, sql, null)
		}
		sql = "INSERT INTO Z_ORG_TBL (ORG_CD, ORG_NM, SEQ, LVL) "
		sql += " SELECT ORG_CD, ORG_NM, SEQ, LVL FROM Z_INTORG_TBL WHERE DTKEY = ? "
		await wsmysql.query(conn, sql, [dtkey])
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

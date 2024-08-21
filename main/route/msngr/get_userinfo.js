const config = require('../../config')
const nodeConfig = require(config.app.nodeConfig)
const ws = require(nodeConfig.app.ws)
const wsmysql = require(nodeConfig.app.wsmysql)
const express = require('express')
const router = express.Router()

router.use(function(req, res, next) {
	req.title = 'get_userinfo'
	next() //next('error')는 아래 ws.util.watchRouterError()로 연결
})

router.post('/', async function(req, res) {
	let conn, sql, data, len
	try { 
		const rs = ws.http.resInit()
		conn = await wsmysql.getConnFromPool(global.pool)
		const objToken = await ws.jwt.chkToken(req, res, conn) //res : 오류시 바로 클라이언트로 응답. conn : 사용자 조직정보 위변조체크
		const userid = objToken.userid
		if (!userid) {
			ws.http.resWarn(res, objToken.msg, false, objToken.code, req.title)
			return
		} //PWD 없음을 유의
		sql =  "SELECT USER_ID, USER_NM, ORG_CD, ORG_NM, TOP_ORG_CD, TOP_ORG_NM, NICK_NM, JOB, AB_CD, AB_NM, NOTI_OFF, "
		sql += "       BODY_OFF, SENDER_OFF, TM_FR, TM_TO "
		sql += "  FROM Z_USER_TBL "
		sql += " WHERE USER_ID = ? "
		data = await wsmysql.query(conn, sql, [userid])
		if (data.length == 0) {
			ws.http.resWarn(res, '사용자아이디가 없습니다.')
			return
		}
		Object.assign(rs, data[0])
		ws.http.resJson(res, rs, userid) //세번째 인자가 있으면 token 생성(갱신)해 내림
	} catch (ex) {
		ws.http.resException(req, res, ex)
	} finally {
		wsmysql.closeConn(conn, req.title)
	}
})

ws.util.watchRouterError(router)

module.exports = router
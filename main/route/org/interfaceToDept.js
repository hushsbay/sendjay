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
		const objToken = await ws.jwt.chkToken(req, res) //res : 오류시 바로 클라이언트로 응답. conn : 사용자 조직정보 위변조체크
		const userid = objToken.userid
		if (!userid) return
		// sql = "SELECT COUNT(*) CNT FROM Z_USER_TBL WHERE USER_ID = ? "
		// data = await wsmysql.query(conn, sql, [userid])
		// if (data.length == 0) {
		// 	ws.http.resWarn(res, ws.cons.MSG_NO_DATA, true, ws.cons.CODE_NO_DATA)
		// 	return
		// }
		// let _nicknm = decodeURIComponent(req.body.nicknm) || ''
		// const _job = decodeURIComponent(req.body.job) || ''
		// const _abcd = decodeURIComponent(req.body.abcd) || ''
		// const _abnm = decodeURIComponent(req.body.abnm) || ''
		// const _notioff = req.body.notioff
		// const _fr = req.body.fr
		// const _to = req.body.to
		// const _bodyoff = req.body.bodyoff
		// const _senderoff = req.body.senderoff
		// sql = "UPDATE Z_USER_TBL "
		// sql += "  SET NICK_NM = ?, JOB = ?, AB_CD = ?, AB_NM = ?, NOTI_OFF = ?, " 
		// sql += "      BODY_OFF = ?, SENDER_OFF = ?, TM_FR = ?, TM_TO = ?, MODR = ?, MODDT = sysdate(6) "
		// sql += "WHERE USER_ID = ? "
		// await wsmysql.query(conn, sql, [_nicknm, _job, _abcd, _abnm, _notioff, _bodyoff, _senderoff, _fr, _to, userid, userid])
		ws.http.resJson(res, rs, userid) //세번째 인자(userid) 있으면 token 갱신
	} catch (ex) {
		ws.http.resException(req, res, ex)
	} finally {
		wsmysql.closeConn(conn, req.title)
	}
})

ws.util.watchRouterError(router)

module.exports = router

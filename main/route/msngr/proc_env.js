const config = require('../../config')
const ws = require(config.app.ws)
const wsmysql = require(config.app.wsmysql)
const express = require('express')
const router = express.Router()

router.use(function(req, res, next) {
	req.title = 'proc_env'
	next() //next('error') for going to ws.util.watchRouterError() below
})

router.post('/', async function(req, res) {
	let conn, sql, data, len, userid
	try {
		const rs = ws.http.resInit()	
		conn = await wsmysql.getConnFromPool(global.pool)
		userid = await ws.jwt.chkToken(req, res, conn) //사용자 부서 위변조체크 필요없으면 세번째 인자인 conn을 빼면 됨
		if (!userid) return
		sql = "SELECT COUNT(*) CNT FROM Z_USER_TBL WHERE USER_ID = ? "
		data = await wsmysql.query(conn, sql, [userid])
		if (data.length == 0) {
			ws.http.resWarn(res, ws.cons.MSG_NO_DATA, true)
			return
		}
		let _nicknm = decodeURIComponent(req.body.nicknm) || ''
		const _job = decodeURIComponent(req.body.job) || ''
		const _abcd = decodeURIComponent(req.body.abcd) || ''
		const _abnm = decodeURIComponent(req.body.abnm) || ''
		const _standalone = req.body.standalone
		const _notioff = req.body.notioff
		const _soundoff = req.body.soundoff
		const _fr = req.body.fr
		const _to = req.body.to
		const _bodyoff = req.body.bodyoff
		const _senderoff = req.body.senderoff
		sql = "UPDATE Z_USER_TBL "
		sql += "  SET NICK_NM = ?, JOB = ?, AB_CD = ?, AB_NM = ?, STANDALONE = ?, NOTI_OFF = ?, " 
		sql += "      SOUND_OFF = ?, TM_FR = ?, TM_TO = ?, BODY_OFF = ?, SENDER_OFF = ?, MODR = ?, MODDT = sysdate(6) "
		sql += "WHERE USER_ID = ? "
		await wsmysql.query(conn, sql, [_nicknm, _job, _abcd, _abnm, _standalone, _notioff, _soundoff, _fr, _to, _bodyoff, _senderoff, userid, userid])
		ws.http.resJson(res, rs, userid) //세번째 인자가 있으면 token 생성(갱신)해 내림
	} catch (ex) {
		ws.http.resException(req, res, ex)
	} finally {
		wsmysql.closeConn(conn, req.title)
	}
})

ws.util.watchRouterError(router)

module.exports = router

const config = require('../../config')
const nodeConfig = require(config.app.nodeConfig)
const ws = require(nodeConfig.app.ws)
const wsmysql = require(nodeConfig.app.wsmysql)
const express = require('express')
const router = express.Router()

router.use(function(req, res, next) {
	req.title = 'applyUser'
	next() //next('error')는 아래 ws.util.watchRouterError()로 연결
})

router.post('/', async function(req, res) {
	let conn, sql, data, len
	try {
		const rs = ws.http.resInit()	
		conn = await wsmysql.getConnFromPool(global.pool)
		const dtkey = req.body.key
		console.log(dtkey, "----")
		const objToken = await ws.jwt.chkToken(req, res) //res : 오류시 바로 클라이언트로 응답. conn : 사용자 조직정보 위변조체크
		const userid = objToken.userid
		if (!userid) {
			ws.http.resWarn(res, objToken.msg, false, objToken.code, req.title)
			return
		}
		await wsmysql.txBegin(conn)
		sql = "SELECT COUNT(*) CNT FROM Z_INTUSER_TBL WHERE DTKEY = ? "
		data = await wsmysql.query(conn, sql, [dtkey])
		if (data[0].CNT == 0) throw new Error('해당 키가 테이블에 없습니다 : ' + dtkey)
		//1. (동기화 아이디만을 대상으로 해서) Z_ORG_TBL 루프 돌면서 Z_INTORG_TBL에 있으면 가져와 업데이트하고 없으면 아이디 제거해야 함
		sql = "SELECT * FROM Z_USER_TBL WHERE IS_SYNC = 'Y' "
		data = await wsmysql.query(conn, sql, null)
		len = data.length
		for (let i = 0; i < len; i++) {
			const _userid = data[i].USER_ID
			sql = "SELECT USER_NM, ORG_CD, ORG_NM, TOP_ORG_CD, TOP_ORG_NM, JOB, TEL_NO, AB_CD, AB_NM FROM Z_INTUSER_TBL WHERE DTKEY = ? AND USER_ID = ? "
			const data1 = await wsmysql.query(conn, sql, [dtkey, _userid])
			if (data1.length > 0) {
				sql = "UPDATE Z_USER_TBL SET "
				sql += " USER_NM = ?, ORG_CD = ?, ORG_NM = ?, TOP_ORG_CD = ?, TOP_ORG_NM = ?, JOB  = ?, TEL_NO = ?, AB_CD  = ?, AB_NM = ? "
				sql += "WHERE USER_ID = ? "
				data = await wsmysql.query(conn, sql, [
					data1[0].USER_NM, data1[0].ORG_CD, data1[0].ORG_NM, data1[0].TOP_ORG_CD, data1[0].TOP_ORG_NM, data1[0].JOB, data1[0].TEL_NO, data1[0].AB_CD, data1[0].AB_NM, _userid
				])	
			} else {
				sql = "DELETE FROM Z_USER_TBL WHERE USER_ID = ? AND IS_SYNC = 'Y' "
				data = await wsmysql.query(conn, sql, [_userid])
			}
		}
		//2. Z_INTORG에 있는데 Z_ORG_TBL에 없으면 신규(추가)분이므로 넣기
		sql = "SELECT USER_ID, USER_NM, ORG_CD, ORG_NM, TOP_ORG_CD, TOP_ORG_NM, JOB, TEL_NO, AB_CD, AB_NM FROM Z_INTUSER_TBL WHERE DTKEY = ? "
		data = await wsmysql.query(conn, sql, [dtkey])
		len = data.length
		for (let i = 0; i < len; i++) {
			console.log(JSON.stringify(data))
			const _userid = data[i].USER_ID
			sql = "SELECT * FROM Z_USER_TBL WHERE USER_ID = ? "
			const data1 = await wsmysql.query(conn, sql, [_userid])
			if (data1.length == 0) {
				sql = "INSERT INTO Z_USER_TBL (PWD, USER_ID, ID_KIND, USER_NM, ORG_CD, ORG_NM, TOP_ORG_CD, TOP_ORG_NM, JOB, TEL_NO, AB_CD, AB_NM) "
				sql += " VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) "
				data = await wsmysql.query(conn, sql, [ //PWD는 나중에 제거하기 (drop table후)
					'', data[0].USER_ID, 'U', data[0].USER_NM, data[0].ORG_CD, data[0].ORG_NM, data[0].TOP_ORG_CD, data[0].TOP_ORG_NM, data[0].JOB, data[0].TEL_NO, data[0].AB_CD, data[0].AB_NM
				])	
			} else {
				//위 1.에서 처리됨. 동기화되는 아이디가 아닌데 수동으로 이미 만든 아이디가 있을 수 있음 (오류처리하지 않고 일단 넘어감)
			}
		}		
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

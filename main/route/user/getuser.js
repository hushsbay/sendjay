const config = require('../../config')
const ws = require(config.app.ws)
const wsmysql = require(config.app.wsmysql)
const express = require('express')
const router = express.Router()

router.use(function(req, res, next) {
	req.title = 'getuser'
	next() //next('error')는 아래 ws.util.watchRouterError()로 연결
})

router.post('/', async function(req, res) {
	let conn, sql, data, len
	try {
		const rs = ws.http.resInit()
		const { id, imgOnly } = req.body
		conn = await wsmysql.getConnFromPool(global.pool) //의도적으로 인증체크하지 않음
		sql =  "SELECT ORG_CD, ORG_NM, TOP_ORG_CD, TOP_ORG_NM, USER_ID, USER_NM, NICK_NM, JOB, TEL_NO, AB_CD, AB_NM, PICTURE, MIMETYPE "
		sql += "  FROM JAY.Z_USER_TBL "
        sql += " WHERE USER_ID = ? "
		data = await wsmysql.query(conn, sql, [id])
        if (data.length == 0) {
			ws.http.resWarn(res, ws.cons.MSG_NO_DATA, true) //true=toast
			return
		}
		//rs.picture = data[0].PICTURE ? Buffer.from(data[0].PICTURE, 'binary').toString('base64') : null //base64로 변환해 내림 (사용시 클라이언트 코딩도 변경 필요)
		if (imgOnly == "Y") {
			rs.list.push({ PICTURE : data[0].PICTURE }) //base64 방법과 육안으로는 속도 차이 안남
		} else {
			rs.list = data
		}
		ws.http.resJson(res, rs) //세번째 인자가 있으면 token 생성(갱신)해 내림
	} catch (ex) {
		ws.http.resException(req, res, ex)
	} finally {
		wsmysql.closeConn(conn, req.title)
	}
})

ws.util.watchRouterError(router)

module.exports = router
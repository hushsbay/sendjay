const config = require('../../config')
const ws = require(config.app.ws)
const wsmysql = require(config.app.wsmysql)
const express = require('express')
const router = express.Router()

const title = 'getuser'

router.post('/', async function(req, res) {
	let conn, sql, data, len
	const rs = ws.http.resInit()
	try {
		const id = req.body.id
		const imgOnly = req.body.imgOnly
		//if (!(await ws.jwt.chkVerify(req.body.tokenInfo))) return //의도적으로 인증체크하지 않음
		conn = await wsmysql.getConnFromPool(global.pool)
		sql =  "SELECT ORG_CD, ORG_NM, TOP_ORG_CD, TOP_ORG_NM, USER_ID, USER_NM, NICK_NM, JOB, TEL_NO, AB_CD, AB_NM, PICTURE, MIMETYPE "
		sql += "  FROM JAY.Z_USER_TBL "
        sql += " WHERE USER_ID = ? "
		data = await wsmysql.query(conn, sql, [id])
		len = data.length
        if (len == 0) {
			ws.http.resWarn(res, ws.cons.MSG_NO_DATA, true) //true=toast
			return
		}
		//rs.picture = data[0].PICTURE ? Buffer.from(data[0].PICTURE, 'binary').toString('base64') : null //base64로 변환해 내림 (사용시 클라이언트 코딩도 변경 필요)
		if (imgOnly == "Y") {
			rs.list.push({ PICTURE : data[0].PICTURE }) //base64 방법과 육안으로는 속도 차이 안남
		} else {
			rs.list = data
		}
		res.json(rs)
	} catch (ex) {
		ws.http.resException(res, ex, title)
	} finally {
		wsmysql.closeConn(conn, title)
	}
})

ws.util.watchRouterError(router, title)

module.exports = router
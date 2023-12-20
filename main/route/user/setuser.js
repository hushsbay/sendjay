const config = require('../../config')
const ws = require(config.app.ws)
const wsmysql = require(config.app.wsmysql)
const express = require('express')
const multer  = require('multer') //ajax enctype을 "multipart/form-data"으로 했을 경우 multer로 처리 필요
const router = express.Router()
const upload = multer({ storage: multer.memoryStorage() })

const title = 'setuser'

router.post('/', upload.any(), async function(req, res) {
	let conn, sql, data, len
	const rs = ws.http.resInit()
	try {
		const type = req.body.type
		const id = req.body.id
		const nm = req.body.nm
		const alias = req.body.alias
		const pwd = req.body.pwd
		const pwd_1 = req.body.pwd_1
		const toporgcd = req.body.toporgcd
		const toporgnm = req.body.toporgnm
		const orgcd = req.body.orgcd
		const orgnm = req.body.orgnm
		const mimetype = req.body.mimetype
		const buf = mimetype ? Buffer.from(new Uint8Array(req.files[0].buffer)) : null
		conn = await wsmysql.getConnFromPool(global.pool)
		sql =  "SELECT COUNT(*) CNT FROM JAY.Z_USER_TBL WHERE USER_ID = ? "
		data = await wsmysql.query(conn, sql, [id])
		if (type == 'C') {
			if (data[0].CNT > 0) {
				ws.http.resWarn(res, ws.cons.MSG_ALREADY_EXISTS)
				return
			}
			const _enc = ws.util.encrypt(pwd_1, nodeConfig.crypto.key)
			sql = "INSERT INTO JAY.Z_USER_TBL (USER_ID, PWD, USER_NM, ORG_CD, ORG_NM, TOP_ORG_CD, TOP_ORG_NM, PICTURE, MIMETYPE, NICK_NM, ISUDT) "
			sql += " VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, sysdate(6)) "
			await wsmysql.query(conn, sql, [id, _enc, nm, orgcd, orgnm, toporgcd, toporgnm, buf, mimetype, alias])
		} else {
			if (data[0].CNT == 0) {
				ws.http.resWarn(res, ws.cons.MSG_NO_DATA)
				return
			}
			if (type == 'D') {
				sql = "DELETE FROM JAY.Z_USER_TBL WHERE USER_ID = ? "
				await wsmysql.query(conn, sql, [id])
			} else { //U(Update)
				if (pwd_1 == "") { //비번변경 X
					_str = "PWD"
				} else {
					const _enc = ws.util.encrypt(pwd_1, nodeConfig.crypto.key)
					_str = "'" + _enc + "'"
				}				
				sql =  "UPDATE JAY.Z_USER_TBL "
				sql += "   SET USER_NM = ?, PWD = " + _str + ", ORG_CD = ?, ORG_NM = ?, TOP_ORG_CD = ?, TOP_ORG_NM = ?, PICTURE = ?, MIMETYPE = ?, NICK_NM = ? "
				sql += " WHERE USER_ID = ? "
				await wsmysql.query(conn, sql, [id, nm, orgcd, orgnm, toporgcd, toporgnm, buf, mimetype, alias])
			}
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
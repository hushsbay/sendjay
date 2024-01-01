const config = require('../../config')
const ws = require(config.app.ws)
const wsmysql = require(config.app.wsmysql)
const express = require('express')
const multer  = require('multer') //ajax enctype을 "multipart/form-data"으로 했을 경우 multer로 처리 필요
const router = express.Router()
const upload = multer({ storage: multer.memoryStorage() })

router.use(function(req, res, next) {
	req.title = 'setuser'
	next() //next('error') for going to ws.util.watchRouterError() below
})

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
		const buf = mimetype ? Buffer.from(new Uint8Array(req.files[0].buffer)) : null //MySql PICTURE 필드가 longblob 타입으로 되어 있고 브라우저에서 blob으로 넘겨받아 저장하는 것임
		conn = await wsmysql.getConnFromPool(global.pool) //의도적으로 인증체크하지 않음
		sql =  "SELECT COUNT(*) CNT, PWD FROM JAY.Z_USER_TBL WHERE USER_ID = ? "
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
			const _dec = ws.util.decrypt(data[0].PWD, nodeConfig.crypto.key)
			if (pwd != _dec) {
				ws.http.resWarn(res, '입력한 (기존) 비번이 서버에 저장된 비번과 다릅니다.')
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
				await wsmysql.query(conn, sql, [nm, orgcd, orgnm, toporgcd, toporgnm, buf, mimetype, alias, id])
			}
		}
		res.json(rs)
	} catch (ex) {
		ws.http.resException(req, res, ex)
	} finally {
		wsmysql.closeConn(conn, req.title)
	}
})

ws.util.watchRouterError(router)

module.exports = router
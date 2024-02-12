const config = require('../../config')
const ws = require(config.app.ws)
const wsmysql = require(config.app.wsmysql)
const express = require('express')
const multer  = require('multer')
const router = express.Router()
const upload = multer({ storage: multer.memoryStorage() })

const proc = (req) => {
	return new Promise(async (resolve, reject) => {
		let conn, sql, data, len, userid
		try {			
			let rs = ws.http.resInit()
			const buf = Buffer.from(new Uint8Array(req.files[0].buffer))
			const ridArr = req.body.receiverid.split(com.cons.easydeli)
			const rnmArr = req.body.receivernm.split(com.cons.easydeli)
			conn = await wsmysql.getConnFromPool(global.pool)
			await wsmysql.txBegin(conn)
			sql = "INSERT INTO A_MSGMST_TBL (MSGID, ROOMID, SENDERID, SENDERNM, BODY, BUFFER, REPLY, TYP, CDT) VALUES (?, ?, ?, ?, ?, ?, ?, ?, sysdate(6)) "
			await wsmysql.query(conn, sql, [req.body.msgid, req.body.roomid, req.body.senderid, req.body.sendernm, '', buf, req.body.reply, req.body.type])
			len = ridArr.length
			for (let i = 0; i < len; i++) {
				sql = "INSERT INTO A_MSGDTL_TBL (MSGID, ROOMID, SENDERID, RECEIVERID, RECEIVERNM, CDT) VALUES (?, ?, ?, ?, ?, sysdate(6)) "
				await wsmysql.query(conn, sql, [req.body.msgid, req.body.roomid, req.body.senderid, ridArr[i], rnmArr[i]])
			}
			await wsmysql.txCommit(conn)
			resolve(rs)
		} catch (ex) {
			if (conn) await wsmysql.txRollback(conn)
			reject(ex)
		} finally {
			wsmysql.closeConn(conn, req.title)
		}
	})
}

router.post('/', upload.any(), async (req, res) => {
	req.title = 'proc_image.post'
	try {
		//const result = await com.verifyWithRestUserId(req, res, req.body.senderid, _logTitle)
		//if (!result) return //ws.http.resCodeMsg() 사용하지 않음을 유의
		const rs = await proc(req)
		res.json(rs)
	} catch (ex) {
		ws.http.resException(req, res, ex)
	}
})

ws.util.watchRouterError(router)

module.exports = router
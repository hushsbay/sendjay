const config = require('../../config')
const nodeConfig = require(config.app.nodeConfig)
const ws = require(nodeConfig.app.ws)
const wsmysql = require(nodeConfig.app.wsmysql)
const express = require('express')
const multer  = require('multer')
const router = express.Router()
const upload = multer({ storage: multer.memoryStorage() })

const proc = (req) => {
	return new Promise(async (resolve, reject) => {
		let conn, sql, data, len
		try {			
			let rs = ws.http.resInit()
			const buf = Buffer.from(new Uint8Array(req.files[0].buffer))
			const ridArr = req.body.receiverid.split(ws.cons.easydeli)
			const rnmArr = req.body.receivernm.split(ws.cons.easydeli)
			conn = await wsmysql.getConnFromPool(global.pool)
			const ret = await ws.util.chkAccessUserWithTarget(conn, req.body.senderid, req.body.roomid, 'room')
			if (ret != '') throw new Error(ret)
			await wsmysql.txBegin(conn)
			sql = "INSERT INTO a_msgmst_tbl (MSGID, ROOMID, SENDERID, SENDERNM, BODY, BUFFER, REPLY, TYP, CDT) VALUES (?, ?, ?, ?, ?, ?, ?, ?, sysdate(6)) "
			await wsmysql.query(conn, sql, [req.body.msgid, req.body.roomid, req.body.senderid, req.body.sendernm, '', buf, req.body.reply, req.body.type])
			len = ridArr.length
			for (let i = 0; i < len; i++) {
				sql = "INSERT INTO a_msgdtl_tbl (MSGID, ROOMID, SENDERID, RECEIVERID, RECEIVERNM, CDT) VALUES (?, ?, ?, ?, ?, sysdate(6)) "
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
		const objToken = await ws.jwt.chkToken(req, res) //res : 오류시 바로 클라이언트로 응답. conn : 사용자 조직정보 위변조체크
		if (!objToken.userid) { //각각의 함수에 쿠키를 읽어서 처리해도 되는데 그냥 편의상 아래서 req.body.userid 사용하므로 userid와 비교하는 것임
			ws.http.resWarn(res, objToken.msg, false, objToken.code, req.title)
			return
		}
		if (req.body.senderid != objToken.userid) throw new Error(ws.cons.MSG_MISMATCH_WITH_USERID + '- req.body.senderid')
		const rs = await proc(req)
		ws.http.resJson(res, rs, objToken.userid) //세번째 인자(userid) 있으면 token 갱신
	} catch (ex) {
		ws.http.resException(req, res, ex)
	}
})

ws.util.watchRouterError(router)

module.exports = router
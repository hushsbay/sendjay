const config = require('../../config')
const ws = require(config.app.ws)
const wsmysql = require(config.app.wsmysql)
const express = require('express')
const multer  = require('multer')
const router = express.Router()
const upload = multer({ storage: multer.memoryStorage() })

const proc = (req) => {
	return new Promise(async (resolve, reject) => {
		let conn, sql, data, len
		try {			
			let rs = ws.http.resInit()
			conn = await wsmysql.getConnFromPool(global.pool)
			if (req.body.type == 'R') { //검색해서 발견 못함 (체크해보기 - getUser에서 처리)
				sql = "SELECT PICTURE, MIMETYPE FROM Z_USER_TBL WHERE USER_ID = ? "
				data = await wsmysql.query(conn, sql, [req.body.userid])
				if (data.length == 0) throw new Error(ws.cons.MSG_NO_DATA)
				rs.picture = data[0].PICTURE //rs.picture = data[0].PICTURE ? Buffer.from(data[0].PICTURE, 'binary').toString('base64') : null
				rs.mimetype = data[0].MIMETYPE
			} else { //watch out for MySQl Error => ER_NET_PACKET_TOO_LARGE: Got a packet bigger than 'max_allowed_packet' btyes
				const buf = (req.body.type == 'U') ? Buffer.from(new Uint8Array(req.files[0].buffer)) : null //null when req.body.type == 'D'
                const _mime = (req.body.type == 'U') ? req.body.mimetype : ""
				const uqry = "UPDATE Z_USER_TBL SET PICTURE = ?, MIMETYPE = ?, MODR = ?, MODDT = sysdate(6) WHERE USER_ID = ? "
				await wsmysql.query(conn, uqry, [buf, _mime, req.body.userid, req.body.userid])
			}			
			resolve(rs)
		} catch (ex) {
			reject(ex)
		} finally {
			wsmysql.closeConn(conn, req.title)
		}
	})
}

router.post('/', upload.any(), async (req, res) => {
	req.title = 'proc_picture.post'
	try {
		const userid = await ws.jwt.chkToken(req, res) //사용자 부서 위변조체크 필요없으면 세번째 인자인 conn을 빼면 됨
		if (!userid) return
		if (req.body.userid != userid) throw new Error(ws.cons.MSG_MISMATCH_WITH_USERID + '- req.body.userid')
		const rs = await proc(req)
		res.json(rs)
	} catch (ex) {
		ws.http.resException(req, res, ex)
	}
})

ws.util.watchRouterError(router)

module.exports = router
const config = require('../../config')
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
			conn = await wsmysql.getConnFromPool(global.pool)
			const objToken = await ws.jwt.chkToken(req) //res : 오류시 바로 클라이언트로 응답. conn : 사용자 조직정보 위변조체크
			const userid = objToken.userid
			if (!userid) {
				resolve(objToken)
				return
			}
			if (req.body.type == 'R') { //검색해서 발견 못함 (체크해보기 - getUser에서 처리)
				sql = "SELECT PICTURE, MIMETYPE FROM Z_USER_TBL WHERE USER_ID = ? "
				data = await wsmysql.query(conn, sql, [userid])
				if (data.length == 0) throw new Error(ws.cons.MSG_NO_DATA)
				rs.picture = data[0].PICTURE //rs.picture = data[0].PICTURE ? Buffer.from(data[0].PICTURE, 'binary').toString('base64') : null
				rs.mimetype = data[0].MIMETYPE
			} else { //watch out for MySQl Error => ER_NET_PACKET_TOO_LARGE: Got a packet bigger than 'max_allowed_packet' btyes
				//MIMETYPE 필드 : 파일이 아닌 BLOB으로 저장후 꺼내 쓸 때 mimetype을 얻으려면 현재는 파일로 변환해 구해야 하는데 차라리 최초 저장시 필드값으로 저장해 사용하는 것이 효율적인 것으로 판단
				const buf = (req.body.type == 'U') ? Buffer.from(new Uint8Array(req.files[0].buffer)) : null //null when req.body.type == 'D'
                const _mime = (req.body.type == 'U') ? req.body.mimetype : ""
				const uqry = "UPDATE Z_USER_TBL SET PICTURE = ?, MIMETYPE = ?, MODR = ?, MODDT = sysdate(6) WHERE USER_ID = ? "
				await wsmysql.query(conn, uqry, [buf, _mime, userid, userid])
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
		const rs = await proc(req)
		ws.http.resJson(res, rs, req.cookies.userid) //세번째 인자(userid) 있으면 token 갱신
	} catch (ex) {
		ws.http.resException(req, res, ex)
	}
})

ws.util.watchRouterError(router)

module.exports = router
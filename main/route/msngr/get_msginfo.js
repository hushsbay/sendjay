const config = require('../../config')
const ws = require(config.app.ws)
const wsmysql = require(config.app.wsmysql)
const fs = require('fs')
const mime = require('mime')
const express = require('express')
const router = express.Router()
//1) Image downloading 2) Checking sending failure 3) 이미지를 파일로 만들어 다운로드

router.use(function(req, res, next) {
	req.title = 'get_msginfo'
	next() //next('error')는 아래 ws.util.watchRouterError()로 연결
})

router.post('/', async function(req, res) {
	let conn, sql, data, len
	try {
		const rs = ws.http.resInit()
		const { msgid, body, kind, msgids } = req.body
		conn = await wsmysql.getConnFromPool(global.pool)
		const objToken = await ws.jwt.chkToken(req, res) //res : 오류시 바로 클라이언트로 응답. conn : 사용자 조직정보 위변조체크
		const userid = objToken.userid
		if (!userid) return
		if (kind == 'check') {
			const _arr = []
			for (let _msgid of msgids) {
				sql = "SELECT COUNT(*) CNT FROM A_MSGMST_TBL WHERE MSGID = ? "
				data = await wsmysql.query(conn, sql, [_msgid])
				if (data[0].CNT == 0) _arr.push(_msgid) //sending failure 실패난 것만 클라이언트로 내림
			}
			rs.list = _arr
			ws.http.resJson(res, rs) //세번째 인자가 있으면 token 생성(갱신)해 내림
		} else {
			sql = "SELECT TYP TYPE, BUFFER, BODY FROM A_MSGMST_TBL WHERE MSGID = ? "
			data = await wsmysql.query(conn, sql, [msgid])
			if (data.length == 0) {
				ws.http.resWarn(res, ws.cons.MSG_NO_DATA, true) //true=toast
				return
			}
			if (data[0].TYPE == 'image') {
				//rs.buffer = data[0].BUFFER //rs.bufferStr = (data[0].BUFFER) ? Buffer.from(data[0].BUFFER, 'binary').toString('base64') : null
				//resolve(rs)
				const ret = await ws.util.chkAccessUserWithTarget(conn, userid, msgid, '')
				if (ret != '') throw new Error(ret)
				rs.list = data
				ws.http.resJson(res, rs) //세번째 인자(userid) 있으면 token 갱신
			} else if (data[0].TYPE == 'file' || data[0].TYPE == 'flink') { //almost same as get_sublink.js 
				let fileToProc
				const _fileStr = body.split(ws.cons.deli)
				const objFileStr = ws.util.getFileNameAndExtension(_fileStr[0])
				if (ws.cons.sublink_ext_video.includes(objFileStr.ext)) {
					fileToProc = _fileStr[0] + ws.cons.sublink_result_img
				} else if (ws.cons.sublink_ext_image.includes(objFileStr.ext)) {
					fileToProc = _fileStr[0]
				} else {
					rs.list = data
					ws.http.resJson(res, rs) //세번째 인자(userid) 있으면 token 갱신
					return
				}
				const ret = await ws.util.chkAccessUserWithTarget(conn, userid, msgid, 'file', _fileStr[0])
				if (ret != '') throw new Error(ret)
				const _filepath = config.app.uploadPath + '/' + fileToProc
				fs.stat(_filepath, function(err, stat) {
					if (err) {
						rs.list = data
						ws.http.resJson(res, rs) //세번째 인자(userid) 있으면 token 갱신
					} else {
						if (stat && stat.isFile() && stat.size <= ws.cons.max_size_to_sublink) { 
							fs.readFile(_filepath, function(err1, result) {
								if (!err1) data[0].BUFFER = result									
								rs.list = data
								ws.http.resJson(res, rs) //세번째 인자(userid) 있으면 token 갱신
							})
						} else {
							rs.list = data
							ws.http.resJson(res, rs) //세번째 인자(userid) 있으면 token 갱신
						}
					}					
				})
			} else {
				const ret = await ws.util.chkAccessUserWithTarget(conn, userid, msgid, '')
				if (ret != '') throw new Error(ret)
				rs.list = data
				ws.http.resJson(res, rs) //세번째 인자(userid) 있으면 token 갱신
			}
		}
	} catch (ex) {
		ws.http.resException(req, res, ex)
	} finally {
		wsmysql.closeConn(conn, req.title)
	}
})

router.get('/', async function(req, res) { //chat.html의 hush.http.fileDownload("imagetofile", obj.msgid) 참조 : 이미지를 파일로 만들어 다운로드 (PC 및 모바일)
	let conn, sql, data, len
	try {
		const rs = ws.http.resInit()
		const { msgid, type, suffix } = req.query
		conn = await wsmysql.getConnFromPool(global.pool)
		const objToken = await ws.jwt.chkToken(req, res) //res : 오류시 바로 클라이언트로 응답. conn : 사용자 조직정보 위변조체크
		const userid = objToken.userid
		if (!userid) return
		sql = "SELECT TYP TYPE, BUFFER, BODY FROM A_MSGMST_TBL WHERE MSGID = ? "
		data = await wsmysql.query(conn, sql, [msgid])
		if (data.length == 0) {
			ws.http.resWarn(res, ws.cons.MSG_NO_DATA, true) //true=toast
			return
		}
		const ret = await ws.util.chkAccessUserWithTarget(conn, userid, msgid, '')
		if (ret != '') throw new Error(ret)
		if (data[0].TYPE == 'image') {			
			if (type == 'imagetofile') {
				const filename = ws.cons.title + '_' + suffix + ws.cons.sublink_result_img //same as mobile app (file download for webview)
				const buf = Buffer.from(new Uint8Array(data[0].BUFFER))
				const filePath = config.app.uploadPath + '/' + filename
				const writer = fs.createWriteStream(filePath)
				writer.write(buf)
				writer.end()
				writer.on("finish", () => { 
					const mimetype = mime.getType(filename)
					res.setHeader('Content-type', mimetype)
					res.download(filePath, filename, (err) => { //res.setHeader('Content-disposition', 'attachment; filename=' + filename)
						if (err) ws.util.loge(req, err)
						fs.unlink(filePath, () => { })
					})
				})
			} else { //현재 여기로 올 일 없음
				rs.list = data
				ws.http.resJson(res, rs) //세번째 인자(userid) 있으면 token 갱신
			}
		} //현재 else case 없음
	} catch (ex) {
		ws.http.resException(req, res, ex)
	} finally {
		wsmysql.closeConn(conn, req.title)
	}
})

ws.util.watchRouterError(router)

module.exports = router
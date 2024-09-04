const config = require('../../config')
const nodeConfig = require(config.app.nodeConfig)
const ws = require(nodeConfig.app.ws)
const wsmysql = require(nodeConfig.app.wsmysql)
const fs = require('fs')
const mime = require('mime')
const express = require('express')
const router = express.Router()
//1) Image downloading 2) Checking sending failure 3) 이미지를 파일로 만들어 다운로드
//restful_timeout이 너무 짧거나 이미지 사이즈가 너무 크면 안내려오는 경우 발생함

router.use(function(req, res, next) {
	req.title = 'get_msginfo'
	next() //next('error')는 아래 ws.util.watchRouterError()로 연결
})

router.post('/', async function(req, res) {
	let conn, sql, data, len
	try {
		const rs = ws.http.resInit()
		const { msgid, body, kind, msgids } = req.body //console.log(msgid, body, kind, msgids, "######")
		conn = await wsmysql.getConnFromPool(global.pool)
		const objToken = await ws.jwt.chkToken(req, res) //res : 오류시 바로 클라이언트로 응답. conn : 사용자 조직정보 위변조체크
		const userid = objToken.userid
		if (!userid) {
			ws.http.resWarn(res, objToken.msg, false, objToken.code, req.title)
			return
		}
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
			sql = "SELECT TYP TYPE, BUFFER, CASE WHEN STATE2 = 'C' THEN '" + ws.cons.cell_revoked + "' ELSE BODY END BODY, SENDERNM, FILESTATE "
			sql += " FROM A_MSGMST_TBL WHERE MSGID = ? "
			data = await wsmysql.query(conn, sql, [msgid])
			if (data.length == 0) {
				ws.http.resWarn(res, ws.cons.MSG_NO_DATA, true, ws.cons.CODE_NO_DATA) //true=toast
				return
			}
			if (data[0].TYPE == 'image') {
				const ret = await ws.util.chkAccessUserWithTarget(conn, userid, msgid, '')
				if (ret != '') throw new Error(ret)
				rs.list = data
				ws.http.resJson(res, rs) //세번째 인자(userid) 있으면 token 갱신
			} else if (kind != 'reply' && data[0].FILESTATE != ws.cons.file_expired && (data[0].TYPE == 'file' || data[0].TYPE == 'flink')) { //almost same as get_sublink.js 
				//reply일 경우 file은 일반텍스트만 받으므로 여기로 들어오지 않음
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
						console.log('msginfo', err.toString(), msgid)
						rs.list = data
						ws.http.resJson(res, rs) //세번째 인자(userid) 있으면 token 갱신
					} else {
						if (stat && stat.isFile() && stat.size <= ws.cons.max_size_to_sublink) { 
							fs.readFile(_filepath, function(err1, result) {
								if (err1) {
									console.log('msginfo2', err1.toString(), msgid)
								} else {
									data[0].BUFFER = result
								}
								rs.list = data
								ws.http.resJson(res, rs) //세번째 인자(userid) 있으면 token 갱신
							})
						} else {
							console.log('msginfo1', msgid)
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
		if (!userid) {
			ws.http.resWarn(res, objToken.msg, false, objToken.code, req.title)
			return
		}
		sql = "SELECT TYP TYPE, BUFFER, CASE WHEN STATE2 = 'C' THEN '" + ws.cons.cell_revoked + "' ELSE BODY END BODY FROM A_MSGMST_TBL WHERE MSGID = ? "
		data = await wsmysql.query(conn, sql, [msgid])
		if (data.length == 0) {
			ws.http.resWarn(res, ws.cons.MSG_NO_DATA, true, ws.cons.CODE_NO_DATA) //true=toast
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
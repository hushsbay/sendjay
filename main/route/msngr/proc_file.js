const config = require('../../config')
const ws = require(config.app.ws)
const wsmysql = require(config.app.wsmysql)
const fs = require('fs-extra') //not fs
const url = require('url')
const mime = require('mime') //@4.x는 require()시 오류 발생 (@3.0.0 사용함)
const express = require('express')
const multer  = require('multer') //@1.4.5는 한글 깨짐 (@1.4.4로 사용함)
const ffmpeg = require('fluent-ffmpeg')
const router = express.Router()

const procScreenShot = (req, filename, filepath, filedir) => {
	return new Promise(async (resolve, reject) => {
		try {			
			const new_filename = filename + ws.cons.sublink_result_img
			const ffMpeg = new ffmpeg({ source: filepath, nolog: true })
			ffMpeg.setFfmpegPath(config.app.ffmpegPath)
			ffMpeg.takeScreenshots({ timemarks : ['00:00:03.000'], size : '320x320', filename : new_filename }, filedir)
			.on('error', function(err) {
				console.log('ffmpeg error : ' + err + ' ==> ' + filepath)
				resolve()
			}).on('end', function() {
				if (filename.endsWith(ws.cons.sublink_ext_video)) {
					ffmpeg.ffprobe(filepath, function(err, metadata) { //You can remove this coding if performance issue exists
						if (err) {
							resolve()
						} else {					
							resolve(metadata) //metadata should contain 'width', 'height' and 'display_aspect_ratio'
						}
					})
				} else {
					resolve()
				}
			})
		} catch (ex) {
			ws.util.loge(req, ex) //ws.log.ex(req, ex, 'procScreenShot', filepath)
			resolve()
		}
	})
}

const upload = multer({ storage: multer.diskStorage({ //order : destination -> filename (all the time regardless coding position)
	destination : async function(req, file, cb) {
		let _dir_room, _dir
		try {			
			_dir_room = config.app.uploadPath + '/' + req.body.roomid
			_dir = _dir_room + '/' + req.body.senderid
			if (_dir.includes('undefined')) {
				const errStr = '_dir undefined - ' + _dir + '-' + file.originalname
				ws.util.loge(req, errStr)
				cb(errStr)
			}
			await fs.ensureDir(_dir_room) //It's possible that empty dir occurrs.
			await fs.ensureDir(_dir) //It's possible that empty dir occurrs.
			cb(null, _dir)
		} catch (ex) {
			ws.util.loge(req, ex) //ws.log.ex(req, err, 'destination', _dir)
			cb(ex)
		}
	},
	filename : async function(req, file, cb) { //file={"fieldname":"file","originalname":"제목 없음.png","encoding":"7bit","mimetype":"image/png"} : no file size here
		let conn, sql, data, len
		try {
			const fileStrObj = ws.util.getFileNameAndExtension(file.originalname) //file size => req.body.body
			req.filename = fileStrObj.name + ws.cons.subdeli + ws.util.getCurDateTimeStr() + ws.util.getRnd() + fileStrObj.extDot
			conn = await wsmysql.getConnFromPool(global.pool)
			//const role = await ws.getRole(req.cookies.userid, conn)
			//if (!ws.chkRole(role, ws.cons.group_admin)) {
				if (req.body.body > ws.cons.max_filesize) throw new Error('파일크기 초과 (최대:' + ws.cons.max_filesize + ', 현재:' + req.body.body + ')')
				sql = "SELECT COUNT(*) CNT FROM A_MSGMST_TBL WHERE TYP = 'file' AND FILESTATE >= sysdate() AND FILESTATE <> ? AND SENDERID = ? "
				data = await wsmysql.query(conn, sql, [ws.cons.file_expired, req.body.senderid])
				if (data[0].CNT >= ws.cons.max_filecount) throw new Error('최대 ' + ws.cons.max_filecount + '개 파일까지 한번에 전송 가능합니다.')
			//}
			sql = "INSERT INTO A_FILELOG_TBL (MSGID, ROOMID, SENDERID, BODY, CDT) VALUES (?, ?, ?, ?, sysdate(6)) "
			await wsmysql.query(conn, sql, [req.body.msgid, req.body.roomid, req.body.senderid, req.filename])
			cb(null, req.filename)
		} catch (ex) {
			ws.util.loge(req, ex) //ws.log.ex(req, ex, 'filename', req.filename)
			cb(ex)
		} finally {
			wsmysql.closeConn(conn, req.title)
		}
	}
})})

const procMulter = (req) => {
	return new Promise(async (resolve, reject) => {
		let conn, sql, data, len, userid
		try {	
			const rs = ws.http.resInit()
			let expiry = ws.util.setHourAdd(new Date(), ws.cons.max_hours_to_filesave) //ws.util.setDateAdd(new Date(), ws.cons.max_days_to_filesave)
			const ridArr = req.body.receiverid.split(ws.cons.easydeli)
			const rnmArr = req.body.receivernm.split(ws.cons.easydeli)
			const filedir = config.app.uploadPath + '/' + req.body.roomid + '/' + req.body.senderid
			const filepath = filedir + '/' + req.filename
			let fileInfo = filepath + ws.cons.deli + req.body.body
			fileInfo = fileInfo.replace(config.app.uploadPath + '/', '') //hide parent folder for file upload
			console.log(fileInfo+'@@@@@@@@@@@@')
			conn = await wsmysql.getConnFromPool(global.pool)			
			await wsmysql.txBegin(conn)
			sql = "INSERT INTO A_MSGMST_TBL (MSGID, ROOMID, SENDERID, SENDERNM, BODY, REPLY, TYP, FILESTATE, CDT) VALUES (?, ?, ?, ?, ?, ?, ?, ?, sysdate(6)) "
			await wsmysql.query(conn, sql, [req.body.msgid, req.body.roomid, req.body.senderid, req.body.sendernm, fileInfo, req.body.reply, req.body.type, expiry])
			len = ridArr.length
			for (let i = 0; i < len; i++) {
				sql = "INSERT INTO A_MSGDTL_TBL (MSGID, ROOMID, SENDERID, RECEIVERID, RECEIVERNM, CDT) VALUES (?, ?, ?, ?, ?, sysdate(6)) "
				await wsmysql.query(conn, sql, [req.body.msgid, req.body.roomid, req.body.senderid, ridArr[i], rnmArr[i]])
			}
			const objFileStr = ws.util.getFileNameAndExtension(req.filename)
			if (ws.cons.sublink_ext_video.includes(objFileStr.ext)) {
				const meta = await procScreenShot(req, req.filename, filepath, filedir)
				if (meta) {
					const _added = ws.cons.deli + meta.streams[0].width + ws.cons.deli + meta.streams[0].height 
					sql = "UPDATE A_MSGMST_TBL SET BODY = CONCAT(BODY, ?) WHERE MSGID = ? AND ROOMID = ? "
					await wsmysql.query(conn, sql, [_added, req.body.msgid, req.body.roomid])
				}
			}
			await wsmysql.txCommit(conn)
			resolve(rs)
		} catch (ex) {
			await wsmysql.txRollback(conn)
			reject(ex)
		} finally {
			wsmysql.closeConn(conn, req.title)
		}
	})
}

router.post('/', (req, res) => { //router.post('/', upload.single('file'), async (req, res) => {
	req.title = 'proc_file.post'
	upload.single('file')(req, res, async (err) => { //업로드 처리 순서 : upload(multer(destination) -> multer(filename)) -> procMulter()
		try {
			if (err) throw new Error(err.toString())
			//const result = await ws.verifyWithRestUserId(req, res, req.body.senderid, _logTitle)
			//if (!result) return //ws.http.resCodeMsg() 사용하지 않음을 유의
			const rs = await procMulter(req)
			res.json(rs)
		} catch (ex) {
			ws.http.resException(req, res, ex)
		}
	})
})

router.get('/*', async (req, res) => { //asterisk(*) needed
	req.title = 'proc_file.get'
	try {	
		//const result = await ws.verifyWithRestUserId(req, res, null, _logTitle)
		//if (!result) return //ws.http.resCodeMsg() 사용하지 않음을 유의
		let _path = url.parse(req.url).pathname.replace('/proc_file/', '')
		_path = decodeURIComponent(_path)
		const _idx = _path.indexOf('?')
		if (_idx > -1) _path = _path.substr(0, _idx)
		//const ret = await ws.chkAccessUserWithTarget(req.cookies.userid, req.query.msgid, "file", _path)
		//if (ret != "") throw new Error(ret)
		const _filename = config.app.uploadPath + _path //C:/nodeops/upload/sendjay~/20210214124957779000571393Q59/aaa$$2023~.png => _path starts with roomid        
		const mimetype = mime.getType(_filename) //mimetype = mime.lookup(_filename)
		res.setHeader('Content-type', mimetype) //res.header("Content-Type", "video/mp4; charset=utf-8")
        const fileStrObj = ws.util.getFileNameAndExtension(_filename)
        const _arr = _filename.split('/')
        const _brr = _arr[_arr.length - 1].split(ws.cons.subdeli)
        const newName = _brr[0] + fileStrObj.extDot
		res.download(_filename, newName)
	} catch (ex) {
		ws.http.resException(req, res, ex)
	}	
})

ws.util.watchRouterError(router)

module.exports = router

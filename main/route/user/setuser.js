const config = require('../../config')
const nodeConfig = require(config.app.nodeConfig)
const ws = require(nodeConfig.app.ws)
const wsmysql = require(nodeConfig.app.wsmysql)
const express = require('express')
const multer  = require('multer') //ajax enctype을 "multipart/form-data"으로 했을 경우 multer로 처리 필요
const router = express.Router()
const upload = multer({ storage: multer.memoryStorage() })

//1) 로그인하지 않은 상태로도 처리 가능 (아이디 생성 : admin/organ 아이디도 생성 가능. 수정/삭제시 기존 입력된 비번을 넣어야만 처리 가능)
//2) 로그인한 상태로 처리 가능 (admin 아이디로 로그인한 상태에서 비번없이도 다른 아이디 수정, 삭제 가능. 부서공용ID도 처리 가능)

router.use(function(req, res, next) {
	req.title = 'setuser'
	next() //next('error')는 아래 ws.util.watchRouterError()로 연결
})

router.post('/', upload.any(), async function(req, res) {
	let conn, sql, data, len
	try {
		const rs = ws.http.resInit()
		const { type, id, kind, nm, alias, pwd, pwd_1, toporgcd, toporgnm, orgcd, orgnm, mimetype } = req.body
		console.log(type, id, kind, nm, alias, pwd, pwd_1, toporgcd, toporgnm, orgcd, orgnm, mimetype)
		let _kind = (id == 'admin') ? 'A' : (id == 'organ' ? 'O' : kind)
		const buf = mimetype ? Buffer.from(new Uint8Array(req.files[0].buffer)) : null //MySql PICTURE 필드가 longblob 타입으로 되어 있고 브라우저에서 blob으로 넘겨받아 저장하는 것임
		conn = await wsmysql.getConnFromPool(global.pool)
		let userid = null //로그인하지 않은 상태로도 사용 가능하나
		if (req.cookies.token && req.cookies.userid) { //admin으로 로그인한 경우 체크 필요
			const objToken = await ws.jwt.chkToken(req, res)
			userid = objToken.userid
		}
		sql =  "SELECT COUNT(*) CNT, PWD FROM Z_USER_TBL WHERE USER_ID = ? "
		data = await wsmysql.query(conn, sql, [id])
		if (userid != 'admin') {
			if (_kind != 'U') {
				ws.http.resWarn(res, '일반 사용자ID만 처리 가능합니다.')
				return
			}
		}
		if (type == 'C') {
			if (data[0].CNT > 0) {
				ws.http.resWarn(res, ws.cons.MSG_ALREADY_EXISTS)
				return
			}
			const _enc = ws.util.encrypt(pwd_1, nodeConfig.crypto.key)
			//MIMETYPE 필드 : 파일이 아닌 BLOB으로 저장후 꺼내 쓸 때 mimetype을 얻으려면 현재는 파일로 변환해 구해야 하는데 차라리 최초 저장시 필드값으로 저장해 사용하는 것이 효율적인 것으로 판단
			sql = "INSERT INTO Z_USER_TBL (USER_ID, ID_KIND, PWD, USER_NM, ORG_CD, ORG_NM, TOP_ORG_CD, TOP_ORG_NM, PICTURE, MIMETYPE, NICK_NM, IS_SYNC, ISUDT) "
			sql += "                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, sysdate(6)) "
			await wsmysql.query(conn, sql, [id, _kind, _enc, nm, orgcd, orgnm, toporgcd, toporgnm, buf, mimetype, alias, 'N'])
		} else {
			if (data[0].CNT == 0) {
				ws.http.resWarn(res, ws.cons.MSG_NO_DATA, true, ws.cons.CODE_NO_DATA)
				return
			}
			if (userid != 'admin') {
				const _dec = ws.util.decrypt(data[0].PWD, nodeConfig.crypto.key)
				if (pwd != _dec) {
					ws.http.resWarn(res, '입력한 (기존) 비번이 서버에 저장된 비번과 다릅니다.')
					return
				}
			}
			if (type == 'D') {
				sql = "DELETE FROM Z_USER_TBL WHERE USER_ID = ? "
				await wsmysql.query(conn, sql, [id])
			} else { //U(Update)
				if (pwd_1 == "") { //비번변경 X
					_str = "PWD"
				} else {
					const _enc = ws.util.encrypt(pwd_1, nodeConfig.crypto.key)
					_str = "'" + _enc + "'"
				}
				//MIMETYPE 필드 : 파일이 아닌 BLOB으로 저장후 꺼내 쓸 때 mimetype을 얻으려면 현재는 파일로 변환해 구해야 하는데 차라리 최초 저장시 필드값으로 저장해 사용하는 것이 효율적인 것으로 판단				
				sql =  "UPDATE Z_USER_TBL "
				sql += "   SET ID_KIND = ?, USER_NM = ?, PWD = " + _str + ", ORG_CD = ?, ORG_NM = ?, TOP_ORG_CD = ?, TOP_ORG_NM = ?, PICTURE = ?, MIMETYPE = ?, NICK_NM = ? "
				sql += " WHERE USER_ID = ? "
				await wsmysql.query(conn, sql, [_kind, nm, orgcd, orgnm, toporgcd, toporgnm, buf, mimetype, alias, id])
			}
		}
		ws.http.resJson(res, rs) //세번째 인자가 있으면 token 생성(갱신)해 내림
	} catch (ex) {
		ws.http.resException(req, res, ex)
	} finally {
		wsmysql.closeConn(conn, req.title)
	}
})

ws.util.watchRouterError(router)

module.exports = router
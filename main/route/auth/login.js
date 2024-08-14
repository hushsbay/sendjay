const config = require('../../config')
const nodeConfig = require(config.app.nodeConfig)
const ws = require(nodeConfig.app.ws)
const wsmysql = require(nodeConfig.app.wsmysql)
const express = require('express')
const router = express.Router()

router.use(function(req, res, next) {
	req.title = 'login'
	next() //next('error')는 아래 ws.util.watchRouterError()로 연결
})

router.post('/', async function(req, res) {
	let conn, sql, data, len, userid, webAuthenticated
	try { 
		const rs = ws.http.resInit()
		const { uid, pwd, autologin, autokey_app, kind } = req.body //autologin은 앱에서만 사용 (웹은 자동로그인이 아닌 token을 통한 인증체크임)
		console.log(req.title, ws.util.getCurDateTimeStr(true), autologin, uid) //나중에 막기
		conn = await wsmysql.getConnFromPool(global.pool)
		if (kind == 'web') { //웹에서는 맨 처음 로그인시 uid,pwd가 넘어 오거나 이미 로그인 상태에서 쿠키(token,userid)가 넘어와 체크하면 됨
			if (!uid) {
				const objToken = await ws.jwt.chkToken(req, res, conn) //res : 오류시 바로 클라이언트로 응답. conn : 사용자 조직정보 위변조체크
				userid = objToken.userid
				if (!userid) {
					ws.http.resWarn(res, objToken.msg, false, objToken.code, req.title)
					return
				}
				webAuthenticated = true		
			} else { //웹 로그인 (원래부터 자동로그인은 없음)
				userid = uid
			}
		} else { //앱은 pwd가 항상 넘어와 아래에서 체크
			userid = uid
		}		
		sql =  "SELECT USER_ID, PWD, USER_NM, ORG_CD, ORG_NM, TOP_ORG_CD, TOP_ORG_NM, NICK_NM, JOB, AB_CD, AB_NM, NOTI_OFF, "
		sql += "       BODY_OFF, SENDER_OFF, TM_FR, TM_TO, AUTOKEY_APP "
		sql += "  FROM Z_USER_TBL "
		sql += " WHERE USER_ID = ? "
		data = await wsmysql.query(conn, sql, [userid])
		if (data.length == 0) {
			ws.http.resWarn(res, '사용자아이디가 없습니다.')
			return
		}
		if (webAuthenticated) {
			//위 토큰 인증을 신뢰하고 진행함
		} else {
			let pwdToCompare
			if (autologin == 'Y') { //pwd는 앱에 저장된 암호화된 상태의 값이므로 pwdToCompare도 암호화된 값 그대로 비교 필요
				pwdToCompare = data[0].PWD
			} else { //pwd는 암호화되지 않은 사용자 입력분 그대로이므로 pwdToCompare도 디코딩 필요
				pwdToCompare = ws.util.decrypt(data[0].PWD, nodeConfig.crypto.key)
			}
			if (pwd != pwdToCompare) {
				ws.http.resWarn(res, '비번이 다릅니다.')
				return
			}
		}
		if (autologin == 'Y' || webAuthenticated) { //앱자동로그인 또는 웹인증OK시 
			if (autologin == 'Y') {
				if (autokey_app != data[0].AUTOKEY_APP) {
					ws.http.resWarn(res, '(자동로그인 해제) 수동로그인이 필요합니다.')
					return
				}
			} else {
				//AUTOKEY_WEB은 관리안함
			}
		} else {
			if (kind == 'web') {
				//AUTOKEY_WEB은 관리안함
			} else {
				sql = "UPDATE Z_USER_TBL SET AUTOKEY_APP = '" + autokey_app + "' WHERE USER_ID = ? "		
			}
			await wsmysql.query(conn, sql, [userid])
			data[0].AUTOKEY_APP = autokey_app //순전히 앱에서 코딩이 불편해서 처리한 것임 //AUTOKEY_WEB은 관리안함
		}
		Object.assign(rs, data[0])
		if (kind == 'web') delete rs['PWD'] //웹에서는 브라우저에서 비번저장하지 않음 (암호화된 비번도 내리지도 말기)
		//여기는 모두 세션 쿠키로 내림. 아래 쿠키설정은 verifyUser() in common.js의 쿠키가져오기와 일치해야 함 
		//userid는 여기가 아닌 (아이디저장 옵션때문에 session/persist 여부를) login.html에서 판단 : 여기서도 설정하면 브라우저에서와 충돌 (더 먼저 수행될 수 있어 문제)
		//ws.http.resCookie(res, "usernm", rs.USER_NM); ws.http.resCookie(res, "orgcd", rs.ORG_CD); ws.http.resCookie(res, "orgnm", rs.ORG_NM)
		//ws.http.resCookie(res, "toporgcd", rs.TOP_ORG_CD); ws.http.resCookie(res, "toporgnm", rs.TOP_ORG_NM)
		//위 쿠키는 여기서해도 되지만 코드 편의상 login.html에서 userid와 함께 전체적으로 설정함
		//결론적으로, 사용자정보는 응답본문으로 내리고 토큰만 응답본문+쿠키로 내림 (쿠키만 내려도 구현을 가능한데 코딩이 불편해서 아예 응답본문으로도 토큰을 내림)
		//1) 웹에서는 사용자정보는 login.html에서 쿠키로 설정하고 토큰은 자동으로 쿠키로 내려감 (비번 불포함)
		//2) 앱에서는 사용자정보 및 토큰을 응답본문으로 모두 받으므로 그걸 모두 UserInfo()에서 KeyChain으로 저장함 (비번 포함)
		ws.http.resJson(res, rs, userid) //세번째 인자가 있으면 token 생성(갱신)해 내림
	} catch (ex) {
		ws.http.resException(req, res, ex)
	} finally {
		wsmysql.closeConn(conn, req.title)
	}
})

ws.util.watchRouterError(router)

module.exports = router
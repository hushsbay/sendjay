const config = require('../../config')
const nodeConfig = require(config.app.nodeConfig)
const ws = require(nodeConfig.app.ws)
const express = require('express')
const router = express.Router()

router.use(function(req, res, next) {
	req.title = 'login'
	next() //next('error')는 아래 ws.util.watchRouterError()로 연결
})

router.post('/', async function(req, res) {
	try { 
		//const rs = ws.http.resInit() //아래 auth module 호출이므로 막음
		const { uid, pwd, autologin, autokey_app, kind } = req.body //autologin은 앱에서만 사용 (웹은 자동로그인이 아닌 token을 통한 인증체크임)
		//console.log(req.title, ws.util.getCurDateTimeStr(true), uid, pwd, autologin, autokey_app, kind) //나중에 막기
		const auth = require('../../module/auth')
		const rs = await auth.login(uid, pwd, autologin, autokey_app, kind, req, res)
		if (rs.code != ws.cons.CODE_OK) {
			ws.http.resWarn(res, rs.msg, false, rs.code, req.title)
			return
		}
		//여기는 모두 세션 쿠키로 내림. 아래 쿠키설정은 verifyUser() in common.js의 쿠키가져오기와 일치해야 함 
		//userid는 여기가 아닌 (아이디저장 옵션때문에 session/persist 여부를) login.html에서 판단 : 여기서도 설정하면 브라우저에서와 충돌 (더 먼저 수행될 수 있어 문제)
		//ws.http.resCookie(res, "usernm", rs.USER_NM); ws.http.resCookie(res, "orgcd", rs.ORG_CD); ws.http.resCookie(res, "orgnm", rs.ORG_NM)
		//ws.http.resCookie(res, "toporgcd", rs.TOP_ORG_CD); ws.http.resCookie(res, "toporgnm", rs.TOP_ORG_NM)
		//위 쿠키는 여기서해도 되지만 코드 편의상 login.html에서 userid와 함께 전체적으로 설정함
		//결론적으로, 사용자정보는 응답본문으로 내리고 토큰만 응답본문+쿠키로 내림 (쿠키만 내려도 구현을 가능한데 코딩이 불편해서 아예 응답본문으로도 토큰을 내림)
		//1) 웹에서는 사용자정보는 login.html에서 쿠키로 설정하고 토큰은 자동으로 쿠키로 내려감 (비번 불포함)
		//2) 앱에서는 사용자정보 및 토큰을 응답본문으로 모두 받으므로 그걸 모두 UserInfo()에서 KeyChain으로 저장함 (비번 포함)
		ws.http.resJson(res, rs, rs.userid) //세번째 인자가 있으면 token 생성(갱신)해 내림
	} catch (ex) {
		ws.http.resException(req, res, ex)
	}
})

ws.util.watchRouterError(router)

module.exports = router
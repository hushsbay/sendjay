const config = require('../../config')
const nodeConfig = require(config.app.nodeConfig)
const ws = require(nodeConfig.app.ws)
const express = require('express')
const router = express.Router()

//일반적으로는 인증토큰의 만기를 적당히 (예: 4시간) 설정하고 만기가 지나도록 아이들 상태(서버호출없음)이면 인증만료로 내려보내는데
//메신저처럼 계속 토큰이 살아 있으려면 1) 토큰만료일을 길게 주게 될 경우는 노출시 아무래도 보안상 위험한 부분이 있으므로 
//2) 만기를 짧게 주는 대신 여기 refresh_token을 클라이언트(앱 or 웹)에서 주기적으로 호출해서 갱신된 토큰을 내려 받는 것이 낫다고 판단됨
//앱에서는 쿠키로 올리고 내려받는 건 불편하므로 post rq/rs로 핸들링 가능하도록 되어 있음

//refresh_token을 호출하는 곳은 아래임
//1) startFromWebView() in main_common.js 앱에서 시작시
//2) startMsngr() in main_common.js 웹에서 시작시 (StandAlone과 Embedded 두 경우 모두)
//refresh_token을 호출하지는 않지만 안드로이드 onResume()에서 갱신된 토큰을 넘겨주고 있음
//안드로이드 웹뷰가 스택 아래에 들어있는 경우도 백그라운드에서 refresh_token이 호출되는데 디바이스 제어에 의해 호출이 안되는 경우가 혹시 생길까봐 추가한 것임

router.use(function(req, res, next) {
	req.title = 'refresh_token'
	next() //next('error')는 아래 ws.util.watchRouterError()로 연결
})

router.post('/', async function(req, res) {
	try {
		const rs = ws.http.resInit()
		const objToken = await ws.jwt.chkToken(req, res) //res : 오류시 바로 클라이언트로 응답. conn : 사용자 조직정보 위변조체크
		const userid = objToken.userid
		if (!userid) {
			ws.http.resWarn(res, objToken.msg, false, objToken.code, req.title)
			return
		}
		ws.http.resJson(res, rs, userid) //세번째 인자(userid) 있으면 token 갱신
	} catch (ex) {
		ws.http.resException(req, res, ex)
	}
})

ws.util.watchRouterError(router)

module.exports = router

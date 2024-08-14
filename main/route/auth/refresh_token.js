const config = require('../../config')
const nodeConfig = require(config.app.nodeConfig)
const ws = require(nodeConfig.app.ws)
const express = require('express')
const router = express.Router()

//일반적으로는 인증토큰의 만기를 적당히 (예: 4시간) 설정하고 만기가 지나도록 아이들 상태(서버호출없음)이면 인증만료로 내려보내는데
//메신저처럼 계속 토큰이 살아 있으려면 1) 토큰만료일을 길게 주게 될 경우는 노출시 아무래도 보안상 위험한 부분이 있으므로 
//2) 만기를 짧게 주는 대신 여기 refresh_token을 클라이언트에서 주기적으로 호출해서 갱신된 토큰을 내려 받는 것이 낫다고 판단됨

//1. PC 웹의 경우
//	 - startMsngr() in main_common.js에서 주기적으로 토큰을 갱신해주면 됨
//2. 모바일 네이티브앱 + 웹뷰의 경우
//	 - 네이티브앱은 액티비티는 강제로 종료시키고 서비스만 살아 있는 경우도 고려해야 하므로
//	 - 주기적으로 토큰을 갱신하면 앱 대기모드나 슬립모드에서 주기적인 호출이 block되기 때문에
//   - 아예, 소켓 재연결시와 onResume()시에 자동로그인을 해서 토큰을 새로 생성 받아서 웹뷰로 넘겨주기로 함
//     소켓 재연결시엔 query 파라미터내 token을 갱신해야 함 (SocketIO.kt 참조)
//   - 웹뷰(앱)에서는 1. PC 웹의 경우처럼 주기적으로 토큰을 갱신해주면 됨 : startFromWebView() in main_common.js 참조

//결론적으로, jwt 만기는 토큰 갱신 주기(앱은 없음)가 10분으로 되어 있으므로 적어도 1시간 정도 이상으로 설정하는 것이 좋아 보임
//정상적인 상황이면 주기적으로 갱신하므로 토큰 만기가 뜨면 안되는 것임

router.use(function(req, res, next) {
	req.title = 'refresh_token'
	next() //next('error')는 아래 ws.util.watchRouterError()로 연결
})

router.post('/', async function(req, res) {
	try {
		const rs = ws.http.resInit()
		const objToken = await ws.jwt.chkToken(req, res, null, true) //true는 로깅(console.log 포함) 남기지 않게 함
		const userid = objToken.userid
		if (!userid) {
			console.log("refreshToken", objToken.msg)
			ws.http.resWarn(res, objToken.msg, false, objToken.code, req.title)
			return
		}
		console.log("refreshToken", userid)
		ws.http.resJson(res, rs, userid) //세번째 인자(userid) 있으면 token 갱신
	} catch (ex) {
		ws.http.resException(req, res, ex)
	}
})

ws.util.watchRouterError(router)

module.exports = router

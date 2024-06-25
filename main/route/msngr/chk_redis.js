const config = require('../../config')
const nodeConfig = require(config.app.nodeConfig)
const ws = require(nodeConfig.app.ws)
const express = require('express')
const router = express.Router()

router.use(function(req, res, next) {
	req.title = 'chk_redis'
	next() //next('error')는 아래 ws.util.watchRouterError()로 연결
})

router.post('/', async function(req, res) {
	try {
		const rs = ws.http.resInit()
		const { type, userkey, winid } = req.body
		const objToken = await ws.jwt.chkToken(req, res) //res : 오류시 바로 클라이언트로 응답. conn : 사용자 조직정보 위변조체크
		if (!objToken.userid) return
		const pattern = ws.cons.key_str_winid + userkey + ws.cons.easydeli //$$ + W + W__USERID;
		const uwKey = pattern + winid //$$WW__USERID;winid
		const _dt = ws.util.getCurDateTimeStr(true)
		const stream = global.store.scanStream({ match : pattern + '*', count : ws.cons.scan_stream_cnt }) 
		//console.log(type, "##############", userkey, winid, pattern, uwKey)
		stream.on('data', async (resultKeys) => { //resultKeys is an array of strings representing key names
			if (type == "chk_embeded") { //웹메신저 자동실행을 위한 마지막 체크임
				if (resultKeys.length == 0) { //console.log(type, userkey, winid, pattern, uwKey, "====new")
					await global.store.set(uwKey, _dt)
					rs.result = "new" //새로운 winner
				} else {
					for (let item of resultKeys) {
						const arr = item.split(ws.cons.easydeli) //[0](userkey), [1](winid)
						if (arr[1] == winid) { //console.log(type, userkey, winid, pattern, uwKey, "====same")
							await global.store.set(uwKey, _dt)
							rs.result = "same" //기존 우승자 계속
							break
						} else { //console.log(type, userkey, winid, pattern, uwKey, "====another")
							//ws.cons.max_diff_sec_worker가 지난 것은 닫힌 탭이므로 삭제해야 함 (Web Worker에 의해 업데이트 안되는 가비지 데이터임)
							const _dtVal = await global.store.get(item)
							const _diffSec = ws.util.getDateTimeDiff(_dtVal, new Date())
							if (_diffSec > ws.cons.max_diff_sec_worker) await global.store.del(item)
							rs.result = "another"
						}
					}
				}
			} else if (type == "set_new") { //manual 실행시 무조건 키 setting함 (auto로 들어오는 embeded일 경우는 여기로 오면 안됨 - 무한루프)
				for (let item of resultKeys) await global.store.del(item)
				await global.store.set(uwKey, _dt) //await global.store.set(uwKey, winid) //console.log(type, userkey, winid, pattern, uwKey)
				rs.result = "new" //새로운 winner		
			}
			rs.userip = req.clientIp //소켓서버에서 파악이 힘들어 미리 클라이언트로 내려 요청시 포함하도록 하려 함
			ws.http.resJson(res, rs) //세번째 인자(userid) 있으면 token 갱신
		}) //stream.on('end', function() { resolve(rs) }) //'end' does not guarantee rs.result as defined.
	} catch (ex) {
		ws.http.resException(req, res, ex)
	}
})

ws.util.watchRouterError(router)

module.exports = router
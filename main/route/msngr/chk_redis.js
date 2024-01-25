const config = require('../../config')
const ws = require(config.app.ws)
const express = require('express')
const router = express.Router()

router.use(function(req, res, next) {
	req.title = 'chk_redis'
	next() //next('error') for going to ws.util.watchRouterError() below
})

router.post('/', async function(req, res) {
	const rs = ws.http.resInit()
	try {
		const { type, userkey, winid } = req.body
		const userid = await ws.jwt.chkToken(req, res) //사용자 부서 위변조체크 필요없으면 세번째 인자인 conn을 빼면 됨
		if (!userid) return	
		
		const pattern = ws.cons.key_str_winid + userkey + ws.cons.easydeli //eg) $$WW__USERID;
		const uwKey = pattern + _winid //eg) $$WW__USERID;20200918210554260
		const stream = global.store.scanStream({ match : pattern + '*', count : ws.cons.scan_stream_cnt }) //console.log(_type, _userkey, _winid, pattern, uwKey)
		stream.on('data', async (resultKeys) => { //resultKeys is an array of strings representing key names
			if (_type == "chk_embeded") { //웹메신저 자동실행을 위한 마지막 체크임
				const _dt = ws.util.getCurDateTimeStr(true)
				if (resultKeys.length == 0) { //console.log(_type, _userkey, _winid, pattern, uwKey, "====new")
					await global.store.set(uwKey, _dt)
					rs.result = "new" //새로운 winner
				} else {
					for (let item of resultKeys) {
						const arr = item.split(ws.cons.easydeli) //[0](userkey), [1](winid)
						if (arr[1] == _winid) { //console.log(_type, _userkey, _winid, pattern, uwKey, "====same")
							await global.store.set(uwKey, _dt)
							rs.result = "same" //기존 우승자 계속
							break
						} else { //console.log(_type, _userkey, _winid, pattern, uwKey, "====another")
							//com.cons.max_diff_sec_worker가 지난 것은 닫힌 탭이므로 삭제해야 함 (Web Worker에 의해 업데이트 안되는 가비지 데이터임)
							const _dtVal = await global.store.get(item)
							const _diffSec = ws.util.getDateTimeDiff(_dtVal, new Date())
							if (_diffSec > com.cons.max_diff_sec_worker) await global.store.del(item)
							rs.result = "another"
						}
					}
				}
				rs.userip = req.clientIp
				res.json(rs)
			} else if (_type == "set_new") { //manual 실행시 무조건 키 setting함
				for (let item of resultKeys) await global.store.del(item)
				await global.store.set(uwKey, _winid) //console.log(_type, _userkey, _winid, pattern, uwKey)
				rs.result = "new" //새로운 winner		
			}
			rs.userip = req.clientIp
			res.json(rs)
			
		}) //stream.on('end', function() { resolve(rs) }) //'end' does not guarantee rs.result as defined.
		

        // if (len == 0) {
		// 	ws.http.resWarn(res, ws.cons.MSG_NO_DATA)
		// 	return
		// }       	
		
	} catch (ex) {
		ws.http.resException(req, res, ex)
	} finally {
		wsmysql.closeConn(conn, req.title)
	}
})

ws.util.watchRouterError(router)

module.exports = router
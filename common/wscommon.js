const config = require('./config')
const nodeConfig = require(config.app.nodeConfig)
const fs = require('fs')
const http = require('http')
const https = require('https')
const crypto = require('crypto')
const express = require('express')
const timeout = require('connect-timeout')
const requestIp = require('request-ip')
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')
const wsmysql = require(nodeConfig.app.wsmysql)
const jwt = require('jsonwebtoken')

module.exports = (function() {

	const PREFIX = '$$' //for redis
	const KEYDELI = '__'
	
	let ws = {
	
		cons : {
			CODE_OK : '0',
			CODE_ERR : '-1',
			MSG_ALREADY_EXISTS : '이미 존재하는 데이터입니다.',
			CODE_NO_DATA : '-100',
			MSG_NO_DATA : '데이터가 없습니다.',
			MSG_MISMATCH_WITH_USERID : 'Userid Mismatch ', //'- 변수'가 추가되어 사용될 것임
			CODE_TOKEN_NEEDED : '-81', //jwt : -8로 시작하는 오류코드는 클라이언트에서 로그인이 필요하다는 안내에 의미있게 쓰이고 있음
			CODE_TOKEN_MISMATCH : '-82', //jwt payload not equal to decoded
			CODE_USERINFO_MISMATCH : '-83',
			CODE_TOKEN_EXPIRED : '-84',
			CODE_USERCOOKIE_MISMATCH : '-85',
			CODE_USERID_NOT_EXIST : '-86',
			token_err_prefix : '-8',
			toast_prefix : '##$$', //클라이언트와 동일해야 함
			deli : '##',
			subdeli : '$$',
			indeli : "','", //sql where in clause
			easydeli : ';',
			memdeli : '/', //
			keydeli : KEYDELI, 
			title : 'sendjay',
			w_key : 'W' + KEYDELI, //Web userkey
			m_key : 'M' + KEYDELI, //Mobile userkey
			prefix : PREFIX, //for redis
			pattern : PREFIX + '*', //redis pub/sub				
			key_str_winid : PREFIX + 'W', //redis strings (userkey+deli+winid prefix added) - get winid for auto launch
			key_str_socket : PREFIX + 'S', //redis strings (userkey+deli+socketid prefix added) - get socketid
			//key_set_us : PREFIX + 'US', //redis set - prefix+'S'+userkey+deli+socketid //지우지는 말 것 (주석으로 막은 코딩 있음)
			scan_stream_cnt : 100, //means scanning count at a time, not whole count to scan. https://www.gitmemory.com/issue/luin/ioredis/908/511472853. Without count param, Something unexpectable might be happend ?!
			sock_ev_alert : 'alert',
			sock_ev_toast : 'toast',
			sock_ev_disconnect : "disconnect", //disconnect로 써야 함 (socket.io event)
			sock_ev_common : 'common', //Belows are handled in this sock_ev_common event.
			sock_ev_chk_alive : 'chk_alive',
			sock_ev_show_off : 'show_off',
			sock_ev_show_on : 'show_on',
			sock_ev_create_room : 'create_room',
			sock_ev_open_room : 'open_room',
			sock_ev_qry_msglist : 'qry_msglist',
			sock_ev_send_msg : 'send_msg',
			sock_ev_read_msg : 'read_msg', 
			sock_ev_qry_msgcell : 'qry_msgcell', 
			sock_ev_revoke_msgcell : 'revoke_msgcell',
			sock_ev_delete_msg : 'delete_msg',
			sock_ev_invite_user : 'invite_user',
			sock_ev_rename_room : 'rename_room',
			sock_ev_set_env : 'set_env',
			sock_ev_chk_typing : 'chk_typing',
			sock_ev_chk_roomfocus : 'chk_roomfocus',
			sock_ev_stop_mobile : 'stop_mobile',	
			sock_ev_get_roominfo : 'get_roominfo', //socket으로는 모바일만 사용 (웹/웹뷰에서는 rest로 사용)		
			max_diff_sec_worker : 5 * 2, //SEC in worker.js * 2		
			max_days_to_fetch : -365, //For sql where : 조회 및 worker.js에서 함께 사용 (오래된 데이터 물리적인 삭제 아닌 논리적 삭제만 적용함. 더 상세처리는 각자 알아서 정책 만들어 적용하기)
			max_check_same_members : 50, //Consider up to 50 and no more. max 1500 bytes for members field in z_roommem_tbl. userid(20) + alpha = 21 * 50 = 1050 bytes
			max_people_to_display : 3, //Consider up to 10 and no more. max 800 bytes for roomnm field in z_roommst_tbl. usernm(50) + userid(20) + alpha = 80 * 10 = 800 bytes
			max_hours_to_filesave : 1, //max_days_to_filesave : 1, //File's expiry
			max_hours_to_endure_upload : -4, //worker.js 파일업로드 사작후 4시간이 지나도 완료되지 않으면 가비지로 간주하고 제거
			max_nicknm_len : 100, //same as client's
			max_msg_len : 4000, //same as client's
			max_filesize : 5000000000, //10MB //max_filesize : 10485760, //10MB
			max_filecount : 50, //per user
			max_size_to_sublink : 5242880, //5MB. same as client's
			cell_revoked : 'message cancelled',
			file_expired : 'expired', //Used in daemon and client too
			sublink_ext_image : 'png,gif,jpg,jpeg,ico',
			sublink_ext_video : 'mp4', //File format which supports html5 streaming
			sublink_result_img : '.png', //ffmpeg converts screenshot to png
		},

		http : {
			resInit : () => {
				return { code : ws.cons.CODE_OK, msg : '', list : [] }
			},
			resCodeMsg : (res, code, ex, title) => { //단독으로 사용하지 말고 ws 함수에 녹여쓰기 (아래처럼 오류 처리에서만 사용중)
				res.type('application/json')
				const _obj = ws.util.getLogMsg(null, ex, title)
				res.json({ code : code, msg : _obj.msg })
			},
			resWarn : (res, msg, withToast, code, title) => { //catch로 넘기지 말고 try 안에서 체크해 return으로 마쳐야 할 때만 사용 (return되어도 finally 사용해 db 등 해제할 건 해제해야 함)
				const _msg = (withToast ? ws.cons.toast_prefix : '' ) + msg
				const _code = ws.util.isvoid(code) ? ws.cons.CODE_ERR : code.toString()
				ws.http.resCodeMsg(res, _code, _msg, title)
			},
			resException : (req, res, ex) => { //catch나 .use(err)내에서만 사용하기
				const title = req ? req.title : ''
				ws.util.loge(req, ex)
				ws.http.resCodeMsg(res, ws.cons.CODE_ERR, ex, title)
			},
			resCookie : (res, key, val, persist) => {
				res.cookie(key, val, {  //domain : xx.co.kr, //도메인쿠키 여기서는 필요없음
					path : '/',
					maxAge : persist ? 60 * 60 * 24 * 365 : null
				})
			},
			resJson : (res, rs, useridReal) => {
				if (useridReal) {
					const newToken = ws.jwt.make({ userid : useridReal })
                	ws.http.resCookie(res, "token", newToken) //jwt 만기 갱신해 세션 쿠키로 내림
					rs.token = newToken //웹일 경우는 필요없는데 앱에서는 쿠키로 받아 UserInfo에 넣기 불편한 구조여서 아예 response에 넣어서 내려서 처리하도록 함
				}
				res.json(rs)
			},
			// deviceFrom : (req) => { //사용금지
			// 	const userAgent = req.headers['user-agent'] //String
			// 	if (userAgent.includes('Dalvik') || userAgent.includes('Android')) {
			// 		return 'aos'
			// 	} else if (userAgent.includes('notyettested') && userAgent.includes('notyettested')) {
			// 		return 'ios'
			// 	} else {
			// 		return 'web'
			// 	}
			// },
			ipChk : (_ipArr, _ip) => {
				if (!_ipArr || !Array.isArray(_ipArr)) return false
				if (_ipArr[0] == 'all') {
					return true
				} else {
					for (const item of _ipArr) { //console.log(item+"@@@")
						if (item == _ip || '::ffff:' + item == _ip) return true
					}
					return false
				}
			}
		},

		jwt : {
			make : (userInfo, _key, _due) => { //userInfo = { userid }
				const key = _key || nodeConfig.jwt.key
				const due = _due || nodeConfig.jwt.expiry //"4h", "59s", "365 days" ..
				return jwt.sign(userInfo, key, { algorithm : nodeConfig.jwt.algo, expiresIn : due })
			},
			verify : (tokenInfo, _key) => { //tokenInfo = { token, userid } //여기서는 orgcd, toporgcd 체크하지 않음
				return new Promise((resolve, reject) => {
					try {
						const token = tokenInfo.token
						const userid = tokenInfo.userid
						const key = _key || nodeConfig.jwt.key
						let rs = ws.http.resInit()
						if (!token) {
							rs.code = ws.cons.CODE_TOKEN_NEEDED
							rs.msg = '인증(토큰)이 없습니다.'
							resolve(rs)
							return
						}
						if (!userid) {
							rs.code = ws.cons.CODE_USERINFO_MISMATCH
							rs.msg = '토큰과 비교할 사용자정보가 없습니다.'
							resolve(rs)
							return
						}
						const _arr = token.split('.')
						const _payloadStr = Buffer.from(_arr[1], 'base64').toString('utf-8')
						jwt.verify(token, key, function(err, decoded) { 
							if (err) {
								if (err.message.includes('jwt expired')) {
									rs.code = ws.cons.CODE_TOKEN_EXPIRED
									rs.msg = '토큰이 만료되었습니다 : ' + userid
								} else {
									rs.code = ws.cons.CODE_ERR
									rs.msg = err.message + ' : ' + userid
								}
								resolve(rs)
								return
							} //아래부터는 위변조도 체크
							const decodedStr = JSON.stringify(decoded)
							if (decodedStr != _payloadStr) {
								rs.code = ws.cons.CODE_TOKEN_MISMATCH
								rs.msg = 'Token mismatch : ' + decoded.userid + '/' + userid
								resolve(rs)
								return
							}
							if (decoded.userid != userid) {
								rs.code = ws.cons.CODE_USERINFO_MISMATCH
								rs.msg = '사용자정보에 문제가 있습니다 : ' + decoded.userid + '/' + userid
								resolve(rs)
								return
							}
							resolve(rs)
						})
					} catch (ex) {
						reject(ex)
					}
				})
			},
			//app.use(), router.use()에서 ws.jwt.verify()로 사용해도 되지만, 래핑된 chkToken()로 체크 : 코딩 약간 수월
			//클라이언트에 code, msg 전달해야 하는데 app.use(), router.use()보다는 손이 더 갈 수도 있지만 더 유연하게 사용 가능
			chkToken : async (req, res, conn, notLogging) => {
				let { token, userid, orgcd, toporgcd } = req.cookies
				if (!token || !userid) { //organ의 token은 외부 인터페이스를 통해 post로 호출될 수 있음
					userid = req.body.userid
					token = req.body.token
				}				
				const tokenInfo = { userid : userid, token : token, orgcd : orgcd, toporgcd : toporgcd } //login.html을 제외하고 웹 또는 앱에서 항상 넘어오는 쿠키
				if (req && req.clientIp) tokenInfo.ip = req.clientIp
				const rs = ws.http.resInit()
				const jwtRet = await ws.jwt.verify(tokenInfo)
				if (jwtRet.code != ws.cons.CODE_OK) { //실수로 await 빼고 chkToken() 호출할 때 대비해 if절 구성
					if (!notLogging) ws.util.loge(req, jwtRet.msg) //refresh_token처럼 클라이언트에서 주기적으로 갱신하는 경우 시간차때문에 만기가 올 수 있으므로 로깅(console.log도 포함)없게 함
					rs.code = jwtRet.code
					rs.msg = jwtRet.msg //if (res) ws.http.resWarn(res, rs.msg, false, rs.code, _title)
					return rs
				}				
				if (conn && userid != 'admin' && userid != 'organ') { //userid뿐만 아니라 부서정보 등 위변조도 체크 필요 (문제 발생시 로깅. 겸직 코딩은 제외되어 있음)
					const sql = "SELECT ORG_CD, TOP_ORG_CD FROM Z_USER_TBL WHERE USER_ID = ? "
					const data = await wsmysql.query(conn, sql, [tokenInfo.userid])
					if (data.length == 0) {
						const msg = ws.cons.CODE_USERID_NOT_EXIST + '/' + tokenInfo.userid + '/사용자아이디가 없습니다.' 
						ws.util.loge(req, msg)
						rs.code = ws.cons.CODE_USERID_NOT_EXIST
						rs.msg = msg //if (res) ws.http.resWarn(res, rs.msg, false, rs.code, _title)
						return rs
					}
					if (data[0].ORG_CD != tokenInfo.orgcd || data[0].TOP_ORG_CD != tokenInfo.toporgcd) {
						const msg = '사용자쿠키값에 문제가 있습니다 : ' + tokenInfo.userid + '/' + tokenInfo.orgcd + '/' + tokenInfo.toporgcd
						ws.util.loge(req, msg)
						rs.code = ws.cons.CODE_USERCOOKIE_MISMATCH
						rs.msg = msg //if (res) ws.http.resWarn(res, rs.msg, false, rs.code, _title)
						return rs
					}
				}
				rs.userid = tokenInfo.userid
				return rs
			}
		},

		redis : {
			//hash******************************
			//await global.store.hmset(key, obj) //obj is 1 depth like { id : "aa", userkey : "bb"}
			//await global.store.del(key)
			//return await global.store.hmget(key, fields) //hmget key field1 field2 .. array returns array
			//return await global.store.hgetall(key) //return object
			//strings******************************
			//await global.store.set(key, value) //setStr
			//return await global.store.get(key) //getStr
			//return await global.store.del(key) //delStr
			//return await global.store.keys(pattern) //keyStr => do not use because this might occur redis lock
			//sets******************************
			//await global.store.sadd(key, value) //addToSet
			//await global.store.srem(key, value) //delFromSet
			//return await global.store.sismember(key, value) //isMemOfSet
			//return await global.store.scard(key) //getSetCount
			//return await global.store.smembers(key) //getSetAll
			getMyOtherSocket : async (socket) => {
				let myOtherUserkey				
				if (socket.userkey.startsWith(ws.cons.m_key)) {
					myOtherUserkey = socket.userkey.replace(ws.cons.m_key, ws.cons.w_key)
				} else {
					myOtherUserkey = socket.userkey.replace(ws.cons.w_key, ws.cons.m_key)
				}				
				const arr = await ws.redis.getUserkeySocket(myOtherUserkey) //console.log("socket.userkey", socket.userkey, myOtherUserkey, arr[0])
				return arr[0] //if not, undefined returned
			},
			getUserkeySocket : (userkey) => {
				return new Promise((resolve, reject) => {
					let arr = []
					const pattern = ws.cons.key_str_socket + userkey + ws.cons.easydeli //예) $$SW__xxxx;
					const stream = global.store.scanStream({ match : pattern + '*', count: ws.cons.scan_stream_cnt })
					stream.on('data', (resultKeys) => {
						for (let key of resultKeys) arr.push(key)
						resolve(arr)
					}) //stream.on('end', () => { resolve(arr) }) //'end' does not guarantee rs.result as defined.
				})
			},
			getUserkeySocketIdFromKey : (key) => { //key => $$SW__xxxx;/sendjay#sjkfhsaf8934kmhjsfd8
				const arr = key.split(ws.cons.easydeli)
				const _userkey = arr[0].replace(ws.cons.key_str_socket, '') //W__xxxx
				const _socketid = arr[1] //=>/sendjay#sjkfhsaf8934kmhjsfd8
				return { userkey : _userkey, socketid : _socketid }
			},
			getUserkeySocketsFromMulti : async (userkeys) => { 
				let usArr = []
				for (let userkey of userkeys) { //[userkey1,userkey2..]
					const arr = await ws.redis.getUserkeySocket(userkey)			
					if (arr.length > 0) usArr = usArr.concat(arr)
				}
				return usArr
			},
			getUserkeysInSocket : async (userkeys) => { //app.js에 설명되어 있는 fetchSockets()을 이용해 더 정확한 소켓정보를 가져올 수 있겠으나 일단 아래 코딩으로 유지
				let ukArr = []
				const resultArr = await ws.redis.getUserkeySocketsFromMulti(userkeys)
				for (let key of resultArr) {
					const _obj = ws.redis.getUserkeySocketIdFromKey(key)
					if (_obj && _obj.userkey) ukArr.push(_obj.userkey)
				}
				return ukArr
			},
			pub : (pubKey, obj) => { //obj needs 1 depth object like { id : "aa", userkey : "bb" }
				global.pub.publish(ws.cons.prefix + pubKey, JSON.stringify(obj))
			},	
			multiSetForUserkeySocket : async (socket) => {
				try {
					/*const usKey = ws.cons.key_str_socket + socket.userkey + ws.cons.easydeli + socket.id //예) $$S + W__userid + ; + XYZ~
					const uwKey = ws.cons.key_str_winid + socket.userkey + ws.cons.easydeli + socket.winid //예) $$W + W__userid + ; + xxxxxx~
					if (usKey.includes('undefined')) throw Error('multiSetForUserkeySocket : usKey not defined')
					if (uwKey.includes('undefined')) throw Error('multiSetForUserkeySocket : uwKey not defined')
					const arr = await global.store.multi().set(usKey, socket.id)
												 		  .set(uwKey, ws.util.getCurDateTimeStr(true)) //See chk_redis.js, too.
													      .sadd(ws.cons.key_set_userkey_socket, usKey) //예) $$US에 $$S + W__userid + ; + XYZ~를 추가
													      .exec() //.scard(com.cons.key_set_userkey_socket)
					//위 sadd()는 아직 쓰임새가 없으나 추가/삭제 실행함
					if (!arr || arr.length < 3) throw Error('multiSetForUserkeySocket : global.store.multi() error')
					console.log(arr[2][1], "===")
					return arr[2][1]*/ //arr = [[빈값, 'OK'], [빈값, 'OK'], [빈값, 99]] => return 99 //for sadd count. smembers $$US for query list
					//redis-cli에서 keys *로 모두 검색. smembers $$US로 검색하면 $$S + W__userid + ; + XYZ~ 등으로 목록이 나옴			
					///////////////////////////////////////////////////////////////////////////////위를 아래와 같이 수정해 사용
					//.set(uwKey, ws.util.getCurDateTimeStr(true))는 chk_redis.js에서 처리되므로 막음
					//.sadd(ws.cons.key_set_userkey_socket, usKey)는 아직 쓰임새가 없으므로 막음
					const usKey = ws.cons.key_str_socket + socket.userkey + ws.cons.easydeli + socket.id //예) $$S + W__userid + ; + XYZ~
					if (usKey.includes('undefined')) throw Error('multiSetForUserkeySocket : usKey not defined')
					const arr = await global.store.multi().set(usKey, socket.id).exec() //한개 항목이면 멀티로 안해도 되나, 추가 고려해 그대로 유지함
					if (!arr || arr.length < 1) throw Error('multiSetForUserkeySocket : global.store.multi() error')
					if (arr[0][1] != 'OK') throw Error('multiSetForUserkeySocket : global.store.multi() error : ' + arr[0][1])
				} catch(ex) {
					throw new Error(ex)
				}
			},	
			multiDelForUserkeySocket : async (socket) => {
				try {
					const usKey = ws.cons.key_str_socket + socket.userkey + ws.cons.easydeli + socket.id //$$SW__oldclock;Q5zmRCF2q7d6IJfLAAAB
					const uwKey = ws.cons.key_str_winid + socket.userkey + ws.cons.easydeli + socket.winid //$$WW__oldclock;874223_20240405154525
					if (usKey.includes('undefined')) throw Error('multiDelForUserkeySocket : usKey not defined')
					if (uwKey.includes('undefined')) throw Error('multiDelForUserkeySocket : uwKey not defined')
					/*const arr = await global.store.multi().del(usKey)
														  .del(uwKey)
														  .srem(com.cons.key_set_userkey_socket, usKey) //.scard(com.cons.key_set_userkey_socket)
														  .exec()
					if (!arr || arr.length < 3) throw Error('multiDelForUserkeySocket : global.store.multi() error')
					return arr[2][1]*/ //for srem count. smembers $$US for query list
					///////////////////////////////////////////////////////////////////////////위를 아래와 같이 수정해 사용
					//.srem(com.cons.key_set_userkey_socket, usKey)는 아직 쓰임새가 없으므로 막음
					//multiSet~과는 다르게 지울 때는 uwKey까지 같이 지워야 함
					const arr = await global.store.multi().del(usKey).del(uwKey).exec()
					//console.log("###", arr.toString()) //### ,1,,0
					//console.log("@@@", JSON.stringify(arr)) //@@@ [[null,1],[null,0]] //위 multi()set()에서는 arr[0][1]이 OK로 나오는데 여기서는 1로 나오고 arr[1][1]은 0 or 1로 나옴
					if (!arr || arr.length < 2) throw Error('multiDelForUserkeySocket : global.store.multi() error') //왜 0 or 1로 나오는지 모르므로 일단 아래 막음
					//if (arr[0][1] != 1 || arr[1][1] != 0) throw Error('multiDelForUserkeySocket : global.store.multi() error : ' + arr[0][1] + '/' + arr[1][1])
				} catch(ex) {
					throw new Error(ex)
				}
			},	
			multiDelGarbageForUserkeySocket : async (usKey, afterScan) => { //usKey = ws.cons.key_str_socket + socket.userkey + ws.cons.easydeli + socket.id
				try { 
					//위 multi~()에서 보듯 uwkey에 대해서도 지우면 좋겠지만 socket만 지우고 winid는 남겨 두어도 큰 무리 없으므로 socket 정보 가비지만 지움
					//지우다 실패해도 오류처리하지 않고 넘어감
					if (usKey.includes('undefined')) throw Error('multiDelGarbageForUserkeySocket : usKey not defined')
					if (afterScan) {
						const stream = global.store.scanStream({ match : usKey, count : ws.cons.scan_stream_cnt })
						stream.on('data', async (resultKeys) => { //Search for userkey's another socketid which might be alive on (other) server(s), and kill them.
							for (let item of resultKeys) { //await global.store.multi().del(item).srem(com.cons.key_set_userkey_socket, item).exec()
								await global.store.multi().del(item).exec()
							}
						})
					} else { //scanning not needed since already scanned
						await global.store.multi().del(usKey).exec() //await global.store.multi().del(usKey).srem(com.cons.key_set_userkey_socket, usKey).exec()
					}
				} catch(ex) {
					throw new Error(ex)
				}
			},
		},

		sock : {
			broadcast : (ev, data, returnTo, returnToAnother) => { //broadcast : (socket, ev, data, returnTo, returnToAnother) => {
				const _returnTo = returnTo ? returnTo : 'parent' //'all' used in most cases
				/*global.jay.emit(ws.cons.sock_ev_common, { ev : ev, data : data, returnTo : _returnTo, returnToAnother : returnToAnother }) //to all inside namaspace. socket oneself included
				global.jay.emit => TypeError: opts.except is not iterable (from socket.io 3.0)*/
				/*socket.broadcast.emit(ws.cons.sock_ev_common, { ev : ev, data : data, returnTo : _returnTo, returnToAnother : returnToAnother }) //자기자신 제외
				socket.emit(ws.cons.sock_ev_common, { ev : ev, data : data, returnTo : _returnTo, returnToAnother : returnToAnother })*/
				global.jay.emit(ws.cons.sock_ev_common, { ev : ev, data : data, returnTo : _returnTo, returnToAnother : returnToAnother }) //to all inside namaspace. socket oneself included
			},
			getLogMsg : (_socket, ex, title) => { //단독으로 사용하지 말고 ws 함수에 녹여쓰기 (ws에서만 존재해야 함)
				let _msg = '', _stack = ''
				if (_socket) {
					if (_socket.userip) _msg += '[' + _socket.userip + ']'
					if (_socket.userkey) _msg += '[' + _socket.userkey + ']'
				}
				if (title) _msg += '[' + title + ']'
				if (typeof ex == 'string') {
					_msg += ex
					_stack = _msg
				} else {
					if (ex.stack) {
						_msg += ex.message //stack을 사용자에게 보여주기엔 너무 시각적으로 부담이 됨
						_stack += ex.stack //stack은 logger에 저장할 때 쓰기로 함
					} else {
						_msg += ex.toString()
						_stack = _msg
					}
				}
				return { msg : _msg, stack : _stack }
			},
			joinRoomWithUserkeySocketArr : (userkeySocketArr, _roomid) => new Promise(async (resolve, reject) => { //open_room or invite_user
				let _obj
				try {
					for (let key of userkeySocketArr) { //Garbage of socketid might be in userkeySocketArr.
						_obj = ws.redis.getUserkeySocketIdFromKey(key)
						try { //await global.jay.adapter.remoteJoin(_obj.socketid, _roomid)
							await global.jay.in(_obj.socketid).socketsJoin(_roomid) //https://socket.io/docs/v4/server-api/#serversocketsjoinrooms
						} catch (ex) { //reject(new Error('cannot connect to specific server when remoteJoinging with ' + _obj.userkey))
							if (ex.message.includes('timeout')) { //timeout reached while waiting for remoteJoin response (specific server down)
								//특정 서버 다운시 그 서버내 연결이 끊어진 소켓이 포함된 톡방을 열 때 이 오류가 발생함
								//이 경우, 해당 userkey가 연결이 안되면 오류가 계속 발생함. 그래서, 해당 userkey는 open room시 timeout을 만나면 그냥 skip하면 됨 
								//다시 서버가 살거나 사용자가 해당 톡방을 열면 remoteJoin은 문제없이 처리됨
							} else {
								throw new Error(ex.message)
							}
						}
					}
					resolve()
				} catch (ex) {
					if (_obj) {
						global.logger.error('joinRoomWithUserkeySocketArr..' + _obj.userkey + '/' + _obj.socketid + '\n' + ex.stack)
						reject(new Error(_obj.userkey + '/' + ex.message))
					} else {
						resolve()
					}
				}
			}),
			leaveRoomWithUserkeySocketArr : (userkeySocketArr, _roomid) => new Promise(async (resolve, reject) => {
				let _userkey, _socketid
				try {
					for (let key of userkeySocketArr) {
						const arr = key.split(ws.cons.easydeli)
						_userkey = arr[0].replace(ws.cons.key_str_socket, '')
						_socketid = arr[1]
						try { //await global.jay.adapter.remoteLeave(_socketid, _roomid)
							await global.jay.in(_socketid).socketsLeave(_roomid)
						} catch (ex) { //reject(new Error('cannot connect to specific server when remoteLeaving with ' + _obj.userkey))
							if (ex.message.includes('timeout')) { //timeout reached while waiting for remoteLeave response (specific server down)
								//joinRoomWithUserkeySocketArr() 경우와 같지만 한가지 다른 점은 이미 leave하였기 때문에 opening room시 다시 join되지 않을 것임
							} else {
								throw new Error(ex.message)
							}
						}
					}
					if (_userkey && _socketid) resolve()
				} catch (ex) { 
					if (_userkey && _socketid) {
						global.logger.error('leaveRoomWithUserkeySocketArr..' + _userkey + '/' + _socketid + '\n' + ex.stack)
						reject(new Error(_userkey + '/' + ex.message))
					} else {
						reject(new Error('No one left in this room : ') + userkeySocketArr.toString() + '\n' + ex.message)
					}
				}
			}),
			sendToMyOtherSocket : async (socket, param) => { //call pmessage()
				param.data.userid = socket.userid //see ChatService.kt
				const otherUserkeySocket = await ws.redis.getMyOtherSocket(socket)
				if (otherUserkeySocket) ws.redis.pub('sendto_myother_socket', { socketid : socket.id, otherkey : otherUserkeySocket, param : param }) //call pmessage()
			},
			sendToRoom : (socket, roomid, param) => { //const sockets = await global.jay.in("room1").fetchSockets()
				//global.jay.to(roomid).emit(com.cons.sock_ev_common, param) //to all inside room. socket oneself included
				//global.jay.to(roomid).emit => TypeError: opts.except is not iterable (from socket.io 3.0)
				socket.to(roomid).emit(ws.cons.sock_ev_common, param) //본인 소켓 제외
				socket.emit(ws.cons.sock_ev_common, param) //본인 소켓에게 보냄
			},
			setRoomnmWithUsernm : (data, fieldUserNm, fieldUserId) => {
				let _roomnm = '', _userid = ''
				const len = data.length
				if (len == 1) {
					_roomnm = 'Myself'
				} else {				
					for (let i = 0; i < len; i++) {
						if (i > ws.cons.max_people_to_display) {
							_roomnm += ws.cons.memdeli + 'more..'
							_userid += ws.cons.memdeli + 'more..'
							break
						}
						if (_roomnm == '') {
							_roomnm = data[i][fieldUserNm]
							_userid = data[i][fieldUserId]
						} else {
							_roomnm += ws.cons.memdeli + data[i][fieldUserNm]
							_userid += ws.cons.memdeli + data[i][fieldUserId]
						}					
					}
				}
				return { roomnm : _roomnm, userid : _userid }
			},
			warn : (_type, _socket, _logTitle, _ex, _roomid) => {
				try { //_type = alert, toast, null(just logging)
					let _obj = ws.sock.getLogMsg(_socket, _ex, _logTitle)
					if (_roomid) _obj.stack += '<br>' + _roomid
					global.logger.info(_obj.stack) //logger는 console.log(a,b,c..)를 지원하지 않음. This line should precede _socket (in the next line)
					if (_type && _socket) _socket.emit(_type, { code : '-1', msg : _obj.msg, roomid : _roomid })
				} catch (ex) { 
					let _obj = ws.sock.getLogMsg(_socket, ex, _logTitle)
					global.logger.error(_obj.stack)
				}
			},
		},

		util : {
			initExpressApp : (public) => {
				const _app = express()
				_app.use(timeout('2s'))
				_app.use(requestIp.mw()) //req.clientIp => X-Forwarded-For header info in AWS checked (req.headers['x-forwarded-for'] || req.connection.remoteAddress)
				_app.use(bodyParser.json()) //app.use(express.json())
				_app.use(bodyParser.urlencoded({ extended: true })) //req.body : { array : { key1 : { key2 : '123' } } } //when false => req.body : { 'array[key1][key2]' :'123' }
				_app.use(cookieParser()) //_app.use(express.limit('10G'))
				if (public) _app.use(express.static(public))					
				return _app
			},
			createWas : (_app, _kind) => { //프로젝트 hushsbay는 aws 기반(https는 로드밸런서인 CLB 이용)이므로 내부에서는 https가 아닌 http로 설정
				let server
				if (_kind == 'https') {
					const sslOption = { key: fs.readFileSync(nodeConfig.ssl.key, 'utf-8'), cert: fs.readFileSync(nodeConfig.ssl.cert, 'utf-8') }
					server = https.Server(sslOption, _app)
				} else {
					server = http.Server(_app)
				} //https://velog.io/@dramatic/NestJS-%ED%98%B9%EC%9D%80-Express%EC%97%90%EC%84%9C-%EA%B0%84%ED%97%90%EC%A0%81%EC%9C%BC%EB%A1%9C-502-%EC%9D%91%EB%8B%B5%EC%9D%B4-%EC%98%A4%EB%8A%94-%EA%B2%BD%EC%9A%B0
				server.keepAliveTimeout = 120000 //위 링크 참조. 502 방지. AWS ALB보다 Node.js에서 더 길게 잡아야
				return server
			},
			isvoid : (obj) => { //"0", 0, 등의 경우는 유효할 경우도 고려해야 하므로 아래 2가지 경우만 체크하는 함수임
                if (typeof obj == 'undefined' || obj == null) return true
                return false
            },
			getLogMsg : (req, ex, title) => { //단독으로 사용하지 말고 ws 함수에 녹여쓰기 (ws에서만 존재해야 함)
				let _msg = '', _stack = ''
				if (req) {
					if (req.clientIp) _msg += '[' + req.clientIp + ']'
					if (req.cookie && req.cookie.userid) _msg += '[' + req.cookie.userid + ']'
				}
				if (title) _msg += '[' + title + ']'
				if (typeof ex == 'string') {
					_msg += ex
					_stack = _msg
				} else {
					if (ex.stack) {
						_msg += ex.message //stack을 사용자에게 보여주기엔 너무 시각적으로 부담이 됨
						_stack += ex.stack //stack은 logger에 저장할 때 쓰기로 함
					} else {
						_msg += ex.toString()
						_stack = _msg
					}
				}
				return { msg : _msg, stack : _stack }
			},
			logi : (req, ex) => {
				const _obj = ws.util.getLogMsg(req, ex)
				global.logger.info(_obj.stack)
			},
			loge : (req, ex) => { //ex가 catch되는 곳에서 사용하기
				const _obj = ws.util.getLogMsg(req, ex)
				global.logger.error(_obj.stack)
			},
			watchProcessError : () => {
				process.on('error', e => {
					global.logger.error('process.on error.. ' + e.stack)
				}).on('uncaughtException', e => { //##4 Error:read ECONNRESET => events.js:183 throw er; //Unhandled 'error' event~ 에 걸려 서버다운되는데 여기에 걸려 해결됨
					global.logger.error('process.on uncaughtException.. ' + e.stack)
				}).on('unhandledRejection', (reason, p) => {
					global.logger.error(reason, 'process.on Unhandled Rejection at Promise.. ' + p)
				})
			},
			watchRouterError : (router) => { //router.use(function(req, res, next) {에서 next("오류내용")으로 router.use(function(err, req, res, next) { 으로 전달됨
				router.use(function(err, req, res, next) {
					ws.http.resException(req, res, err)
				})
			},
			getLastItemFromStr : (_arg, _deli) => {
				if (typeof _arg != 'string') return null
				const _items = _arg.split(_deli)
				return _items[_items.length - 1]
			},
			toStringForInClause : (target) => { //"where cocd in ('" + _ret + "')"에 들어갈 _ret을 반환
				let _ret = '', arr
				if (typeof target == 'string') {
					arr = target.split(',') //A,B,C..
					if (arr.length == 1) return target
				} else { //나머지 경우는 모두 배열로 가정하고 처리함 //if (Array.isArray(target)) {
					arr = target
				}
				_ret = arr.map(item => "'" + item + "'").toString()
				_ret = _ret.substring(1)
				_ret = _ret.substr(0, _ret.length - 1)
				return _ret
			},
			encrypt : (text, key) => { //key = 32bytes
				const iv = crypto.randomBytes(16)
				let cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(key), iv)
				let encrypted = cipher.update(text)
				encrypted = Buffer.concat([encrypted, cipher.final()])
				return iv.toString('hex') + ':' + encrypted.toString('hex')
			}, 
			decrypt : (text, key) => { 				
				let arr = text.split(':')
				let iv = Buffer.from(arr[0], 'hex')
				let encryptedText = Buffer.from(arr[1], 'hex')
				let decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(key), iv) //const decode = crypto.createDecipher('aes-256-cbc', key). createDecipher deprecated
				let decrypted = decipher.update(encryptedText)
				decrypted = Buffer.concat([decrypted, decipher.final()])
				return decrypted.toString()
			},
			getRnd : (_min, _max) => {
                min = (!_min) ? 100000 : _min
                max = (!_max) ? 999999 : _max
                return Math.floor(Math.random() * (max - min)) + min //return min(inclusive) ~ max(exclusive) Integer only 
			},
			getCurDateTimeStr : (deli) => {
				const now = new Date()
				if (deli) {
					return now.getFullYear().toString() + "-" + (now.getMonth() + 1).toString().padStart(2, "0") + "-" + now.getDate().toString().padStart(2, "0") + " " + 
						now.getHours().toString().padStart(2, "0") + ":" + now.getMinutes().toString().padStart(2, "0") + ":" + now.getSeconds().toString().padStart(2, "0")
				} else {
					return now.getFullYear().toString() + (now.getMonth() + 1).toString().padStart(2, "0") + now.getDate().toString().padStart(2, "0") + 
						now.getHours().toString().padStart(2, "0") + now.getMinutes().toString().padStart(2, "0") + now.getSeconds().toString().padStart(2, "0")
				}
			},
			getTimeStamp : (str) => { //str(2012-08-02 14:12:04) to Date()
				const d = str.match(/\d+/g) //extracts date parts
				return new Date(d[0], d[1] - 1, d[2], d[3], d[4], d[5])
			},
			getDateTimeDiff : (_prev, _now) => { //_prev(2012-08-02 14:12:04)
				const dtPrev = ws.util.getTimeStamp(_prev)
				return parseInt((_now - dtPrev) / 1000) //return seconds
			},
			setDateAdd : (date, days) => {
				let _date = date
				const _days = (Number.isInteger(days)) ? days : parseInt(days)
				_date.setDate(_date.getDate() + _days)
				const year = _date.getFullYear()
				const month = (_date.getMonth() + 1).toString().padStart(2, "0")
				const day = _date.getDate().toString().padStart(2, "0")
				const _dateString = year + '-' + month + '-' + day
				return _dateString
			},
			setHourAdd : (dt, hours) => { //eg)72hours=60*60*1000*72=259,200,000
				let _dt = dt
				const _hours = (Number.isInteger(hours)) ? hours : parseInt(hours)
				_dt.setTime(_dt.getTime() + (_hours * 60 * 60 * 1000)) //Suppose that server set to UTC 
				const year = _dt.getFullYear()
				const month = (_dt.getMonth() + 1).toString().padStart(2, "0")
				const day = _dt.getDate().toString().padStart(2, "0")
				const hour = _dt.getHours().toString().padStart(2, "0")
				const minute = _dt.getMinutes().toString().padStart(2, "0")
				const second = _dt.getSeconds().toString().padStart(2, "0")
				const _dtString = year + '-' + month + '-' + day + ' ' + hour + ':' + minute + ':' + second
				return _dtString
			},
			strLen : function(s, b, i, c) { //https://programmingsummaries.tistory.com/239
                // for (b = i = 0; i < s.length; i++) {
                //     c = s.charCodeAt(i)
                //     //b += c >> 11 ? 3 : c >> 7 ? 2 : 1 //(2048(2^11)로 나눌 때 몫이 있으면 2048보다 큰 유니코드이므로 3바이트를 할당.. 128(2^7)로 나눌 땐 ..)
                //     b += c >> 11 ? 2 : c >> 7 ? 2 : 1
                // }
                // return b
                return s.length //mySql 필드인 경우에는 한글이 1바이트로 계산되어 입력되고 있으므로 그냥 .length를 사용하고 있음 (다른 DB는 체크 필요)
            },
			getFileNameAndExtension : (fileStr) => {
				const obj = { }
				const arr = fileStr.split('.')
				obj.name = arr[0]
				if (arr.length == 1) {
					obj.ext = ''
					obj.extDot = ''	
				} else {
					obj.ext = arr[arr.length - 1]
					obj.extDot = '.' + obj.ext
				}
				return obj
			},
			chkAccessUserWithTarget : async (conn, userid, uid, type, target) => { //for socket or rest
				let ret = '대상에 대한 권한이 없습니다. '
				if (type == 'file' || type == '') { //'' means general type for msgid
					const data = await wsmysql.query(conn, "SELECT COUNT(*) CNT FROM A_MSGDTL_TBL WHERE MSGID = ? AND RECEIVERID = ? ", [uid, userid])
					if (data[0].CNT > 0) {
						if (type == 'file') {
							const sqlM = "SELECT TYP TYPE, CASE WHEN STATE2 = 'C' THEN '" + ws.cons.cell_revoked + "' ELSE BODY END BODY FROM A_MSGMST_TBL WHERE MSGID = ? "
							const dataM = await wsmysql.query(conn, sqlM, [uid])
							if (dataM.length > 0) {
								const _file = dataM[0].BODY.split(ws.cons.deli)[0] //console.log(_file, dataM[0].TYPE, target, "===")
								if (dataM[0].TYPE == 'flink' || target.includes(_file)) ret = '' //The filepath is in msgid
							} else {
								ret += uid
							}
						} else {
							ret = ''
						}
					} else {
						//const dataM = await wsmysql.query(conn, "SELECT COUNT(*) CNT FROM A_MSGMST_TBL WHERE MSGID = ? ", [uid])
						//if (dataM[0].CNT == 0) ret = ''
						ret += uid
					}
				} else if (type == 'room') { //예를 들어, 해당 채팅방의 멤버가 아닐 때는 그 사용자는 권한이 없어야 함
					const data = await wsmysql.query(conn, "SELECT COUNT(*) CNT FROM A_ROOMDTL_TBL WHERE ROOMID = ? AND USERID = ? ", [uid, userid])
					if (data[0].CNT > 0) {
						ret = ''
					} else {
						ret += uid
					}
				}
				return ret
			},
		}

	}

	return ws

})()

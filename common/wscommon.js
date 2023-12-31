const fs = require('fs')
const path = require('path')
const http = require('http')
const https = require('https')
const crypto = require('crypto')
const url = require('url')
const express = require('express')
const requestIp = require('request-ip')
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')
const jwt = require('jsonwebtoken')
//const os = require('os-utils')

module.exports = (function() {
	
	let ws = {
	
		cons : {
			 CODE_OK : '0',
			 CODE_ERR : '-1',
			 MSG_ALREADY_EXISTS : '이미 존재하는 데이터입니다.',
			 CODE_NO_DATA : '-100',
			 MSG_NO_DATA : '데이터가 없습니다.',
			 //CODE_PASSWORD_NEEDED : '-76',
			 //CODE_PASSKEY_NEEDED : '-77',
			 //CODE_PASSWORD_NOT_MATCHED : '-78',
			 //CODE_PASSKEY_NOT_MATCHED : '-79',
			 CODE_TOKEN_NEEDED : '-81', //jwt 
			 CODE_TOKEN_MISMATCH : '-82', //jwt payload not equal to decoded
			 CODE_USERINFO_MISMATCH : '-83',
			 CODE_TOKEN_EXPIRED : '-84',
			 //CODE_USE_YOUR_OWN_USERID : '-85',
			 mysql_close_error : 'mysql_close_error',
			 toast_prefix : '##$$', //클라이언트와 동일
		},

		http : {
			resInit : () => {
				return { code : ws.cons.CODE_OK, msg : '', list : [ ] }
			},
			resJson : (res, code, ex, title) => {
				res.type('application/json')
				const _msg = ws.util.getLogMsg(ex, title)
				res.json({ code : code, msg : _msg })
			},
			resWarn : (res, msg, withToast, code, title) => { //'데이터가 없습니다' 처럼 catch로 넘기지 말고 try 안에서 체크해 return으로 마쳐야 할 때만 사용 (return되어도 finally 사용해 db 등 해제할 건 해제해야 함)
				const _msg = (withToast ? ws.cons.toast_prefix : '' ) + msg
				const _code = ws.util.isvoid(code) ? ws.cons.CODE_ERR : code.toString()
				ws.http.resJson(res, _code, _msg, title)
			},
			resException : (res, ex, title) => {
				ws.util.loge(ex, title)
				ws.http.resJson(res, ws.cons.CODE_ERR, ex, title)
			},
		},

		jwt : {
			make : (userInfo, _key) => { //userInfo = { userid }
				const key = _key || global.nodeConfig.jwt.key
				return jwt.sign(userInfo, key, { algorithm : global.nodeConfig.jwt.algo, expiresIn : global.nodeConfig.jwt.expiry })
			},
			verify : (tokenInfo, _key) => { //tokenInfo = { token, userid }
				return new Promise((resolve, reject) => {
					try {
						const token = tokenInfo.token
						const userid = tokenInfo.userid
						console.log(token, "@@@@", userid)
						//const orgcd = userInfo.orgcd
						//const toporgcd = userInfo.toporgcd
						const key = _key || global.nodeConfig.jwt.key					
						let rs = ws.http.resInit()
						if (!token) {
							rs.code = ws.cons.CODE_TOKEN_NEEDED
							rs.msg = '인증(토큰)이 필요합니다.'
							resolve(rs)
							return
						}
						if (!userid) { //|| !orgcd || !toporgcd) {
							rs.code = ws.cons.CODE_USERINFO_MISMATCH
							rs.msg = '토큰과 비교할 사용자정보에 문제가 있습니다 : ' + JSON.stringify(userInfo)
							resolve(rs)
							return
						}
						const _arr = token.split('.')
						const _payloadStr = Buffer.from(_arr[1], 'base64').toString('utf-8')
						jwt.verify(token, key, function(err, decoded) { 
							if (err) {
								if (err.message.includes('jwt expired')) {
									rs.code = ws.cons.CODE_TOKEN_EXPIRED
									rs.msg = 'Token expired.'
								} else {
									rs.code = ws.cons.CODE_ERR
									rs.msg = err.message
								}
								console.log(rs.code, rs.msg)
								resolve(rs)
								return
							} //아래부터는 위변조도 체크하는 것이 됨
							const decodedStr = JSON.stringify(decoded)
							console.log(decodedStr, "====", _payloadStr)
							if (decodedStr != _payloadStr) {
								rs.code = ws.cons.CODE_TOKEN_MISMATCH
								rs.msg = 'Token mismatch.'
								resolve(rs)
								return
							}
							if (decoded.userid != userid) { //|| decoded.orgcd != orgcd || decoded.toporgcd != toporgcd) {
								rs.code = ws.cons.CODE_USERINFO_MISMATCH
								rs.msg = 'Userinfo not matched with token.'
								resolve(rs)
								return
							}
							console.log(rs.code, rs.msg)
							//rs.token = decoded //com.verifyToken()에서처럼 token을 받아서 비교하는 데 사용하기 위한 목적임
							resolve(rs)
						})
					} catch (ex) {
						reject(ex)
					}
				})
			},
			chkVerify : async (res, tokenInfo) => { 
				//app.use(), router.use() 사용해도 되지만, 함수로 체크 : 코딩 약간 수월
				//클라이언트에 code, msg 전달해야 하는데 app.use(), router.use()는 손이 더 가고 함수보다 덜 유연함
				const jwtRet = await ws.jwt.verify(tokenInfo)
				if (jwtRet.code == ws.cons.CODE_OK) { //await 빼고 chkVerify() 호출할 때 대비해 if절 구성
					return true
				} else {
					ws.http.resWarn(res, jwtRet.msg, false, jwtRet.code)
					return false
				}
			},
			// make : (payload, _key) => {
			// 	const key = _key || global.nodeConfig.jwt.key
			// 	return jwt.sign(payload, key, { algorithm : global.nodeConfig.jwt.algo, expiresIn : global.nodeConfig.jwt.expiry })
			// },
			// verify : (token, userid, _key) => {
			// 	return new Promise((resolve, reject) => {
			// 		try {
			// 			const key = _key || global.nodeConfig.jwt.key					
			// 			let rs = ws.http.resInit()
			// 			if (!token) {
			// 				rs.code = ws.cons.CODE_TOKEN_NEEDED
			// 				rs.msg = '인증(토큰)이 필요합니다.'
			// 				resolve(rs)
			// 				//return
			// 			}
			// 			if (!userid) {
			// 				rs.code = ws.cons.CODE_USERID_MISMATCH
			// 				rs.msg = '토큰과 비교할 사용자아이디가 필요합니다.'
			// 				resolve(rs)
			// 				//return
			// 			}
			// 			const _arr = token.split('.')
			// 			const _payloadStr = Buffer.from(_arr[1], 'base64').toString('utf-8')
			// 			jwt.verify(token, key, function(err, decoded) { 
			// 				if (err) {
			// 					if (err.message.includes('jwt expired')) {
			// 						rs.code = ws.cons.CODE_TOKEN_EXPIRED
			// 						rs.msg = 'Token expired.'
			// 					} else {
			// 						rs.code = ws.cons.CODE_ERR
			// 						rs.msg = err.message
			// 					}
			// 					resolve(rs)
			// 					//return
			// 				}
			// 				const decodedStr = JSON.stringify(decoded)
			// 				if (decodedStr != _payloadStr) {
			// 					rs.code = ws.cons.CODE_TOKEN_MISMATCH
			// 					rs.msg = 'Token mismatch.'
			// 					resolve(rs)
			// 					//return
			// 				}
			// 				if (decoded.userid != userid) {
			// 					rs.code = ws.cons.CODE_USERID_MISMATCH
			// 					rs.msg = 'Userid not matched with token.'
			// 					resolve(rs)
			// 					//return
			// 				}
			// 				rs.token = decoded //com.verifyToken()에서처럼 token을 받아서 비교하는 데 사용하기 위한 목적임
			// 				resolve(rs)
			// 			})
			// 		} catch (ex) {
			// 			reject(ex)
			// 		}
			// 	})
			// }
		},

		util : {
			addToGlobal : (wslogger, _obj, nodeConfig) => {
				if (nodeConfig) global.nodeConfig = nodeConfig
				global.logger = wslogger
				global.projDir = ws.util.getLastItemFromStr(_obj.dirName, path.sep)
				console.log('version', process.version)
				console.log('projDir', global.projDir, _obj.dirName)
			},
			initExpressApp : (public) => {
				const _app = express()
				_app.use(requestIp.mw()) //req.clientIp => X-Forwarded-For header info in AWS checked (req.headers['x-forwarded-for'] || req.connection.remoteAddress)
				_app.use(bodyParser.json()) //app.use(express.json())
				_app.use(bodyParser.urlencoded({ extended: true })) //req.body : { array : { key1 : { key2 : '123' } } } //when false => req.body : { 'array[key1][key2]' :'123' }
				_app.use(cookieParser())
				if (public) _app.use(express.static(public))
				return _app
			},
			createWas : (_app, _kind) => {
				let server
				if (_kind == 'https') { //watch out for expiry date.
					const sslOption = { key: fs.readFileSync(nodeConfig.ssl.key, 'utf-8'), cert: fs.readFileSync(nodeConfig.ssl.cert, 'utf-8') }
					server = https.Server(sslOption, _app)
				} else {
					server = http.Server(_app)
				}
				server.keepAliveTimeout = 120000
				return server
			},
			isvoid : (obj) => {
                if (typeof obj == 'undefined' || obj == null) return true
                return false
            },
			getLogMsg : (ex, title) => {
				let _msg = (title) ? '[' + title + '] ' : ''
				if (typeof ex == 'string') {
					_msg += ex
				} else {
					if (ex.stack) {
						_msg += ex.stack	
					} else if (ex.message) {
						_msg += ex.message
					} else {
						_msg += ex.toString()
					}
				}
				return _msg
			},
			logi : (ex, title) => {
				const _msg = ws.util.getLogMsg(ex, title)
				global.logger.info(_msg)
			},
			loge : (ex, title) => { //ex가 catch되는 곳에서 사용하기
				const _msg = ws.util.getLogMsg(ex, title)
				global.logger.error(_msg)
			},
			watchProcessError : () => {
				process.on('error', e => {
					global.logger.error('process.on error.. ' + e.stack)
				}).on('uncaughtException', e => { //##4 가끔 Error:read ECONNRESET => events.js:183 throw er; //Unhandled 'error' event~ 에 걸려 서버다운되는데 여기에 걸려 해결됨
					global.logger.error('process.on uncaughtException.. ' + e.stack)
				}).on('unhandledRejection', (reason, p) => {
					global.logger.error(reason, 'process.on Unhandled Rejection at Promise.. ' + p)
				})
			},
			watchRouterError : (router, title) => { //router.use(function(req, res, next) {에서 next("오류내용")으로 router.use(function(err, req, res, next) { 으로 전달됨
				router.use(function(err, req, res, next) {
					ws.http.resException(res, err, title)
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
		}

	}

	return ws

})()

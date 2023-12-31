const fs = require('fs')
const path = require('path')
const http = require('http')
const https = require('https')
const crypto = require('crypto')
const express = require('express')
const requestIp = require('request-ip')
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')
const jwt = require('jsonwebtoken')

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
			 CODE_TOKEN_NEEDED : '-81', //jwt : -8로 시작하는 오류코드는 클라이언트에서 로그인이 필요하다는 안내에 의미있게 쓰이고 있음
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
			resCodeMsg : (res, code, ex, title) => { //단독으로 사용하지 말고 ws 함수에 녹여쓰기 (아래처럼 오류 처리에서만 사용중)
				res.type('application/json')
				const _msg = ws.util.getLogMsg(null, ex, title)
				res.json({ code : code, msg : _msg })
			},
			resWarn : (res, msg, withToast, code, title) => { //catch로 넘기지 말고 try 안에서 체크해 return으로 마쳐야 할 때만 사용 (return되어도 finally 사용해 db 등 해제할 건 해제해야 함)
				const _msg = (withToast ? ws.cons.toast_prefix : '' ) + msg
				const _code = ws.util.isvoid(code) ? ws.cons.CODE_ERR : code.toString()
				ws.http.resCodeMsg(res, _code, _msg, title)
			},
			resException : (req, res, ex, title) => { //catch나 .use(err)내에서만 사용하기
				ws.util.loge(req, ex, title)
				ws.http.resCodeMsg(res, ws.cons.CODE_ERR, ex, title)
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
						const key = _key || global.nodeConfig.jwt.key			
						let rs = ws.http.resInit()
						if (!token) {
							rs.code = ws.cons.CODE_TOKEN_NEEDED
							rs.msg = '인증(토큰)이 없습니다.'
							console.log(tokenInfo.ip, rs.msg) //안정화때까지 임시로 찍어보기 (나중에 막기)
							resolve(rs)
							return
						}
						if (!userid) {
							rs.code = ws.cons.CODE_USERINFO_MISMATCH
							rs.msg = '토큰과 비교할 사용자정보가 없습니다.'
							console.log(tokenInfo.ip, rs.msg) //안정화때까지 임시로 찍어보기 (나중에 막기)
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
								console.log(tokenInfo.ip, rs.msg) //안정화때까지 임시로 찍어보기 (나중에 막기)
								resolve(rs)
								return
							} //아래부터는 위변조도 체크하는 것이 됨
							const decodedStr = JSON.stringify(decoded)
							if (decodedStr != _payloadStr) {
								rs.code = ws.cons.CODE_TOKEN_MISMATCH
								rs.msg = 'Token mismatch : ' + decoded.userid + '/' + userid
								console.log(tokenInfo.ip, rs.msg) //안정화때까지 임시로 찍어보기 (나중에 막기)
								resolve(rs)
								return
							}
							if (decoded.userid != userid) {
								rs.code = ws.cons.CODE_USERINFO_MISMATCH
								rs.msg = '사용자정보에 문제가 있습니다 : ' + decoded.userid + '/' + userid
								console.log(tokenInfo.ip, rs.msg) //안정화때까지 임시로 찍어보기 (나중에 막기)
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
			chkVerify : async (req, res, tokenInfo) => { 
				//app.use(), router.use()에서 ws.jwt.verify()로 사용해도 되지만, 래핑된 chkVerify()로 체크 : 코딩 약간 수월
				//클라이언트에 code, msg 전달해야 하는데 app.use(), router.use()보다는 손이 더 갈 수도 있지만 더 유연하게 사용 가능
				if (req && req.clientIp) Object.assign(tokenInfo, { ip : req.clientIp })
				const jwtRet = await ws.jwt.verify(tokenInfo)
				if (jwtRet.code == ws.cons.CODE_OK) { //실수로 await 빼고 chkVerify() 호출할 때 대비해 if절 구성
					return true
				} else {					
					ws.http.resWarn(res, jwtRet.msg, false, jwtRet.code)
					return false
				}
			},
		},

		util : {
			addToGlobal : (wslogger, obj, nodeConfig) => {
				if (nodeConfig) global.nodeConfig = nodeConfig
				global.logger = wslogger
				//global.projDir = ws.util.getLastItemFromStr(obj.dirName, path.sep) //아직 사용처없으나 일단 지우지 말고 두기
				console.log('version :', process.version)
				console.log('projPath :', obj.dirName)					
				console.log('logPath : ', obj.logPath)			
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
				if (_kind == 'https') { //프로젝트 hushsbay는 aws 기반(https는 로드밸런서CLB 이용)이므로 여기서는 https가 아닌 http로 설정
					const sslOption = { key: fs.readFileSync(nodeConfig.ssl.key, 'utf-8'), cert: fs.readFileSync(nodeConfig.ssl.cert, 'utf-8') }
					server = https.Server(sslOption, _app)
				} else {
					server = http.Server(_app)
				}
				server.keepAliveTimeout = 120000
				return server
			},
			isvoid : (obj) => { //"0", 0, 등의 경우는 유효할 경우도 고려해야 하므로 아래 2가지 경우만 체크하는 함수임
                if (typeof obj == 'undefined' || obj == null) return true
                return false
            },
			getLogMsg : (req, ex, title) => { //단독으로 사용하지 말고 ws 함수에 녹여쓰기
				let _uInfo = '', _msg = ''
				if (req) {
					if (req.clientIp) _uInfo = '[' + req.clientIp + ']'
					if (req.body && req.body.tokenInfo) _uInfo += '[' + req.body.tokenInfo.userid + ']'
				}
				_msg = _uInfo + (title ? '[' + title + '] ' : '')
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
			logi : (req, ex, title) => {
				const _msg = ws.util.getLogMsg(req, ex, title)
				global.logger.info(_msg)
			},
			loge : (req, ex, title) => { //ex가 catch되는 곳에서 사용하기
				const _msg = ws.util.getLogMsg(req, ex, title)
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
					ws.http.resException(req, res, err, title)
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

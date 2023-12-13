const fs = require('fs')
const path = require('path')
const http = require('http')
const https = require('https')
//const crypto = require('crypto')
//const tracer = require('tracer')
const url = require('url')
const express = require('express')
const requestIp = require('request-ip')
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')
//const jwt = require('jsonwebtoken')
//const os = require('os-utils')
const process = require('process')

module.exports = (function() {
	
	let ws = {
	
		cons : {
			 CODE_OK : '0',
			 CODE_ERR : '-1',
			 CODE_NO_DATA : '-100',
			 MSG_NO_DATA : 'no data.',
			 CODE_PASSWORD_NEEDED : '-76',
			 CODE_PASSKEY_NEEDED : '-77',
			 CODE_PASSWORD_NOT_MATCHED : '-78',
			 CODE_PASSKEY_NOT_MATCHED : '-79',
			 CODE_TOKEN_NEEDED : '-81', //jwt 
			 CODE_TOKEN_MISMATCH : '-82', //jwt payload not equal to decoded
			 CODE_USERID_MISMATCH : '-83',
			 CODE_TOKEN_EXPIRED : '-84',
			 CODE_USE_YOUR_OWN_USERID : '-85',
			 
		},

		http : {
			resInit : () => {
				return { code : ws.cons.CODE_OK, msg : '', list : [ ] }
			},
			resJson : (res, code, msg, title) => {
				res.type('application/json')
				const _msg = (title) ? title + "\n" + msg : msg
				res.json({ code : code, msg : _msg })
			},
		},

		util : {
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
			getLogMsg : (ex, title) => {
				let _msg = (title) ? title + ': ' : ''
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
				const _msg = hush.util.getLogMsg(ex, title)
				global.logger.info(_msg)
			},
			loge : (ex, title) => {
				const _msg = hush.util.getLogMsg(ex, title)
				global.logger.error(_msg)
			},
			watchProcessError : () => {
				process.on('error', e => {
					global.log.error('process.on error.. ' + e.stack)
				}).on('uncaughtException', e => { //##4 가끔 Error:read ECONNRESET => events.js:183 throw er; //Unhandled 'error' event~ 에 걸려 서버다운되는데 여기에 걸려 해결됨
					global.log.error('process.on uncaughtException.. ' + e.stack)
				}).on('unhandledRejection', (reason, p) => {
					global.log.error(reason, 'process.on Unhandled Rejection at Promise.. ' + p)
				})
			}
		}

	}

	return ws

})()

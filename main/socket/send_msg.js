const config = require('../config')
const ws = require(config.app.ws)
const wsmysql = require(config.app.wsmysql)

module.exports = async function(socket, param) { 
	const _logTitle = param.ev//, _roomid = param.returnTo
	let conn, sql, data, len, obj, _cnt, _roomid, userkeyBrr = [], userkeyCrr = [] //userkeyBrr(Web), userkeyCrr(Mobile)
	try { //ws.sock.warn(null, socket, _logTitle, JSON.stringify(param), _roomid)
		obj = param.data
		_roomid = obj.roomid
		//const resVeri = com.verifyWithSocketUserId(obj.senderid, socket.userid)
		//if (resVeri != '') throw new Error(resVeri)
		//const ret = await com.chkAccessUserWithTarget(socket.userid, _roomid, "room")
		//if (ret != "") throw new Error(ret)
		conn = await wsmysql.getConnFromPool(global.pool)
		await wsmysql.txBegin(conn)	
		let useridToProc = obj.senderid
		if (obj.type == 'check') {
			data = await wsmysql.query(conn, "SELECT COUNT(*) CNT, CDT FROM A_MSGMST_TBL WHERE MSGID = ? ", [obj.prevmsgid])
			param.data.msgid = obj.prevmsgid
			param.data.body = data[0].CNT
			param.data.cdt = data[0].CDT
			await wsmysql.txCommit(conn)
			socket.emit(ws.cons.sock_ev_common, param)
		} else if (obj.type == 'notice') {
			const kind = obj.body
			if (kind == 'image') { //get image which was uploaded with ajax. arraybuffer sent with blank on socket.io-redis npm
				data = await wsmysql.query(conn, "SELECT CDT, BUFFER FROM A_MSGMST_TBL WHERE MSGID = ? ", [obj.prevmsgid])
				if (data.length == 0) throw new Error(ws.cons.MSG_NO_DATA + ' : ' + obj.prevmsgid)
				param.data.msgid = obj.prevmsgid
				param.data.cdt = data[0].CDT
				param.data.buffer = data[0].BUFFER //download through socket
				param.data.bufferStr = (data[0].BUFFER) ? 'Y' : null //(data[0].BUFFER) ? Buffer.from(data[0].BUFFER, 'binary').toString('base64') : null //see get_sublink.js
				param.data.type = kind
			} else if (kind == 'file') { //get image which was uploaded with ajax. arraybuffer sent with blank on socket.io-redis npm
				data = await wsmysql.query(conn, "SELECT CDT, BODY, FILESTATE FROM A_MSGMST_TBL WHERE MSGID = ? ", [obj.prevmsgid])
				if (data.length == 0) throw new Error(ws.cons.MSG_NO_DATA + ' : ' + obj.prevmsgid)
				param.data.msgid = obj.prevmsgid
				param.data.cdt = data[0].CDT
				param.data.body = data[0].BODY
				param.data.filestate = data[0].FILESTATE
				param.data.type = kind				
			}
			const _len = param.data.receiverid.length
			for (let i = 0; i < _len; i++) {
				userkeyBrr.push(ws.cons.w_key + param.data.receiverid[i])
				userkeyCrr.push(ws.cons.m_key + param.data.receiverid[i])
			}
			param.data.userkeyArr = await ws.redis.getUserkeysInSocket(userkeyBrr) //See ChatService.kt
			param.data.userid = socket.userid //in order for sendToMyOtherSocket and sendToRoom
			await wsmysql.txCommit(conn)
			ws.sock.sendToRoom(socket, _roomid, param) //global.jay.to(_roomid).emit(ws.cons.sock_ev_common, param)
		} else { //type = talk,flink,invite,leave
			data = await wsmysql.query(conn, "SELECT COUNT(*) CNT, sysdate(6) CURDT FROM A_ROOMDTL_TBL WHERE ROOMID = ? ", [_roomid])
			_cnt = data[0].CNT
			param.data.cdt = data[0].CURDT //dateStrings:'date' in mysql npm //? data[0].CURDT : ws.util.getCurDateTimeStr(true) //for timezone
			let _sql
			if (obj.type == 'leave') {				
				if (obj.reply && obj.reply != obj.senderid) { //make someone leave. 강제퇴장
					useridToProc = obj.reply
					//const dataA = await wsmysql.query(conn, "SELECT COUNT(*) CNT FROM " + com.tbl.user + " WHERE USER_ID = ? ", [useridToProc])
					//if (dataA[0].CNT > 0) throw new Error('Only unregistered user can be processed : ' + useridToProc) 
                    await wsmysql.query(conn, "SELECT COUNT(*) CNT FROM Z_USER_TBL WHERE USER_ID = ? ", [useridToProc])
				}
				if (_cnt == 2) {
					_sql = "UPDATE A_ROOMDTL_TBL SET STATE = '2' WHERE ROOMID = '" + _roomid + "' AND USERID = '" + useridToProc + "' "
				} else {
					_sql = "UPDATE A_ROOMDTL_TBL SET STATE = 'L', UDT = ? WHERE ROOMID = '" + _roomid + "' AND USERID = '" + useridToProc + "' "
				}
				await wsmysql.query(conn, _sql, [param.data.cdt])
				const uqry = "UPDATE A_MSGDTL_TBL SET STATE = 'D', UDT = ? WHERE ROOMID = ? AND RECEIVERID = ? "
				await wsmysql.query(conn, uqry, [param.data.cdt, _roomid, useridToProc])
				if (_cnt != 2) {
					let userkeyArr = [ ], arrUseridSortedByUsernm = [], arrUsernmSortedByUsernm = []
					const qry = "SELECT USERID, USERNM FROM A_ROOMDTL_TBL WHERE ROOMID = ? AND STATE <> 'L' ORDER BY USERNM "
					const dataDtl = await wsmysql.query(conn, qry, [_roomid])
					const roomnmObj = ws.sock.setRoomnmWithUsernm(dataDtl, 'USERNM', 'USERID')
					const len = dataDtl.length
					for (let i = 0; i < len; i++) {
						const _userid = dataDtl[i].USERID						
						arrUseridSortedByUsernm.push(_userid)
						arrUsernmSortedByUsernm.push(dataDtl[i].USERNM)
						const w_userkey = ws.cons.w_key + _userid
						const m_userkey = ws.cons.m_key + _userid
						userkeyArr.push(w_userkey)
						userkeyArr.push(m_userkey)
					}
					const _chkSameMembers = len <= ws.cons.max_check_same_members ? true : false
					await wsmysql.query(conn, "UPDATE A_ROOMMST_TBL SET MEMCNT = ?, ROOMNM = ?, UDT = ? WHERE ROOMID = ? ", [len, JSON.stringify(roomnmObj), param.data.cdt, _roomid])
					await wsmysql.query(conn, "DELETE FROM A_ROOMMEM_TBL WHERE ROOMID = ? ", [_roomid]) //should be deleted since it might be multi records			
					const qryMem = "SELECT GROUP_CONCAT(USERID separator '" + ws.cons.easydeli + "') USERIDS FROM A_ROOMDTL_TBL WHERE ROOMID = ? AND STATE <> 'L' ORDER BY USERID "
					const dataMem = await wsmysql.query(conn, qryMem, [_roomid])
					if (_chkSameMembers) await wsmysql.query(conn, "INSERT INTO A_ROOMMEM_TBL (ROOMID, MEMBERS, CDT) VALUES (?, ?, ?) ", [_roomid, dataMem[0].USERIDS, param.data.cdt])
					param.data.roomnm = JSON.stringify(roomnmObj)
					param.data.receiverid = arrUseridSortedByUsernm
					param.data.receivernm = arrUsernmSortedByUsernm
					param.data.userkeys = userkeyArr
				}
			}
			if (obj.type == 'leave' && _cnt <= 2) {
				await wsmysql.txCommit(conn)
				socket.emit(ws.cons.sock_ev_common, param)
				ws.sock.sendToMyOtherSocket(socket, param)
			} else {
				if (obj.type != 'leave' && _cnt <= 2) {
					_sql = "UPDATE A_ROOMDTL_TBL SET STATE = '' WHERE ROOMID = '" + _roomid + "' AND STATE = '2' "
					await wsmysql.query(conn, _sql, null)
				}
				let bodyForInsert
				if (obj.type == 'talk' && ws.util.chkEmoji(obj.body)) {
					bodyForInsert = emoji.unemojify(obj.body)
					if (ws.util.utf8StrByteLength(bodyForInsert) > ws.cons.max_msg_len) throw new Error('Max size of talk is ' + ws.cons.max_msg_len + '. Now is ' + ws.util.utf8StrByteLength(bodyForInsert) + '.') 
				} else {
					bodyForInsert = obj.body
				}
				let iqry = "INSERT INTO A_MSGMST_TBL (MSGID, ROOMID, SENDERID, SENDERNM, BODY, REPLY, TYP, CDT, FILESTATE) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) "
				await wsmysql.query(conn, iqry, [obj.msgid, _roomid, useridToProc, obj.sendernm, bodyForInsert, obj.reply, obj.type, param.data.cdt, obj.filestate])
				const _state = (obj.type == 'leave') ? 'R' : '' //Inserting R to 'STATE' field in advance for 'leave' message gives good sql performance in qry_unread.js
				const _len = param.data.receiverid.length //should not be obj but param.data since 'leave' exclude himself
				for (let i = 0; i < _len; i++) {
					iqry = "INSERT INTO A_MSGDTL_TBL (MSGID, ROOMID, SENDERID, RECEIVERID, RECEIVERNM, CDT, STATE) VALUES (?, ?, ?, ?, ?, ?, ?) "
					await wsmysql.query(conn, iqry, [obj.msgid, _roomid, useridToProc, param.data.receiverid[i], param.data.receivernm[i], param.data.cdt, _state])
					userkeyBrr.push(ws.cons.w_key + param.data.receiverid[i])
					userkeyCrr.push(ws.cons.m_key + param.data.receiverid[i])
				}
				param.data.userkeyArr = await ws.redis.getUserkeysInSocket(userkeyBrr) //See ChatService.kt
				param.data.userid = socket.userid //in order for sendToMyOtherSocket and sendToRoom
				await wsmysql.txCommit(conn)
				ws.sock.sendToRoom(socket, _roomid, param) //global.jay.to(_roomid).emit(ws.cons.sock_ev_common, param)
			}
			if (obj.type == 'leave' && _cnt > 2) {
				setTimeout(async function() {
					try {
						let userkeySocketArr = [ ]
						const arr = await ws.redis.getUserkeySocket(ws.cons.w_key + useridToProc)
						const brr = await ws.redis.getUserkeySocket(ws.cons.m_key + useridToProc)
						if (arr.length > 0) userkeySocketArr = userkeySocketArr.concat(arr)
						if (brr.length > 0) userkeySocketArr = userkeySocketArr.concat(brr)
						await ws.sock.leaveRoomWithUserkeySocketArr(userkeySocketArr, _roomid)
					} catch (ex) {
						ws.sock.warn(ws.cons.sock_ev_alert, socket, _logTitle, ex, _roomid)
					}
				}, 1000)
			}
		}
		if (obj.type != 'check' && obj.type != 'leave') { //push(fcm/apns) sending to userkeys who are not connected
			const userkeyArrInSocket = await ws.redis.getUserkeysInSocket(userkeyCrr)
			const userkeyArrNotInSocket = userkeyCrr.filter(item => !userkeyArrInSocket.includes(item))
			const _len = userkeyArrNotInSocket.length
			for (let i = 0; i < _len; i++) {				
				if (userkeyArrNotInSocket[i].startsWith(ws.cons.m_key)) { //이 로직은 다시 한번 점검해야 할 것임 (오래전 기억..)
					const userid = userkeyArrNotInSocket[i].replace(ws.cons.m_key, '')
					const sqry = "SELECT OS_INUSE, PUSH_IOS, PUSH_AND FROM Z_USER_TBL WHERE USER_ID = ? "
					const sdata = await wsmysql.query(conn, sqry, [userid]) //Notice that txCommit has already done above.
					if (sdata.length == 0) continue //console.log(userkeyArrNotInSocket[i]+"===="+sdata[0].PUSH_AND)
					if (sdata[0].OS_INUSE == 'ios' && sdata[0].PUSH_IOS != ws.cons.invalid_push_token) {
						//later
					} else if (sdata[0].OS_INUSE == 'and' && sdata[0].PUSH_AND != ws.cons.invalid_push_token) {
						let msg = {
							data: { //Every key name should be equal to socket's data (param.data) since Android app use these things for notification.
								msgid : param.data.msgid, 
								senderkey : param.data.senderkey, 
								senderid : param.data.senderid, 
								body : 'fcm) ' + param.data.body, //fcm) is temporary test for distinguish it from socket message.  
								type : param.data.type, 
								userkeyArr : param.data.userkeyArr.toString(), 
								roomid : param.data.roomid,
								cdt : param.data.cdt
							},
							android: {
								priority: "high"
							},
							token: sdata[0].PUSH_AND
						} //https://noonestaysthesame.tistory.com/m/17
                        const dsql = "UPDATE A_MSGDTL_TBL SET PUSH_ERR = ? WHERE MSGID = ? AND ROOMID = ? "
						global.fcm.messaging().send(msg, false) //dryRun=false callback not found on google's sdk document
						.then(async (rs) => { //rs=projects/sendjay-d712c/messages/0:1619162645061012%3a7eb762f9fd7ecd
							await wsmysql.query(conn, dsql, ['fcm_ok', param.data.msgid, param.data.roomid])
						}).catch(async (err) => { //Error Code : https://firebase.google.com/docs/cloud-messaging/send-message?hl=ko	
							//const dsql = "UPDATE A_MSGDTL_TBL SET PUSH_ERR = ? WHERE MSGID = ? AND ROOMID = ? " //100byte
							let code = (err.errorInfo) ? err.errorInfo.code : err.code
							let msg = (err.errorInfo) ? err.errorInfo.message : 'Unknown Error'
							let _msg = 'fcm_err/' + code  + '/' + msg
							_msg = _msg.length > 100 ? _msg.substr(0, 100) : _msg //max 100byte
							console.log(userid, _msg)
							await wsmysql.query(conn, dsql, [_msg, param.data.msgid, param.data.roomid]) //Even if error occurs, talk will be sent.
							if (_msg.includes('The registration token is not a valid')) {
								const usql = "UPDATE Z_USER_TBL SET PUSH_AND = ? WHERE USER_ID = ? "
								await wsmysql.query(conn, usql, [ws.cons.invalid_push_token, userid])
							}
						})						
					}
				}
			}
		}
	} catch (ex) { //ws.sock.warn(null, socket, _logTitle, JSON.stringify(param), _roomid)
		if (conn) await wsmysql.txRollback(conn)
		ws.sock.warn(ws.cons.sock_ev_alert, socket, _logTitle, ex, _roomid)
		try {
			if (obj.type != 'leave') {
				param.data.errcd = ws.cons.RESULT_ERR
				param.data.errmsg = ex.message
				socket.emit(ws.cons.sock_ev_common, param)
				ws.sock.warn(null, socket, _logTitle, ex, _roomid)
			} else {
				ws.sock.warn(ws.cons.sock_ev_alert, socket, _logTitle, ex, _roomid)
			}			
		} catch (ex1) {}
	} finally {
		wsmysql.closeConn(conn, _logTitle)
	}
}

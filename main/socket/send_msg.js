const config = require('../config')
const nodeConfig = require(config.app.nodeConfig)
const ws = require(nodeConfig.app.ws)
const wsmysql = require(nodeConfig.app.wsmysql)

//type = leave, invite, check, notice, flink, talk
//image, file는 chat.html에서 구분값으로 넘기나 결국은 서버에 넘길 때는 notice로 type이 넘어가므로 서버에서는 미사용 (실데이터는 ajax로 처리) 

module.exports = async function(socket, param) { 
	const _logTitle = param.ev//, _roomid = param.returnTo
	let conn, sql, data, len, obj, _cnt, _roomid, userkeyBrr = [], userkeyCrr = [] //userkeyBrr(Web), userkeyCrr(Mobile)
	try { //ws.sock.warn(null, socket, _logTitle, JSON.stringify(param), _roomid)
		obj = param.data
		_roomid = obj.roomid
		obj.senderid = socket.userid
		conn = await wsmysql.getConnFromPool(global.pool) //console.log(obj.senderid, _roomid)
		const ret = await ws.util.chkAccessUserWithTarget(conn, obj.senderid, _roomid, 'room')
		if (ret != '') throw new Error(ret)
		await wsmysql.txBegin(conn)
		let useridToProc = obj.senderid
		if (obj.type == 'check') { //전송여부 단순 확인
			data = await wsmysql.query(conn, "SELECT CDT, COUNT(*) CNT FROM A_MSGMST_TBL WHERE MSGID = ? GROUP BY CDT ", [obj.prevmsgid])
			param.data.msgid = obj.prevmsgid
			if (data.length == 0) {				
				param.data.body = 0 //전송실패표시
			} else {
				param.data.body = data[0].CNT
				param.data.cdt = data[0].CDT
			}
			await wsmysql.txCommit(conn)
			socket.emit(ws.cons.sock_ev_common, param)
		} else if (obj.type == 'notice') { //이미지, 파일 전송후 notice
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
				data = await wsmysql.query(conn, "SELECT CDT, CASE WHEN STATE2 = 'C' THEN '" + ws.cons.cell_revoked + "' ELSE BODY END BODY, FILESTATE FROM A_MSGMST_TBL WHERE MSGID = ? ", [obj.prevmsgid])
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
			param.data.userid = obj.senderid //in order for sendToMyOtherSocket and sendToRoom
			await wsmysql.txCommit(conn)
			ws.sock.sendToRoom(socket, _roomid, param) //global.jay.to(_roomid).emit(ws.cons.sock_ev_common, param)
		} else { //type = talk,flink,invite,leave
			data = await wsmysql.query(conn, "SELECT COUNT(*) CNT, sysdate(6) CURDT FROM A_ROOMDTL_TBL WHERE ROOMID = ? ", [_roomid])
			_cnt = data[0].CNT
			param.data.cdt = data[0].CURDT //dateStrings:'date' in mysql npm //? data[0].CURDT : ws.util.getCurDateTimeStr(true) //for timezone
			let _sql
			if (obj.type == 'leave') {				
				if (obj.reply && obj.reply != obj.senderid) { //강제퇴장
					useridToProc = obj.reply
                    await wsmysql.query(conn, "SELECT COUNT(*) CNT FROM Z_USER_TBL WHERE USER_ID = ? ", [useridToProc])
				}
				if (_cnt == 2) { //챗방에 2명인 경우는 한명이 나가도 퇴장 표시 안함
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
					const dataMem = await wsmysql.query(conn, qryMem, [_roomid]) //dataMem[0].USERIDS이 null이면 나 혼자만의 방에서 내가 퇴장하고 아무도 없다는 의미가 되므로 체크해야 함
					if (_chkSameMembers && dataMem[0].USERIDS) await wsmysql.query(conn, "INSERT INTO A_ROOMMEM_TBL (ROOMID, MEMBERS, CDT) VALUES (?, ?, ?) ", [_roomid, dataMem[0].USERIDS, param.data.cdt])
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
				let iqry = "INSERT INTO A_MSGMST_TBL (MSGID, ROOMID, SENDERID, SENDERNM, BODY, REPLY, TYP, CDT, FILESTATE) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) "
				await wsmysql.query(conn, iqry, [obj.msgid, _roomid, useridToProc, obj.sendernm, obj.body, obj.reply, obj.type, param.data.cdt, obj.filestate])
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
	} catch (ex) { //ws.sock.warn(null, socket, _logTitle, JSON.stringify(param), _roomid)
		if (conn) await wsmysql.txRollback(conn)
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

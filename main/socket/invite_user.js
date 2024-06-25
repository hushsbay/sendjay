const config = require('../config')
const nodeConfig = require(config.app.nodeConfig)
const ws = require(nodeConfig.app.ws)
const wsmysql = require(nodeConfig.app.wsmysql)

module.exports = async function(socket, param) {
	const _logTitle = param.ev, _roomid = param.returnTo
	let conn, sql, data, len
	try { //ws.sock.warn(null, socket, _logTitle, com.cons.rq + JSON.stringify(param), _roomid)
		let invitedUseridArr = [], invitedUsernmArr = []
		const _useridArr = param.data.userids
		const _usernmArr = param.data.usernms
		conn = await wsmysql.getConnFromPool(global.pool)
		const ret = await ws.util.chkAccessUserWithTarget(conn, socket.userid, _roomid, "room")
		if (ret != "") throw new Error(ret)
		await wsmysql.txBegin(conn)		
		for (let i = 0; i < _useridArr.length; i++) {
			sql = "SELECT USERID, USERNM, STATE FROM A_ROOMDTL_TBL WHERE ROOMID = ? AND USERID = ? "
			data = await wsmysql.query(conn, sql, [_roomid, _useridArr[i]])
			if (data.length == 0) {
				sql = "INSERT INTO A_ROOMDTL_TBL (ROOMID, USERID, USERNM, CDT) VALUES (?, ?, ?, sysdate(6)) "
				await wsmysql.query(conn, sql, [_roomid, _useridArr[i], _usernmArr[i]])
				invitedUseridArr.push(_useridArr[i])
				invitedUsernmArr.push(_usernmArr[i])				
			} else {
				if (data[0].STATE == 'L') {
					sql = "UPDATE A_ROOMDTL_TBL SET STATE = '', UDT = sysdate(6) WHERE ROOMID = ? AND USERID = ? "
					await wsmysql.query(conn, sql, [_roomid, _useridArr[i]])
					invitedUseridArr.push(_useridArr[i])
					invitedUsernmArr.push(_usernmArr[i])	
				}
			}
		}
		let useridBrr = [], userkeyArr = [], userkeySocketArr = [], arrUseridSortedByUsernm = [], arrUsernmSortedByUsernm = []
		if (invitedUseridArr.length > 0) {
			sql = "SELECT USERID, USERNM FROM A_ROOMDTL_TBL WHERE ROOMID = ? AND STATE <> 'L' ORDER BY USERNM "
			data = await wsmysql.query(conn, sql, [_roomid])
			const roomnmObj = ws.sock.setRoomnmWithUsernm(data, 'USERNM', 'USERID')
			len = data.length
			for (let i = 0; i < len; i++) {
				const _userid = data[i].USERID
				useridBrr.push(_userid)
				const _usernm = data[i].USERNM
				arrUseridSortedByUsernm.push(_userid)
				arrUsernmSortedByUsernm.push(_usernm)
				const w_userkey = ws.cons.w_key + _userid
				const m_userkey = ws.cons.m_key + _userid
				userkeyArr.push(w_userkey)
				userkeyArr.push(m_userkey)
				const arr = await ws.redis.getUserkeySocket(w_userkey)
				const brr = await ws.redis.getUserkeySocket(m_userkey)
				if (arr.length > 0) userkeySocketArr = userkeySocketArr.concat(arr)
				if (brr.length > 0) userkeySocketArr = userkeySocketArr.concat(brr)
			}		
			useridBrr.sort((a, b) => { return (a > b) ? 1 : (b > a) ? -1 : 0 })
			const _chkSameMembers = useridBrr.length <= ws.cons.max_check_same_members ? true : false
			const _useridJoinedEasy = useridBrr.join(ws.cons.easydeli)
			await wsmysql.query(conn, "UPDATE A_ROOMMST_TBL SET MEMCNT = ?, ROOMNM = ?, UDT = sysdate(6) WHERE ROOMID = ? ", [len, JSON.stringify(roomnmObj), _roomid])
			await wsmysql.query(conn, "DELETE FROM A_ROOMMEM_TBL WHERE ROOMID = ? ", [_roomid]) //should be deleted since it might be multi records			
			if (_chkSameMembers) await wsmysql.query(conn, "INSERT INTO A_ROOMMEM_TBL (ROOMID, MEMBERS, CDT) VALUES (?, ?, sysdate(6)) ", [_roomid, _useridJoinedEasy])
			await wsmysql.txCommit(conn)
			await ws.sock.joinRoomWithUserkeySocketArr(userkeySocketArr, _roomid)
			param.data.roomnm = JSON.stringify(roomnmObj)
		}
		param.data.roomid = _roomid		
		param.data.receiverid = arrUseridSortedByUsernm
		param.data.receivernm = arrUsernmSortedByUsernm
		param.data.invitedUserids = invitedUseridArr
		param.data.invitedUsernms = invitedUsernmArr
		param.data.userkeys = userkeyArr
		socket.emit(ws.cons.sock_ev_common, param)
	} catch (ex) { //ws.sock.warn(null, socket, _logTitle, com.cons.rs + JSON.stringify(param), _roomid)
		if (conn) await wsmysql.txRollback(conn)
		ws.sock.warn(ws.cons.sock_ev_alert, socket, _logTitle, ex, _roomid)
	} finally {
		wsmysql.closeConn(conn, _logTitle)
	}
}

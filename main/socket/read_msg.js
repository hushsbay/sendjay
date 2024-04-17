const config = require('../config')
const ws = require(config.app.ws)
const wsmysql = require(config.app.wsmysql)

module.exports = async function(socket, param) { 
	const _logTitle = param.ev, _roomid = param.returnTo
	let conn, sql, data, len
	try { //ws.sock.warn(null, socket, _logTitle, JSON.stringify(param), _roomid)
		const obj = param.data	
		//const userid = socket.userid
		//if (obj.type == 'updateall' || obj.type == 'update') {
			//if (obj.receiverid != socket.userid) throw new Error(ws.cons.MSG_MISMATCH_WITH_USERID + '- obj.receiverid')	
		//}
		param.data.userid = socket.userid //1) see ChatService.kt 2) in order to sendToMyOtherSocket for mobile noti cancelling	
		conn = await wsmysql.getConnFromPool(global.pool)
		const ret = await ws.util.chkAccessUserWithTarget(conn, socket.userid, _roomid, 'room')
		if (ret != '') throw new Error(ret)
		const dateFr = ws.util.setDateAdd(new Date(), ws.cons.max_days_to_fetch)	
		await wsmysql.txBegin(conn)		
		if (obj.type == 'updateall') {
			sql = "SELECT COUNT(*) CNT FROM A_MSGDTL_TBL WHERE ROOMID = ? AND RECEIVERID = ? AND STATE = '' AND CDT >= ? "
			data = await wsmysql.query(conn, sql, [_roomid, obj.receiverid, dateFr])
			if (data[0].CNT > 0) {
				data = "UPDATE A_MSGDTL_TBL SET STATE = 'R' WHERE ROOMID = ? AND RECEIVERID = ? AND STATE = '' AND CDT >= ? "
				await wsmysql.query(conn, data, [_roomid, obj.receiverid, dateFr]) //update all
			}
			await wsmysql.txCommit(conn)
			if (data[0].CNT > 0) { //need to update unread count for all members
				ws.sock.sendToRoom(socket, _roomid, param) //global.jay.to(_roomid).emit(com.cons.sock_ev_common, param)
			} else {
				socket.emit(ws.cons.sock_ev_common, param)
				ws.sock.sendToMyOtherSocket(socket, param)
			}
		} else if (obj.type == 'getmembers') {
			sql = "SELECT RECEIVERNM FROM A_MSGDTL_TBL WHERE MSGID = ? AND ROOMID = ? AND STATE = '' AND CDT >= ? ORDER BY RECEIVERNM "
			const data = await wsmysql.query(conn, sql, [obj.msgid, _roomid, dateFr])
			param.data.unread_list = data
			await wsmysql.txCommit(conn)
			socket.emit(ws.cons.sock_ev_common, param)
		} else if (obj.type == 'update') {
			sql = "SELECT COUNT(*) CNT FROM A_MSGDTL_TBL WHERE MSGID = ? AND ROOMID = ? AND CDT >= ? "
			data = await wsmysql.query(conn, sql, [obj.msgid, _roomid, dateFr])
			if (data[0].CNT == 0) { //might be no record at first right after sending talk
				param.data.unread_cnt = -1
			} else {
				data = "UPDATE A_MSGDTL_TBL SET STATE = 'R' WHERE MSGID = ? AND ROOMID = ? AND RECEIVERID = ? AND STATE = '' AND CDT >= ? "
				await wsmysql.query(conn, data, [obj.msgid, _roomid, obj.receiverid, dateFr])
				sql = "SELECT COUNT(*) CNT FROM A_MSGDTL_TBL WHERE MSGID = ? AND ROOMID = ? AND STATE = '' AND CDT >= ? "
				data = await wsmysql.query(conn, sql, [obj.msgid, _roomid, dateFr])
				param.data.unread_cnt = data[0].CNT
			}
			await wsmysql.txCommit(conn)
			ws.sock.sendToRoom(socket, _roomid, param) //global.jay.to(_roomid).emit(com.cons.sock_ev_common, param)
		} else if (obj.type == 'query') {
			let unreadArr = []
			for (let msgid of obj.msgidArr) {
				sql = "SELECT COUNT(*) CNT FROM A_MSGDTL_TBL WHERE MSGID = ? AND ROOMID = ? AND CDT >= ? "
				data = await wsmysql.query(conn, sql, [msgid, _roomid, dateFr])
				if (data[0].CNT == 0) { //might be no record at first right after sending talk
					unreadArr.push(-1)
				} else {
					sql = "SELECT COUNT(*) CNT FROM A_MSGDTL_TBL WHERE MSGID = ? AND ROOMID = ? AND STATE = '' AND CDT >= ? "
					data = await wsmysql.query(conn, sql, [msgid, _roomid, dateFr])
					unreadArr.push(data[0].CNT)
				}
			}
			param.data.unreadArr = unreadArr
			await wsmysql.txCommit(conn)
			socket.emit(ws.cons.sock_ev_common, param)
		}	
	} catch (ex) { //ws.sock.warn(null, socket, _logTitle, JSON.stringify(param), _roomid)
		if (conn) await wsmysql.txRollback(conn)
		ws.sock.warn(ws.cons.sock_ev_alert, socket, _logTitle, ex, _roomid)
	} finally {
		wsmysql.closeConn(conn, _logTitle)
	}
}

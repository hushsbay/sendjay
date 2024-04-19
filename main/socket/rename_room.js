const config = require('../config')
const ws = require(config.app.ws)
const wsmysql = require(config.app.wsmysql)

module.exports = async function(socket, param) {
	const _logTitle = param.ev, _roomid = param.returnTo
	let conn, sql, data, len
	try { //ws.sock.warn(null, socket, _logTitle, com.cons.rq + JSON.stringify(param), _roomid)
		const _type = param.data.type //all or one(self)
		const _roomname = param.data.roomname
		const userid = socket.userid //param.data.userid
		//if (_userid != socket.userid) throw new Error(ws.cons.MSG_MISMATCH_WITH_USERID + '- _userid')
		conn = await wsmysql.getConnFromPool(global.pool)
		const ret = await ws.util.chkAccessUserWithTarget(conn, userid, _roomid, 'room')
		if (ret != '') throw new Error(ret)
		sql = "UPDATE A_ROOMDTL_TBL SET UDT = sysdate(6), NICKNM = ? WHERE ROOMID = ? AND USERID = ? "		
		data = await wsmysql.query(conn, "SELECT MASTERID, ROOMNM FROM A_ROOMMST_TBL WHERE ROOMID = ? ", [_roomid])
		if (_type == 'all') {			
			if (data[0].MASTERID == userid) {
				await wsmysql.query(conn, sql, [_roomname, _roomid, userid])
				await wsmysql.query(conn, "UPDATE A_ROOMMST_TBL SET UDT = sysdate(6), NICKNM = ? WHERE ROOMID = ? ", [_roomname, _roomid]) 
				ws.sock.sendToRoom(socket, _roomid, param)
			} else {
				throw new Error('방 맴버전체에게 적용되는 방명 변경은 방장만 가능합니다.')
			}			
		} else {
			await wsmysql.query(conn, sql, [_roomname, _roomid, userid])
			if (data[0].MASTERID == userid) {
				await wsmysql.query(conn, "UPDATE A_ROOMMST_TBL SET UDT = sysdate(6), NICKNM = '' WHERE ROOMID = ? ", [_roomid]) 
				ws.sock.sendToRoom(socket, _roomid, param) //모두에게 보냄
			} else { //나에게만 보냄
				socket.emit(ws.cons.sock_ev_common, param)
				ws.sock.sendToMyOtherSocket(socket, param)
			}
		}
	} catch (ex) { //ws.sock.warn(null, socket, _logTitle, com.cons.rs + JSON.stringify(param), _roomid)
		ws.sock.warn(ws.cons.sock_ev_alert, socket, _logTitle, ex, _roomid)
	} finally {
		wsmysql.closeConn(conn, _logTitle)
	}
}

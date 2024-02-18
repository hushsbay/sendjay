const config = require('../config')
const ws = require(config.app.ws)
const wsmysql = require(config.app.wsmysql)

module.exports = async function(socket, param) {
	const _logTitle = param.ev
	let conn, sql, data, len
	try { //ws.sock.warn(null, socket, _logTitle, com.cons.rq + JSON.stringify(param))
		//const resVeri = com.verifyWithSocketUserId(param.data.userid, socket.userid)
		//if (resVeri != '') throw new Error(resVeri)	
		const _kind = param.data.kind		
		const _userid = param.data.userid
		conn = await wsmysql.getConnFromPool(global.pool)
		if (_kind == 'noti' || _kind == 'dispmem') {
			const _value = param.data.value
			const _roomid = param.data.roomid
			if (_kind == 'noti') {
				await wsmysql.query(conn, "UPDATE A_ROOMDTL_TBL SET NOTI = ? WHERE ROOMID = ? AND USERID = ? ", [_value, _roomid, _userid]) 
				socket.emit(ws.cons.sock_ev_common, param)	
				ws.sock.sendToMyOtherSocket(socket, param)
			} else { //mobile only
				await wsmysql.query(conn, "UPDATE A_ROOMDTL_TBL SET DISPMEM = ? WHERE ROOMID = ? AND USERID = ? ", [_value, _roomid, _userid])
				socket.emit(ws.cons.sock_ev_common, param)	 
			}					
		} else if (_kind == 'userinfo') { //No need to update table since it was already updated. You just broadcast it inside namespace.
			ws.sock.broadcast(socket, ws.cons.sock_ev_set_env, param.data, 'all')
		} //ws.sock.warn(null, socket, _logTitle, com.cons.rs + JSON.stringify(param))
	} catch (ex) {
		ws.sock.warn(ws.cons.sock_ev_alert, socket, _logTitle, ex)
	} finally {
		wsmysql.closeConn(conn, _logTitle)
	}
}

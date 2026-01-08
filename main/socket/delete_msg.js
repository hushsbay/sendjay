const config = require('../config')
const nodeConfig = require(config.app.nodeConfig)
const ws = require(nodeConfig.app.ws)
const wsmysql = require(nodeConfig.app.wsmysql)

module.exports = async function(socket, param) {
	const _logTitle = param.ev, _roomid = param.returnTo
	let conn
	try { //ws.sock.warn(null, socket, _logTitle, ws.cons.rq + JSON.stringify(param), _roomid)	
		const userid = socket.userid //param.data.receiverid
		conn = await wsmysql.getConnFromPool(global.pool)
		await wsmysql.txBegin(conn)	
		if (param.data.type == 'all') {
			const ret = await ws.util.chkAccessUserWithTarget(conn, userid, _roomid, 'room')
			if (ret != '') throw new Error(ret)
			const arg = [_roomid, userid]
			await wsmysql.query(conn, "UPDATE a_msgdtl_tbl SET UDT = sysdate(6), STATE = 'D' WHERE ROOMID = ? AND RECEIVERID = ? ", arg)
		} else {
			const _msgidArr = param.data.msgidArr
			const _len = _msgidArr.length
			for (let i = 0; i < _len; i++) {
				const ret = await ws.util.chkAccessUserWithTarget(conn, userid, _msgidArr[i], '')
				if (ret != '') throw new Error(ret)
				const arg = [_msgidArr[i], _roomid, userid]
				await wsmysql.query(conn, "UPDATE a_msgdtl_tbl SET UDT = sysdate(6), STATE = 'D' WHERE MSGID = ? AND ROOMID = ? AND RECEIVERID = ? ", arg)
			}
		}
		await wsmysql.txCommit(conn)	
		socket.emit(ws.cons.sock_ev_common, param)
		ws.sock.sendToMyOtherSocket(socket, param)
	} catch (ex) { //ws.sock.warn(null, socket, _logTitle, com.cons.rs + JSON.stringify(param), _roomid)
		if (conn) await wsmysql.txRollback(conn)
		ws.sock.warn(ws.cons.sock_ev_alert, socket, _logTitle, ex, _roomid)
	} finally {
		wsmysql.closeConn(conn, _logTitle)
	}
}

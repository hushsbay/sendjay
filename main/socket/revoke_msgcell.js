const config = require('../config')
const ws = require(config.app.ws)
const wsmysql = require(config.app.wsmysql)

module.exports = async function(socket, param) {
	const _logTitle = param.ev, _roomid = param.returnTo
	let conn, sql, data, len
	try { //ws.sock.warn(null, socket, _logTitle, com.cons.rq + JSON.stringify(param), _roomid)	
		//const ret = await com.chkAccessUserWithTarget(socket.userid, param.data.msgid, "")
		//if (ret != "") throw new Error(ret)
		conn = await wsmysql.getConnFromPool(global.pool)
		await wsmysql.txBegin(conn)	
		data = await wsmysql.query(conn, "SELECT TIMEDIFF(sysdate(6), CDT) GAP FROM A_MSGMST_TBL WHERE MSGID = ? ", [param.data.msgid])
		if (data.length == 0) throw new Error(ws.cons.MSG_NO_DATA + ' : ' + param.data.msgid)
		if (data[0].GAP > '24:00:00') throw new Error('전송취소는 전송후 24시간내만 가능합니다.')
		await wsmysql.query(conn, "UPDATE A_MSGDTL_TBL SET UDT = sysdate(6), STATE = 'R' WHERE MSGID = ? AND SENDERID = ? AND SENDERID = RECEIVERID ", [param.data.msgid, param.data.senderid])
		await wsmysql.query(conn, "UPDATE A_MSGDTL_TBL SET UDT = sysdate(6), STATE = 'D' WHERE MSGID = ? AND STATE = '' ", [param.data.msgid])
		await wsmysql.query(conn, "UPDATE A_MSGMST_TBL SET UDT = sysdate(6), BODY = ?, BUFFER = null WHERE MSGID = ? ", [ws.cons.cell_revoked, param.data.msgid])
		await wsmysql.txCommit(conn)
		//원래 파일도 삭제해야 하나 파일업로드시 브라우저창 닫기로 인한 가비지는 데몬으로 처리해야 하므로 나중에 모두 합쳐서 데몬으로 처리하기로 함
		ws.sock.sendToRoom(socket, _roomid, param)
	} catch (ex) { //ws.sock.warn(null, socket, _logTitle, com.cons.rs + JSON.stringify(param), _roomid)
		if (conn) await wsmysql.txRollback(conn)
		ws.sock.warn(ws.cons.sock_ev_alert, socket, _logTitle, ex, _roomid)
	} finally {
		wsmysql.closeConn(conn, _logTitle)
	}
}

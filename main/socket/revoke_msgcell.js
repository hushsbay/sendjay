const config = require('../config')
const nodeConfig = require(config.app.nodeConfig)
const ws = require(nodeConfig.app.ws)
const wsmysql = require(nodeConfig.app.wsmysql)

module.exports = async function(socket, param) {
	const _logTitle = param.ev, _roomid = param.returnTo
	let conn, sql, data, len
	try { //ws.sock.warn(null, socket, _logTitle, com.cons.rq + JSON.stringify(param), _roomid)	
		const _msgid = param.data.msgid
		const _senderid = socket.userid //param.data.senderid
		//if (_senderid != socket.userid) throw new Error(ws.cons.MSG_MISMATCH_WITH_USERID + '- _senderid')
		conn = await wsmysql.getConnFromPool(global.pool)
		const ret = await ws.util.chkAccessUserWithTarget(conn, socket.userid, _roomid, 'room')
		if (ret != '') throw new Error(ret)
		await wsmysql.txBegin(conn)	
		data = await wsmysql.query(conn, "SELECT TIMEDIFF(sysdate(6), CDT) GAP FROM A_MSGMST_TBL WHERE MSGID = ? ", [_msgid])
		if (data.length == 0) throw new Error(ws.cons.MSG_NO_DATA + ' : ' + _msgid)
		if (data[0].GAP > '24:00:00') throw new Error('전송취소는 전송후 24시간내만 가능합니다.')
		await wsmysql.query(conn, "UPDATE A_MSGDTL_TBL SET UDT = sysdate(6), STATE = 'R' WHERE MSGID = ? AND SENDERID = ? AND SENDERID = RECEIVERID ", [_msgid, _senderid]) //본인은 읽음 처리
		await wsmysql.query(conn, "UPDATE A_MSGDTL_TBL SET UDT = sysdate(6), STATE = 'D' WHERE MSGID = ? AND STATE = '' ", [_msgid]) //아직 읽지 않은 사람들만 MSGDTL에서는 삭제 처리
		//await wsmysql.query(conn, "UPDATE A_MSGMST_TBL SET UDT = sysdate(6), BODY = ?, BUFFER = null WHERE MSGID = ? ", [ws.cons.cell_revoked, _msgid])
		//BODY에 ws.cons.cell_revoked를 넣으니 파일일 경우 나중에 만기시 실제 파일삭제가 문제가 되어 아래와 같이 개선함. 클라이언트로 내릴 땐 BODY를 ws.cons.cell_revoked로 대체해 내려야 함
		await wsmysql.query(conn, "UPDATE A_MSGMST_TBL SET UDT = sysdate(6), STATE2 = 'C' WHERE MSGID = ? ", [_msgid]) //C=Cancelled
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

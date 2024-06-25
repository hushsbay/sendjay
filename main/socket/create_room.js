const config = require('../config')
const nodeConfig = require(config.app.nodeConfig)
const ws = require(nodeConfig.app.ws)
const wsmysql = require(nodeConfig.app.wsmysql)
//새 채팅방을 개설하기 전에 기존에 같은 멤버들의 방이 있으면 그 방을 열기. 퇴장한 후라도 이미 이전 데이터는 삭제되었으므로 문제없음

module.exports = async function(socket, param) {
	const _logTitle = param.ev, _roomid = param.returnTo
	let conn, sql, data, len
	try { //ws.sock.warn(null, socket, _logTitle, JSON.stringify(param), _roomid)
		const _useridArr = param.data.userids
		const _masterid = param.data.masterid //socket.userid를 사용해도 되는데 문맥 편의상 그냥 파라미터로 받음 (따라서, socket.userid와 비교 필요)
		const _masternm = param.data.masternm
		if (_masterid != socket.userid) throw new Error(ws.cons.MSG_MISMATCH_WITH_USERID + '- masterid')
		const _chkSameMembers = _useridArr.length <= ws.cons.max_check_same_members ? true : false
		_useridArr.sort((a, b) => { return (a > b) ? 1 : (b > a) ? -1 : 0 }) //alphabetical 순서
		const _useridJoinedEasy = _useridArr.join(ws.cons.easydeli)
		conn = await wsmysql.getConnFromPool(global.pool)
		await wsmysql.txBegin(conn)
		data = await wsmysql.query(conn, "SELECT ROOMID FROM A_ROOMMEM_TBL WHERE MEMBERS = ? AND ROOMID <> '' ORDER BY CDT DESC LIMIT 1 ", [_useridJoinedEasy])
		if (data.length > 0) { //동일 멤버들의 방이 있는지 체크. 여러 개 있을 수 있음 (invite_user 참조)
			param.data.from = 'dupchk'
			param.data.roomid = data[0].ROOMID
			param.data.prevroomid = _roomid
		} else {
            const _useridJoined = _useridArr.join(ws.cons.indeli)
			sql = "SELECT USER_NM, USER_ID FROM Z_USER_TBL WHERE USER_ID IN ('" + _useridJoined + "') ORDER BY USER_NM, USER_ID "
			data = await wsmysql.query(conn, sql, null)
			len = data.length
			if (len == 0) throw new Error(ws.cons.MSG_NO_DATA + ' (Z_USER_TBL)')
			const roomnmObj = ws.sock.setRoomnmWithUsernm(data, 'USER_NM', 'USER_ID')
			for (let i = 0; i < len; i++) {
				const _userid = data[i].USER_ID
				const _usernm = data[i].USER_NM
				const iqry = "INSERT INTO A_ROOMDTL_TBL (ROOMID, USERID, USERNM, CDT) VALUES (?, ?, ?, sysdate(6)) "
				await wsmysql.query(conn, iqry, [_roomid, _userid, _usernm])
			}
			const iqry = "INSERT INTO A_ROOMMST_TBL (ROOMID, ROOMNM, MASTERID, MASTERNM, MEMCNT, CDT) VALUES (?, ?, ?, ?, ?, sysdate(6)) "
			await wsmysql.query(conn, iqry, [_roomid, JSON.stringify(roomnmObj), _masterid, _masternm, len])
			if (_chkSameMembers) await wsmysql.query(conn, "INSERT INTO A_ROOMMEM_TBL (ROOMID, MEMBERS, CDT) VALUES (?, ?, sysdate(6)) ", [_roomid, _useridJoinedEasy])
		} 
		await wsmysql.txCommit(conn)
		socket.emit(ws.cons.sock_ev_common, param)
	} catch (ex) { //ws.sock.warn(null, socket, _logTitle, JSON.stringify(param), _roomid)
		if (conn) await wsmysql.txRollback(conn)
		ws.sock.warn(ws.cons.sock_ev_alert, socket, _logTitle, ex, _roomid)
	} finally {
		wsmysql.closeConn(conn, _logTitle)
	}
}

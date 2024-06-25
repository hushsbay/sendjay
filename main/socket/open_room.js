const config = require('../config')
const ws = require(nodeConfig.app.ws)
const wsmysql = require(nodeConfig.app.wsmysql)
//remoteJoining room for valid socket

module.exports = async function(socket, param) { 
	const _logTitle = param.ev, _roomid = param.returnTo
	let conn, sql, data, len, _nicknm
	try { //ws.sock.warn(null, socket, _logTitle, JSON.stringify(param), _roomid)
		const userid = socket.userid //param.data.userid
		//if (userid != socket.userid) throw new Error(ws.cons.MSG_MISMATCH_WITH_USERID + '- userid')
		conn = await wsmysql.getConnFromPool(global.pool)
		const ret = await ws.util.chkAccessUserWithTarget(conn, userid, _roomid, "room")
		if (ret != "") throw new Error(ret)
		sql = "SELECT B.USERID, B.USERNM, B.NICKNM, A.ROOMNM, A.NICKNM MAINNM, A.MASTERID "
		sql += " FROM A_ROOMDTL_TBL B "
		sql += "INNER JOIN A_ROOMMST_TBL A ON B.ROOMID = A.ROOMID AND B.STATE <> 'L' "
		sql += "WHERE B.ROOMID = ? "
		sql += "ORDER BY B.USERNM, USERID "
		data = await wsmysql.query(conn, sql, [_roomid])
		len = data.length
		if (len == 0) throw new Error(ws.cons.MSG_NO_DATA + ' (roomid)')
		let userkeyArr = [], userkeySocketArr = [], arrUseridSortedByUsernm = [], arrUsernmSortedByUsernm = []
		for (let i = 0; i < len; i++) {
			const _userid = data[i].USERID
			if (_userid == userid) _nicknm = data[i].NICKNM				
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
		if (param.data.from != 'dupchk') await ws.sock.joinRoomWithUserkeySocketArr(userkeySocketArr, _roomid) //Overwriting joining ok
		const dataR = await wsmysql.query(conn, "SELECT DISPMEM FROM A_ROOMDTL_TBL WHERE ROOMID = ? AND USERID = ? ", [_roomid, userid]) 
		if (dataR.length == 0) throw new Error(ws.cons.MSG_NO_DATA + ' (roomid, userid)')
		param.data.dispmem = dataR[0].DISPMEM
		param.data.roomid = _roomid
		param.data.roomnm = JSON.parse(data[0].ROOMNM) // "{\"roomnm\":\"111\"~}" => {"roomnm":"111"~} : JSON.parse needed especially in android
		param.data.nicknm = _nicknm
		param.data.mainnm = data[0].MAINNM
		param.data.masterid = data[0].MASTERID
		param.data.receiverid = arrUseridSortedByUsernm
		param.data.receivernm = arrUsernmSortedByUsernm
		param.data.userkeys = userkeyArr
		socket.emit(ws.cons.sock_ev_common, param)
	} catch (ex) { //ws.sock.warn(null, socket, _logTitle, JSON.stringify(param), _roomid)
		ws.sock.warn(ws.cons.sock_ev_alert, socket, _logTitle, ex, _roomid)
	} finally {
		wsmysql.closeConn(conn, _logTitle)
	}
}

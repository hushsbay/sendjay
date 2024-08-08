const config = require('../config')
const nodeConfig = require(config.app.nodeConfig)
const ws = require(nodeConfig.app.ws)

module.exports = async function(socket, param) {
	const _logTitle = param.ev
	try {
		const userid = socket.userid
		const token = param.data.token //만기되지 않은 oldToken
		const tokenInfo = { userid : userid, token : token }
		console.log(ws.util.getCurDateTimeStr(true), 'refresh_token(m)========')
		const jwtRet = await ws.jwt.verify(tokenInfo)
		if (jwtRet.code != ws.cons.CODE_OK) throw new Error(jwtRet.code + '/' + jwtRet.msg)
		const newToken = ws.jwt.make({ userid : userid }) //새로 발급받은 newToken
		socket.usertoken = newToken
		param.data.newToken = newToken
		console.log(ws.util.getCurDateTimeStr(true), 'refresh_token(m)========newToken')
		socket.emit(ws.cons.sock_ev_common, param)
	} catch (ex) {
		ws.sock.warn(ws.cons.sock_ev_alert, socket, _logTitle, ex)
	}
}

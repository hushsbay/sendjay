const config = require('../config')
const nodeConfig = require(config.app.nodeConfig)
const ws = require(nodeConfig.app.ws)
const wsmysql = require(nodeConfig.app.wsmysql)

module.exports = {
    getEncrypt : (userid) => {
        return new Promise(async (resolve, reject) => {
            try {
                const _enc = ws.util.encrypt(userid, nodeConfig.crypto.key)
                resolve(_enc)
            } catch (ex) {
				reject(null)
			}
        })
    },
    getFromRepository : (userid) => {
		return new Promise(async (resolve, reject) => {
			let conn, sql, data, len
			try {
                conn = await wsmysql.getConnFromPool(global.pool)
                sql = "SELECT PWD FROM Z_USER_TBL WHERE USER_ID = ? "
                data = await wsmysql.query(conn, sql, [userid])
                if (data.length == 0) throw new Error()
                    console.log(userid, "$$$$")
                resolve(data[0].PWD) //암호화된 비번
			} catch (ex) {
				reject(null)
			} finally {
                wsmysql.closeConn(conn, 'pwd.getFromRepository')
            }
		})
	},
	verify : (userid, pwd, autologin) => {
		return new Promise(async (resolve, reject) => {
			let conn, sql, data, len
            const rs = ws.http.resInit()
			try {
                conn = await wsmysql.getConnFromPool(global.pool)
                sql = "SELECT PWD FROM Z_USER_TBL WHERE USER_ID = ? "
                data = await wsmysql.query(conn, sql, [userid])
                if (data.length == 0) {
                    rs.code = ws.cons.CODE_USERID_NOT_EXIST
                    rs.msg = '사용자아이디가 없습니다.'
                    resolve(rs)
                    return
                }
                let pwdToCompare
                if (autologin == 'Y') { //pwd는 앱에 저장된 암호화된 상태의 값이므로 pwdToCompare도 암호화된 값 그대로 비교 필요
                    pwdToCompare = data[0].PWD
                } else { //pwd는 암호화되지 않은 사용자 입력분 그대로이므로 pwdToCompare도 디코딩 필요
                    pwdToCompare = ws.util.decrypt(data[0].PWD, nodeConfig.crypto.key)
                }
                console.log(userid, pwd, pwdToCompare, autologin)
                if (pwd != pwdToCompare) { //pwd는 요청값인데 평문일 수도 암호화된 값일 수도 있음
                    rs.code = ws.cons.CODE_PWD_MISMATCH
                    rs.msg = '비번이 다릅니다.'
                    resolve(rs)
                    return
                }
                rs.PWD = data[0].PWD //암호화된 비번
                resolve(rs)
			} catch (ex) {
                rs.code = ws.cons.CODE_ERR
                rs.msg = ex.message
				reject(rs)
			} finally {
                wsmysql.closeConn(conn, 'pwd.verify')
            }
		})
	}
}

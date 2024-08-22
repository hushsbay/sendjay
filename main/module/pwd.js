const config = require('../config')
const nodeConfig = require(config.app.nodeConfig)
const ws = require(nodeConfig.app.ws)
const wsmysql = require(nodeConfig.app.wsmysql)

//굳이 별도의 pwd.js 파일로 분리한 이유는 각 기업의 사내 ERP등으로부터 인터페이스를 통해 조직/사용자 데이터 연동시
//각종 사용자 정보를 내려서 Z_USER_TBL에 담으면 되지만 암호화된 비번을 가져와서 저장,관리하는 것은 보안상 부담스러움

//Z_USER_TBL에 있는 사용자정보중에 IS_SYNC=Y값은 데이터 연동되어 가져온 데이터이고 그 외는 수동으로 입력한 데이터임
//- 수동 입력 데이터는 사내 ERP등과 연동하지 않으므로 자체 암호화된 비번을 저장하고 있음

//따라서, Github 소스를 내려 받아서 사내 ERP와 연동하지 않고 테스트 용도 등으로 그냥 사용한다면 아래 소스는 그대로 두면 되나
//사내 ERP등으로부터 인터페이스를 통해 조직/사용자 데이터 연동한다면 아래를 진행해야 함

//1. applyUser.js에 있는 아래 2가지 메소드 getEncrypt()와 getFromRepository()을 제거하고 그 값을 받는 PWD 필드값은 빈값으로 채우고
//2. 그 아래 verify()에서, 현재 Z_USER_TBL을 읽어서 비번을 검증하는 것을 사내 ERP 인증 모듈을 호출해서 인증결과 및 암호화된 비번을 받는 
//   루틴으로 변경하면 결론적으로, 비번을 Z_USER_TBL에 저장하지 않고 원본 Repository에 두고 핸들링이 가능해짐

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
                } //console.log(userid, pwd, pwdToCompare, autologin)
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

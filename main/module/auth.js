const config = require('../config')
const nodeConfig = require(config.app.nodeConfig)
const ws = require(nodeConfig.app.ws)
const wsmysql = require(nodeConfig.app.wsmysql)
const pwdModule = require('./pwd') //pwdModule은 여기 auth.js에서 코딩해도 문제없는데 굳이 별도의 pwd.js 파일로 분리한 이유는 pwd.js 파일내 주석(설명) 참조 요망

module.exports = {
	login : (uid, pwd, autologin, autokey_app, kind, req, res) => { //req, res는 web에서만 사용
		return new Promise(async (resolve, reject) => {
			let conn, sql, data, len, userid, webAuthenticated, encryptedPwd
            const rs = ws.http.resInit()
			try { //console.log('auth.login', uid, pwd, autologin, autokey_app, kind) //나중에 막기
                conn = await wsmysql.getConnFromPool(global.pool)
                if (kind == 'web') { //웹에서는 맨 처음 로그인시 uid,pwd가 넘어 오거나 이미 로그인 상태에서 쿠키(token,userid)가 넘어와 체크하면 됨
                    if (!uid) { //아이디가 없으므로 토큰 검증
                        const objToken = await ws.jwt.chkToken(req, res, conn) //res : 오류시 바로 클라이언트로 응답. conn : 사용자 조직정보 위변조체크
                        userid = objToken.userid
                        if (!userid) {
                            rs.code = objToken.code
                            rs.msg = objToken.msg
                            resolve(rs)
                            return
                        }
                        webAuthenticated = true		
                    } else { //웹 로그인 (원래부터 자동로그인은 없음)
                        userid = uid
                    }
                } else { //앱은 pwd가 항상 넘어와 아래에서 체크
                    userid = uid
                }		
                sql =  "SELECT USER_ID, PWD, USER_NM, ORG_CD, ORG_NM, TOP_ORG_CD, TOP_ORG_NM, NICK_NM, JOB, AB_CD, AB_NM, "
                sql += "       NOTI_OFF, BODY_OFF, SENDER_OFF, TM_FR, TM_TO, AUTOKEY_APP, IS_SYNC "
                sql += "  FROM Z_USER_TBL "
                sql += " WHERE USER_ID = ? "
                data = await wsmysql.query(conn, sql, [userid])
                if (data.length == 0) {
                    rs.code = ws.cons.CODE_USERID_NOT_EXIST
                    rs.msg = '사용자아이디가 없습니다.'
                    resolve(rs)
                    return
                }
                if (webAuthenticated) {
                    //위 토큰 인증을 신뢰하고 진행함
                } else {
                    if (data[0].IS_SYNC != 'Y') { //수동으로 아이디/비번을 만든 경우
                        encryptedPwd = data[0].PWD
                        let pwdToCompare
                        if (autologin == 'Y') { //pwd는 앱에 저장된 암호화된 상태의 값이므로 pwdToCompare도 암호화된 값 그대로 비교 필요
                            pwdToCompare = encryptedPwd
                        } else { //pwd는 암호화되지 않은 사용자 입력분 그대로이므로 pwdToCompare도 디코딩 필요
                            pwdToCompare = ws.util.decrypt(encryptedPwd, nodeConfig.crypto.key)
                        }
                        if (pwd != pwdToCompare) {
                            rs.code = ws.cons.CODE_PWD_MISMATCH
                            rs.msg = '비번이 다릅니다.'
                            resolve(rs)
                            return
                        }                        
                    } else { //외부시스템 인터페이스인 경우
                        console.log(userid, pwd, autologin, "=======")
                        const rsPwd = await pwdModule.verify(userid, pwd, autologin)
                        if (rsPwd.code != ws.cons.CODE_OK) {
                            rs.code = rsPwd.code
                            rs.msg = rsPwd.msg
                            resolve(rs)
                            return
                        }
                        encryptedPwd = rsPwd.PWD
                    }
                }
                if (autologin == 'Y' || webAuthenticated) { //앱자동로그인 또는 웹인증OK시 
                    if (autologin == 'Y') {
                        if (autokey_app != data[0].AUTOKEY_APP) {
                            rs.code = ws.cons.CODE_AUTOLOGIN_CANCEL
                            rs.msg = '(자동로그인 해제) 수동로그인이 필요합니다.'
                            return
                        }
                    } else {
                        //AUTOKEY_WEB은 관리안함
                    }
                } else {
                    if (kind == 'web') {
                        //AUTOKEY_WEB은 관리안함
                    } else {
                        sql = "UPDATE Z_USER_TBL SET AUTOKEY_APP = '" + autokey_app + "' WHERE USER_ID = ? "		
                    }
                    await wsmysql.query(conn, sql, [userid])
                    data[0].AUTOKEY_APP = autokey_app //순전히 앱에서 코딩이 불편해서 처리한 것임 //AUTOKEY_WEB은 관리안함
                }
                Object.assign(rs, data[0])
                if (kind == 'app') rs.PWD = encryptedPwd //앱에서는 암호화된 비번으로 자동로그인 처리
                rs.userid = userid
                resolve(rs)
			} catch (ex) {
                rs.code = ws.cons.CODE_ERR
                rs.msg = ex.message
				reject(rs)
			} finally {
                wsmysql.closeConn(conn, 'auth.login')
            }
		})
	}
}



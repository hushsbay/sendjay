const config = require('../config')
const nodeConfig = require(config.app.nodeConfig)
const ws = require(config.app.ws)
const wsmysql = require(config.app.wsmysql)
const wslogger = require(config.app.wslogger)(config.app.logPath, 'hushsbay')
const fs = require('fs')

global.nodeConfig = nodeConfig
global.logger = wslogger
global.pool = wsmysql.createPool(config.mysql.schema, true)

const TITLE = 'worker'
console.log('starting thread: ' + TITLE)

proc()
async function proc() {
    let conn, sql, data, _len
    try {
        conn = await wsmysql.getConnFromPool(global.pool)
        await wsmysql.txBegin(conn) //1) 파일 삭제
        sql = "SELECT MSGID, ROOMID, BODY "
        sql += " FROM A_MSGMST_TBL "
        sql += "WHERE TYP in ('file', 'flink') "
        sql += "  AND (FILESTATE < sysdate() OR STATE = 'D' OR STATE2 = 'C') " //만료되었거나 메시지가 삭제 또는 전송취소된 것도 물리적삭제 => 모두 만료로 표시
        sql += "  AND FILESTATE <> ? "
        data = await wsmysql.query(conn, sql, [ws.cons.file_expired])
        _len = data.length
        for (let i = 0; i < _len; i++) {
            const _msgid = data[i].MSGID
            const _roomid = data[i].ROOMID
            const _body = data[i].BODY //예) 20240210071920474000999934t0-cYE8g_E/oldclock/7인의 부활_wise banner$$20240527214223680240.jpg##37786
            const _filename = _body.split(ws.cons.deli)[0] //예) 20240210071920474000999934t0-cYE8g_E/oldclock/7인의 부활_wise banner$$20240527214223680240.jpg
            const _path = config.app.uploadPath + '/' + _filename
            await wsmysql.query(conn, "UPDATE A_MSGMST_TBL SET FILESTATE = ? WHERE MSGID = ? AND ROOMID = ? ", [ws.cons.file_expired, _msgid, _roomid]) 
            deleteFileAndRemoveEmptyFolderFromChild(_path, _filename, 'expiry')
        } //2) 가비지 파일 삭제 (파일업로드중 브라우저 닫기 등)
        //A_FILELOG_TBL에 insert하는 것은 proc_file.js인데 아래 로직에서 MSGMST에 있다는 것은 정상적으로 파일이 업로드되었다는 의미임
        sql = "SELECT MSGID, ROOMID, SENDERID, BODY FROM A_FILELOG_TBL WHERE UDT = '' AND CDT < DATE_ADD(sysdate(), INTERVAL ? HOUR) " //몇시간이 지나도 업로드완료 안된 것은 가비지로 간주
        data = await wsmysql.query(conn, sql, [ws.cons.max_hours_to_endure_upload])
        _len = data.length
        for (let i = 0; i < _len; i++) {
            const _msgid = data[i].MSGID
            const _roomid = data[i].ROOMID
            const _senderid= data[i].SENDERID
            const _filename = data[i].BODY
            const _path = config.app.uploadPath + '/' + _roomid + '/' + _senderid + "/" + _filename
            const sql2 = "SELECT COUNT(*) CNT FROM A_MSGMST_TBL WHERE MSGID = ? AND ROOMID = ? AND BODY LIKE '%" + _filename + "%' "
            const data2 = await wsmysql.query(conn, sql2, [_msgid, _roomid])
            await wsmysql.query(conn, "UPDATE A_FILELOG_TBL SET UDT = sysdate() WHERE MSGID = ? AND ROOMID = ? ", [_msgid, _roomid]) 
            if (data2[0].CNT >= 1) {
                //no garbage
            } else { //garbage : 제거해야 함
                //console.log(_filename+"$$$$$$$$$$")
                deleteFileAndRemoveEmptyFolderFromChild(_path, _filename, 'garbage')
            }
        }
        await wsmysql.txCommit(conn)
    } catch (ex) {
        if (conn) await wsmysql.txRollback(conn)
        global.logger.error(TITLE + ': error\n' + ex.stack)
    } finally {
        wsmysql.closeConn(conn, TITLE)
        setTimeout(() => { proc() }, 1000 * 60 * 5) //5 minutes
    }
}

function deleteFileAndRemoveEmptyFolderFromChild(_path, _filename, type) {
    //_path 예) config.app.uploadPath + 20240210071920474000999934t0-cYE8g_E/oldclock/7인의 부활_wise banner$$20240527214223680240.jpg
    //_filename 예) 20240210071920474000999934t0-cYE8g_E/oldclock/7인의 부활_wise banner$$20240527214223680240.jpg
    try {
        const stat = fs.statSync(_path)
        if (stat && stat.isFile()) { //console.log(TITLE + '@' + type + '@' + _path)
            fs.unlinkSync(_path)
            const pathObj = ws.util.getFileNameAndExtension(_path)
            if (ws.cons.sublink_ext_video.includes(pathObj.ext)) { //ffmpeg으로 생성된 확장자 파일도 삭제
                try {
                    const imgPath = _path + ws.cons.sublink_result_img
                    const stat = fs.statSync(imgPath)
                    if (stat && stat.isFile()) fs.unlinkSync(imgPath)
                } catch (ex2) { //Error: ENOENT: no such file or directory => 무시하고 넘어감
                    const _msg = ex2.message.includes('ENOENT') ? 'not found' : ex2.message
                    console.log(TITLE + ': error2(' + type + ') ' + imgPath + ': ' + _msg)        
                }
            }
            const arr = _filename.split('/')
            const brr = []
            for (let i = 0; i < arr.length - 1; i++) { //맨 아래부터 폴더마다 파일이나 하위폴더가 없으면 해당 폴더도 삭제해야 함
                if (i == 0) {
                    brr.push(arr[i]) //20240210071920474000999934t0-cYE8g_E
                } else {
                    brr.push(brr.join('/') + '/' + arr[i]) //20240210071920474000999934t0-cYE8g_E/oldclock
                } //console.log("brr===>"+brr[brr.length-1])
            }
            for (let j = brr.length - 1; j >= 0; j--) {
                const files = fs.readdirSync(config.app.uploadPath + '/' + brr[j])
                if (!files.length) fs.rmdirSync(config.app.uploadPath + '/' + brr[j])
            }
        }
    } catch (ex) { //Error: ENOENT: no such file or directory => 무시하고 넘어감
        const _msg = ex.message.includes('ENOENT') ? 'not found' : ex.message
        console.log(TITLE + ' error1(' + type + ') ' + _path + ': ' + _msg)
    }
}

ws.util.watchProcessError()
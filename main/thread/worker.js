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
        await wsmysql.txBegin(conn) //1) delete files to be expired 
        //sql = "SELECT MSGID, ROOMID, BODY FROM A_MSGMST_TBL WHERE TYP in ('file', 'flink') AND FILESTATE < sysdate() AND FILESTATE <> ? AND BODY <> ? "
        sql = "SELECT MSGID, ROOMID, BODY FROM A_MSGMST_TBL WHERE TYP in ('file', 'flink') AND FILESTATE < '2024-01-01' AND FILESTATE <> ? AND BODY <> ? "
        data = await wsmysql.query(conn, sql, [ws.cons.file_expired, ws.cons.cell_revoked])
        _len = data.length
        for (let i = 0; i < _len; i++) {
            const _msgid = data[i].MSGID
            const _roomid = data[i].ROOMID
            const _body = data[i].BODY
            const _filename = _body.split(ws.cons.deli)[0]
            const _path = config.app.uploadPath + '/' + _filename
            await wsmysql.query(conn, "UPDATE A_MSGMST_TBL SET FILESTATE = ? WHERE MSGID = ? AND ROOMID = ? ", [ws.cons.file_expired, _msgid, _roomid]) 
            deleteFileAndRemoveEmptyFolderFromChild(_path, _filename, 'expiry')
        } //2) remove garbage files (when browser closing, when aborted ..)
        sql = "SELECT MSGID, ROOMID, SENDERID, BODY FROM A_FILELOG_TBL WHERE UDT = '' AND CDT < DATE_ADD(sysdate(), INTERVAL -24 HOUR) "
        data = await wsmysql.query(conn, sql, null)
        _len = data.length
        for (let i = 0; i < _len; i++) {
            const _msgid = data1[i].MSGID
            const _roomid = data1[i].ROOMID
            const _senderid= data1[i].SENDERID
            const _filename = data1[i].BODY
            const _path = config.app.uploadPath + '/' + _roomid + '/' + _senderid + "/" + _filename
            const sql2 = "SELECT COUNT(*) CNT FROM A_MSGMST_TBL WHERE MSGID = ? AND ROOMID = ? AND BODY LIKE '%" + _filename + "%' "
            const data2 = await wsmysql.query(conn, sql2, [_msgid, _roomid])
            await wsmysql.query(conn, "UPDATE A_MSGMST_TBL SET UDT = sysdate() WHERE MSGID = ? AND ROOMID = ? ", [_msgid, _roomid]) 
            if (data2[0].CNT == 1) continue //no garbage 
            deleteFileAndRemoveEmptyFolderFromChild(_path, _filename, 'garbage')
        }
        await wsmysql.txCommit(conn)
    } catch (ex) {
        if (conn) await wsmysql.txRollback(conn)
        global.logger.error(TITLE + ': error\n' + ex.stack)
    } finally {
        wsmysql.closeConn(conn, TITLE)
        setTimeout(() => { proc() }, 5000) //Test
    }
}

function deleteFileAndRemoveEmptyFolderFromChild(_path, _filename, type) {
    try {
        const stat = fs.statSync(_path)
        if (stat && stat.isFile()) { 
            console.log(TITLE + ': ' + type + ': ' + _path)
            fs.unlinkSync(_path)
            const pathObj = ws.util.getFileNameAndExtension(_path)
            if (ws.cons.sublink_ext_video.includes(pathObj.ext)) { //related with ffmpeg (streaming)
                try {
                    const imgPath = _path + ws.cons.sublink_result_img
                    const stat = fs.statSync(imgPath)
                    if (stat && stat.isFile()) fs.unlinkSync(imgPath)
                } catch (ex2) { //Almost => Error: ENOENT: no such file or directory => it's ok to be ignored
                    const _msg = ex2.message.includes('ENOENT') ? 'not found' : ex2.message
                    console.log(TITLE + ': error2: ' + type + ': ' + imgPath + ': ' + _msg)        
                }
            } 
            const arr = _filename.split('/')
            const brr = []
            for (let i = 0; i < arr.length - 1; i++) { //(arr.length - 1) is filename
                if (i == 0) {
                    brr.push(arr[i])
                } else {
                    brr.push(brr.join('/') + '/' + arr[i])
                }
            }
            for (let j = brr.length - 1; j >= 0; j--) { //remove empty folder from child
                const files = fs.readdirSync(config.app.uploadPath + '/' + brr[j])
                if (!files.length) fs.rmdirSync(config.app.uploadPath + '/' + brr[j])
            }
        }
    } catch (ex) { //Almost => Error: ENOENT: no such file or directory => it's ok to be ignored
        const _msg = ex.message.includes('ENOENT') ? 'not found' : ex.message
        console.log(TITLE + ': error1: ' + type + ': ' + _path + ': ' + _msg)
    }
}

ws.util.watchProcessError()
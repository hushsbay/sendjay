const config = require('../config')
const nodeConfig = require(config.app.nodeConfig)
const ws = require(nodeConfig.app.ws)
const { parentPort } = require('worker_threads')

//미사용 - 오래된 코딩 (just 참고용)

ws.util.addGlobal({ logPath: config.app.logPath, dirName: __dirname }, nodeConfig)

const TITLE = 'worker02'
console.log('starting thread: ' + TITLE)

proc()
async function proc() {
    try {
        parentPort.postMessage({ ev : 'chk_sockets_rooms' })
    } catch (ex) {
        global.logger.error(TITLE + ': error: ', ex.stack)
    } finally {
        setTimeout(() => { proc() }, 1000 * 60) //1 minute
    }
}

ws.util.watchProcessError()
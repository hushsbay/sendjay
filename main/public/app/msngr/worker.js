//used as dedicated worker : debugger, console.log supported. DOM, anonymous function.. are not supported.
//jQuery is not defined
//w_winid는 브라우저의 각 윈도우(탭)의 유니크한 ID이며 Redis에도 저장, 사용됨
//BroadcastChannel로 메신저 구동 경합을 대체해보려 검토하다가 더 복잡하기만 해서 기존의 indexedDB + worker로 구현하기로 함
//g_chan = new BroadcastChannel("hushsbay") //브라우저 시크릿 모드에서는 작동하지 않음 (참고)
let w_cnt = 0, w_winid
const SEC = 3 //10

//////////////////////////////////////////start handling IndexedDB
const DATABASE = "jay", TBL = "winner", ONE_KEY = "just_one" //only 1 table & 1 record handled
let db //field(id, winid, udt), protocol(winid, code, msg);

//##31 아래에서 onupgradeneeded는 indexedDB.open시 항상 수행되는지는 않을 것인데 최초 또는 개발자가 업그레이드한 경우만 수행될 것이나
//하여튼, 최초 실행시에는 반드시 onupgradeneeded가 발생하고 그 뒤에 onsuccess도 같이 발생함
//따라서, 이 두개의 이벤트를 구분하지 않고 코딩하면 callback안에서 중요한 의미의 실행이 두번 처리되는 것을 의미하므로 반드시 구분해야 함
let conn = indexedDB.open(DATABASE, 1) //Increment will trigger conn.onupgradeneeded (add version number if upgrade needed)
conn.onerror = function() {	
    console.log("indexedDB connect error: " + conn.errorCode) 
    postMessage({ code : "idb_conn_err", msg : "indexedDB connect error: " + conn.errorCode })
}
conn.onupgradeneeded = function(e) {
	db = e.target.result //define field
	const os = (db.objectStoreNames.contains(TBL)) ? e.target.transaction.objectStore(TBL) : db.createObjectStore(TBL, { keyPath: "id" }) 			
	if (!os.indexNames.contains("winid")) os.createIndex("winid", "winid", { unique : false })
	if (!os.indexNames.contains("udt")) os.createIndex("udt", "udt", { unique : false })
	os.transaction.oncomplete = function(e) { 
        const _msg = "idb_upgraded"
        console.log(_msg) 
        postMessage({ code : _msg, msg : _msg })
    }
}
conn.onsuccess = function(e) {
    db = conn.result
    const _msg = "idb_connected"
    console.log(_msg) 
    postMessage({ code : _msg, msg : _msg })
}
//////////////////////////////////////////end

onmessage = function(e) { //console.log(e.data.msg+"@@@@"+e.data.code) 
    w_winid = e.data.msg
    if (e.data.code == "auto") {        
        competeWinner() //자동으로 백그라운드로 임베디드되는 것이므로 어느 브라우저탭이 위너가 될 지 경합해서 하나가 위너가 됨 
    } else if (e.data.code == "manual") {
        setWinner() //사용자가 클릭해서 실행할 때는 경합할 이유없이 본인이 위너가 되면 돔
    }
}

function competeWinner() {
    try {
        let isWinner = false
        let udt = getCurDateTimeStr()
        w_winid = w_winid ? w_winid : udt //20200817153202xxx
        udt = udt.substring(0, 0 + 14) //udt.substr(0, 14) //20200817153202
        const tx = db.transaction(TBL, "readwrite")
        const os = tx.objectStore(TBL)
        const os_req = os.get(ONE_KEY) //record is only one
        os_req.onsuccess = function(e) {
            const rec = os_req.result //only 1 record returned
            if (!rec) {
                const add_req = os.add({ id : ONE_KEY, winid : w_winid, udt : udt })
                add_req.onsuccess = function() {
                    isWinner = true
                }
                add_req.onerror = function(e) {
                    const _msg = "competeWinner: add_req error: " + e.srcElement.error
                    console.log(_msg)
                    postMessage({ code : "competeWinner_err", msg : _msg })
                }
            } else {
                if (rec.winid == w_winid) {
                    rec.udt = udt
                    const up_req = os.put(rec)
                    up_req.onsuccess = function() {
                        isWinner = true
                    }
                    up_req.onerror = function(e) {
                        const _msg = "competeWinner: up_req error: " + e.srcElement.error
                        console.log(_msg)
                        postMessage({ code : "competeWinner_err", msg : _msg })
                    }
                } else {
                    const _diff = getDateTimeDiff(rec.udt, new Date()) //console.log(_diff+"===="+SEC)
                    if (_diff > SEC) { //if (_diff > (SEC * 2)) {
                        rec.winid = w_winid //Old w_winid가 업데이트 안되는 미사용분이므로 점유함
                        rec.udt = udt
                        const up_req1 = os.put(rec)
                        up_req1.onsuccess = function() {
                            isWinner = true
                        }
                        up_req1.onerror = function(e) {
                            const _msg = "competeWinner: up_req1 error: " + e.srcElement.error
                            console.log(_msg)
                            postMessage({ code : "competeWinner_err", msg : _msg })
                        }
                    }
                }			
            }
        }
        os_req.onerror = function(e) {
            const _msg = "competeWinner: os_req error: " + e.srcElement.error
            console.log(_msg)
            postMessage({ code : "competeWinner_err", msg : _msg })
        }
        tx.oncomplete = function() {
            if (isWinner) {
                postMessage({ code : "winner", msg : "competeWinner: became winner: " + w_cnt, winid : w_winid })
            } else {
                postMessage({ code : "0", msg : "competeWinner: competing to be winner: " + w_cnt, winid : w_winid })
            }
            w_cnt += 1
            setTimeout(function() { competeWinner() }, SEC * 1000)            
        }  
    } catch (ex) {
        console.log(ex.toString()) 
        postMessage({ code : "competeWinner_err", msg : ex.message })
        return
    }
    
}

function setWinner() {
    try {
        let udt = getCurDateTimeStr()
        udt = udt.substring(0, 0 + 14) //udt.substr(0, 14) //20200817153202
        const tx = db.transaction(TBL, "readwrite")
        const os = tx.objectStore(TBL)
        const os_req = os.get(ONE_KEY) //record is only one
        os_req.onsuccess = function(e) {
            const rec = os_req.result //only 1 record returned
            if (!rec) {
                const add_req = os.add({ id : ONE_KEY, winid : w_winid, udt : udt })
                add_req.onerror = function(e) {
                    const _msg = "setWinner: add_req error: " + e.srcElement.error
                    console.log(_msg)
                    postMessage({ code : "setWinner_err", msg : _msg })
                }
            } else {
                rec.winid = w_winid
                rec.udt = udt
                const up_req = os.put(rec)
                up_req.onerror = function(e) {
                    const _msg = "setWinner: up_req error: " + e.srcElement.error
                    console.log(_msg)
                    postMessage({ code : "setWinner_err", msg : _msg })
                }
            }
        }
        os_req.onerror = function(e) {
            const _msg = "setWinner: os_req error: " + e.srcElement.error
            console.log(_msg)
            postMessage({ code : "setWinner_err", msg : _msg })
        }
        tx.oncomplete = function() {
            postMessage({ code : "winner", msg : "setWinner: checked as winner: " + w_cnt, winid : w_winid })
            w_cnt += 1
            setTimeout(function() { competeWinner() }, SEC * 1000) //not setWinner()
        }  
    } catch (ex) {
        console.log(ex.toString()) 
        postMessage({ code : "setWinner_err", msg : ex.message })
        return
    }
    
}

function getCurDateTimeStr() {
    const now = new Date()
    return now.getFullYear().toString() + (now.getMonth() + 1).toString().padStart(2, "0") + now.getDate().toString().padStart(2, "0") + 
           now.getHours().toString().padStart(2, "0") + now.getMinutes().toString().padStart(2, "0") + now.getSeconds().toString().padStart(2, "0") +
           now.getMilliseconds().toString()
}

function getTimeStamp(str) { //str = 2012-08-02 14:12:04
    var d = str.match(/\d+/g) //extract date parts
    return new Date(d[0], d[1] - 1, d[2], d[3], d[4], d[5]);
}

function getDateTimeDiff(_prev, _now) {
    //const udt = _prev.substr(0, 4) + "-" + _prev.substr(4, 2) + "-" + _prev.substr(6, 2) + " " + _prev.substr(8, 2) + ":" + _prev.substr(10, 2) + ":" + _prev.substr(12, 2)
    const udt = _prev.substring(0, 0 + 4) + "-" + _prev.substring(4, 4 + 2) + "-" + _prev.substring(6, 6 + 2) + " " + 
                _prev.substring(8, 8 + 2) + ":" + _prev.substring(10, 10 + 2) + ":" + _prev.substring(12, 12 + 2)
    var dtPrev = getTimeStamp(udt)
    return parseInt((_now - dtPrev) / 1000) //return seconds
}
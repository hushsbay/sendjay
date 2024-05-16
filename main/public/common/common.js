(function($) {
    document.oncontextmenu = new Function("return false")
    const _warn_blank = " 필드가 빈값입니다."
    window.hush = {
        cons : {
            CODE_OK : '0',
            MSG_OK : '처리 완료',
            CODE_ERR : '-1',
            CODE_NO_DATA : '-100',
            MSG_NO_DATA : '데이터가 없습니다.',
            MSG_NO_MORE_DATA : '더 이상 데이터가 없습니다.',
            NETWORK_UNAVAILABLE : '네트워크가 연결되어 있지 않습니다.',
            NETWORK_UNSTABLE : '네트워크가 원할하지 않거나 서버 작업중입니다.',
            toast_prefix : "##$$", 
            ///////////////////////////////////위는 서버와 동일
            erp_portal : "index.html",
            failOnLoad : "failOnLoad",
            restful_timeout : 8000, //실제로는 1~2초정도의 시간이 추가 소요되는 경험상 8초 정도로 설정해 10초 느낌이 나게 함
            pattern : /^[A-Za-z0-9!@#$=]*$/, //들어있는 항목 이외는 사용 금지
            color_fadein : "#b2e2f8",
            ext_image : "png,gif,jpg,jpeg,ico",
            max_image : 5242880, //5MB
            warn_blank : _warn_blank,
            warn_search_blank : "검색어" + _warn_blank,
            warn_no_row_selected : "선택한 행이 없습니다.",
            warn_no_opener : "opener가 존재하지 않습니다.",
            warn_char_not_allowed : "영문,숫자,!@#$=만 사용할 수 있습니다.", //비번 및 아이디 등 고려
            warn_need_one_row_selected : "One row should be selected.",
            //////////////////////////////////아래는 메신저 관련 : 3050(web ops),3051(mobile ops) and 3060(web dev),3061(mobile dev)
            title : "sendjay",
            app : "/app/msngr/main.html", //web messenger's location.pathname
            logo_darkblue : "/img/hushsbay.png",
            img_noperson : "/img/noperson.png",
            socket_url : location.hostname + ':3050/jay', //jay는 socket.io namespace
            w_key : 'W__', //Web userkey
            m_key : 'M__', //Mobile userkey
            prefix : '$$', //for redis, socket
            deli : "##",
            subdeli : "$$",
            indeli : "','", //use this for sql where in clause
            easydeli : ";", //use this for absolutely safe place
            memdeli : " / ",
            deli_key : "__", //for setUser()
            idb_tbl : "msngr", //indexedDB
            sock_ev_connect : 'connect',
            sock_ev_mark_as_connect : 'mark_as_connect',
            sock_ev_disconnect : "disconnect",
            sock_ev_alert : 'alert',
			sock_ev_toast : 'toast',			
			sock_ev_common : 'common', //Belows are handled in this sock_ev_common event.
			sock_ev_chk_alive : 'chk_alive',
			sock_ev_show_off : 'show_off',
			sock_ev_show_on : 'show_on',
			sock_ev_create_room : 'create_room',
			sock_ev_open_room : 'open_room',
			sock_ev_qry_msglist : 'qry_msglist',
			sock_ev_send_msg : 'send_msg',
			sock_ev_read_msg : 'read_msg', 
			sock_ev_qry_msgcell : 'qry_msgcell', 
			sock_ev_revoke_msgcell : 'revoke_msgcell',
			sock_ev_delete_msg : 'delete_msg',
			sock_ev_invite_user : 'invite_user',
			sock_ev_rename_room : 'rename_room',
			sock_ev_set_env : 'set_env',
			sock_ev_chk_typing : 'chk_typing',
			sock_ev_cut_mobile : 'cut_mobile',
            sock_ev_chk_roomfocus : 'chk_roomfocus',
            tz_seoul : "Asia/Seoul", //for korean
            fetch_cnt_list : 100, //At least, this should be the count which exceeds minimum rows with y-scroll .
            fetch_cnt : 100, //At least, this should be the count which exceeds minimum rows with y-scroll.
            fetch_first_cnt : 15, //At least, this should be the count which exceeds minimum rows with y-scroll.
            fetch_cnt_oneshot : 10000, //like search result
            sec_for_webview_func : 100,
            max_member_for_org : 16, //temporary. same as server's
            max_filecount : 5, //uploading files
            max_filesize : 10000000000,//about 10GB
            max_picture_size : 5242880, //5MB
            max_nicknm_len : 100, //same as server's
            max_msg_len : 4000, //bytes. check body field length same as server's
            max_size_to_sublink : 5242880, //5MB. same as server's
            unread_max_check : 1000,
            max_add_count : 100, //when connect after disconnect
            send_timeout_sec : 5,
            result_bgcolor : 'orange', 
            result_highlight : 'yellow',
            chat_handled : "file,flink,image,talk",
            cell_revoked : "message cancelled",
            file_expired : "expired", 
            sublink_ext_image : "png,gif,jpg,jpeg,ico",
            sublink_ext_video : "mp4", //file format which supports html5 streaming
            handling : ".. ", //handling..
            no_response : "no response",
            retry_sending : "retry sending",
            sending_failure : "check failure",
            left : " left this room",
            param_webview_and : "webview=and",
            param_webview_ios : "webview=ios",
        },
        socket : null,
        tz : Intl.DateTimeFormat().resolvedOptions().timeZone, //eg) Asia/Seoul, America/Toronto
        user : null,
        ////////////////////////////////////////////////////////////////////////////////////////
        auth : {
            setCookieForUser : (rs, _persist) => { //token은 서버 쿠키+응답본문으로 자동으로 내려옴
                const persist = (_persist == true) ? true : false
                hush.http.setCookie("token", rs.token)
                hush.http.setCookie("userid", rs.USER_ID || rs.userid, persist) //persistent cookie - _persist는 아이디를 화면에 저장할 지에만 사용
                hush.http.setCookie("usernm", rs.USER_NM || rs.usernm) //모바일에서 소문자 붙여서 넘어옴 (이하 동일)
                hush.http.setCookie("orgcd", rs.ORG_CD || rs.orgcd)
                hush.http.setCookie("orgnm", rs.ORG_NM || rs.orgnm)
                hush.http.setCookie("toporgcd", rs.TOP_ORG_CD || rs.toporgcd)
                hush.http.setCookie("toporgnm", rs.TOP_ORG_NM || rs.toporgnm)
            }, //위 아래 함수는 verifyUser() in common.js와 앱의 UserInfo 클래스내 항목과 같아야 함
            deleteCookieForUser : () => {
                hush.http.deleteCookie('token')
                //hush.http.deleteCookie('userid')
                hush.http.deleteCookie('usernm')
                hush.http.deleteCookie('orgcd')
                hush.http.deleteCookie('orgnm')
                hush.http.deleteCookie('toporgcd')
                hush.http.deleteCookie('toporgnm')
            },
            setUser : (_token) => { //바로 아래와 index.html에서 사용됨
                const token = _token ? _token : hush.http.getCookie("token")
                const _id = hush.http.getCookie("userid")
                const _nm = hush.http.getCookie("usernm")
                const _orgcd = hush.http.getCookie("orgcd")
                const _orgnm = hush.http.getCookie("orgnm")
                const _toporgcd = hush.http.getCookie("toporgcd")
                const _toporgnm = hush.http.getCookie("toporgnm")
                hush.user = { 
                    token : token, id : _id, key : (hush.webview.on ? hush.cons.m_key : hush.cons.w_key) + _id, 
                    nm : _nm, orgcd : _orgcd, orgnm : _orgnm, toporgcd : _toporgcd, toporgnm : _toporgnm 
                }
            },
            verifyUser : async (verbose) => { //index.html 제외한 나머지에서 사용됨
                let rs
                const _token = hush.http.getCookie("token")  
                if (_token) {
                    rs = await hush.http.ajax("/auth/login")
                    if (rs.code != hush.cons.CODE_OK) {
                        if (verbose) {
                            await hush.msg.alert(rs.msg + "<br>로그인이 필요합니다.")
                        } else {
                            if (rs.code.startsWith("-8")) {
                                await hush.msg.alert(rs.msg + "<br>로그인 페이지로 이동합니다.")
                                const _target = encodeURIComponent(location.pathname + location.search)
                                hush.util.openWinTab("/app/auth/login.html?target=" + _target, true)
                            } else {
                                hush.msg.msg(rs.msg)
                            }  
                        }
                        return null                      
                    }
                } else {
                    if (verbose) {
                        await hush.msg.alert("로그인이 필요합니다.")
                    } else {
                        const _target = encodeURIComponent(location.pathname + location.search)
                        hush.util.openWinTab("/app/auth/login.html?target=" + _target, true)
                    }
                    return null
                }
                hush.auth.setUser(_token)
                return rs
            },             
        },
        blob : { //브라우저에서 이미지 파일 선택후 노드서버에 올리고 다시 내려 표시하는 등 처리는 2가지 방법이 있음 => 1) blob 2) base64인코딩스트링
            getUrlForFile : (file, returnBlob, callback) => {
                const reader = new FileReader()
                if (returnBlob) {
                    reader.onload = function(e) {
                        const blob = new Blob([new Uint8Array(e.target.result)], {type: file.type })
                        const blobUrl = URL.createObjectURL(blob)
                        callback(blobUrl) //blob:https://hushsbay.com/512bc969-441c-4019-8ba9-478a478b2cfd
                    }
                    reader.readAsArrayBuffer(file)
                } else { //base64 인코딩된 스트링 데이터로 리턴
                    reader.readAsDataURL(file)
                    reader.addEventListener("load", function () {
                        callback(reader.result) //data:image/png;base64,~
                    })
                }
            },
            get : async (url) => { //get(getPromise)도 <img>의 src url이 blob이든 base64든 관계없이 blob 데이터 리턴해서 서버로 보낼 준비를 함
                try {
                    const rs = await hush.blob.getPromise(url)               
                    return rs
                } catch (ex) {
                    throw ex //new Error(ex.message)
                }
            },
            getPromise : (url) => new Promise((resolve, reject) => {
                const xhr = new XMLHttpRequest()
                xhr.open("GET", url, true) //url might be 1) blob or 2) base64 string
                xhr.responseType = "blob"
                xhr.onload = function(e) {
                    if (this.status == 200) {
                        resolve(this.response)
                    } else {
                        debugger //e로 오류 핸들링 가능한지 알아봐야 함
                        reject(new Error(this.status + " / getBlob 오류입니다."))
                    }
                }
                xhr.send()
            }),
            //1) blob을 이용해 처리
            getBlobUrlForImage : (buffer, mimetype) => {
                const _mimetype = (mimetype) ? mimetype : "image/png"
                const uInt8Array = new Uint8Array(buffer)
                const blob = new Blob([uInt8Array], { type: _mimetype })
                const blobUrl = URL.createObjectURL(blob)
                return blobUrl //blob:https://hushsbay.com/f4cb83ea-5d46-40b7-8baa-ba62dca2ffca
            },
            //2) base64인코딩스트링
            setDataUrl : (base64, mimetype) => { //base64는 노드 서버에서 Buffer.from(data[0].PICTURE, 'binary').toString('base64')로 처리된 것을 전제로 함
                const dataUrl = "data:" + mimetype + ";base64," + base64
				return dataUrl
            },
            ////////////////////////////////////////////////////////////////////////////////////////
            parseDataUrl : (objUrl) => { //eg) data:image/png;base64,~
                let _ret = { mimetype : "", body : "" }
                var _header = objUrl.split(";base64,")
                if (_header.length == 2) {
                    const _data = _header[0].split(":")
                    if (_data[0] == "data") {
                        _ret.mimetype = _data[1] //eg) image/png
                        _ret.body = _header[1]
                    } else {
                        _ret = null
                    }
                } else {
                    _ret = null
                }
                return _ret
            },
        },
        http : {
            chkOnline : (verbose) => { //소켓과 ajax 모두 적용
                if (navigator.onLine) return true
                if (verbose == "none") {
                    //반복적으로 호출인 경우 아무런 오류메시지 안보여줘야 할 때가 있을 때 사용
                } else if (verbose == "alert") {
                    hush.msg.alert(hush.cons.NETWORK_UNAVAILABLE)
                } else {
                    hush.msg.toast(hush.cons.NETWORK_UNAVAILABLE, 3)
                }
                return false
            },
            handleNoCache : (url) => {
                let _url = url
                if (!_url.includes("nocache=")) _url += (_url.includes("?") ? "&" : "?") + "nocache=" + hush.util.getRnd()
                return _url
            },
            ajaxCall : (url, _data, callback, failCallback, method) => {
                let data = _data //Object.assign(data, { tokenInfo : hush.http.getTokenInfo()})
                $.ajax({dataType : "json", //response data type
                    contentType : "application/json; charset=utf-8", //request mime type
                    url : url,
                    data: (method && method.toLowerCase() == "get") ? data : JSON.stringify(data),
                    cache : false,
                    async : true,
                    type : (method) ? method : "post",
                    timeout : hush.cons.restful_timeout,
                    success : function(rs) { //if (rs.token) hush.http.refreshToken(rs.token) //모바일앱 등 고려해서 편의상 쿠키로 처리하지 않음
                        if (callback) callback(rs)
                    },
                    error : function(xhr, status, error) {
                        const msg = (typeof error == "string") ? error : error.toString()
                        if (failCallback == false) {
                            //skip (like getting image)
                        } else if (failCallback) {
                            failCallback(msg)
                        } else {
                            hush.util.showEx(msg)
                        }
                    }
                })
            },
            ajax : async (url, data, noToast, method) => {
                try {
                    if (!navigator.onLine) throw new Error(hush.cons.NETWORK_UNAVAILABLE)
                    if (!noToast) hush.msg.toast("waiting..", -1)
                    const rs = await hush.http.ajaxPromise(url, data, method)               
                    if (!noToast) hush.msg.toastEnd()                    
                    return rs
                } catch (ex) {
                    if (!noToast) hush.msg.toastEnd()
                    throw ex //new Error(ex.message)
                }
            },
            ajaxPromise : (url, _data, method) => new Promise((resolve, reject) => { //ajaxPromise()는 hush.http.ajax를 통해서만 사용하기
                let data = _data //Object.assign(data, { tokenInfo : hush.http.getTokenInfo()})
                $.ajax({dataType : "json", //response data type
                    contentType : "application/json; charset=utf-8", //request mime type
                    url : url,
                    data: (method && method.toLowerCase() == "get") ? data : JSON.stringify(data),
                    cache : false,
                    async : true,
                    type : (method) ? method : "post",
                    timeout : hush.cons.restful_timeout,
                    success : function(rs) { //if (rs.token) hush.http.refreshToken(rs.token) //모바일앱 등 고려해서 편의상 쿠키로 처리하지 않음
                        resolve(rs)
                    },
                    error : function(xhr, status, error) {
                        //"Uncaught (in promise) Error" => status=error, error=""
                        //When done().fail(), "Uncaught (in promise) Error: error" returned
                        const msg = (typeof error == "string") ? error : error.toString()
                        reject(new Error(msg))
                    }
                })
            }),
            ajaxFormData : (url, _data, callback, failCallback) => {
                let data = _data //data.append("tokenInfo", JSON.stringify(hush.http.getTokenInfo()))
                $.ajax({url : url,
                    data : data,
                    processData : false,
                    enctype : "multipart/form-data",
                    contentType : false,
                    cache : false,
                    type : "POST",
                    success : function(rs) { //if (rs.token) hush.http.refreshToken(rs.token) //모바일앱 등 고려해서 편의상 쿠키로 처리하지 않음
                        if (callback) callback(rs)
                    },
                    error : function(xhr, status, error) {
                        const msg = (typeof error == "string") ? error : error.toString()
                        if (failCallback == false) {
                            //skip (like getting image)
                        } else if (failCallback) {
                            failCallback(msg)
                        } else {
                            hush.util.showEx(msg)
                        }
                    }
                })
            },
            getCookie : (name) => { //cookie 처리는 jquery.cookie.js 참조
                return $.cookie(name)
            },
            setCookie : (name, value, persist) => {
                if (persist) {
                    $.cookie(name, value, { expires: 365, path: '/' })
                } else {
                    $.cookie(name, value, { path: '/' }) //session cookie
                }
            },
            deleteCookie : (name) => { //actually 'return' needed
                $.removeCookie(name, { path: '/' })
            },
            fileDownload : (_path, msgid) => {
                let _fileUrl
                if ($("#ifr").length > 0) $("#ifr").remove()
                if (_path == "imagetofile") {
                    _fileUrl = "/msngr/get_msginfo?type=" + _path + "&msgid=" + msgid + "&suffix=" + hush.util.getCurDateTimeStr(false, true) //suffix used in mobile app
                } else {
                    _fileUrl = "/msngr/proc_file/" + decodeURIComponent(_path) + "?msgid=" + msgid
                }
                $("<iframe id=ifr src='" + _fileUrl + "' style='display:none;width:0px;height:0px;' />").appendTo("body") 
                hush.msg.toast("downloading..")
            },
            getUserPic : (user_id, tag_id) => {
                if ($("#" + tag_id).attr("downloaded") == "Y") return
                hush.http.ajaxCall("/user/getuser", { id : user_id, imgOnly : "Y" }, function(rs) {
                    if (rs.code != hush.cons.CODE_OK) return
                    const _len = rs.list.length
                    $("#" + tag_id).attr("downloaded", "Y")
                    if (_len == 0) return
                    const row = rs.list[0]
                    if (row.PICTURE) { //common.js참조 : 노드에서 MySql에 저장된 PICTURE(longblob)값 내리기 (2가지 방법 - 육안으로는 속도 차이 안남)
                        //const url = hush.blob.setDataUrl(rs.picture, row.MIMETYPE) //방법2) base64로 변환해 내림 (사용시 서버에서도 코딩 변경 필요) + getUrlForFile() false 설정 + 서버 코딩 변경
                        const url = hush.blob.getBlobUrlForImage(row.PICTURE.data, row.MIMETYPE) //방법1) 특별히 변환하지 않고 그냥 blob으로 내림 + getUrlForFile() true 설정 + 서버 코딩 변경
                        $("#" + tag_id).attr("src", url)
                    } else {
                        $("#" + tag_id).attr("src", hush.cons.img_noperson)
                    }
                })
            }
        },
        idb : { //for mobile only
            db : null, 
            connect : (callback) => {
                if (!hush.idb.db) {
                    let conn = indexedDB.open("jay_mobile", 1) //Increment will trigger conn.onupgradeneeded (add version number if upgrade needed)
                    conn.onerror = function() {	
                        debugger
                        if (callback) callback({ code : "idb_conn_err", msg : "IndexedDB connect error: " + conn.errorCode })
                    }
                    conn.onupgradeneeded = function(e) { //field(roomid, msgid, body, sent, cdt)
                        hush.idb.db = e.target.result
                        let os
                        if (hush.idb.db.objectStoreNames.contains(hush.cons.idb_tbl)) {
                            os = e.target.transaction.objectStore(hush.cons.idb_tbl)
                        } else {
                            os = hush.idb.db.createObjectStore(hush.cons.idb_tbl, { keyPath: "msgid" })
                        }
                        if (!os.indexNames.contains("roomid")) os.createIndex("roomid", "roomid", { unique : false }) //index 'roomid_cdt' failed to handle cursor
                        os.transaction.oncomplete = function(e) { 
                            if (callback) callback({ code : hush.cons.result_ok, msg : "IndexedDB upgraded" })
                        }
                    }
                    conn.onsuccess = function(e) {
                        hush.idb.db = conn.result
                        if (callback) callback({ code : hush.cons.result_ok, msg : "IndexedDB connected" })
                    }
                }
            }
        },
        msg : { //1. msg(비동기콜백) 2. alert(=window.alert) 3. confirm(=window.confirm) 4. toast(복수메시지 순서대로 표시 지원)
            //아래 실행후 육안으로 먼저 보이는 순서는 = 1 > 2 > 3 > 5 > 6 > 7 > 4 
            // hush.msg.toast("1")
            // hush.msg.toast("2")
            // hush.msg.toast("3")
            // hush.msg.msg("4")
            // await hush.msg.alert("5", {color : "red" })
            // const ret = await hush.msg.confirm("6")
            // if (!ret) return
            // hush.msg.msg("7")
            alertSeq : -1,
            toastTextArr : [],
            toastSecArr : [],
            toastProcessing : false,
            addHtml : (_type, _text, _callbackOk, _callbackCancel, _obj) => { //_obj (toast에는 미사용) : width, height, backColor, color
                const maxWidth = (_obj && _obj.width) ? _obj.width : 300
                const maxHeight = (_obj && _obj.height) ? _obj.height : 600
                const backColor = (_obj && _obj.backColor) ? _obj.backColor : "beige"
                const color = (_obj && _obj.color) ? _obj.color : "black"
                const _seq = (_type == "toast") ? "" : (++hush.msg.alertSeq).toString()
                const _idx = (_type == "toast") ? "9999" : "9998"
                let _html = "<div id=hushPopup" + _seq + " style='z-index:" + _idx + ";position:fixed;left:0;top:0;width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:transparent'>"
                _html += "	    <div id=hushPopupMain" + _seq + " style='min-width:180px;min-height:120px;max-width:" + maxWidth + "px;max-height:" + maxHeight + "px;display:flex;flex-direction:column;align-items:center;justify-content:space-between;background:" + backColor + ";color:" + color + ";border:1px solid darkgray;border-radius:5px;box-shadow:3px 3px 3px grey;padding:10px'>"
                _html += "		    <div style='width:100%;height:calc(100% - 45px);overflow-wrap:break-word;overflow:auto'>" + _text + "</div>"
                _html += "		    <div id=hushBtn" + _seq + " style='width:100%;height:45px;display:flex;align-items:center;justify-content:flex-end;border-top:1px solid darkgray;padding-top:10px;margin-top:10px'>"
                _html += "			    <div id=hushPopupOk" + _seq + " style='cursor:pointer;font-weight:bold;color:black;border-radius:5px;background:#0082AD;color:white;padding:10px 15px;margin:0px 0px 0px 10px'>확인</div>"
                _html += "			    <div id=hushPopupCancel" + _seq + " style='display:none;cursor:pointer;font-weight:bold;color:black;border-radius:5px;background:#0082AD;color:white;padding:10px 15px;margin:0px 0px 0px 10px'>취소</div>"
                _html += "		    </div>"				
                _html += "	    </div>"
                _html += "</div>"
                const _body = document.querySelector("body")
                _body.insertAdjacentHTML('beforeend', _html)
                if (_type == "toast") return
                const _div = document.getElementById("hushPopup" + _seq)
                const _divOk = document.getElementById("hushPopupOk" + _seq)
                const _divCancel = document.getElementById("hushPopupCancel" + _seq)
                if (_callbackCancel) _divCancel.style.display = "block"
                _divOk.addEventListener("click", function() { //onclick=xxx()로는 promise resolve 처리못함
                    _div.remove()
                    if (_callbackOk) _callbackOk()
                })
                _divCancel.addEventListener("click", function() {
                    _div.remove()
                    if (_callbackCancel) _callbackCancel()
                })
            },
            msg : (_text, _callbackOk, _callbackCancel, _obj) => { //비동기콜백
                hush.msg.addHtml("", _text, _callbackOk, _callbackCancel, _obj)
            },
            alert : (_text, _obj) => new Promise((resolve) => {
                hush.msg.msg(_text, function() {
                    resolve(true)
                }, null, _obj)
            }),
            confirm : (_text, _obj) => new Promise((resolve) => {
                hush.msg.msg(_text, function() {
                    resolve(true)
                }, function() {
                    resolve(false)
                }, _obj)
            }),
            toast : (_text, _sec) => {
                hush.msg.toastTextArr.push(_text)
                hush.msg.toastSecArr.push(_sec)
                hush.msg.toastLoop()
            },
            toastEnd : () => {
                const _div = document.getElementById("hushPopup")
                if (_div) _div.remove()
                if (hush.msg.toastTextArr.length > 0) {
                    hush.msg.toastTextArr.splice(0, 1) //첫번째 아이템 제거
                    hush.msg.toastSecArr.splice(0, 1) //첫번째 아이템 제거
                }
                hush.msg.toastProcessing = false
                hush.msg.toastLoop()
            },
            toastLoop : () => {
                const _len = hush.msg.toastTextArr.length
                if (_len == 0) return 
                if (hush.msg.toastTextArr.length > 10) {
                    hush.msg.toastTextArr = []
                    hush.msg.toastSecArr = []
                    alert("토스트 메시지는 한번에 10개까지만 지원합니다.") 
                    return
                }
                if (hush.msg.toastProcessing) {
                    setTimeout(function() {
                        hush.msg.toastLoop()
                    }, 500)
                    return
                }
                hush.msg.toastProcessing = true
                hush.msg.addHtml("toast", hush.msg.toastTextArr[0])                
                const _divBtn = document.getElementById("hushBtn")
                _divBtn.style.display = "none"
                const _divPopupMain = document.getElementById("hushPopupMain")
                _divPopupMain.style.minWidth = "0px"
                _divPopupMain.style.minHeight = "0px"
                const _sec = hush.msg.toastSecArr[0]
                if (_sec == -1) { 
                    //endless toast (예: 서버호출) : 사용자가 hush.msg.toastEnd()를 이용해 종료해야 함
                } else {
                    const sec = (!_sec ? 2 : _sec) * 1000
                    setTimeout(function() {
                        hush.msg.toastEnd()
                    }, sec)
                }
            },
            showMsg : (_msg, _code, _sec) => { //서버의 ws.http.resWarn()의 토스트 메시지와 관련
                if (_msg.includes(hush.cons.toast_prefix)) {
                    const _arr = _msg.split(hush.cons.toast_prefix)
                    const _strMsg = (_arr.length >= 2) ? _arr[1] : _arr[0]
                    hush.msg.toast(_strMsg, _sec)	
                } else {
                    if (_code.startsWith("-8")) { //서버에서 -8로 시작시 로그인 관련
                        hush.msg.msg(_msg + "<br>로그인하시기 바랍니다.")
                    } else {
                        hush.msg.msg(_msg)
                    }
                }
            },
            //아래 4개는 jqueryui에서 가져온 dialog 구현이며 위의 hush.msg.*와는 공유하는 것 없음
            //특수한 경우만 사용하는 것이며 향후 jqueryui 없이 확장할 경우를 대비해 최소한으로 사용하기
            dialogMultiButton : (desc, callbackObj, title, width) => { //dialog is from jqueryui               
                const _title = (title) ? title : hush.cons.title
                const _alertBody = "<div id='hush-dialog-confirm' title='" + _title + "'><p>" + desc + "</p></div>"
                const _width = (width) ? width : 300
                $("#hush-dialog-confirm").remove()
                if (!callbackObj) {
                    $(_alertBody).dialog({ resizable: false, height: "auto", width: _width, modal: true, 
                        buttons: { "Ok": function() { $("#hush-dialog-confirm").dialog("destroy") }}
                    })
                } else {
                    $(_alertBody).dialog({ resizable: false, height: "auto", width: _width, modal: true, 
                        buttons: callbackObj
                    })
                }
            },
            dialogInputBox : (desc, val, callbackObj, title, width) => { //dialog is from jqueryui     
                const _val = (val) ? val : ""
                const _title = (title) ? title : "Inputbox"
                let _body = "<div id='hush-dialog-confirm' title='" + _title + "'>"
                _body += "      <p>" + desc + "</p>"
                _body += "      <input id='hush_in' value='" + _val + "' spellcheck=false style='width:95%;margin-top:10px' />"
                _body += "   </div>"
                const _width = (width) ? width : 300
                $("#hush-dialog-confirm").remove()                
                $(_body).dialog({ resizable: false, height: "auto", width: _width, modal: true, 
                    buttons: callbackObj,
                    open: function() {
                        $("#hush_in").select()
                        $("#hush_in").keyup(function(e) { 
                            if (e.keyCode == 13 && !e.shiftKey) {
                                $(this).parent().parent().find("button:eq(1)").trigger("click") //close icon button is at 0 position
                            }
                        })
                    }
                })                             
            },
            dialogGetInput : () => { //dialog is from jqueryui
                return $("#hush_in").val()
            },
            dialogClose : () => {
                $("#hush-dialog-confirm").dialog("destroy") //dialog is from jqueryui
            }
        },
        noti : {
            notis : { },
            procNoti : async (roomid, obj) => { //This function should be called from main.html only
                if (hush.webview.on) return //covered at app notification
                if (hush.http.getCookie("notioff") == "Y") return //see setting tab
                if (obj.senderid == hush.user.id) return //skip for oneself when mobile
                if (obj.type == "leave") return //no need to be notified
                if (obj.type == "invite") {
                    const userids = hush.cons.memdeli + obj.body.split(hush.cons.deli)[1] + hush.cons.memdeli
                    const myuserid = hush.cons.memdeli + hush.http.getCookie("userid") + hush.cons.memdeli
                    if (!userids.includes(myuserid)) return //means that myuserid not invited and exists already in chat room
                }
                let _body, _from
                if (hush.sock.roomMap[roomid]) {
                    if (hush.sock.roomMap[roomid].noti == "X") return
                    _from = hush.sock.roomMap[roomid].nm                    
                } else {
                    const rs = await hush.http.ajax("/msngr/get_roominfo", { roomid : roomid })                
                    if (rs.code == hush.cons.result_ok) {
                        _from = hush.room.getRoomName(rs.list[0].NICKNM, rs.list[0].MAINNM, rs.list[0].ROOMNM)
                        hush.sock.roomMap[roomid] = { nm: _from, noti: rs.list[0].NOTI }
                        if (hush.sock.roomMap[roomid].noti == "X") return
                    } else {
                        let _people = obj.receivernm.join(",") + ","
                        _people = _people.replace(hush.user.nm + ",", "")
                        if (_people.endsWith(",")) _people = _people.substr(0, _people.length - 1)
                        _from = _people
                    }
                }
                const msgArrived = "새 메시지 도착"
                const _bodyoff = hush.http.getCookie("bodyoff")
                const _senderoff = hush.http.getCookie("senderoff")
                if (_bodyoff == "Y" && _senderoff == "Y") { //see setting tab
                    _body = msgArrived
                } else if (_bodyoff == "Y") {
                    _body = "[" + _from + "]\n" + msgArrived
                } else if (_senderoff == "Y") {
                    _body = hush.util.displayTalkBodyCustom(obj.type, obj.body)
                } else {
                    _body = "[" + _from + "]\n" + hush.util.displayTalkBodyCustom(obj.type, obj.body)
                }
                const noti = new window.Notification("", { 
                    body : _body, dir : "auto", lang : "EN", tag : roomid, icon : hush.cons.logo_darkblue, requireInteraction : true 
                }) //1) 이 때 noti.onclose()도 실행되어 아래 2)가 실행되어 delete hush.noti.notis[roomid]가 제거되어 
                //정작 hush.noti.notis[roomid]를 참조해 noti를 가져오려 할 때 문제가 됨
                noti.msgid = obj.msgid
                hush.noti.notis[roomid] = noti
                noti.onclick = function () {
                    hush.sock.openRoom("/app/msngr/chat.html", roomid, "noti")                   
                    noti.close()
                    delete hush.noti.notis[roomid] //3) 따라서, 여기와 closeNoti()에서 delete해야 함
                } //2) noti.onclose = function () { delete hush.noti.notis[roomid] }
            }
        },
        sock : {
            roomMap : { }, //{ nm: 'xxx', noti: true/false }
            rooms : { }, //window 객체가 저장됨. sock.connect => https://socket.io/docs/v3/client-initialization        
            connect : (io, query) => new Promise((resolve, reject) => { //this will be occurred only on index.html
                const socket = io(hush.cons.socket_url, { forceNew: false, reconnection: false, query: query }) //forceNew=false //See 'disconnect_prev_sock' in pmessage.js (on server)
        		socket.off("connect_error").on("connect_error", async (e) => { await hush.msg.alert("connect_error\n" + e.toString()) })
                socket.off("disconnect").on("disconnect", async () => { 
                    console.log("socket disconnected " + hush.util.getCurDateTimeStr(true, true))
                    //await hush.msg.alert("socket disconnected " + hush.util.getCurDateTimeStr(true, true))
                    location.replace("/" + hush.cons.erp_portal) //최초 개발시엔 새로고침되면 다시 소켓연결되어 무한루프돌기때문에 임시로 막았으나 이제 경합로직도 넣었으니 풀어도 됨
                }) 
                socket.off("connect").on("connect", () => {
                    console.log("socket connected " + hush.util.getCurDateTimeStr(true, true))
                    hush.sock.on(socket, (rs) => {
                        console.log("hush.sock.on => " + JSON.stringify(rs)) //if (rs.data.type == "talk") debugger
                        if (rs.returnTo == "parent" || rs.returnTo == "all") {
                            funcSockEv[rs.ev].call(null, rs.data)
                            if (rs.returnTo == "all") { //call from app.js or disconnect.js on server
                                Object.entries(hush.sock.rooms).forEach(([key, value]) => {
                                    const _win = hush.sock.rooms[key]
                                    if (_win && !_win.closed) _win.funcSockEv[rs.ev].call(null, rs.data)
                                })
                            }
                        } else { //to roomid
                            const _win = hush.sock.rooms[rs.returnTo]
                            if (_win && !_win.closed) _win.funcSockEv[rs.ev].call(null, rs.data)
                            if (rs.returnToAnother == "parent") funcSockEv[rs.ev].call(null, rs.data)
                        }
                    })
                    resolve(socket)
                })
            }),
            createRoom : (_url, _type) => { //newFromMain, newFromPopup, me
                const roomid = hush.util.createId()
                const _newwin = hush.util.openWinPop(_url + "?type=" + _type + "&roomid=" + roomid)
                hush.sock.rooms[roomid] = _newwin
            },
            getAllRoomsOpen : (callback) => {
                Object.entries(hush.sock.rooms).forEach(([key, value]) => {
                    const _win = hush.sock.rooms[key]
                    if (_win && !_win.closed) callback(_win)
                })
            },
            getRoomName : (nicknm, mainnm, roomnm) => {
                if (nicknm) return nicknm //각 멤버들이 만들기 가능
                if (mainnm) return mainnm //Owner(Master=Creator)만 만들기 가능
                const _roomnmObj = (typeof roomnm == "string") ? JSON.parse(roomnm) : roomnm
                return hush.sock.procRoomName(_roomnmObj, g_userid) //Or member's name are displayed with some delimeter.
            },
            getWinId : () => { //xxxxxx20241231010159
                return hush.util.getRnd().toString() + "_" + hush.util.getCurDateTimeStr()
            },
            on : (socket, callback) => {            
                socket.off(hush.cons.sock_ev_alert).on(hush.cons.sock_ev_alert, async (obj) => { 
                    if (!obj.roomid) {
                        await hush.msg.alert("sock_alert<br>" + obj.msg) 
                    } else {
                        await hush.sock.rooms[obj.roomid].hush.msg.alert("sock_alert<br>" + obj.msg)
                    }
                })
                socket.off(hush.cons.sock_ev_toast).on(hush.cons.sock_ev_toast, (obj) => {
                    if (!obj.roomid) {
                        hush.msg.toast("sock_toast<br>" + obj.msg) 
                    } else {
                        hush.sock.rooms[obj.roomid].hush.msg.toast("socksock_toast<br>" + obj.msg)
                    }
                })
                socket.off(hush.cons.sock_ev_common).on(hush.cons.sock_ev_common, (rs) => { callback(rs) })
            },
            openRoom : (_url, roomid, origin) => { //origin=""(new),portal,noti
                const _win = hush.sock.rooms[roomid]
                if (_win) {
                    if (!_win.closed) {
                        _win.focus()
                        return
                    }
                    _win.close()
                    delete _win
                }
                const _newwin = hush.util.openWinPop(_url + "?type=open&origin=" + origin + "&roomid=" + roomid)
                hush.sock.rooms[roomid] = _newwin
            },
            procRoomName : (_roomnmObj, _userid) => { //See setRoomnmWithUsernm() in common.js
                let finalnm             
                const _idx = _roomnmObj.userid.split(hush.cons.memdeli).indexOf(_userid)
                if (_idx == -1) {
                    finalnm = _roomnmObj.roomnm
                } else { //remove my name
                    const _arr = _roomnmObj.roomnm.split(hush.cons.memdeli)
                    let _brr = [ ]
                    for (let i = 0; i < _arr.length; i++) {
                        if (i != _idx) _brr.push(_arr[i])
                    }
                    finalnm = _brr.join(hush.cons.memdeli)
                }
                return finalnm
            },
            send : (socket, ev, data, returnTo, returnToAnother) => {
                //returnTo : 부모, 해당채팅방, all 중 하나를 지정하며 parent(부모)가 기본값임
                //returnToAnother : returnTo 말고도 하나 더 전송 가능 (주로 특정 방에 보내면서 parent에게 추가로 보낼 때 사용)
                const _returnTo = returnTo ? returnTo : "parent" //parent(부모)가 기본값
                socket.emit(hush.cons.sock_ev_common, { ev : ev, data : data, returnTo : _returnTo, returnToAnother : returnToAnother })
            },            
        },        
        util : {
            chkSeoulTz : () => {
                if (hush.tz == hush.cons.tz_seoul) return true
                return false
            },
            isvoid : (obj) => {
                if (typeof obj == "undefined" || obj == null) return true
                return false
            },
            showEx : (ex, title, _msgType, _sec) => {
                hush.msg.toastEnd() //예외 발생시므로 혹시나 모를 토스트 메시지 제거
                if (ex.message.includes(hush.cons.NETWORK_UNAVAILABLE)) { //hush.http.ajax() 참조
                    hush.msg.toast(hush.cons.NETWORK_UNAVAILABLE)
                    return
                }
                //ajax 타임아웃 : 1) 서버다운 경우 2) 네트워크는 연결되어 있는데 원할치 못해 연결되지 않은 경우
                //socket의 경우, PC 웹브라우저에서는 네트워크가 특별한 경우가 아니면 항상 연결되어 있는 상태이고 연결이 끊어지면 바로 웹브라우저탭에서 포털로 replace되도록 되어 있음
                //그러나, 앱에서는 (웹뷰 포함) 네이티브(예: 안드로이드 코틀린)가 socket 통신을 처리하므로 웹뷰 클릭시 소켓이 끊어진 상태라면 오류 핸들링이 섬세하게 필요함
                if (ex.message.includes("timeout")) {
                    if (title == "alert") {
                        hush.msg.alert(_msg)
                    } else if (title == "none") {
                        //반복적으로 ajax 호출인 경우 timeout시 아무런 오류메시지 안보여줘야 할 때가 있을 때 사용 (예: chk_redis)
                    } else {
                        hush.msg.toast(hush.cons.NETWORK_UNSTABLE, 3)
                    }
                    return
                }
                const _title = title ? "[" + title + "]<br>" : ""
                let _msg                
                if (typeof ex == "string") {
                    _msg = _title + ex
                } else if (typeof ex == "object" && ex.stack) {
                    const arr = ex.stack.split("\n")
                    arr.splice(0, 1) //첫번째 아이템 제거
                    const strAt = arr.join("\n")
                    console.log(ex.stack)
                    _msg = _title + ex.message + "<br><br>" + strAt
                } else {
                    _msg = _title + ex.toString()
                }
                if (_msgType == "toast") {
                    hush.msg.toast(_msg, _sec)
                } else if (_msgType == "alert") {
                    hush.msg.alert(_msg) //Promise
                } else {
                    hush.msg.msg(_msg) //기본은 비동기콜백 처리
                }
            },
            chkAjaxCode : (rs, notShowMsgIfNoData) => {
                if (notShowMsgIfNoData) {
                    if (rs.code != hush.cons.CODE_OK && rs.code != hush.cons.CODE_NO_DATA) {
                        hush.msg.showMsg(rs.msg, rs.code)
                        return false
                    }
                } else {
                    if (rs.code != hush.cons.CODE_OK) {
                        hush.msg.showMsg(rs.msg, rs.code)
                        return false
                    }
                }
                return true
            },
            getRnd : (_min, _max) => {
                const min = (!_min && _min != 0) ? 100000 : _min
                const max = (!_max && _max != 0) ? 999999 : _max
                return Math.floor(Math.random() * (max - min)) + min //return min(inclusive) ~ max(exclusive) Integer only 
            },
            shuffleChar : (str) => {
                let arr = [...str]
                arr.sort(function() { return 0.5 - Math.random() })
                return arr.join("")
            },
            // createId : (uniqueStr) => { //uniqueStr 제거하기 : 과하게 길어서 불편하기만 함. 결국, g_token10도 모두 제거하기
            //     return hush.util.getCurDateTimeStr(false, true) + hush.util.getRnd().toString().padStart(6, "0") + (uniqueStr ? hush.util.shuffleChar(uniqueStr) : "")
            // },
            createId : () => {
                return hush.util.getCurDateTimeStr(false, true) + hush.util.getRnd().toString().padStart(6, "0")
            },
            openWinTab : (url, replace) => {
                const _url = hush.http.handleNoCache(url)
                if (replace) {
                    location.replace(_url)
                } else {
                    return window.open(_url)
                }
            },
            openWinPop : (url, width, height, pos) => { //pos : 1) 없으면 중앙 2) 1~9999면 중앙인데 top만 지정 3) 0이면 (0, 0) 4) random은 랜덤
                let _left, _top
                const _width = width ? width : 500
                const _height = height ? height : screen.availHeight - 300
                if (hush.util.isvoid(pos)) {
                    _left = (parseInt(screen.width) - _width) / 2
                    _top = (parseInt(screen.height) - _height) / 2
                } else if (pos >= 1 && pos <= 9999) { //9999이하면 top으로 정의
                    _left = (parseInt(screen.width) - _width) / 2
                    _top = pos
                } else if (pos == 0) {
                    _left = 0
                    _top = 0
                } else {
                    const _leftMax = screen.width - _width
                    const _topMax = screen.height - _height                
                    _left = hush.util.getRnd(0, _leftMax)
                    _top = hush.util.getRnd(0, _topMax)
                }
                const _bar = "left=" + _left + ",top=" + _top + ",width=" + _width + ",height=" + _height + ",menubar=no,status=no,toolbar=no,resizable=yes,location=no"
                const _url = hush.http.handleNoCache(url)
                return window.open(_url, "", _bar)
            },
            fadein : (tag, callback) => { //jqueryui
                if (callback) {
                    tag.animate({ opacity : 1 }, 150, null, callback)
                } else {
                    tag.animate({ opacity : 1 }, 150)
                }              
            },
            fadeout : (tag, callback) => { //jqueryui
                if (callback) {
                	tag.animate({ opacity : 0.2 }, 150, null, callback)
                } else {
                	tag.animate({ opacity : 0.2 }, 150)
                }                
            },
            anim : (tag, callback) => { //jqueryui
                if (callback) {
                	tag.animate({ opacity : 0.2 }, 100).animate({ opacity : 1 }, 200, null, callback)
                } else {
                	tag.animate({ opacity : 1 }, 100).animate({ opacity : 1 }, 200)
                }                
            },
            animBgColor : (tag, callback, bgColor) => { //jqueryui
                const _prevBackcolor = tag.css("background-color")
                const _bgColor = bgColor ? bgColor : hush.cons.color_fadein
                if (callback) {
                	tag.animate({ backgroundColor : _bgColor }, 100).animate({ backgroundColor : _prevBackcolor }, 200, null, callback)
                } else {
                	tag.animate({ backgroundColor : _bgColor }, 100).animate({ backgroundColor : _prevBackcolor }, 200)
                }                
            },
            getFileNameAndExtension : (fileStr) => {
				const obj = { }
				const arr = fileStr.split(".")
				obj.name = arr[0]
                if (arr.length == 1) {
					obj.ext = ""
					obj.extDot = ""
				} else {
					obj.ext = arr[arr.length - 1]
					obj.extDot = "." + obj.ext
				}
				return obj
            },
            extractFileFromTalkBody : (body) => { //from hush.A_MSGMS_TBL BODY Field value for file upload (xxroomid/xxuserid/realfilenamebody~~tempfilenamebody.extension##filesize)
                const _arr = body.split("/")
                const _brr = (_arr.length == 1) ? _arr[0].split(hush.cons.subdeli) : _arr[2].split(hush.cons.subdeli)
                const _crr = (_brr.length == 1) ? _brr[0].split(hush.cons.deli) : _brr[1].split(hush.cons.deli)
                return _brr[0] + hush.util.getFileNameAndExtension(_crr[0]).extDot
            },
            displayTalkBodyCustom : (type, body) => { //See ChatService.kt too.
                let _body
                if (body == hush.cons.cell_revoked) {
                    _body = body
                } else if (type == "invite") {
                    const _arr = body.split(hush.cons.deli)
                    _body = _arr[0] + " invited by " + _arr[2]
                } else if (type == "image") {
                    _body = type
                } else if (type == "file" || type == "flink") {
                    _body = hush.util.extractFileFromTalkBody(body)
                } else {
                    _body = body
                }
                return _body
            },
            formatBytes : (bytes) => {
                let units = ["B", "KB", "MB", "GB", "TB"], i
                for (i = 0; bytes >= 1024 && i < 4; i++) bytes /= 1024
                return bytes.toFixed(2) + units[i]
            },
            strLen : function(s, b, i, c) { //https://programmingsummaries.tistory.com/239
                // for (b = i = 0; i < s.length; i++) {
                //     c = s.charCodeAt(i)
                //     //b += c >> 11 ? 3 : c >> 7 ? 2 : 1 //(2048(2^11)로 나눌 때 몫이 있으면 2048보다 큰 유니코드이므로 3바이트를 할당.. 128(2^7)로 나눌 땐 ..)
                //     b += c >> 11 ? 2 : c >> 7 ? 2 : 1
                // }
                // return b
                return s.length //mySql 필드인 경우에는 한글이 1바이트로 계산되어 입력되고 있으므로 그냥 .length를 사용하고 있음 (다른 DB는 체크 필요)
            },
            chkFieldVal : async (_val, _nm, _min, _max, _pattern) => { //크리티컬한 내용은 서버에서 체크하고 그렇지 않은 것은 클라이언트에서 체크해도 무방할 것임
                const nm = (_nm) ? "[" + _nm + "]<br>" : ""
                if (_pattern) { //비번 및 아이디에 한글 및 일부 특수문자 사용금지 
                    if (!hush.cons.pattern.test(_val)) {
                        await hush.msg.alert(nm + hush.cons.warn_char_not_allowed)
                        return false
                    }
                }
                const _len = hush.util.strLen(_val)
                if (_max) {
                    if (_len > _max) {
                        await hush.msg.alert(nm + "최대 " + _max + " 바이트까지만 가능합니다 : 현재 " + _len + "바이트")
                        return false
                    }
                }
                if (_min) {
                    if (_val.trim() == "") {
                        await hush.msg.alert(nm + "빈칸입니다.")
                        return false
                    } else {
                        if (_len < _min) {
                            await hush.msg.alert(nm + "최소 " + _min + " 바이트가 필요합니다 : 현재 " + _len + "바이트")
                            return false
                        }
                    }
                }
                return true
            },
            getCurDateTimeStr : (deli, millisec) => {
                const now = new Date()
                let ret, _dot
				if (deli) {
					ret = now.getFullYear().toString() + "-" + (now.getMonth() + 1).toString().padStart(2, "0") + "-" + now.getDate().toString().padStart(2, "0") + " " + 
                          now.getHours().toString().padStart(2, "0") + ":" + now.getMinutes().toString().padStart(2, "0") + ":" + now.getSeconds().toString().padStart(2, "0")
                    _dot = "."      
                } else {
					ret = now.getFullYear().toString() + (now.getMonth() + 1).toString().padStart(2, "0") + now.getDate().toString().padStart(2, "0") + 
						  now.getHours().toString().padStart(2, "0") + now.getMinutes().toString().padStart(2, "0") + now.getSeconds().toString().padStart(2, "0")
                    _dot = ""
                }
                if (millisec) ret += _dot + now.getMilliseconds().toString().padEnd(6, "0")
                return ret
            },
            getTimeStamp : (str) => { //str = 2012-08-02 14:12:04
                const d = str.match(/\d+/g) //extract date parts
                return new Date(d[0], d[1] - 1, d[2], d[3], d[4], d[5])
            },
            getDateTimeDiff(_prev, _cur) { //_prev = yyyy-mm-dd hh:MM:dd
                const dtPrev = hush.util.getTimeStamp(_prev)
                return parseInt((_cur - dtPrev) / 1000) //return seconds
            },
            formatMsgDt : (_dt, _year, onlyDate) => { //yyyy-mm-dd hh:mm:ss => consider tzDateTime first
                let dt 
                if (_dt.substr(0, 4) == _year) {
                    dt = _dt.substr(5, 11)
                 } else {
                    if (onlyDate) {
                        dt = _dt.substr(0, 10)
                    } else {
                        dt = _dt.substr(0, 16) //up to minutes
                    }
                 }
                 return dt
            },
            tzDateTime : (dt, dispSec) => { //see moment.js about timezone handling
                let _dt = ((dt.length > 19) ? dt.substr(0, 19) : dt) + "Z" //dt = UTC (YYYY-MM-DD hh:MM:ss or YYYY-MM-DD hh:MM:ssZ or YYYY-MM-DDThh:MM:ssZ)
                _dt = moment(_dt).tz(hush.tz).format() //returns 2020-07-19T11:07:00+09:00
                if (dispSec) {
                    return _dt.substr(0, 10) + " " + _dt.substr(11, 8)
                } else {
                    return _dt.substr(0, 10) + " " + _dt.substr(11, 5)
                }
            },
            getExpiryWithTZ : (filestate, cur_year) => {
                let _expiry
                if (filestate == "" || filestate == hush.cons.file_expired) {
                    _expiry = filestate
                } else {
                    _expiry = hush.util.tzDateTime(filestate, true)
                    _expiry = "until " + hush.util.formatMsgDt(_expiry, cur_year) //daemon kills periodically
                }
                return _expiry
            },
            displayOnOff : (userkey, on) => {
                if (on) {
                    $("#w_" + userkey).removeClass("coStateOff").addClass("coStateOn")
                    if ($("#m_" + userkey).hasClass("mobInstalled")) {
                        $("#m_" + userkey).removeClass("coStateMob").addClass("coStateOn")
                    } else {
                        $("#m_" + userkey).removeClass("coStateOff").addClass("coStateOn")
                    }
                } else {
                    $("#w_" + userkey).removeClass("coStateOn").addClass("coStateOff")
                    if ($("#m_" + userkey).hasClass("mobInstalled")) {
                        $("#m_" + userkey).removeClass("coStateOn").addClass("coStateMob")
                    } else {
                        $("#m_" + userkey).removeClass("coStateOn").addClass("coStateOff")
                    }
                }
            },
        },
        webview : {
            on : false,
            ios : false,
            and : false,
            ready : false,
            screenHeightOnLoad : null, //모바일 키보드 올라오면서 높이 조정
            chk : (param) => { //const param = new URLSearchParams(location.search)
                const _os = param.get("webview")
                if (_os == "and" || _os == "ios") {
                    hush.webview.on = true
                    if (_os == "ios") {
                        hush.webview.ios = true
                        hush.webview.and = false
                    } else {
                        hush.webview.ios = false
                        hush.webview.and = true
                    }
                    hush.webview.screenHeightOnLoad = $(window).height()
                } else {
                    hush.webview.on = false
                    hush.webview.ios = false
                    hush.webview.and = false
                }
            },
            //////////////////////////////////////////chat.html의 procInvite()에서 AndroidCom.send가 안먹히길래 callAppFunc()로 처리하려 했더니 AndroidCom, AndroidCom.send는 잘 가져오고 있었음
            //결국, 아래 2개는 잘못 짚은 거였고 일단 setTimeout()으로 처리해서 넘어감
            chkAppFunc : (WebInterface, elapsed) => {
                try {
                    let _elapsed = elapsed ? elapsed : 0
                    if (_elapsed >= 1000) return false
                    if (!WebInterface) {
                        _elapsed += 300
                        setTimeout(function() {
                            $("#in_chat").val($("#in_chat").val()+"==="+_elapsed)
                            return hush.webview.chkAppFunc(WebInterface, _elapsed)
                        }, 300)
                    } else {
                        $("#in_chat").val("@@@"+_elapsed)
                        return true
                    }
                } catch (ex) {
                    return ex
                }                
            },
            callAppFunc : (WebInterface, elapsed) => new Promise((resolve) => {
                try {
                    const ret = hush.webview.chkAppFunc(WebInterface, elapsed)
                    if (ret == false) throw new Error("모바일앱 함수 호출 타임아웃입니다.")
                    if (ret && ret.message) throw new Error("[callAppFunc] " + ret.message)
                    resolve()
                } catch (ex) {
                    reject(ex)
                }                
            }), /////////////////////////////////////////////////////////////////////////////


        }      
    }
})(jQuery)
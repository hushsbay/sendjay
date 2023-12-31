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
            CODE_PASSWORD_NEEDED : '-76',
            CODE_PASSKEY_NEEDED : '-77',
            CODE_PASSWORD_NOT_MATCHED : '-78',
            CODE_PASSKEY_NOT_MATCHED : '-79',
            CODE_TOKEN_NEEDED : '-81', //jwt 
            CODE_TOKEN_MISMATCH : '-82', //jwt payload not equal to decoded
            CODE_USERID_MISMATCH : '-83',
            CODE_TOKEN_EXPIRED : '-84',
            CODE_USE_YOUR_OWN_USERID : '-85',
            toast_prefix : "##$$", 
            ///////////////////////////////////위는 서버와 동일
            failOnLoad : "failOnLoad",
            restful_timeout : 10000,
            pattern : /^[A-Za-z0-9!@^*(),.]*$/, //do not include # $ - _ % & + = ( //pattern excludes characters concerned with problem of uri malforming and jquery selector, so not worry about encodeURIComponent for that field) 
            color_fadein : "#b2e2f8",
            ext_image : "png,gif,jpg,jpeg,ico",
            max_image : 5242880, //5MB
            warn_blank : _warn_blank,
            warn_search_blank : "검색어" + _warn_blank,
            warn_no_row_selected : "선택한 행이 없습니다.",
            warn_no_opener : "opener가 존재하지 않습니다.",
            warn_char_not_allowed : "한글이나 특수문자 일부(# $ - _ % & + =)는 사용할 수 없습니다."
        },
        user : null,
        auth : {
            setCookieForUser : (rs, _persist) => { //_persist = Y or else
                const persist = (_persist == "Y") ? true : false
                hush.http.setCookie("autologin", _persist, true) //포털(index.html)에서만 사용됨
                hush.http.setCookie("token", rs.token, persist) //jwt
                hush.http.setCookie("userid", rs.USER_ID, true)
                //hush.http.setCookie("userkey", (fromWebView ? hush.cons.m_key : hush.cons.w_key) + rs.userid, persist)
                //hush.http.setCookie("passkey", rs.passkey, persist) //See login.js
                hush.http.setCookie("usernm", rs.USER_NM, persist)
                hush.http.setCookie("orgcd", rs.ORG_CD, persist)
                hush.http.setCookie("toporgcd", rs.TOP_ORG_CD, persist)
                //hush.http.setCookie("role", rs.role, persist)
                //hush.http.setCookie("logined", "Y", false) //항상 세션쿠키 (자동이든 수동이든 인증되면 Y) : 화면에 로그인/로그아웃 등의 단순표시를 위해서만 사용하기
            },
            deleteCookieForUser : () => {
                hush.http.deleteCookie('autologin')
                hush.http.deleteCookie('token')
                hush.http.deleteCookie('userid')
                //hush.http.deleteCookie('userkey')
                //hush.http.deleteCookie('passkey')
                hush.http.deleteCookie('usernm')
                hush.http.deleteCookie('orgcd')
                hush.http.deleteCookie('toporgcd')
                //hush.http.deleteCookie('role')
                //hush.http.deleteCookie('logined')
            },
            setUser : async () => {
                const _token = hush.http.getCookie("token")  
                if (_token) {
                    const _userid = hush.http.getCookie("userid")  
                    const rs = await hush.http.ajax("/auth/login", { token : _token, userid : _userid })
                    if (rs.code != hush.cons.CODE_OK) {
                        hush.msg.showMsg(rs.msg)
						return false                           
                    }
                }
                const _id = hush.http.getCookie("userid")
                const _nm = hush.http.getCookie("usernm")
                const _orgcd = hush.http.getCookie("orgcd")
                const _orgnm = hush.http.getCookie("orgnm")
                const _toporgcd = hush.http.getCookie("toporgcd")
                const _toporgnm = hush.http.getCookie("toporgnm")
                //const _key = hush.http.getCookie("userkey") //hushj.cons.w_key + _id //for socket
                //const _role = hush.http.getCookie("role") //'role' check in browser is just for convenience. Keep in mind that you should check this on server.
                hush.user = { token : _token, id : _id, nm : _nm, orgcd : _orgcd, orgnm : _orgnm, toporgcd : _toporgcd, toporgnm : _toporgnm }
                return true
            }, 
            getUserPhoto : (user_id, tag_id) => {
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
                    }
                })
            }
        },
        http : {
            handleNoCache: (url) => {
                let _url = url
                if (!_url.includes("nocache=")) _url += (_url.includes("?") ? "&" : "?") + "nocache=" + hush.util.getRnd()
                return _url
            },
            ajaxCall : (url, _data, callback, failCallback, method) => {
                let data = _data
                Object.assign(data, { tokenInfo : { token : hush.http.getCookie("token"), userid : hush.http.getCookie("userid") }})
                $.ajax({dataType : "json", //response data type
                    contentType : "application/json; charset=utf-8", //request mime type
                    url : url,
                    data: (method && method.toLowerCase() == "get") ? data : JSON.stringify(data),
                    cache : false,
                    async : true,
                    type : (method) ? method : "post",
                    timeout : hush.cons.restful_timeout,
                    success : function(rs) {
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
                let data = _data
                Object.assign(data, { tokenInfo : { token : hush.http.getCookie("token"), userid : hush.http.getCookie("userid") }})
                $.ajax({dataType : "json", //response data type
                    contentType : "application/json; charset=utf-8", //request mime type
                    url : url,
                    data: (method && method.toLowerCase() == "get") ? data : JSON.stringify(data),
                    cache : false,
                    async : true,
                    type : (method) ? method : "post",
                    timeout : hush.cons.restful_timeout,
                    success : function(rs) {
                        resolve(rs)
                    },
                    error : function(xhr, status, error) {
                        //"Uncaught (in promise) Error" => status=error, error=""
                        //When done().fail(), "Uncaught (in promise) Error: error" returned
                        const msg = (typeof error == "string") ? error : error.toString()
                        reject(new Error(msg))
                    }
                }
            )}),
            ajaxFormData : (url, _data, callback, failCallback) => {
                let data = _data
                data.append("tokenInfo", { token : hush.http.getCookie("token"), userid : hush.http.getCookie("userid") })
                $.ajax({url : url,
                    data : data,
                    processData : false,
                    enctype : "multipart/form-data",
                    contentType : false,
                    cache : false,
                    type : "POST",
                    success : function(rs) { 
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
                if (persist) { //expires value should be same as server's global.nodeConfig.jwt.expiry
                    $.cookie(name, value, { expires: 365, path: '/' })
                } else {
                    $.cookie(name, value, { path: '/' }) //session cookie
                }
            },
            deleteCookie : (name) => { //actually 'return' needed
                $.removeCookie(name, { path: '/' })
            },            
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
                const maxWidth = (_obj && _obj.width) ? _obj.width : 400
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
            showMsg : (_msg, _sec) => { //서버의 ws.http.resWarn()의 토스트 메시지와 관련
                if (_msg.includes(hush.cons.toast_prefix)) {
                    const _arr = _msg.split(hush.cons.toast_prefix)
                    const _strMsg = (_arr.length >= 2) ? _arr[1] : _arr[0]
                    hush.msg.toast(_strMsg, _sec)	
                } else {
                    hush.msg.msg(_msg)
                }
            }
        },
        util : {
            isvoid : (obj) => {
                if (typeof obj == "undefined" || obj == null) return true
                return false
            },
            showEx : (ex, title, _msgType, _sec) => {
                hush.msg.toastEnd() //예외 발생시므로 혹시나 모를 토스트 메시지 제거
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
                    hush.msg.alert(_msg)
                } else {
                    hush.msg.msg(_msg) //기본은 비동기콜백 처리
                }
            },
            getRnd : (_min, _max) => {
                const min = (!_min && _min != 0) ? 100000 : _min
                const max = (!_max && _max != 0) ? 999999 : _max
                return Math.floor(Math.random() * (max - min)) + min //return min(inclusive) ~ max(exclusive) Integer only 
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
                const _width = width ? width : "500"
                const _height = height ? height : "680"
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
                	tag.animate({ opacity : 0.2 }, 150).animate({ opacity : 1 }, 300, null, callback)
                } else {
                	tag.animate({ opacity : 1 }, 150).animate({ opacity : 1 }, 300)
                }                
            },
            animBgColor : (tag, callback, bgColor) => { //jqueryui
                const _prevBackcolor = tag.css("background-color")
                const _bgColor = bgColor ? bgColor : hush.cons.color_fadein
                if (callback) {
                	tag.animate({ backgroundColor : _bgColor }, 150).animate({ backgroundColor : _prevBackcolor }, 300, null, callback)
                } else {
                	tag.animate({ backgroundColor : _bgColor }, 150).animate({ backgroundColor : _prevBackcolor }, 300)
                }                
            },
            getFileNameAndExtension : (fileStr) => {
				const obj = { }
				const arr = fileStr.split(".")
				obj.name = arr[0]
                obj.ext = (arr.length == 1) ? "" : arr[arr.length - 1]
				return obj
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
            chkFieldVal : (_val, _nm, _min, _max, _pattern) => { //크리티컬한 내용은 서버에서 체크하고 그렇지 않은 것은 클라이언트에서 체크해도 무방할 것임
                const nm = (_nm) ? "[" + _nm + "]<br>" : ""
                if (_pattern) {
                    if (!hush.cons.pattern.test(_val)) {
                        hush.msg.alert(nm + hush.cons.warn_char_not_allowed)
                        return false
                    }
                }
                const _len = hush.util.strLen(_val)
                if (_max) {
                    if (_len > _max) {
                        hush.msg.alert(nm + "최대 " + _max + " 바이트까지만 가능합니다 : 현재 " + _len + "바이트")
                        return false
                    }
                }
                if (_min) {
                    if (_val.trim() == "") {
                        hush.msg.alert(nm + "빈칸입니다.")
                        return false
                    } else {
                        if (_len < _min) {
                            hush.msg.alert(nm + "최소 " + _min + " 바이트가 필요합니다 : 현재 " + _len + "바이트")
                            return false
                        }
                    }
                }
                return true
            },
        },
        blob : {
            //브라우저에서 이미지 파일 선택후 노드서버에 올리고 다시 내려 표시하는 등 처리는 2가지 방법이 있음 => 1) blob 2) base64인코딩스트링
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
            }
        }
    }
})(jQuery)
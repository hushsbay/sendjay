(function() { //jQuery 없음
    window.hush = {
        http : {
            handleNoCache: (url) => {
                let _url = url
                if (!_url.includes("nocache=")) _url += (_url.includes("?") ? "&" : "?") + "nocache=" + hush.util.getRnd()
                return _url
            },
        },
        msg : { //1. alert/alertWait 2. popup/popupWait 3. toast : window.alert처럼 여러개의 메시지를 순서대로 처리하는 기능 지원 
            addHtml : (_text, _width, _height, _backColor) => {
                const maxWidth = _width ? _width : 400
                const maxHeight = _height ? _height : 600
                const backColor = _backColor ? _backColor : "beige"
                let _html = "<div id=hushPopup style='z-index:9999;position:fixed;left:0;top:0;width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:transparent'>"
                _html += "	<div id=hushPopupMain style='min-width:180px;min-height:100px;max-width:" + maxWidth + "px;max-height:" + maxHeight + "px;display:flex;flex-direction:column;align-items:center;justify-content:space-between;background:" + backColor + ";border:1px solid darkgray;border-radius:5px;box-shadow:3px 3px 3px grey;padding:10px'>"
                _html += "		<div style='width:100%;height:calc(100% - 45px);overflow:auto'>" + _text + "</div>"
                _html += "		<div id=hushBtn style='width:100%;height:45px;display:flex;align-items:center;justify-content:flex-end;border-top:1px solid darkgray;padding-top:10px;margin-top:10px'>"
                _html += "			<div id=hushPopupOk style='cursor:pointer;font-weight:bold;color:black;border-radius:5px;background:#0082AD;color:white;padding:10px 15px;margin:0px 0px 0px 10px'>확인</div>"
                _html += "			<div id=hushPopupCancel style='display:none;cursor:pointer;font-weight:bold;color:black;border-radius:5px;background:#0082AD;color:white;padding:10px 15px;margin:0px 0px 0px 10px'>취소</div>"
                _html += "		</div>"				
                _html += "	</div>"
                _html += "</div>"
                const _body = document.querySelector("body")
                _body.insertAdjacentHTML('beforeend', _html)
            },
            handleEvent : (callbackOk, callbackCancel) => {
                const _div = document.getElementById("hushPopup")
                const _divOk = document.getElementById("hushPopupOk")
                const _divCancel = document.getElementById("hushPopupCancel")
                if (callbackCancel) _divCancel.style.display = "block"
                _divOk.addEventListener("click", function() { //onclick=xxx()로는 promise resolve 처리못함
                    _div.remove()
                    if (callbackOk) callbackOk()
                })
                _divCancel.addEventListener("click", function() {
                    _div.remove()
                    if (callbackCancel) callbackCancel()
                })
            },
            alert : (_text, callbackOk, callbackCancel) => {
                hush.msg.addHtml(_text)
                hush.msg.handleEvent(callbackOk, callbackCancel)
            },
            alertWait : (text, OKCancel) => new Promise((resolve) => { //async/await으로 복수개의 alert를 의도하는 순서대로 처리가능하게 함
                if (OKCancel) {
                    hush.msg.alert(text, function() {
                        resolve(true)
                    }, function() {
                        resolve(false)
                    }, true)
                } else {
                    hush.msg.alert(text, function() {
                        resolve(true)
                    }, null, true)
                }               
            }),
            popup : (_obj, callbackOk, callbackCancel) => { //간단한 html 팝업 - alert로도 가능하나 Size/backColor 정도 추가한 것임
                if (typeof _obj == "string") {
                    alert("hush.msg.popup의 첫번째 인수는 string이 아닌 object가 필요합니다.")
                    return
                }
                const _html = _obj.html
                if (!_html) {
                    alert("hush.msg.popup의 object내에 html이 필요합니다.")
                    return
                }
                const _width = 800 //maxWidth
                const _height = 900 //maxHeight
                const _backColor = _obj.backColor
                hush.msg.addHtml(_html, _width, _height, _backColor)
                hush.msg.handleEvent(callbackOk, callbackCancel)
            },
            popupWait : (_obj, OKCancel) => new Promise((resolve) => { //async/await으로 복수개의 popup을 의도하는 순서대로 처리가능하게 함
                if (OKCancel) {
                    hush.msg.popup(_obj, function() {
                        resolve(true)
                    }, function() {
                        resolve(false)
                    }, true)
                } else {
                    hush.msg.popup(_obj, function() {
                        resolve(true)
                    }, null, true)
                }               
            }),
            toastTextArr : [],
            toastSecArr : [],
            toastProcessing : false,
            toast : (_text, _sec) => {
                hush.msg.toastTextArr.push(_text)
                hush.msg.toastSecArr.push(_sec)
                hush.msg.toastLoop()
            },
            toastEnd : () => {
                const _div = document.getElementById("hushPopup")
                _div.remove()
                hush.msg.toastTextArr.splice(0, 1) //첫번째 아이템 제거
                hush.msg.toastSecArr.splice(0, 1) //첫번째 아이템 제거
                hush.msg.toastProcessing = false
                hush.msg.toastLoop()
            },
            toastLoop : () => {
                const _len = hush.msg.toastTextArr.length
                if (_len == 0) return 
                if (hush.msg.toastTextArr.length > 5) {
                    hush.msg.toastTextArr = []
                    hush.msg.toastSecArr = []
                    alert("토스트 메시지는 한번에 5개까지만 가능합니다.") 
                    return
                }
                if (hush.msg.toastProcessing) {
                    setTimeout(function() {
                        hush.msg.toastLoop()
                    }, 500)
                    return
                }
                hush.msg.toastProcessing = true
                hush.msg.addHtml(hush.msg.toastTextArr[0])                
                const _divBtn = document.getElementById("hushBtn")
                _divBtn.style.display = "none"
                const _divPopupMain = document.getElementById("hushPopupMain")
                _divPopupMain.style.minWidth = "0px"
                _divPopupMain.style.minHeight = "0px"
                const _sec = hush.msg.toastSecArr[0]
                if (_sec == -1) { 
                    //endless toast (예: 서버호출) : 사용자가 toastEnd()를 이용해 종료
                } else {
                    const sec = (!_sec ? 3 : _sec) * 1000
                    setTimeout(function() {
                        hush.msg.toastEnd()
                    }, sec)
                }
            }
        },
        util : {
            isvoid : (obj) => {
                if (typeof obj == "undefined" || obj == null) return true
                return false
            },
            getRnd : (_min, _max) => {
                const min = (!_min && _min != 0) ? 100000 : _min
                const max = (!_max && _max != 0) ? 999999 : _max
                return Math.floor(Math.random() * (max - min)) + min //return min(inclusive) ~ max(exclusive) Integer only 
            },
            openWinPop : (url, width, height, pos) => { //pos : 1) 없으면 중앙 2) 1~9999면 중앙인데 top만 지정 3) 0이면 (0, 0) 4) random은 랜덤
                let _left, _top
                const _width = width ? width : "550"
                const _height = height ? height : "700"
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
        }
    }
})()
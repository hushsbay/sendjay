//index.html 및 main.html에서 사용됨

var g_memWin, g_userkey, g_userid, g_usernm, g_orgcd, g_useridArr, g_unread = {}

let g_mode, g_mode_people, g_win_type, g_setting = {}
let g_list, g_page, g_cdt, g_searchmode, g_year, g_lastdt_for_toprow //g_lastdt_for_toprow = for mobil only
let prevType = "", g_setting_changed = false
let g_nodeIndent, portalListBeingQueried = false
let g_focusedRoomid = ""

const BTN_MODE_PEOPLE = "btn_people", BTN_MODE_CHAT = "btn_chat" //should be same as button id
const BTN_PEOPLE_TEAM = "btn_team", BTN_PEOPLE_COMPANY = "btn_company" //should be same as button id
const FIRST_QUERIED = "9999"
const runFromStandalone = (location.pathname == hush.cons.app) ? true : false //false means embeded talk

const resetEnvForScroll = () => {
    g_searchmode = false
    g_cdt = FIRST_QUERIED //FIRST_QUERIED(default). YYYYMMDD~ : when scrolled all the way down to the bottom, previous page shown and g_cdt gets YYYYMMDD~ value
    if ($("#spn_unread").css("display") != "none") handleDocTitle(-1)
}

const procScrollEvent = () => {            
    resetEnvForScroll()
    g_list.scroll(function() { //endless scroll
        if (g_searchmode) return
        const getMore = $("#getmore")
        if (!getMore || getMore.length == 0) return
        if (getMore.position().top <= g_list.height()) { //g_list position should be relative for checking position().top
            if (getMore.attr("getting") == "Y") return
            getMore.attr("getting", "Y")
            setTimeout(() => getPortalList({ type: "normal" }), 100)
        }
    })
}

const procMenuTop = async (_mode, _mode_people) => {
    try {
        if (!hush.http.chkOnline()) return
        g_mode = (_mode) ? _mode : BTN_MODE_PEOPLE
        $(".coNav").removeClass("coNavSelected")
        $(".coMenuBtn").hide()
        $("btn_close_search").hide()
        if (g_mode == BTN_MODE_PEOPLE) {
            $("#fr_menu_top").css("display", "flex")
            $("#fr_people").css("display", "flex")
            $("#fr_chat").hide()
            $("#fr_setting").hide()
            if (g_win_type == "org") {
                toggleForBtnCompany(true)
                $(".setting").show()
                $("#in_search").hide()
                $("#btn_search").hide()
                getOrgTree({ keyword : "", withMember : false, expand : 99 })
            } else {
                if (g_win_type == "invite" || g_win_type == "member") {
                    $(".setting").show()
                } else {
                    $(".people").show()
                }
                if (_mode_people) {
                    procMenuPeople(_mode_people, true)
                } else {
                    procMenuPeople(hush.http.getCookie("mode_people"))
                }
            }
        } else if (g_mode == BTN_MODE_CHAT) {
            $("#fr_menu_top").css("display", "flex")
            toggleForBtnCompany(false)
            $("#fr_people").hide()
            $("#fr_chat").css("display", "flex")
            $("#fr_setting").hide()
            $(".chat").show()
            resetEnvForScroll()
            getPortalList({ type: "normal" })
        } else { //btn_setting
            $("#fr_menu_top").hide()
            $("#fr_people").hide()
            $("#fr_chat").hide()
            $("#fr_setting").css("display", "flex")
            $(".setting").show()
            const rs = await hush.auth.verifyUser()
            if (rs.code == hush.cons.CODE_OK) procSetting("load", rs, true)
        }
        $("#" + g_mode).addClass("coNavSelected")
        $("#fr_menu_bottom").css("display", "flex")
        if (!_mode_people) hush.http.setCookie("mode", g_mode, true)
    } catch (ex) {
        hush.util.showEx(ex)
    }
}

const procMenuPeople = (_mode, popup) => {
    try {
        if (!hush.http.chkOnline()) return
        $("#in_search").val("")
        g_mode_people = (_mode) ? _mode : BTN_PEOPLE_TEAM
        if (g_mode_people == BTN_PEOPLE_TEAM) {
            getMembers("orgcd", g_orgcd)
            toggleForBtnCompany(false)
        } else { //BTN_PEOPLE_COMPANY
            getOrgTree({ keyword : "", withMember : true, expand : 0 })
            toggleForBtnCompany(true)
        }
        if (!popup) hush.http.setCookie("mode_people", g_mode_people, true)
    } catch (ex) {
        hush.util.showEx(ex)
    }
}

const toggleForBtnCompany = (show) => {
    if (show) {
        if (!hush.webview.on) {
            $("#btn_collapseall").show()
            $("#btn_expandall").show()
        }
        $("#chk_selectall").hide()
    } else {
        if (!hush.webview.on) {
            $("#btn_collapseall").hide()
            $("#btn_expandall").hide()
        }
        $("#chk_selectall").show()
    }
    $("#chk_selectall").prop("checked", false)
}

const procMemPanel = () => {
    const _cnt = $(".mem").length
    $("#selected_people_cnt").html(_cnt)
    if (_cnt > 0) {
        $("#selected_people").css("display", "flex")
    } else {
        $("#selected_people").hide()
    }            
}

const procSelect = (_userid) => {
    try {
        const _list = $("#select_people_sub")
        const tag = $("#sel_" + _userid)
        const _chk = tag.is(":checked")
        if (_chk) {
            if ($("#add_" + _userid).length > 0) {
                $("#add_" + _userid).effect("highlight", { color: hush.cons.fadein }, 500)
                return
            }
            const _nm = $("#nm_" + _userid).html()
            const _team = $("#team_" + _userid).html()
            let _html = "<div id=add_" + _userid + " class=mem>"
            _html += "      <div id=addnm_" + _userid + " class='coDotDot memNm coText'>" + _nm + "</div>"
            if (_team) _html += "  <div class='coDotDot memTeam coText'>" + _team.replace(/\s/g, "") + "</div>"
            _html += "   </div>"
            _list.append(_html)
            _list.scrollTop(_list.prop("scrollHeight"))
            const _useridTag = $("#add_" + _userid)
            _useridTag.effect("highlight", { color: hush.cons.fadein }, 100)
            _useridTag.off("click").on("click", function() {
                $(this).remove()
                $("#sel_" + _userid).prop("checked", false)
                procMemPanel()    
            })
            _useridTag.off("mouseover").on("mouseover", function() { $(this).addClass("memSel") })
            _useridTag.off("mouseleave").on("mouseleave", function() { $(this).removeClass("memSel") })
            procMemPanel()
        } else {
            const _useridTag = $("#add_" + _userid)
            _useridTag.remove()
            procMemPanel()
        }
    } catch (ex) {
        hush.util.showEx(ex)
    }
}

const procSearch = () => {
    if (!hush.http.chkOnline()) return
    const keyword = $("#in_search").val().trim()
    if (keyword.length == 0) {
        hush.msg.toast(hush.cons.msg.blank_requested)
        return
    } 
    if (g_mode === BTN_MODE_PEOPLE) {
        $("#btn_collapseall").hide()
        $("#btn_expandall").hide()
        getMembers("search", keyword)
    } else {
        getPortalList({ type: "search", keyword : keyword})        
    }    
    setTimeout(() => $("#in_search").blur(), 500)
}

const getMembers = async (type, keyword, tag) => { //group or search. (userids used in chat.html also)
    try {
        let _tag = tag
        const list = $("#list_people")
        let _attr = "", paddingLeft = 10, marginLeft = 0
        if (tag) { //concerned with getOrgTree() below
            _attr = "tagid=" + tag[0].id + " dispstate=flex"
            const _level = parseInt($("#" + tag[0].id).attr("level"))
            paddingLeft += (_level + 1) * g_nodeIndent
            marginLeft = 10
        } else {
            list.empty()
        }
        const rq = { type : type, keyword : encodeURIComponent(keyword) }
        const rs = await hush.http.ajax("/msngr/qry_userlist", rq)
        if (!hush.util.chkAjaxCode(rs)) return
        let userkeyArr = []
        const _len = rs.list.length
        for (let i = 0; i < _len; i++) {
            const row = rs.list[i]
            const _userid = row.USER_ID
            const w_userkey = hush.cons.w_key + _userid
            const m_userkey = hush.cons.m_key + _userid
            const _nm = row.USER_NM
            const _tel = row.TEL_NO
            const _job = row.JOB
            const _org = row.ORG_NM + " / " + row.TOP_ORG_NM
            const _abcd = row.AB_CD
            const _abnm = row.AB_NM
            const _nicknm = row.NICK_NM
            //const push_ios = row.PUSH_IOS
            //const push_and = row.PUSH_AND
            const state_mob = "coStateOff" //(push_ios && push_ios != hush.cons.invalid_push_token) || (push_and && push_and != hush.cons.invalid_push_token) ? "coStateMob mobInstalled" : "coStateOff"
            let disp_nick = "display:none;", disp_abcd = "display:none;", disp_abnm = "display:none;"
            if (_nicknm && !_abcd && !_abnm) disp_nick = ""
            if (_abcd) disp_abcd = ""    
            if (_abnm && !hush.webview.on) disp_abnm = ""   
            const disp_org = (type == "search" && !hush.webview.on) ? "" : "display:none" 
            let disp_job
            if (_job && type == "search") {
                disp_job = (hush.webview.on) ? "color:#005192" : "color:#005192;margin-left:10px"
            } else {
                disp_job = (_job) ? "" : "display:none;"
            }
            const disp_second = (disp_job == "display:none" && disp_org == "display:none") ? "flex-grow:0;display:none" : "flex-grow:1;display:flex"
            let _html = "<div id=mem_" + _userid + " " + _attr + " style='height:50px;display:flex;align-items:center;cursor:default;border-bottom:1px solid lightgray;overflow:hidden;padding-left:" + paddingLeft + "px'>"
            _html += "      <input type=checkbox id=sel_" + _userid + " class=chkbox_people style='visibility:hidden;margin-left:" + marginLeft + "px' />"
            _html += "      <img id=img_" + _userid + " src='" + hush.cons.img_noperson + "' class=coImg32 style='border-radius:5px;margin-left:8px' />"
            _html += "      <div id=per_" + _userid + " style='flex:1;min-width:0;height:100%;display:flex;flex-direction:column;cursor:pointer;margin-left:10px'>" //flex:1;min-width:0 used instead of width:calc
            _html += "          <div id=first_" + _userid + " style='flex-grow:1;display:flex;align-items:center;overflow:hidden;margin:3px 0px 0px 0px'>"
            _html += "              <span id=w_" + w_userkey + " class='state coStateOff'>W</span>"
            _html += "              <span id=m_" + m_userkey + " class='state " + state_mob + "' style='margin-left:5px'>M</span>"
            _html += "              <span id=nm_" + _userid + " class='coDotDot coText' style='min-width:55px;color:#005192;font-weight:bold;margin-left:5px'>" + _nm + "</span>"
            _html += "              <span id=nick_" + _userid + " class='coDotDot coText' style='" + disp_nick + "margin-left:10px'>[" + _nicknm + "]</span>"
            _html += "              <span id=abcd_" + _userid + " class='coStateOut coText' style='" + disp_abcd + "margin-left:10px'>" + _abcd + "</span>"
            _html += "              <span id=abnm_" + _userid + " class='coDotDot coText' style='" + disp_abnm + "margin-left:5px'>" + _abnm + "</span>"
            _html += "         </div>"
            _html += "          <div id=second_" + _userid + " style='" + disp_second + ";align-items:center;overflow:hidden;margin:-5px 0px 0px 0px'>"
            _html += "              <span id=team_" + _userid + " class='coDotDot coText' style='" + disp_org + "'>" + _org + "</span>"
            _html += "              <span id=job_" + _userid + " class='coDotDot coText' style='" + disp_job + "color:darkgray'>" + _job + "</span>"
            _html += "         </div>"
            _html += "      </div>"
            _html += "   </div>"
            if (_tag) {
                _tag.after(_html) //Just using tag not _tag causes ascending order to descending one.
                _tag = $("#mem_" + _userid)
            } else {
                list.append(_html)
            }
            userkeyArr.push(w_userkey)
            userkeyArr.push(m_userkey)
            hush.http.getUserPic(_userid, "img_" + _userid) //$("#per_" + _userid).off("click").on("click", async function(e) {
            $("#mem_" + _userid).off("click").on("click", async function(e) {
                if ($(e.target).is("input:checkbox")) return //checkbox를 클릭하면 event가 먹히도록 함
                hush.util.animBgColor($(this))
                await hush.msg.alert("이름 : " + _nm + "<br><br>전화 : <a href=tel:'" + _tel + "'>" + _tel + "</a><br>부서 : " + _org + "<br>직무 : " + _job + "<br><br>" + _abcd + " " + _abnm, null, "Info")
            })
        }
        if (_len == 0) return false          
        $(".chkbox_people").off("change").on("change", function() {
            const _userid = this.id.substring(4)
            procSelect(_userid)
        })  
        $(".chkbox_people").css("visibility", "visible")
        sendChkAlive(userkeyArr)
        return true
    } catch (ex) {
        hush.util.showEx(ex)
    }
}

const sendChkAlive = (userkeyArr) => {
    const dataObj = { userkeys : userkeyArr }
    if (hush.webview.ios) {
    } else if (hush.webview.and) {
        setTimeout(function() {
            AndroidCom.send(hush.cons.sock_ev_chk_alive, JSON.stringify(dataObj), null, null, false) //procMsg=false
        }, hush.cons.sec_for_webview_func) //비동기로 호출해야 동작
    } else {
        if (g_win_type == "invite") { //from chat.html
            hush.sock.send(opener.opener.hush.socket, hush.cons.sock_ev_chk_alive, dataObj, opener.g_roomid)
        } else if (g_win_type == "member") { //from index.html (popup)
            hush.sock.send(opener.hush.socket, hush.cons.sock_ev_chk_alive, dataObj)
        } else {
            hush.sock.send(hush.socket, hush.cons.sock_ev_chk_alive, dataObj)
        }
    }
}

const getOrgTree = async (obj) => { //예) const obj = { keyword : "", withMember : false, expand : 1 }
    //1) keyword = orgcd or blank (서버 sql option. 2)부터는 클라이언트 option)
    //2) withMember = true(노드 클릭시 다운로드됨 - memcnt attribute 참조) / false(singleSelect) / true(selectMemberOnly - cannot select Org node)
    //3) expand = -1,0,1,2.. (-1 : all collapsed, 1 : depth 0 and 1 expanded, 99 : all expanded)    
    try {
        const list = $("#list_people")
        list.empty()
        let rq = { keyword : encodeURIComponent(obj.keyword) }
        const rs = await hush.http.ajax("/msngr/qry_orgtree", rq) //without members
        if (!hush.util.chkAjaxCode(rs)) return
        const _len = rs.list.length
        const _objUpperLevel = {} //used for deciding child node's parent tag id
        for (let i = 0; i < _len; i++) {
            const row = rs.list[i]
            const orgcd = row.ORG_CD
            const orgnm = row.ORG_NM
            const level = row.LVL
            const memcnt = (obj.withMember) ? row.MEMCNT : -1 //-1 means no need to download members (when -1, every org node has -1)
            let disp = "", hasChild = "Y", expanded = "", parentid = "", chkDisp = ""
            if (i == _len - 1 || rs.list[i + 1].LVL <= level) hasChild = "N" //if hasChild is "N" then 'expanded' has no effect at all
            if (hush.util.isvoid(obj.expand) || obj.expand < 0) {
                disp = (level == 0) ? "flex" : "none"
                if (hasChild == "Y") expanded = " expanded=N"
            } else if (obj.expand > 99) {
                disp = "flex"
                if (hasChild == "Y") expanded = " expanded=Y"
            } else {
                disp = (level <= obj.expand + 1) ? "flex" : "none"
                if (hasChild == "Y") expanded = (level <= obj.expand) ? " expanded=Y" : " expanded=N"
            }
            if (!obj.withMember && level > 0) {
                chkDisp = ""
            } else {
                if (memcnt >= 2 && expanded.includes("=Y")) { //checkbox shown only if the node has multiple members and expanded for convenience of selecting members
                    chkDisp = ""
                } else {
                    chkDisp = "display:none;"
                }
            }
            if (level > 0 && _objUpperLevel[level - 1]) parentid = _objUpperLevel[level - 1]
            const expcolImg = (expanded.includes("=Y")) ? "minus_1" : "plus_1"                    
            const paddingLeft = 10 + level * g_nodeIndent
            let _html = "<div id=orgrow_" + i + " class=orgrow orgcd=" + orgcd + " dispstate=" + disp + " haschild=" + hasChild + " level=" + level + expanded + " memcnt=" + memcnt
            _html += "      memdownloaded=N parent='" + parentid + "' z-index=0 "
            _html += "      style='height:50px;display:" + disp + ";align-items:center;cursor:pointer;border-bottom:1px solid lightgray;padding-left:" + paddingLeft + "px'>"
            _html += "      <input type=checkbox id=orgsel_" + i + " class=orgsel z-index=1 style='" + chkDisp + "margin-left:10px' />"
            _html += "      <img src='/img/ico_dept.png' class=coImg16 style='margin-left:8px' />"
            _html += "      <div id=orgbody_" + i + " class='coDotDot orgbody' style='height:100%;flex:1;min-width:0;display:flex;align-items:center;margin-left:8px'>" //flex:1;min-width:0 used instead of width:calc
            _html += "          <div id=orgnm_" + i + " class='coDotDot coText' style='font-weight:bold'>" + orgnm + "</div>"
            let dispCnt = (memcnt <= 0) ? "" : "(" + memcnt + ")"
            _html += "          <div style='font-size:10px;color:darkgray;margin-left:10px'>" + dispCnt + "</div>"
            _html += "      </div>"
            _html += "      <div style='width:40px;display:flex;align-items:center;justify-content:flex-end;margin-right:8px'>"
            const dispImg = (hasChild == "Y") ? "" : "style='display:none'"
            _html += "          <img id=orgexpcol_" + i + " src='/img/" + expcolImg + ".png' class=coImg32 " + dispImg + " />"
            _html += "      </div>"
            _html += "  </div>"
            list.append(_html)
            _objUpperLevel[level] = "orgrow_" + i
            if (memcnt > 0 && level <= obj.expand) { //if node has child, it downloads members
                const _tag = $("#orgrow_" + i)
                const _done = await getMembers("orgcd", orgcd, _tag)
                if (_done) {
                    _tag.attr("memdownloaded", "Y")
                    _tag.attr("haschild", "Y")
                    procExpCol("N", _tag, i, obj) //N->Y
                }
            }
        }
        if (_len == 0) return
        $(".orgsel").off("change").on("change", function(e) { //e.stopPropagation() not worked since click event is one step ahead change event => changed to .orgbody from .orgrow
            const _self = $(this)
            const _id = this.id //eg) orgsel_2
            const _idx = parseInt(_id.substring(7)) //eg) 2
            const _bool = _self.prop("checked")
            if (obj.withMember) {
                if (_bool) {
                    _self.css("opacity", "0.2")
                } else {
                    _self.css("opacity", "1.0")
                }
                const _memTag = $("div[tagid='orgrow_" + _idx + "']") //see getMembers()  
                $(_memTag).each(function(idx) {
                    const _id = this.id //eg) mem_xxxxxx
                    const _userid = _id.substring(4) //eg) xxxxxx
                    const _selTag = $("#sel_" + _userid)
                    $(_selTag).prop("checked", _bool)
                    procSelect(_userid)
                })
            } else { //singleSelect if not withMember option
                $(".orgsel").prop("checked", false)
                if (_bool) _self.prop("checked", true)
            }
        }) //$(".orgbody").off("click").on("click", async function(e) { //const _id = this.id //eg) orgbody_2 //const _idx = parseInt(_id.substring(8)) //eg) 2 //const _tag = $("#orgrow_" + _idx) //eg) orgrow_2
        $(".orgrow").off("click").on("click", async function(e) {
            if ($(e.target).is("input:checkbox")) return //checkbox를 클릭하면 event가 먹히도록 함
            const _id = this.id //orgrow_2
            const _idx = parseInt(_id.substring(7)) //eg) 2
            const _tag = $(this) //eg) orgrow_2
            const _level = parseInt(_tag.attr("level"))
            const _expanded = _tag.attr("expanded") //Y or ~
            const _hasChild = _tag.attr("haschild") //Y or ~
            const _memcnt = parseInt(_tag.attr("memcnt"))
            const _memDownloaded = _tag.attr("memdownloaded") //Y or ~ => withMember option needed
            hush.util.animBgColor($(this)) //PC 브라우저에서는 문제없음. android webview에서는 행전체 effect와 .orgbody의 animcall이 같이 실행되는데 .orgbody가 높이가 더 커서 부자연스러움
            //원래 의도는 webview에서도 animCall만 먹었으면 좋겠는데 webview 자체의 efffect가 그것도 높낮이가 다른 두개의 effect가 보이는 것이 문제임 .orgbody의 height:100%로 해결함
            if (_hasChild == "Y") {
                const _nextTag = $("#orgrow_" + (_idx + 1))
                const levelNext = (_nextTag || _nextTag.length > 0) ? parseInt(_nextTag.attr("level")) : -1
                if (levelNext == -1 || levelNext <= _level) { //case of last level child
                    procExpCol(_expanded, _tag, _idx, obj)
                } else {
                    let j = 0
                    for (let i = _idx + 1; i < _len; i++) {
                        const _nextTag = $("#orgrow_" + i)
                        const levelNext = parseInt(_nextTag.attr("level"))
                        if (levelNext <= _level) break
                        if (_expanded == "Y") { //if expanded, it should be collapsed (child nodes to hide and save their display state)
                            if (levelNext == _level + 1) {
                                _nextTag.attr("dispstate", "none")
                            } else {
                                _nextTag.attr("dispstate", _nextTag.css("display"))
                            }
                            _nextTag.hide()
                        } else {   
                            if (levelNext == _level + 1) {
                                _nextTag.css("display", "flex")
                                _nextTag.attr("dispstate", "flex")
                            } else {
                                if ($("#" + _nextTag.attr("parent")).css("display") == "none") { //if parent node not displayed, child node should be not displayed too
                                    _nextTag.css("display", "none")
                                } else { //or recall child node's display state
                                    _nextTag.css("display", _nextTag.attr("dispstate"))
                                }
                            }
                        }
                        j += 1
                    }  
                    if (j > 0) procExpCol(_expanded, _tag, _idx, obj)
                }
                if (_memcnt > -1) { //belows are should be processed if _memcnt is 0 (-1 is for withMember option false)
                    for (let i = _idx; i < _len; i++) { //The above is for org node display and below is for member toggle (display or not)
                        const _tag = $("#orgrow_" + i)
                        const _tagLevel = parseInt(_tag.attr("level"))
                        const _memDownloadedTag = (_tag) ? _tag.attr("memdownloaded") : "N"
                        const _memTag = $("div[tagid='" + _tag[0].id + "']") //see getMembers()                          
                        if (i > _idx && _tagLevel <= _level) break
                        if (_memDownloadedTag != "Y") continue
                        if (_expanded == "Y") { //if expanded, it should be collapsed (child nodes to hide and save their display state)
                            if (_tagLevel == _level) {
                                $(_memTag).attr("dispstate", "none")
                            } else {
                                $(_memTag).attr("dispstate", $(_memTag).css("display"))
                            }
                            $(_memTag).hide()
                        } else {
                            if (_tagLevel == _level) {  
                                $(_memTag).css("display", "flex")
                            } else {
                                if ($("#" + _tag.attr("parent")).css("display") == "none") { //if parent node not displayed, child node should be not displayed too
                                    $(_memTag).css("display", "none")
                                } else { //or recall child node's display state
                                    $(_memTag).css("display", $(_memTag).attr("dispstate"))
                                }
                            }
                        }
                    }
                }
            }
            if (_memcnt > 0 && _memDownloaded != "Y" && _expanded != "Y") { //if current node has child, it downloads members when clicked
                const _orgcd = _tag.attr("orgcd")
                const _done = await getMembers("orgcd", _orgcd, _tag)
                if (_done) {
                    _tag.attr("memdownloaded", "Y")
                    _tag.attr("haschild", "Y")
                    procExpCol("N", _tag, _idx, obj) //N->Y
                }
            }
        })
        $("#btn_collapseall").off("click").on("click", function() {
            const _len = $(".orgrow").length
            for (let i = 0; i < _len; i++) {
                const _tag = $("#orgrow_" + i)
                const _level = parseInt(_tag.attr("level"))
                const _memDownloadedTag = (_tag) ? _tag.attr("memdownloaded") : "N"
                const _memTag = $("div[tagid='" + _tag[0].id + "']") //see getMembers()                            
                if (_tag.attr("haschild") == "Y") procExpCol("Y", _tag, i, obj) //Y->N
                if (_level > 0) {
                    _tag.hide()
                    _tag.attr("dispstate", "none")
                    if (_memDownloadedTag == "Y") { //memdownloaded attribute gets Y when withMember option to true and after downloaded
                        $(_memTag).attr("dispstate", "none")
                        $(_memTag).hide()
                    }
                }
            }
        })
        $("#btn_expandall").off("click").on("click", function() {
            const _len = $(".orgrow").length
            for (let i = 0; i < _len; i++) {
                const _tag = $("#orgrow_" + i)
                const _memDownloadedTag = (_tag) ? _tag.attr("memdownloaded") : "N"
                const _memTag = $("div[tagid='" + _tag[0].id + "']") //see getMembers()   
                _tag.css("display", "flex")
                _tag.attr("dispstate", "flex")
                if (_tag.attr("haschild") == "Y") procExpCol("N", _tag, i, obj) //N->Y
                if (_memDownloadedTag == "Y") { //memdownloaded attribute gets Y when withMember option to true and after downloaded
                    $(_memTag).attr("dispstate", "flex")
                    $(_memTag).css("display", "flex")
                }
            }
        })
    } catch (ex) {
        hush.util.showEx(ex)
    }
}

const procExpCol = (_expanded, _tag, _idx, _obj) => {
    const _tagExpcol = $("#orgexpcol_" + _idx)
    if (_tagExpcol.css("display") == "none") _tagExpcol.show()
    if (_expanded == "Y") {
        _tag.attr("expanded", "N")
        _tagExpcol.attr("src", "/img/plus_1.png")
    } else {
        _tag.attr("expanded", "Y")
        _tagExpcol.attr("src", "/img/minus_1.png")
    }
    if (_obj.withMember) {
        if (parseInt(_tag.attr("memcnt")) >= 2 && _tag.attr("expanded") == "Y") {
            $("#orgsel_" + _idx).show()
        } else {
            $("#orgsel_" + _idx).prop("checked", false)
            $("#orgsel_" + _idx).hide()
        }
    }
}

const dispCustom = (body) => {
    const _arr = body.split(hush.cons.subdeli)
    let _msg
    if (_arr.length == 1) {
        _msg = body
    } else {
        _body = body.substring(_arr[0].length + 2) //ex) file$$!
        _msg = hush.util.displayTalkBodyCustom(_arr[0], _body)
    }
    return _msg.replace(/<br>/gi, " ") //ex) ~ <br>invited by ~
}

const getPortalList = async (obj) => {
    try {  
        if (portalListBeingQueried && obj.type != "row") return
        portalListBeingQueried = true
        let noToast = false, rq = { type : obj.type }
        if (obj.type == "search") {
            g_list.empty()
            rq.keyword = encodeURIComponent(obj.keyword)
            $("#btn_close_search").show()
        } else if (obj.type == "row") {
            rq.roomid = obj.roomid
            noToast = true
        } else if (obj.type == "reconnect") {
            rq.dt = FIRST_QUERIED
            rq.cnt = 1
        } else { //normal (endless scrolling)
            rq.dt = g_cdt
            rq.cnt = hush.cons.fetch_cnt_list //if (g_cdt == FIRST_QUERIED) g_list.empty()
        }
        const rs = await hush.http.ajax("/msngr/qry_portal", rq, noToast)
        if (rs.code != hush.cons.CODE_OK) {
            hush.msg.showMsg(rs.msg, rs.code)
            if ($("#getmore").length > 0) $("#getmore").remove()
            portalListBeingQueried = false
            return
        } //obj.replace가 true가 아니면 해당 채팅방(row)은 맨 위로 위치
        if (obj.type == "reconnect") {
            portalListBeingQueried = false
            if (rs.list.length == 0) return //console.log(rs.list[0].LASTDT + "===" + g_lastdt_for_toprow)
            if (rs.list[0].LASTDT == g_lastdt_for_toprow) return
            procMenuTop(hush.http.getCookie("mode"))
            return
        }
        if (obj.roomid && !obj.replace) $("#div_" + obj.roomid).remove() //ex) obj.replace used for when 'leave' 
        let lastRoomid = ""
        if ($(".div_row").length > 0) lastRoomid = $(".div_row").last()[0].id
        const _len = rs.list.length
        if (_len == 0) {
            if (g_cdt == FIRST_QUERIED) {
                hush.msg.toast(hush.cons.MSG_NO_DATA)
            } else {
                $("#getmore").html(hush.cons.MSG_NO_MORE_DATA)
                setTimeout(() => $("#getmore").remove(), 1000)    
            }
            portalListBeingQueried = false
            return
        }
        if (obj.type == "search") g_searchmode = true
        if (obj.type == "normal" && g_cdt == FIRST_QUERIED) g_list.empty()
        for (let i = 0; i < _len; i++) {
            const row = rs.list[i]
            const _roomid = row.ROOMID
            const _roomnm = hush.sock.getRoomName(row.NICKNM, row.MAINNM, row.ROOMNM)
            const _memcnt = row.MEMCNT
            const _noti = row.NOTI 
            hush.sock.roomMap[_roomid] = { nm: _roomnm, noti: _noti }
            const _lastmsg = (row.LASTMSG) ? dispCustom(row.LASTMSG) : "No Message"
            g_cdt = row.LASTDT
            if (i == 0) {
                if (obj.type == "normal" || (obj.roomid && !obj.replace)) g_lastdt_for_toprow = row.LASTDT //ex) ignore when member leave
            }
            let _lastdt = (g_cdt) ? hush.util.formatMsgDt(hush.util.tzDateTime(g_cdt), g_year, true) : "" //timezone            
            let _html = "<div id=div_" + _roomid + " class=div_row style='width:100%;height:50px;display:flex;align-items:center;border-bottom:1px solid lightgray'>"
            _html += "      <input type=checkbox id=sel_" + _roomid + " class=chkbox_portal style='margin-left:10px' />"
            _html += "      <div id=subdiv_" + _roomid + " class=row_portal style='flex:1;min-width:0;height:100%;align-self:stretch;display:flex;flex-direction:column;cursor:pointer;margin:0px 10px'>"
            _html += "          <div style='width:100%;height:50%;display:flex;align-items:flex-end;margin:2px 0px'>"
            _html += "              <div class='coDotDot coText' style='flex:1;min-width:0;color:#005192;font-weight:bold'>" + _roomnm + "</div>" //flex:1;min-width:0 used instead of width:calc
            _html += "              <div style='width:70px;display:flex;align-items:center;justify-content:flex-end'>"
            const _noti_visible = (_noti == "X") ? "" : "display:none;"
            _html += "                  <img id=alarm_" + _roomid + " src='/img/notify_off_com.png' style='" + _noti_visible + "width:18px;height:18px;vertical-align:middle'/>"
            _html += "                  <span id=unread_" + _roomid + " style='display:none;border-radius:8px;background-color:orange;color:white;font-size:10px;padding:2px 6px;margin-left:10px'></span>"
            _html += "                  <span style='color:darkgray;font-size:10px;margin-left:10px'>" + _memcnt + "</span>"
            _html += "              </div>"
            _html += "          </div>"
            _html += "          <div style='width:100%;height:50%;display:flex;align-items:flex-start;margin:2px 0px'>"
            _html += "              <div id=body_" + _roomid + " class='coDotDot coText' style='flex:1;min-width:0;color:darkgray'>" + _lastmsg + "</div>"
            _html += "              <div id=udt_" + _roomid + " class=coText style='width:100px;color:darkgray;text-align:right'>" + _lastdt + "</div>"
            _html += "          </div>"
            _html += "      </div>"
            _html += "   </div>"
            if (!obj.roomid) {
                g_list.append(_html)
                if (i == _len - 1 && !g_searchmode) { //endless scroll
                    if ($("#getmore").length > 0) $("#getmore").remove()
                    const _last = $("#div_" + _roomid)
                    if (_last && _last.length > 0) {
                        if (_last.position().top + _last.height() + 1 >= g_list.height()) { //g_list position should be relative for checking position().top. 1 is border.
                            _html = "<div id=getmore style='height:50px;display:flex;align-items:center;justify-content:center;background:steelblue;color:white'>processing..</div>"
                            g_list.append(_html)
                            _last.css("border-bottom", "1px solid steelblue")
                        }
                    }
                }
            } else {
                if (obj.replace) {
                    $("#div_" + obj.roomid).replaceWith(_html)
                } else {
                    g_list.prepend(_html) //To the top of list
                }
            }
            const _closeNoti = (obj.type == "row") ? false : true
            getUnreadPerEachRoom(_roomid, _closeNoti) //Or you can check unreads at a time by using 'group by roomid' sql in qry_unread.js
        }
        //if (obj.type == "normal" && g_cdt != FIRST_QUERIED && lastRoomid != "") hush.util.animCall(lastRoomid, true) //tells if next fetch exists
        const _tag = (obj.roomid) ? "#div_" + obj.roomid : ".div_row" //const _tag = (obj.roomid) ? "#subdiv_" + obj.roomid : ".row_portal"
        $(_tag).off("click").on("click", function(e) {
            if (!hush.http.chkOnline()) return
            hush.util.animBgColor($(this))
            if ($(e.target).is("input:checkbox")) return //checkbox를 클릭하면 event가 먹히도록 함
            const _id = this.id            
            const _roomid = _id.substring(4) //const _roomid = _id.substring(7)
            if (hush.webview.ios) {
            } else if (hush.webview.and) {
                setTimeout(() => AndroidMain.openRoom("open", _roomid, "portal", ""), hush.cons.sec_for_webview_func) //비동기로 호출해야 동작함
            } else {
                hush.sock.openRoom("/app/msngr/chat.html", _roomid, "portal")
            }
        })
        portalListBeingQueried = false
    } catch (ex) {
        portalListBeingQueried = false
        if (obj.type != "reconnect") hush.util.showEx(ex) //hush.msg.toast("getPortalList: " + obj.type + ": " + ex.message)
    }
}

const getUnreadPerEachRoom = async (roomid, chkCloseNoti) => { //no unread display in case of invite/leave msg  
    if (roomid == g_focusedRoomid) return 
    if (!hush.http.chkOnline("none")) return 
    const rs = await hush.http.ajax("/msngr/qry_unread", { roomid : roomid })
    if (!hush.util.chkAjaxCode(rs, true)) return
    if (rs.list[0] && rs.list[0].UNREAD) {
        const _unread = rs.list[0].UNREAD
        if (_unread == 0) {
            $("#unread_" + roomid).hide() //for positioning problem
            $("#unread_" + roomid).html("0") //for calculation
            if (chkCloseNoti) closeNoti(roomid, true) //closeNoti(roomid, null, true)
        } else {
            $("#unread_" + roomid).show()
            $("#unread_" + roomid).html(_unread)
        }
    }
}

const handleDocTitle = (unreads) => {
    const CHECK_UNREADS = " - Check Unreads"
    if (unreads == 1) {
        if (runFromStandalone) {
            $("#spn_unread").show()
            document.title = hush.cons.title + CHECK_UNREADS
        } else {
            document.title += CHECK_UNREADS
        }
        document.getElementById("favicon").setAttribute("href", "/img/unread.png")
    } else if (unreads == 0) {
        if (runFromStandalone) {
            document.title = hush.cons.title
        } else {
            if (document.title.includes(CHECK_UNREADS)) document.title = document.title.replace(CHECK_UNREADS, "")
            document.title += " (with Talk)"
        }       
        document.getElementById("favicon").setAttribute("href", hush.cons.logo_darkblue)
    } else { //-1 (standalone)
        $("#spn_unread").hide()
        document.title = hush.cons.title
        document.getElementById("favicon").setAttribute("href", hush.cons.logo_darkblue)
    }
}

const getUnreadForAll = async () => {
    //유사한 호출을 하는 getUnreadPerEachRoom()는 웹뷰에서 채팅탭을 눌렀을 때 돌아가는 getPortalList()안에서 돌아가는 것이고
    //여기 getUnreadForAll()는 앱에서는 최초 연결시, 웹에서는 채팅탭이 아닌 다른 탭이 열릴 때 돌아가는 것임
    //따라서, 앱에서 최초 연결시 결과와 그 외의 결과는 달라야 함. 
    try { //예를 들어, 안드로이드 ChatService.kt에서 먼저 qry_unread로 LASTCHKDT 필드 업데이트하면 PC브라우저에서는 안읽은 톡 정보 없는 것으로 나타날 것임 
        if (!hush.http.chkOnline("none")) return
        const rs = await hush.http.ajax("/msngr/qry_unread", {})
        if (!hush.util.chkAjaxCode(rs, true)) return
        const _len = rs.list.length
        if (_len == 0) {
            handleDocTitle(0)
        } else {
            handleDocTitle(1)
            for (let i = 0; i < _len; i++) g_unread[rs.list[i].ROOMID] = rs.list[i].UNREAD
        }
    } catch (ex) {
        hush.util.showEx(ex)
    }
}

const closeNoti = (roomid, skipGetUnreadPerEachRoom) => {
    if (!hush.webview.on) {
        const noti = hush.noti.notis[roomid]
        if (noti) {
            noti.close()
            delete hush.noti.notis[roomid] //common.js의 procNoti() 1)2)3) 참고하기
        }
    } 
    procUnreadTitle(roomid)
    if (!skipGetUnreadPerEachRoom) getUnreadPerEachRoom(roomid)
}

const initMsg = (_roomid) => { //differ from chat.html
    const _msgid = hush.util.createId()
    const _curdt = hush.util.getCurDateTimeStr(true) //local backup in a sence
    return { msgid : _msgid, senderkey : g_userkey, senderid : g_userid, sendernm : g_usernm, cdt : _curdt, filestate : "", body : "", type : "", reply : "", roomid : _roomid, roomnm : "" }
}

function procNewChatFromPopup(useridArr) { //invoked from index.html (member) popup : Web Only
    if (useridArr.length == 0) return
    g_useridArr = useridArr
    hush.sock.createRoom("/app/msngr/chat.html", "newFromPopup")            
}

const chkTime = async (tm) => {
    if (tm == "") return true
    if (tm.length != 4 || parseInt(tm) < 0 || parseInt(tm) > 2400) {
        await hush.msg.alert("Time should be between 0000 and 2400.")
        return false
    }
    return true
}

const procSettingOnLoad = (rs) => { //rs from hush.auth.verifyUser(true)
    g_setting.nicknm = (rs.NICK_NM) ? rs.NICK_NM : ""
    g_setting.job = (rs.JOB) ? rs.JOB : ""
    g_setting.abcd = (rs.AB_CD) ? rs.AB_CD : ""
    g_setting.abnm = (rs.AB_NM) ? rs.AB_NM : ""
    hush.http.setCookie("standalone", rs.STANDALONE)
    hush.http.setCookie("notioff", rs.NOTI_OFF)
    hush.http.setCookie("soundoff", rs.SOUND_OFF)
    hush.http.setCookie("viboff", rs.VIB_OFF)
    hush.http.setCookie("bodyoff", rs.BODY_OFF)
    hush.http.setCookie("senderoff", rs.SENDER_OFF)
    g_setting.fr = (rs.TM_FR) ? rs.TM_FR : ""
    g_setting.to = (rs.TM_TO) ? rs.TM_TO : ""
}

const procSetting = async (type, rs, needPicture) => { //type(load,save,cancel) //rs from hush.auth.verifyUser(true)
    try {
        if (type == "load") {
            procSettingOnLoad(rs)
            $("#in_nicknm").val(g_setting.nicknm)
            $("#header_title").html(g_usernm + ((g_setting.nicknm != "") ? " [" + g_setting.nicknm + "]" : ""))
            $("#in_job").val(g_setting.job)
            $("#in_abcd").val(g_setting.abcd)
            $("#in_abnm").val(g_setting.abnm)
            $("#chk_standalone").prop("checked", (rs.STANDALONE == "Y" ? true : false))
            $("#chk_notioff").prop("checked", (rs.NOTI_OFF == "Y" ? true : false))  
            $("#chk_soundoff").prop("checked", (rs.SOUND_OFF == "Y" ? true : false))  
            $("#chk_viboff").prop("checked", (rs.VIB_OFF == "Y" ? true : false))  
            $("#chk_bodyoff").prop("checked", (rs.BODY_OFF == "Y" ? true : false))
            $("#chk_senderoff").prop("checked", (rs.SENDER_OFF == "Y" ? true : false))      
            $("#in_fr").val(g_setting.fr)
            $("#in_to").val(g_setting.to)      
            if (needPicture) hush.http.getUserPic(g_userid, "img_pict")
        } else if (type == "save") {
            const _nicknm = $("#in_nicknm").val().trim()
            const _job = $("#in_job").val().trim()
            const _abcd = $("#in_abcd").val().trim()
            const _abnm = $("#in_abnm").val().trim()
            if (!await hush.util.chkFieldVal(_nicknm, "별칭/상태", 0, hush.cons.max_nicknm_len)) return false
            if (!await hush.util.chkFieldVal(_job, "직무", 0, 50)) return false
            if (!await hush.util.chkFieldVal(_abcd, "부재코드", 0, 7)) return false
            if (!await hush.util.chkFieldVal(_abnm, "부재내용/기간", 0, 50)) return false    
            const _standalone = $("#chk_standalone").is(":checked") ? "Y" : ""
            const _notioff = $("#chk_notioff").is(":checked") ? "Y" : ""
            const _soundoff = $("#chk_soundoff").is(":checked") ? "Y" : ""
            const _viboff = $("#chk_viboff").is(":checked") ? "Y" : ""
            const _fr = $("#in_fr").val().trim()
            const _to = $("#in_to").val().trim()
            if (!chkTime(_fr)) return false
            if (!chkTime(_to)) return false
            if ((_fr == "" && _to != "") || (_fr != "" && _to == "")) throw new Error("알림시간이 빈칸입니다.")
            const _bodyoff = $("#chk_bodyoff").is(":checked") ? "Y" : ""                       
            const _senderoff = $("#chk_senderoff").is(":checked") ? "Y" : ""              
            const rq = { nicknm : encodeURIComponent(_nicknm), job : encodeURIComponent(_job), //type : "common", 
                        abcd : encodeURIComponent(_abcd), abnm : encodeURIComponent(_abnm), standalone : _standalone, notioff : _notioff,
                        soundoff : _soundoff, viboff : _viboff, bodyoff : _bodyoff, senderoff : _senderoff, fr : _fr, to : _to }
            const rs = await hush.http.ajax("/msngr/proc_env", rq)
            if (rs.code != hush.cons.CODE_OK) throw new Error(rs.msg)
            $("#header_title").html(g_usernm + ((_nicknm != "") ? " [" + _nicknm + "]" : ""))
            g_setting.nicknm = _nicknm            
            g_setting.job = _job
            g_setting.abcd = _abcd
            g_setting.abnm = _abnm            
            hush.http.setCookie("standalone", _standalone)
            hush.http.setCookie("notioff", _notioff)
            hush.http.setCookie("soundoff", _soundoff)
            hush.http.setCookie("viboff", _viboff)
            hush.http.setCookie("bodyoff", _bodyoff)
            hush.http.setCookie("senderoff", _senderoff)
            g_setting.fr = _fr
            g_setting.to = _to
            const rq1 = { kind : "userinfo", userkey : g_userkey, nicknm : _nicknm, job : _job, abcd : _abcd, abnm : _abnm, notioff : _notioff,  
            soundoff : _soundoff, viboff : _viboff, bodyoff : _bodyoff, senderoff : _senderoff, fr : _fr, to : _to }
            if (hush.webview.ios) {
            } else if (hush.webview.and) {
                setTimeout(function() {
                    AndroidCom.send(hush.cons.sock_ev_set_env, JSON.stringify(rq1), "all", null, true) //procMsg=true
                }, hush.cons.sec_for_webview_func) //비동기로 호출해야 동작
            } else {
                hush.sock.send(hush.socket, hush.cons.sock_ev_set_env, rq1, "all")
            }
        } else { //cancel
            $("#in_nicknm").val(g_setting.nicknm)
            $("#in_job").val(g_setting.job)
            $("#in_abcd").val(g_setting.abcd)
            $("#in_abnm").val(g_setting.abnm)  
            $("#chk_standalone").prop("checked", (hush.http.getCookie("standalone") == "Y" ? true : false))
            $("#chk_notioff").prop("checked", (hush.http.getCookie("notioff") == "Y" ? true : false))
            $("#chk_soundoff").prop("checked", (hush.http.getCookie("soundoff") == "Y" ? true : false))
            $("#chk_viboff").prop("checked", (hush.http.getCookie("viboff") == "Y" ? true : false))
            $("#chk_bodyoff").prop("checked", (hush.http.getCookie("bodyoff") == "Y" ? true : false))
            $("#chk_senderoff").prop("checked", (hush.http.getCookie("senderoff") == "Y" ? true : false))
            $("#in_fr").val(g_setting.fr)  
            $("#in_to").val(g_setting.to)
        }
    } catch (ex) {
        hush.util.showEx(ex)
        return false
    }
}

const getRoomInfo = (roomid) => {
    $("#chk_selectall").prop("checked", false)
    if ($("#div_" + roomid).length > 0) getPortalList({ type: "row", roomid : roomid, replace: true })
}

const chkRoomFocus = () => { //웹에서만 호출. 앱에서의 채팅방이 현재 포커싱되어 있는지 파악해 웹에서 노티를 표시할지 여부를 결정하기 위함
    return
    if (hush.http.chkOnline("none")) {
        hush.sock.send(hush.socket, hush.cons.sock_ev_chk_roomfocus, { })
        console.log("chkRoomFocus")
    }
    setTimeout(() => chkRoomFocus(), 3000)
}

function OnSearch(input) {
    if (input.value == "") {
        if (g_win_type == "invite" || g_win_type == "member" || g_win_type == "org") {
            procMenuTop(BTN_MODE_PEOPLE, BTN_PEOPLE_COMPANY)
        } else {
            procMenuTop(hush.http.getCookie("mode"))
        }
    }
    setTimeout(() => $("#in_search").blur(), 500)
}

var procUnreadTitle = (roomid) => { //call from chat.html
    //document.title에 안읽은톡 표시는 메신저가 시작하기 전까지 안읽은 톡 갯수만 다루고 시작 이후의 톡은 대상으로 하지 않음.
    if (!$.isEmptyObject(g_unread)) {
        delete g_unread[roomid]
        if ($.isEmptyObject(g_unread)) handleDocTitle(false)
    }
}

var funcSockEv = { //needs to be public
    [hush.cons.sock_ev_chk_alive] : (data) => { //[...]
        for (let item of data) hush.util.displayOnOff(item, true)
        if (g_memWin && !g_memWin.closed) g_memWin.funcSockEv[hush.cons.sock_ev_chk_alive].call(null, data)
    },
    [hush.cons.sock_ev_show_off] : (userkey) => {
        hush.util.displayOnOff(userkey, false) //클라이언트가 명시적으로 요청(보내지) 않고 서버 disconnect.js에서 보냄
        if (g_memWin && !g_memWin.closed) g_memWin.funcSockEv[hush.cons.sock_ev_show_off].call(null, userkey)
    },
    [hush.cons.sock_ev_show_on] : (userkey) => {
        hush.util.displayOnOff(userkey, true) //클라이언트가 명시적으로 요청(보내지) 않고 서버 app.js에서 보냄 : 맨 처음 로드시 자신이 랜더링되는 것보다 서버 전송이 더 빨라서 반영안될 것임
        if (g_memWin && !g_memWin.closed) g_memWin.funcSockEv[hush.cons.sock_ev_show_on].call(null, userkey) 
    },
    [hush.cons.sock_ev_send_msg] : async (data) => {
        try {
            if (data.type == "leave") {
                if (!runFromStandalone) return
                const who = data.reply ? data.reply : data.senderid //data.reply = 강제퇴장
                if (who == g_userid) {
                    $("#div_" + data.roomid).remove()
                    if (!hush.webview.on) {
                        const _win = hush.sock.rooms[data.roomid]
                        if (_win && !_win.closed) {
                            _win.close()
                            delete hush.sock.rooms[data.roomid]
                        }
                    }
                } else {
                    getPortalList({ type: "row", roomid : data.roomid, replace: true })
                }
            } else {
                const _win = hush.sock.rooms[data.roomid]
                if (_win && !_win.closed) {
                    if (!_win.document.hasFocus() && data.roomid != g_focusedRoomid) hush.noti.procNoti(data.roomid, data)
                } else {
                    if (data.roomid != g_focusedRoomid) hush.noti.procNoti(data.roomid, data)
                }
                if (!runFromStandalone) return
                getPortalList({ type: "row", roomid : data.roomid })
            }
        } catch (ex) {
            await hush.msg.alert("[main]sock_ev_send_msg: " + ex.message)
        }
    },
    [hush.cons.sock_ev_read_msg] : (data) => { //if (data.type != "updateall") debugger //창 포커싱때 updateall이 일어나는데 그 때 debug하려면 chat.html로 갈 수가 없어 updateall은 제외
        if (data.userid != g_userid) return //새 메시지 도착시에는 return되고 새로 도착한 노티 클릭시에는 다음으로 넘어감
        $("#chk_selectall").prop("checked", false)
        $(".chkbox_portal:checked").prop("checked", false)
        if (data.type == "updateall") { //socket.emit for both Desktop/Mobile. 채팅방 열고 나면 모두 읽은 것으로 하기
            const objUnread = $("#unread_" + data.roomid)
            objUnread.hide()
            objUnread.html("0")
        }
        closeNoti(data.roomid)
    },
    [hush.cons.sock_ev_rename_room] : (data) => {
        getRoomInfo(data.roomid)
    },
    [hush.cons.sock_ev_delete_msg] : (data) => {
        getRoomInfo(data.roomid)
    },
    [hush.cons.sock_ev_revoke_msgcell] : (data) => {
        getRoomInfo(data.roomid)
    },
    [hush.cons.sock_ev_set_env] : async (data) => {
        if (data.kind == "noti") { //emit
            getRoomInfo(data.roomid)
        } else if (data.kind == "userinfo") { //broadcast inside namespace
            if (data.userid == g_userid && data.userkey != g_userkey) {
                const rs = await hush.auth.verifyUser()
                if (rs.code == hush.cons.CODE_OK) procSetting("load", rs)
            }
            const _nicknm = data.nicknm ? "[" + data.nicknm + "]" : ""
            $("#nick_" + data.userid).html(_nicknm)
            $("#job_" + data.userid).html(data.job)
            $("#abcd_" + data.userid).html(data.abcd)
            $("#abnm_" + data.userid).html(data.abnm)
            if (data.abcd || data.abnm) {
                $("#nick_" + data.userid).hide()
                $("#abcd_" + data.userid).show()
                $("#abnm_" + data.userid).show()
            } else {
                $("#nick_" + data.userid).show()
                $("#abcd_" + data.userid).hide()
                $("#abnm_" + data.userid).hide()
            }
            hush.sock.getAllRoomsOpen((win) => { //huga라는 코드를 보이게 함
                const _tag = $("#abcd_" + data.userid, win.document)
                _tag.html(data.abcd)
                if (data.abcd) {
                    _tag.show()
                } else {
                    _tag.hide()
                }
            })
        }          
    },
    [hush.cons.sock_ev_cut_mobile] : async (data) => {
        await hush.msg.alert("Logout done. (including mobile device)")
    },
    [hush.cons.sock_ev_disconnect] : (data) => { //mobile only
        console.log("disconnected from server : " + JSON.stringify(data))
        // $("#img_disconn").show() //hush.msg.toast("disconnected", false, true)
        // $("#btn_refresh").hide()
        // $("#btn_logout").hide()
        toggleDisconnIcon(true)
    },
    [hush.cons.sock_ev_mark_as_connect] : (data) => {//mobile only
        // $("#img_disconn").hide() //hush.msg.toastEnd()
        // $("#btn_refresh").show()
        // $("#btn_logout").show()
        toggleDisconnIcon(false)
    },
    [hush.cons.sock_ev_connect] : (data) => { //mobile only (reconnect event in actual)
        //Be careful that Socket.EVENT_CONNECT occurred many times at a moment. => from ChatService.kt
        // $("#img_disconn").hide() //hush.msg.toastEnd()
        // $("#btn_refresh").show()
        // $("#btn_logout").show()
        toggleDisconnIcon(false)
        if (g_mode == BTN_MODE_PEOPLE) {
            const userkeyArr = []
            $(".state").each(function(idx, item) {
                userkeyArr.push(this.id.substring(2))
            }).promise().done(function() {
                sendChkAlive(userkeyArr)
            })
        } else if (g_mode == BTN_MODE_CHAT) {
            getPortalList({ type: "reconnect" }) //procMenuTop(hush.http.getCookie("mode"))
        }
        setTimeout(function() {
            AndroidCom.reconnectDone()
        }, hush.cons.sec_for_webview_func) //비동기로 호출해야 동작
    },
    [hush.cons.sock_ev_chk_roomfocus] : (data) => {
        console.log("data.focusedRoomid"+"==="+data.focusedRoomid)
        //focusedRoomid는 웹에서 앱으로 (단방향으로만) 요청하는 소켓정보임
        //focusedRoomid가 빈칸이 아니면 현재 앱에서 해당 roomid로 챗방이 맨위에 열려 있고 스크린도 On 상태이어서
        //톡을 보내면 웹과 앱이 모두 접속된 상태에서 앱에서는 계속 메시지가 읽음처리가 되므로 웹에서는 노티가 필요없게 됨. 
        //그 반대의 경우는 앱에서 노티체크를 1초정도 delay시켜서 하기 때문에 웹에서 챗방에 포커스가 가 있으면 이미 읽음처리되므로 노티가 필요없게 됨
        g_focusedRoomid = data.focusedRoomid
    },
}

const startMsngr = async (launch, winid) => {
    if (hush.webview.on) return true
    if (!window.Notification) { //window.Notification || window.mozNotification || window.webkitNotification
        await hush.msg.alert("This browser does not support window.Notification.")
        return false
    }
    if (!indexedDB) {
        await hush.msg.alert("This browser does not support HTML5 IndexedDB.")
        return false
    }
    if (!Worker) {
        await hush.msg.alert("This browser does not support HTML5 Web Worker.")
        return false
    }
    if (location.protocol != "https:") { //http not allowed for notification with chrome
        await hush.msg.alert("Https가 필요합니다. (HTML5 Notification 등)")
        return false
    }    
    const permission = await window.Notification.requestPermission() 
    if (permission != "granted") {                        
        await hush.msg.alert("Notification 권한이 필요합니다.")
        return false
    }
    const rs = await hush.auth.verifyUser()
    if (!rs) return false
    SetUserVar()
    ///////////////////////////////////////////////////////////////////////////////////
    const worker = new Worker("/app/msngr/worker.js?" + Math.random())
    worker.onerror = function(err) {
        worker.terminate()
        hush.util.showEx(err)
    }
    worker.onmessage = async function(e) {
        try {            
            if (e.data.code == "idb_upgraded" || e.data.code == "idb_connected") {
                worker.postMessage({ code : launch, msg : winid })
            } else if (e.data.code == "winner") { 
                const _token = hush.http.getCookie("token")
                if (!_token) { //메신저가 임베디드되어 있지 않은 웹페이지(탭)에서 로그아웃시키면 임베디드된 페이지에서도 메신저가 종료되게 함 : disconnect보다 아예 포털페이지로 replace함
                    location.replace("/" + hush.cons.erp_portal) //hush.msg.alert("disconnect") 
                    return
                }
                let _type = (winid && runFromStandalone && prevType == "") ? "set_new" : "chk_embeded" //set_new는 standalone일 때만 처음 한번만 설정됨. 그 다음부터는 무조건 chk_embeded
                prevType = _type //동일 브라우저내에서 윈도우(탭)끼리 (offline)경합을 벌여 1등이 되면 http call을 통해 각 브라우저의 1등끼리 (online)경합으로 최종 winner를 결정
                if (!hush.http.chkOnline("none")) return
                const rsRedis = await hush.http.ajax("/msngr/chk_redis", { type : _type, userkey : g_userkey, winid : winid }, true)
                if (rsRedis.code == hush.cons.CODE_OK) { //console.log(_type+"==="+e.data.winid+"==="+rs1.result+"==="+rs1.ip)
                    if (!rsRedis.result) return //watch out for stream.on('end') in chk_redis.js
                    if (rsRedis.result == "another") {
                        console.log("Talk running on another tab or browser / " + e.data.msg)
                    } else if (rsRedis.result == "same") { //기존 winner 계속. Winner continued
                        console.log("Talk running on this tab / " + e.data.msg)
                    } else { //new. 새로운 위너. //console.log(_type+"@@@"+e.data.winid+"@@@"+rs1.result)      
                        hush.socket = await hush.sock.connect(io, { 
                            token : hush.user.token, userid : g_userid, userkey : g_userkey, winid : winid, userip : rsRedis.userip 
                        })
                        if (runFromStandalone) { //main.html
                            initStandAlone(rs) //rsRedis 아님
                        } else { //Auto-Launching Embeded Talk
                            getUnreadForAll() 
                            procSettingOnLoad(rs) //rsRedis 아님
                        }
                        chkRoomFocus()
                    }
                } else {
                    worker.terminate()
                    console.log("chk_redis: " + rsRedis.msg)
                }
            } else if (e.data.code == "0") {	
                console.log(e.data.msg) //skip
            } else { //오류 발생
                worker.terminate()
                console.log(e.data.code + "===" + e.data.msg)
            }
        } catch (ex) {
            worker.terminate()
            hush.util.showEx(ex, "none")
        }
    } ///////////////////////////////////////////////////////////////////////////////////
    return true
}

const procUnload = () => { //메신저 종료시 그에 종속된 채팅방 및 알림 등을 같이 종료시킴
    for (let roomid in hush.sock.rooms) {
        const _win = hush.sock.rooms[roomid]
        if (_win && !_win.closed) _win.close()
    }
    for (let roomid in hush.noti.notis) {
        const _noti = hush.noti.notis[roomid]
        if (_noti) _noti.close()
    }
}

const SetUserVar = () => { //편의상 한번 더 g_로 set
    g_userkey = hush.user.key 
    g_userid = hush.user.id
    g_usernm = hush.user.nm
    g_orgcd = hush.user.orgcd
}

const initStandAlone = (rs) => { //임베디드가 아닐 경우임. rs from hush.auth.verifyUser(true)
    procSetting("load", rs, true)
    procScrollEvent()
    if (!hush.http.chkOnline()) return
    procMenuTop(hush.http.getCookie("mode"))
    if (g_mode != BTN_MODE_CHAT) getUnreadForAll()
    $("#header_title").html(g_usernm + ((rs.NICK_NM != "") ? " [" + rs.NICK_NM + "]" : ""))
}

function procNewChat(useridArr) { //invoked from index.html and jay_main.js : Mobile Only
    const new_roomid = hush.util.createId()
    if (useridArr.indexOf(g_userid) == -1) useridArr.push(g_userid) //me included
    const rq = { masterid : g_userid, masternm : g_usernm, userids : useridArr }
    if (hush.webview.ios) {
    } else if (hush.webview.and) {
        setTimeout(function() {
            AndroidMain.openRoom("newFromMain", new_roomid, "", JSON.stringify(rq))
        }, hush.cons.sec_for_webview_func) //비동기로 호출해야 동작
    }
}

function toggleDisconnIcon(show) { //hush.msg.toast("disconnected", false, true)
    if (show) {
        $("#img_disconn").show()
        $("#btn_refresh").hide()
        $("#btn_logout").hide()
    } else {
        $("#img_disconn").hide()
        $("#btn_refresh").show()
        $("#btn_logout").show()
    }
}

////////////////////////////////////////////////////////////////////////mobile webview
const startFromWebView = (from, obj, rs) => {
    try { //alert(navigator.userAgent) - 안드로이드 웹뷰인데도 Dalvik이라고 나오지는 않음
        if (!hush.http.chkOnline()) return
        hush.auth.setCookieForUser(obj, true)        
        hush.auth.setUser(obj.token)        
        SetUserVar()
        if (g_win_type) {
            procMenuTop(BTN_MODE_PEOPLE, BTN_PEOPLE_COMPANY)
        } else { //main 화면
            initStandAlone(rs)
            setTimeout(function() {
                AndroidMain.doneLoad()
            }, hush.cons.sec_for_webview_func) //비동기로 호출해야 동작            
        }     
    } catch (ex) {
        hush.util.showEx(ex)
    }
}

const getFromWebViewSocket = (from, json) => { //MainActivity.kt의 procAfterOpenMain() 설명 참조
    try { //모든 event data object는 여기로 (undefined 포함)
        if (!funcSockEv || !funcSockEv[json.ev]) return
        funcSockEv[json.ev].call(null, json.data)
    } catch (ex) {
        hush.util.showEx(ex)
    }
}

const newchat = (from, obj) => { 
    if (!hush.http.chkOnline()) return
    procNewChat(obj.userids.split(hush.cons.deli))
}
////////////////////////////////////////////////////////////////////////

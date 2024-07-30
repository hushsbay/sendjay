<!--
**hushsbay/hushsbay** is a ✨ _special_ ✨ repository because its `README.md` (this file) appears on your GitHub profile.
Here are some ideas to get you started:
- 🔭 I’m currently working on ...
- 🌱 I’m currently learning ...
- 👯 I’m looking to collaborate on ...
- 🤔 I’m looking for help with ...
- 💬 Ask me about ...
- 📫 How to reach me: ...
- 😄 Pronouns: ...
- ⚡ Fun fact: ...
-->

현재 96%정도 개발된 상태입니다.<br/>


# Sendjay 소개

1. Sendjay는 socket.io를 이용한 기업용 메시징 서버 및 앱/웹 클라이언트 개발 프로젝트입니다.<br/>
   (created by hushsbay@gmail.com)<br/>

2. Sendjay는 현재 모 기업내 ERP 사이트에서 필자에 의해 개발되어 현재 실제로 사용중인 웹 전용 메신저를<br/>
   좀 더 확장시켜 멀티소켓서버 환경으로 구성하고 안드로이드 앱에서도 사용 가능하도록 개발되었습니다.<br/>

3. Sendjay는 이미 개발된 웹 모듈을 그대로 재사용해 앱내 WebView에서 실행되므로<br/>
   개발/유지보수 효율성이 높습니다. (소켓통신, 알림 등 고유한 기능은 네이티브 앱에서 처리하도록 개발)<br/>

4. Sendjay 웹은 기업내 ERP 등과 같은 사이트에서 로그인하면 해당 페이지에 백그라운드로 자동 실행되어<br/>
   알림을 받을 수 있으며 해당 페이지를 닫으면 다른 페이지에 백그라운드로 자동 실행되도록 해서 로그인한 후엔<br/>
   항상 연결되어 있어 메시지를 받을 수 있도록 하였습니다.<br/>

5. Sendjay는 소스만 제공하는 것뿐만 아니라 누구나 자유롭게 실제로 사용해 볼 수 있도록 사이트를 제공합니다.<br/>
   다만, 개인이 만든 사이트이므로 대용량 파일 업로드에 용량 제한이 있으며 서버 성능 문제를 겪을 수도 있음을<br/>
   양해해 주시기 바랍니다.<br/>

6. Sendjay는 소스를 내려 받아 구축형(On-Premise)으로 사내 ERP등의 조직/사용자와 연동해 운영할 수 있습니다.<br/>   
     


# 환경 구성
  
![image](https://github.com/hushsbay/sendjay/blob/master/sendjay_env.png)

   + 포트를 PC와 모바일로 나눈 것은 단순히 테스트 편의를 위한 구분입니다.
   + 웹은 HTML5, jQuery가 쓰였으며 Android 앱은 Kotlin입니다.
   + iOS 앱은 아직 개발되지 않았습니다.

   * Sendjay 소스는 아래와 같습니다.
      - 서버 & 웹 클라이언트 : https://github.com/hushsbay/sendjay
      - Android 클라이언트 : https://github.com/hushsbay/sendjay_aos
   
   * Sendjay는 https://hushsbay.com 으로 들어가 (실제로 운영되고 있는 환경에서) Full Test 가능합니다.
   
   * Sendjay는 기업의 ERP, GroupWare 등 사이트(인트라넷)내에서 GitHub 소스를 그대로 내려받아</br>
     개발/운영 가능합니다. 그렇게 운영하기 위해서는 기업내 조직/사용자정보를 연동해야 하는데</br>
     다음 항목에서 별도로 설명하고 있습니다.</br>
   
   ### 서버 환경

   1) MySql (ver 8.0.32) : 테이블 명세는 맨 아래 있습니다.

   2) Redis (ver 3.0.504)

   3) Node.js (ver 20.10.0)

      ##### 적용된 npm list는 아래와 같습니다. (package.json)

   ```
   {
      "dependencies": {
         "@socket.io/redis-adapter": "^8.2.1",
         "cookie-parser": "^1.4.6",
         "cors": "^2.8.5",
         "crypto": "^1.0.1",
         "express": "^4.18.2",
         "fluent-ffmpeg": "^2.1.2",
         "fs-extra": "^11.2.0",
         "ioredis": "^5.3.2",
         "jsonwebtoken": "^9.0.2",
         "mime": "^3.0.0",
         "multer": "^1.4.0",
         "mysql2": "^3.9.0",
         "open-graph-scraper": "^4.7.1",
         "request-ip": "^3.3.0",
         "socket.io": "^4.7.3",
         "winston": "^3.11.0",
         "winston-daily-rotate-file": "^4.7.1"
      }
   }
   ```

      ##### start.bat 

      PC 브라우저에서 호출되는 Node.js서버는 아래와 같이 구동됩니다.

   ```
   set NODE_CONFIG=c:/nodeops/nodeconfig.js
   set MYSQL_SCHEMA=jay
   set HTTP_METHOD=http
   set HTTP_PORT=80
   set SOCK_NAMESPACE=jay
   set SOCK_PORT=3050
   set REDIS_DB=0
   set MAIN_SERVER=Y
   set LOG_PATH=c:/nodeops/log/sendjay
   set UPLOAD_PATH=c:/nodeops/upload/sendjay
   node app
   ```

      ##### start1.bat 

      모바일앱에서 호출되는 Node.js서버는 아래와 같이 구동됩니다.

   ```
   set NODE_CONFIG=c:/nodeops/nodeconfig.js
   set MYSQL_SCHEMA=jay
   set HTTP_METHOD=http
   set HTTP_PORT=81
   set SOCK_NAMESPACE=jay
   set SOCK_PORT=3051
   set REDIS_DB=0
   set MAIN_SERVER=N
   set LOG_PATH=c:/nodeops/log/sendjay
   set UPLOAD_PATH=c:/nodeops/upload/sendjay
   node app
   ```
   
      ##### nodeConfig.js
   
   ```
   module.exports = {
      "mysql" : {   
        	"host" : "localhost",
        	"poolsize" : 50,
        	"port" : 3306,
        	"user" : "xxx",
        	"pwd" : "xxx"
      },
      "redis" : {
         "host" : "127.0.0.1",
         "port" : 6379,
         "pwd" : "xxx"
      },
      "jwt" : {
         "algo" : "xxx",
         "key" : "xxx", //32bytes
         "expiry" : "365 days" //"4h" //for web and mobile //"59s", "365 days"
      },
      "crypto" : {
         "key" : "xxx" //32bytes
      },
      "app" : {
         "ws" : "c:/nodeops/sendjay/common/wscommon.js",
         "wsmysql" : "c:/nodeops/sendjay/common/wsmysql.js",
         "wslogger" : "c:/nodeops/sendjay/common/wslogger.js"
      },
      "path" : {
         "ffmpeg" : "c:/ffmpeg/bin/ffmpeg.exe"
      }
   }
   ```

   Sendjay는 템플릿 개념의 프로젝트이므로 PM2 등의 모듈을 사용하지 않고 node app으로 단순 구동했습니다.<br/>


# 구현 기능 (메시징 관점에서)

   - 소켓아이디는 웹과 앱 각각 1개씩만 허용 (예: 웹에서 2개일 경우 먼저 접속된 소켓이 끊어짐)
   - 아아아아


# 주요 특징 (메시징 관점에서)

   ### (웹/모바일) 소켓 Connect/Reconnect

   웹이든 모바일이든 소켓연결 및 재연결시 사용자가 불편함을 느끼지 않도록 자연스럽게 (자동) 처리하는 것이<br/>
   핵심입니다. 특히, 메신저는 모든 직원이 항상 (웹 관점으로 보면 사내ERP에 들어와 있는 상태에서는 항상)<br/>
   소켓이 연결되어 있어야 한다는 것입니다. 서로 연결되어 있지 않은 메신저는 의미가 없기 때문입니다.<br/>

   1. 웹에서의 소켓 연결
     
   ![image](https://github.com/hushsbay/sendjay/blob/master/sendjay_erp_portal.png)

   - PC 웹브라우저에서는 모바일보다는 일반적으로 상대적으로 네트워크가 안정이 되어 있습니다.<br/>
     사내ERP에 최초 접속시 웹메신저를 실행시키는 경우는 크게 어려움이 없으나 문제는 재연결입니다.<br/>
     사용자가 해당 메신저 탭을 닫거나 다른 사이트로 대체해 버리면 다른 사내ERP 탭에서<br/>
     다시 자동실행을 시켜야 하는데 이 때 사용자 입장에서는 새로운 브라우저탭이<br/>
     자동으로 열리는 것이 불편하고 시각적으로도 아주 거슬리게 됩니다.<br/>

   - 그래서, 브라우저탭에서 백그라운드로 자동실행하는 옵션을 제공하여 사용자가 선택할 수 있도록 합니다.<br/>
     위 그림처럼 브라우저탭에 (with Talk)으로 표시된 것이 백그라운드로 자동실행된 것이며 새로운 톡이<br/>
     도착하면 알림이 뜨게 됩니다.<br/>

   - 사내ERP탭은 회사의 정책에 따라 하나만 제공될 수도 있으나 일반적으로 여러 개의 탭이 열릴 것인데<br/>
     이 경우 백그라운드 자동실행은 각 탭간의 (로컬에서의) 경합을 통해 한개의 탭에서만 동작하도록 했습니다.<br/>

   - 아래 startMsngr()에서는 아래 2가지를 처리하는데<br/>
      a. 사용자가 클릭해 웹메신저가 Standalone으로 실행<br/>
      b. 브라우저탭에서 백그라운드로 자동실행<br/>
      백그라운드 자동실행을 위해서 HTML5 Web Worker와 IndexedDB API를 이용하여 경합을 구현했습니다.<br/>

   ```
      $.when($.ready).done(async function() {
            try {
               await $.getScript("/common/common.js") //cache setting to false
               await $.getScript("/app/msngr/main_common.js")
               const _token = hush.http.getCookie("token")  
               if (_token) { //jwt는 세션쿠키이므로 있다면 사용자가 인증한 것이 되므로 jwt를 검증해야 함
                  const rs = await hush.http.ajax("/auth/login") //token과 userid는 쿠키로 전송됨
                  if (rs.code != hush.cons.CODE_OK) {
                        hush.msg.showMsg(rs.msg, rs.code)
                        showLogout(false) //return 하지 말기
                  } else {
                        hush.auth.setUser(_token)
                        showLogout(true)
                        const result = await startMsngr("auto", hush.sock.getWinId()) //mobile app(webview)에서는 바로 return
                        //if (!result) return 오류나도 아래가 실행되도록 함
                  }                        
               }
            }
      })

   ```

   2. 모바일에서의 소켓 연결

   모바일에서는 일반적으로 자주 네트워크가 끊어질 수도 있고 사용자에 의해 앱이 강제종료될 수도 있을 것입니다.<br/>
   따라서, 재연결이 아주 중요한데 아래와 같은 경우를 대비해야 할 것입니다. (안드로이드 기준)<br/>

   - 사용자에 의한 앱 강제 종료시<br/>
   - Doze / App StandBy 모드 진입시<br/>
   - 네트워크 연결 실패시<br/>
   - 네트워크가 연결은 되어 있으나 원할하지 못할 경우<br/>
   - 서버 다운시<br/>

   이럴 경우, 결국 서비스가 죽거나 네트워크가 끊어지거나 타임아웃 상태가 됩니다.<br/>

   - 서비스가 죽을 경우, 종료 직전 onDestroy()에서 AlarmManager를 이용해 다시 ChatService를 구동시킵니다.<br/>
     (Worker를 이용하면 최소주기가 15분이므로 Term이 길고 FCM을 적용하려면 효과 대비 노력이 많이 소요)<br/>
   - 네트워크가 끊어진 경우는 ChatService의 데몬이 돌면서 상태를 체크해 다시 연결될 때 그동안 도착한 톡이<br/>
     있으면 바로 알려 줍니다.<br/>
      
   
   ### (웹/모바일) 유지보수 효율의 극대화를 위해 가급적 웹으로 구현

   Sendjay는 일반적으로 추구하는 유지보수 효율성을 목적으로 두고<br/>
   모바일에서, 앱으로 반드시 구현해야 할 소켓통신/알림/앱버전업데이트 등은 앱으로 개발하고<br/>
   UI(화면) 관련은 대부분 웹뷰를 통해 기존에 개발된 웹모듈을 재사용하고자 했습니다.<br/>

   아래는 안드로이드에서 캡쳐한 이미지인데 PC 브라우저에서도 동일한 화면으로 만날 수 있습니다.<br/>
   
   <table>
      <tr>
         <td><img src="https://github.com/hushsbay/sendjay/blob/master/sendjay_chat_1.jpg" style="width:276px;height:600px"/></td>
         <td><img src="https://github.com/hushsbay/sendjay/blob/master/sendjay_chat_2.jpg" style="width:276px;height:600px"/></td>
      </tr>
      <tr>
         <td><img src="https://github.com/hushsbay/sendjay/blob/master/sendjay_talklist.jpg" style="width:276px;height:600px"/></td>
         <td><img src="https://github.com/hushsbay/sendjay/blob/master/sendjay_option.jpg" style="width:276px;height:600px"/></td>
      </tr>
      <tr>
         <td><img src="https://github.com/hushsbay/sendjay/blob/master/sendjay_team.jpg" style="width:276px;height:600px"/></td>
         <td><img src="https://github.com/hushsbay/sendjay/blob/master/sendjay_treeview.jpg" style="width:276px;height:600px"/></td>
      </tr>
   </table>


   ### (웹/모바일) 소켓 메시지 플로우

   ![image](https://github.com/hushsbay/sendjay/blob/master/sendjay_socket_web.png)

   ![image](https://github.com/hushsbay/sendjay/blob/master/sendjay_socket_aos.png)


   ### (모바일) 소켓 버퍼링 / 로컬 DB

   socket.io docs에 보면 "연결이 끊어진(offline) 상태에서 emit된 이벤트는 기본적으로<br/> 
   재연결때까지 buffered된다"라고 되어 있습니다.<br/>
   
   <https://socket.io/docs/v4/client-offline-behavior/#buffered-events>
   
   By default, any event emitted while the Socket is not connected will be buffered until reconnection.<br/>
   While useful in most cases (when the reconnection delay is short),<br/> 
   it could result in a huge spike of events when the connection is restored.<br/>
   There are several solutions to prevent this behavior, depending on your use case:<br/>

      • use the connected attribute of the Socket instance
      if (socket.connected) {
           socket.emit( /* ... */ );
      } else {
           // ...
      }

      • use volatile events<br/>
      socket.volatile.emit( /* ... */ );
   
   위 글에 의하면, Sendjay에서의 socket event들에 대해 각각 buffered시킬 것인지 volatile시킬 것인지를<br/>
   판단해서 설정해야 합니다. 예를 들어, Sendjay socket event중에 chk_typing.js(키보딩 여부 주기적 확인)이<br/>
   있는데, 서버다운후 오랜 시간이 지나서 재시작되었다고 가정할 때 이 event를 buffered되도록 해 놓았다면<br/>
   재시작시 서버에 상당한 부하를 주게 될 것이며 이 event 성격을 봐도 굳이 buffered 시킬 필요없이<br/>
   volatile로 처리해도 크리티컬하지 않다고 판단됩니다.<br/> 
   
   다만, 안드로이드에서 socket.io 사용시 volatile 메소드를 제가 아직 찾지 못해 volatile을 대신해서<br/> 
   위 글에 언급된 if (socket.connect) ~처럼 미연결시차단 (이하 'blcok')하는 걸로 코드를 짰습니다.<br/>
   
   웹에서는 PC 웹브라우저 환경을 염두에 두고 개발되어서 안정적인 소켓 연결이 전제였으며 소켓연결이 끊어지면<br/>
   해당 페이지들을 모두 닫아버리고 새로 연결하도록 처리했기 때문에 buffered/volatile에 대해 신경쓰지<br/>
   않았던 것인데, 이제 와서 모바일을 개발하다 보니 제가 잘못된 판단이었다는 걸 깨닫게 되었습니다.<br/>
   (예를 들어, 페이지를 닫지 말고 유지하고 재연결시킬 걸..등)
   
   어쨋든, 안드로이드에서 socket과 ajax에 대해 buffered/block(volatile 대신) 관련해 아래와 같이 정리하고<br/>
   공유하고자 합니다. (이 부분은 소스를 함께 봐야 이해되는 부분입니다. chat.html, ChatService.kt)<br/>
   
   1. socket
      - Sendjay socket event에는 chk_alive.js, create_room.js, invite_user.js, open_room.js,send_msg.js<br/>
        등이 있습니다.<br/>
      - 안드로이드에서 volatile 메소드를 못찾아 대신 block방식으로 처리하는데 모든 event는 buffered가 아닌<br/>
        block을 기본으로 하는데 send_msg만 block과 buffered로 구분했으며 내용은 아래 표와 같습니다.<br/>
        
   <table>
      <tr>
         <td>타입</td>
         <td>전송실패시(Offline등)</td>
         <td>내용</td>
         <td>로컬DB저장</td>
         <td>처리함수(chat.html)</td>
      </tr>
      <tr>
         <td>talk</td>
         <td>block</td>
         <td>일반적인 텍스트로 보냄</td>
         <td>Yes</td>
         <td>retrySending()</td>
      </tr>
      <tr>
         <td>invite</td>
         <td>buffered</td>
         <td>invite_user.js를 통해 초청대상을<br>room join시킨 후<br>방멤버에게 알림</td>
         <td>No</td>
         <td>없음</td>
      </tr>
      <tr>
         <td>leave</td>
         <td>buffered</td>
         <td>퇴장시 room leave후<br>방멤버에게 알림</td>
         <td>No</td>
         <td>없음</td>
      </tr>
      <tr>
         <td>notice</td>
         <td>buffered</td>
         <td>proc_image.js(이미지전송),<br>proc_file.js(파일전송)후<br>방멤버에게 알림</td>
         <td>No</td>
         <td>없음</td>
      </tr>
      <tr>
         <td>check</td>
         <td>block</td>
         <td>전송여부 확인용</td>
         <td>No</td>
         <td>prepareForNoResponse()</td>
      </tr>
      <tr>
         <td>flink</td>
         <td>block</td>
         <td>이미 전송한 파일의 링크를<br>복사해 전송</td>
         <td>No</td>
         <td>procFailure()</td>
      </tr>      
   </table>

   + send_msg.js에 전송되는 일반적인 (텍스트)타입인 talk은 사용자가 키보드 타이핑이 필요한 경우인데<br/>
     모바일에서는 조금만 타이핑 양이 많아도 아주 불편하고 힘든 상황이 되므로<br/>
     전송시 Offline(네트워크 연결 끊어짐, 불안정, 서버 다운 등)이 되서 타이핑이 모두 사라진다면<br/>
     아주 곤란하므로 전송과 동시에 로컬DB(HTML5 IndexedDB)에 저장하도록 처리하였습니다.<br/> 
     (아래 소스(chat.html) 참조)<br/>

     Offline이 되면 buffered가 아닌 block 방식으로 emit이 안되게 막고<br/>
     retrySending()을 통해 전송실패라고 보여주고 나중에 Online(소켓연결)상태가 되면<br/>
     재전송 또는 삭제를 선택할 수 있도록 하였습니다.<br/> 

     참고로, 타이핑한 톡을 전송하지 않고 방을 닫은 경우는 localStorage를 이용해 저장시키고<br/>
     다시 방을 열때 localStorage 데이터를 보여줘서 사용자 불편을 최소화합니다.<br/>
     ``` 
     const procSendAndAppend = (rq, blobUrl) => {
         .
         .
         .
         if (rq.type == "talk") { //##8
            const iObj = hush.idb.setTxOs("readwrite")
            if (iObj == null) return
            const os_req = iObj.os.get(rq.msgid)
            os_req.onsuccess = function(e) {
               if (os_req.result) return //const rec = os_req.result
               //일단, 로컬에 추가했다가 sock_ev_send_msg 서버처리 결과에서 보면 정상적으로 처리된 것이므로 다시 제거 : deleteLocalMsg(data.msgid)
               //결국, 정상적이지 않은 경우만 로컬에 있을 것임
               iObj.os.add({
                     roomid : g_roomid, msgid : rq.msgid, type : rq.type, body : rq.body, reply : rq.reply, 
                     cdt : hush.util.getCurDateTimeStr(true) 
               })
            }
            setTimeout(() => { //타이머 지나고 찾았을 때 아직 남아 있으면 전송실패인 것임
               const iObj1 = hush.idb.setTxOs("readonly")
               if (iObj1 == null) return
               hush.idb.getRec(iObj1.os, rq.msgid, function(rec) {
                     if (!rec) return
                     const obj = initMsgForRetrySending(rec.msgid, rec.type, rec.body, rec.reply, rec.cdt)
                     retrySending(obj)
               })
            }, hush.cons.send_timeout_sec * 1000)
         } else if (rq.type == "flink") {
            setTimeout(() => { //타이머 지나고 찾았을 때 아직 남아 있으면 전송실패인 것임
               const objHandling = $("#handling_" + rq.msgid)
               if (objHandling.css("display") != "none") {
                     procFailure(rq, "전송 실패.")
               }
            }, hush.cons.send_timeout_sec * 1000)
         }
      }
      ```
   + type이 invite, leave인 경우는 초정 및 퇴장(강제퇴장 포함) 관련 처리(DB, socket)후<br/>
     send_msg로 알림을 전송하는데 이 알림은 전송시 Offline->Online이 된 경우 사용자가 재전송할 것인지<br/>
     삭제할 것인지 판단할 게 아니라 무조건 전송해야 하는 성격이므로 buffered되게 emit합니다.<br/>
     
   + type=notice는 아래 2. ajax (파일/이미지 전송)를 참조하시기 바랍니다.<br/>
     (전송 성공 경우 처리)<br/>

   + type=check은 아래 2. ajax (파일/이미지 전송)를 참조하시기 바랍니다.<br/>
     (전송 성공이 아닌 실패의 경우 처리)<br/>
  
   + type=flink는 이미 전송된 파일을 다른 방으로 전달하고자 할 때 해당 파일을 다시 내려서<br/>
     전송하는 것은 시간이 많이 걸리고 불편한데 링크로 보낼 때 사용합니다.<br/>
     이 경우는 사용자 타이핑이 없으므로 로컬DB저장도 않고 buffered시키지도 않고자 했습니다.<br/>
   
   2. ajax (파일/이미지 전송)<br/>
      - Sendjay에서는 ajax로 가능한 것은 굳이 socket으로 처리하지 않으려 했습니다.<br/>
      - 파일/이미지 전송은 ajax with multipart/form-data로 먼저 DB에 저장후 socket으로<br/>
        send_msg(type=notice)로 알려 주는 방식을 사용했습니다.<br/>
      - 따라서, 위 표의 type=notice는 전송실패시 사용자가 재전송할 지 삭제할 지 선택하는 것이 아닌<br/>
        무조건 재전송되어야 하므로 위 표에서 buffered로 잡았습니다.<br/>
      - 그런데, 아직 파악하지 못한 것이 있는데 안드로이드 웹뷰에서 $.ajax로 파일/이미지 전송시<br/>
        네트워크 재연결시엔 buffered되지 않는데 서버(Node.js) 재시작시에는 어디선가 buffered되어<br/>
        DB로 잘 저장됩니다. (이게 Node.js가 죽어도 그 앞단인 AWS CLB에서 받아 저장하고 있는 건지<br/>
        아니면 안드로이드 웹뷰가 가지고 있는지 등을 모르겠습니다. $.ajax가 buffered 관련 free, remove<br/>
        또는 설정옵션도 못찾았습니다.) 고수님들의 가이드 부탁 드립니다. 꾸벅! <br/>
      - 그래서 일단, ajax로 파일/이미지 전송실패후에는 사용자로 하여금 재전송할 지 묻지 않고<br/>
        서버에 이미 전송되었는지 먼저 체크하도록 했습니다. (위 표 type=check 참조)<br/>
   
   3. procSocketEmit() in ChatService.kt<br/>
      따라서, 위 내용대로 send_msg의 socket emit시에 아래와 같이 코딩되었습니다.<br/>

   ```
   private fun procSocketEmit() {
      val logTitle = object{}.javaClass.enclosingMethod?.name!!
      disposable?.dispose()
      disposable = RxToUp.subscribe<RxEvent>().subscribe {
         try {
               val json = JSONObject()
               val evt = it.ev
               val dataStr = it.data.toString()
               json.put("ev", evt)
               json.putOpt("data", it.data)
               json.put("returnTo", it.returnTo ?: "parent")
               json.put("returnToAnother", it.returnToAnother)
               if (evt != "chk_alive" && evt != "chk_typing") Util.log("$logTitle", it.toString())
               val procMsg = it.procMsg //모바일 전용 (웹에는 없음). 아래 buffering하고도 일부는 관련있는 파라미터임 (토스트 뿌리면 true 안뿌리게 하려면 false가 넘어와야 함)
               //아래는 소켓 끊어질 때 버퍼링 관련임. common.js의 hush.sock.sendVolatile() 설명 참조
               //socket.io의 기본 설정은 소켓이 끊어지더라도 버퍼에 두고 있다가 재연결시 내보내는 것인데 
               //Android socket.io 라이브러리에서 volatile을 지원하는 것을 아직 찾지 못해, 사용하지 않으려 함
               //따라서, 기본적으로는 버퍼에 저장하지 않게 하기 위해 아예 소켓이 연결되어 있지 않으면 전송을 멈추기로 함 (아래 몇개 예외 있음)
               Util.connectSockWithCallback(applicationContext, connManager!!) { //SocketIO.connect()
                  if (it.get("code").asString != Const.RESULT_OK) {
                     if (evt == Const.SOCK_EV_SEND_MSG) {
                           val gson = Gson().fromJson(dataStr, JsonObject::class.java)
                           val type = gson.get("type").asString
                           if (type == "leave" || type == "invite" || type == "notice") {
                              //버퍼링. 소켓이 끊어지더라도 일단 소켓객체에 전달해 emit => chat.html의 procSendAndAppend() 설명 참조
                           } else { //talk, flink
                              if (procMsg == true) Toast.makeText(applicationContext, Const.TITLE + ": " + it.get("msg").asString, Toast.LENGTH_LONG).show()
                              return@connectSockWithCallback
                           }
                     } else {
                           if (procMsg == true) Toast.makeText(applicationContext, Const.TITLE + ": " + it.get("msg").asString, Toast.LENGTH_LONG).show()
                           return@connectSockWithCallback
                     }
                  }
                  SocketIO.sock!!.emit(Const.SOCK_EV_COMMON, json)
               }
         } catch (e: Exception) {
               logger.error("$logTitle: ${e.toString()}")
               Util.log(logTitle, e.toString())
               e.printStackTrace()
               Util.showRxMsgInApp(Const.SOCK_EV_TOAST, "$logTitle: ${e.toString()}")
         }
      }
   }
   ```

   ### (웹/모바일) Notification

   Notification(톡 도착 알림)과 관련하여 웹만 또는 앱만 사용시는 일반적인 사안이지만 웹과 앱 동시에<br/>
   사용하는 경우 Noti가 둘 다 동시에 오면 사용자가 불편하게 됩니다. 둘 다 Noti를 표시했다가 한쪽에서<br/>
   읽으면 다른 한쪽의 Noti는 제거하면 문제없지 않을까도 싶지만, 만일 웹에서 해당 방을 열어 놓고<br/>
   계속 채팅하고 있는 상황이라면 앱에서는 노티가 표시되지 않으면 좋겠는데 그게 안되고 계속해서 앱으로<br/>
   Noti가 오는 상황이 됩니다. 2% 부족한 이 부분을 위해 아래와 같은 방식으로 Noti를 처리하고자 했습니다.<br/>
   
   참고로, 카카오톡은 알림을 끄면 소리와 진동만 끄고 알림표시는 여전히 하고 있는데 여기서는 알림 표시도<br/> 
   하지 않기로 했습니다. 물론, 한쪽에서 읽고 다른 쪽에 노티가 떠 있으면 닫히게 했습니다.<br/>

   - 일단, Noti에 필요한 데이터를 웹과 앱에 모두 보냅니다.<br/>
   - 환경설정 데이터를 읽어서 알림을 표시할 지 말지 등을 결정합니다.<br/>
   - 해당 챗방이 열려 있고 포커스가 있다면 (이미 읽은 것으로 보고) 알림을 표시하지 않습니다.<br/>
   - 앱에서는 1초 정도 늦게 해당 메시지가 읽혔는지 체크하고 나서 노티를 열지 판단합니다. 그런데<br/>
   - 만일, 앱에서 챗방이 열려 있고 포커싱이 있는 상태라면 웹으로 톡 올 때마다 노티가 계속 표시되었다가<br/>
     제거되는 것이 반복되는데 이것을 해결하기 위해 웹에서 focusedRoomid라는 변수로 앱으로 현재 스택<br/>
     맨 위에 열려 있고 스크린도 On 상태라고 인지되는 roomid를 받아서 웹에서는 해당 roomid와 일치한다면<br/>
     노티를 표시하지 않도록 했습니다.<br/>

   앱에서 네트워크 재연결이 되거나 강제 종료후 재구동시<br/>
   
   + 웹에서는 브라우저 탭의 document.title에 안읽은 톡에 대해 표시하는 정도로 하고<br/> 
     굳이 알림을 띄우지 않아도 될 것으로 보입니다. (HTML5 Notification Bar를 띄우지 않음)<br/>
   
   + 앱에서는 사용자에 의한 앱의 강제종료 및 사용자의 의도와 관련없이 네트워크 재연결이 자주 발생할 수도<br/>
     있는데 이 경우, 그 시간동안 새로운 톡 도착을 (안읽은 톡이라고 표시하면서) 알려주도록 했습니다.<br/>


# 참고 사항 (메시징 제외)



# 구축형(On-Premise) 서버 적용 안내 - 정리중

   1. DB 인터페이스만 작용해 운영 2) 소스내 db를 운영db로 변경해 적용
   2. JWT 인증인데 적용은 1) 2)에 따라 다름 (로그인 처리..)
   3. in-house 앱 (ios도 나중 앱스토어 배제..)
   

# Table 명세 (MySql)

   - Z_INTORG_TBL : 조직 정보 (인터페이스용)
   - Z_INTUSER_TBL : 사용자 정보 (인터페이스용)
   - Z_ORG_TBL : 조직(회사, 본부, 팀 등) 정보
   - Z_USER_TBL : 사용자 정보
   - A_ROOMMST_TBL : 채팅방 마스터 정보
   - A_ROOMDTL_TBL : 채팅방 디테일 정보
   - A_ROOMMEM_TBL : 채팅방 멤버 정보
   - A_MSGMST_TBL : 메시지(톡) 마스터 정보
   - A_MSGDTL_TBL : 메시지(톡) 디테일 정보
   - A_FILELOG_TBL : 파일 전송 관련 정보
   - A_ACTLOG_TBL : 액션로그(연결 등) 정보

```
drop table if exists jay.Z_INTORG_TBL;
CREATE TABLE jay.Z_INTORG_TBL (
DTKEY CHAR(14) NOT NULL DEFAULT '' COMMENT '일시(생성키)',
ORG_CD VARCHAR(20) NOT NULL COMMENT '조직코드',
ORG_NM VARCHAR(50) NOT NULL COMMENT '조직명',
SEQ VARCHAR(8) NOT NULL COMMENT '순서',
LVL INTEGER NOT NULL COMMENT '레벨(Depth)' ) ;
CREATE INDEX Z_INTORG_IDX0 ON jay.Z_INTORG_TBL (DTKEY) ;


drop table if exists jay.Z_INTUSER_TBL;
CREATE TABLE jay.Z_INTUSER_TBL (
DTKEY CHAR(14) NOT NULL DEFAULT '' COMMENT '일시(생성키)',
USER_ID VARCHAR(20) NOT NULL COMMENT '사용자아이디',
USER_NM VARCHAR(50) NOT NULL DEFAULT '' COMMENT '사용자명',
ORG_CD VARCHAR(20) NOT NULL DEFAULT '' COMMENT '조직코드',
ORG_NM VARCHAR(50) NOT NULL DEFAULT '' COMMENT '조직명',
TOP_ORG_CD VARCHAR(20) NOT NULL DEFAULT '' COMMENT '최상위 조직코드',
TOP_ORG_NM VARCHAR(50) NOT NULL DEFAULT '' COMMENT '최상위 조직명',
JOB VARCHAR(50) NOT NULL DEFAULT '' COMMENT '직무, 업무내용',
TEL_NO VARCHAR(20) NOT NULL DEFAULT '' COMMENT '전화번호',
AB_CD VARCHAR(7) NOT NULL DEFAULT '' COMMENT '부재코드(예:dayoff, biztrip)',
AB_NM VARCHAR(50) NOT NULL DEFAULT '' COMMENT '부재내용(예:20210101~20210103)' ) ;
CREATE INDEX Z_INTUSER_IDX0 ON jay.Z_INTUSER_TBL (DTKEY) ;


drop table if exists jay.Z_ORG_TBL;
CREATE TABLE jay.Z_ORG_TBL (
ORG_CD VARCHAR(20) NOT NULL COMMENT '조직코드',
ORG_NM VARCHAR(50) NOT NULL COMMENT '조직명',
SEQ VARCHAR(8) NOT NULL COMMENT '순서',
LVL INTEGER NOT NULL COMMENT '레벨(Depth)' ) ;
CREATE UNIQUE INDEX Z_ORG_IDX0 ON jay.Z_ORG_TBL (ORG_CD) ;
CREATE INDEX Z_ORG_IDX1 ON jay.Z_ORG_TBL (SEQ) ;


drop table if exists jay.Z_USER_TBL;
CREATE TABLE jay.Z_USER_TBL (
USER_ID VARCHAR(20) NOT NULL COMMENT '사용자아이디',
ID_KIND CHAR(1) NOT NULL DEFAULT '' COMMENT 'A(admin),O(organ),D(dept),U(user)',
PWD VARCHAR(128) NOT NULL DEFAULT '' COMMENT '비밀번호',
USER_NM VARCHAR(50) NOT NULL DEFAULT '' COMMENT '사용자명',
ORG_CD VARCHAR(20) NOT NULL DEFAULT '' COMMENT '조직코드',
ORG_NM VARCHAR(50) NOT NULL DEFAULT '' COMMENT '조직명',
TOP_ORG_CD VARCHAR(20) NOT NULL DEFAULT '' COMMENT '최상위 조직코드',
TOP_ORG_NM VARCHAR(50) NOT NULL DEFAULT '' COMMENT '최상위 조직명',
PICTURE longblob NULL,
MIMETYPE VARCHAR(25) NOT NULL DEFAULT '' COMMENT 'mimetype for PICTURE',
NICK_NM VARCHAR(100) NOT NULL DEFAULT '' COMMENT '별칭 또는 상태',
JOB VARCHAR(50) NOT NULL DEFAULT '' COMMENT '직무, 업무내용',
TEL_NO VARCHAR(20) NOT NULL DEFAULT '' COMMENT '전화번호',
AB_CD VARCHAR(7) NOT NULL DEFAULT '' COMMENT '부재코드(예:dayoff, biztrip)',
AB_NM VARCHAR(50) NOT NULL DEFAULT '' COMMENT '부재내용(예:20210101~20210103)',
NOTI_OFF CHAR(1) NOT NULL DEFAULT '' COMMENT '알림끄기(Y)',
BODY_OFF CHAR(1) NOT NULL DEFAULT '' COMMENT '알림내용숨기기(Y)',
SENDER_OFF CHAR(1) NOT NULL DEFAULT '' COMMENT '발신자숨기기(Y)',
TM_FR VARCHAR(4) NOT NULL DEFAULT '' COMMENT '모바일알림시간(시작)',
TM_TO VARCHAR(4) NOT NULL DEFAULT '' COMMENT '모바일알림시간(종료)',
LASTCHKDT CHAR(26) NOT NULL DEFAULT '' COMMENT '최근체크시각',
UID VARCHAR(30) NOT NULL DEFAULT '' COMMENT '유니크아이디(예:IP)',
IS_SYNC CHAR(1) NOT NULL DEFAULT '' COMMENT '동기화(Y)/수동(나머지)',
ISUR VARCHAR(20) NOT NULL DEFAULT '' COMMENT '작성자',
ISUDT CHAR(26) NOT NULL DEFAULT '' COMMENT '작성시각',
MODR VARCHAR(20) NOT NULL DEFAULT '' COMMENT '수정자',
MODDT CHAR(26) NOT NULL DEFAULT '' COMMENT '수정시각' ) ;
CREATE UNIQUE INDEX Z_USER_IDX0 ON jay.Z_USER_TBL (USER_ID) ;
CREATE INDEX Z_USER_IDX1 ON jay.Z_USER_TBL (ORG_CD, USER_NM) ;
CREATE INDEX Z_USER_IDX2 ON jay.Z_USER_TBL (USER_NM, USER_ID) ;


drop table if exists jay.A_ROOMMST_TBL; 
CREATE TABLE jay.A_ROOMMST_TBL (
ROOMID VARCHAR(40) NOT NULL COMMENT '채팅방아이디',
ROOMNM VARCHAR(800) NOT NULL DEFAULT '' COMMENT '채팅방명',
MASTERID VARCHAR(40) NOT NULL DEFAULT '' COMMENT '마스터아이디',
MASTERNM VARCHAR(50) NOT NULL DEFAULT '' COMMENT '마스터명',
STATE CHAR(1) NOT NULL DEFAULT '' COMMENT '상태', 
NICKNM VARCHAR(100) NOT NULL DEFAULT '' COMMENT '별칭',
MEMCNT SMALLINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '멤버수',
CDT CHAR(26) NOT NULL DEFAULT '' COMMENT '작성시각',
UDT CHAR(26) NOT NULL DEFAULT '' COMMENT '수정시각' );
CREATE UNIQUE INDEX A_ROOMMST_IDX0 ON jay.A_ROOMMST_TBL (ROOMID) ;


drop table if exists jay.A_ROOMDTL_TBL;
CREATE TABLE jay.A_ROOMDTL_TBL (
ROOMID VARCHAR(40) NOT NULL COMMENT '채팅방아이디',
USERID VARCHAR(40) NOT NULL COMMENT '사용자아이디',
USERNM VARCHAR(50) NOT NULL COMMENT '사용자명',
NOTI CHAR(1) NOT NULL DEFAULT '' COMMENT '알림끄기(X)',
DISPMEM CHAR(1) NOT NULL DEFAULT '' COMMENT '멤버표시(X)',
STATE CHAR(1) NOT NULL DEFAULT '' COMMENT '상태 L(Leave), 2(LeaveWhen2Members)',
NICKNM VARCHAR(100) NOT NULL DEFAULT '' COMMENT '별칭',
CDT CHAR(26) NOT NULL DEFAULT '' COMMENT '작성시각',
UDT CHAR(26) NOT NULL DEFAULT '' COMMENT '수정시각' );
CREATE UNIQUE INDEX A_ROOMDTL_IDX0 ON jay.A_ROOMDTL_TBL (ROOMID, USERID) ;
CREATE INDEX A_ROOMDTL_IDX1 ON jay.A_ROOMDTL_TBL (ROOMID, STATE) ;


drop table if exists jay.A_ROOMMEM_TBL;
CREATE TABLE jay.A_ROOMMEM_TBL (
ROOMID VARCHAR(40) NOT NULL COMMENT '채팅방아이디', 
MEMBERS VARCHAR(1000) NOT NULL DEFAULT '' COMMENT '멤버',
CDT CHAR(26) NOT NULL DEFAULT '' COMMENT '작성시각' );
CREATE UNIQUE INDEX A_ROOMMEM_IDX0 ON jay.A_ROOMMEM_TBL (ROOMID) ;
CREATE INDEX A_ROOMMEM_IDX1 ON jay.A_ROOMMEM_TBL (MEMBERS) ;


drop table if exists jay.A_MSGMST_TBL;
CREATE TABLE jay.A_MSGMST_TBL (
MSGID VARCHAR(40) NOT NULL COMMENT '메시지아이디',
ROOMID VARCHAR(40) NOT NULL COMMENT '채팅방아이디',
SENDERID VARCHAR(40) NOT NULL COMMENT '발신자아이디',
SENDERNM VARCHAR(40) NOT NULL COMMENT '발신자명',
BODY VARCHAR(4000) NOT NULL COMMENT '본문',
BUFFER LONGBLOB,
REPLY VARCHAR(100) NOT NULL DEFAULT '' COMMENT '답장',
TYP VARCHAR(20) NOT NULL DEFAULT '' COMMENT '메시지타입(file, flink, image, invite, leave..)',
STATE CHAR(1) NOT NULL DEFAULT '' COMMENT '상태. D(deleted)/R(read)',
STATE2 CHAR(1) NOT NULL DEFAULT '' COMMENT '상태2 C(message cancelled)',
FILESTATE VARCHAR(19) NOT NULL DEFAULT '' COMMENT '파일저장만료 expiry(YYYY-MM-DD hh:mm:ss)',
CDT CHAR(26) NOT NULL DEFAULT '' COMMENT '작성시각', 
UDT CHAR(26) NOT NULL DEFAULT '' COMMENT '수정시각' );
CREATE UNIQUE INDEX A_MSGMST_IDX0 ON jay.A_MSGMST_TBL (MSGID, ROOMID) ;
CREATE INDEX A_MSGMST_IDX1 ON jay.A_MSGMST_TBL (ROOMID, TYP, CDT) ;
CREATE INDEX A_MSGMST_IDX2 ON jay.A_MSGMST_TBL (ROOMID, CDT, SENDERID) ;
CREATE INDEX A_MSGMST_IDX3 ON jay.A_MSGMST_TBL (TYP, FILESTATE) ;
CREATE INDEX A_MSGMST_IDX4 ON jay.A_MSGMST_TBL (STATE, CDT) ;


drop table if exists jay.A_MSGDTL_TBL;
CREATE TABLE jay.A_MSGDTL_TBL (
MSGID VARCHAR(40) NOT NULL COMMENT '메시지아이디',
ROOMID VARCHAR(40) NOT NULL COMMENT '채팅방아이디',
SENDERID VARCHAR(20) NOT NULL COMMENT '발신자아이디',
RECEIVERID VARCHAR(20) NOT NULL COMMENT '수신자아이디',
RECEIVERNM VARCHAR(20) NOT NULL COMMENT '수신자명',
STATE CHAR(1) NOT NULL DEFAULT '' COMMENT '상태. D(deleted)/R(read)',
CDT CHAR(26) NOT NULL DEFAULT '' COMMENT '작성시각',
UDT CHAR(26) NOT NULL DEFAULT '' COMMENT '수정시각' );
CREATE UNIQUE INDEX A_MSGDTL_IDX0 ON jay.A_MSGDTL_TBL (MSGID, ROOMID, SENDERID, RECEIVERID) ;
CREATE INDEX A_MSGDTL_IDX1 ON jay.A_MSGDTL_TBL (MSGID, RECEIVERID) ;
CREATE INDEX A_MSGDTL_IDX2 ON jay.A_MSGDTL_TBL (MSGID, SENDERID) ;
CREATE INDEX A_MSGDTL_IDX3 ON jay.A_MSGDTL_TBL (ROOMID, RECEIVERID, STATE, CDT) ;
CREATE INDEX A_MSGDTL_IDX4 ON jay.A_MSGDTL_TBL (RECEIVERID, CDT, STATE) ;


drop table if exists jay.A_FILELOG_TBL;
CREATE TABLE jay.A_FILELOG_TBL (
MSGID VARCHAR(40) NOT NULL COMMENT '메시지아이디',
ROOMID VARCHAR(40) NOT NULL COMMENT '채팅방아이디',
SENDERID VARCHAR(40) NOT NULL COMMENT '발신자아이디', 
BODY VARCHAR(1000) NOT NULL COMMENT '본문',
CDT CHAR(26) NOT NULL DEFAULT '' COMMENT '작성시각', 
UDT CHAR(26) NOT NULL DEFAULT '' COMMENT '수정시각' );
CREATE UNIQUE INDEX A_FILELOG_IDX0 ON jay.A_FILELOG_TBL (MSGID, ROOMID) ;
CREATE INDEX A_FILELOG_IDX1 ON jay.A_FILELOG_TBL (UDT, CDT) ;


drop table if exists jay.Z_ACTLOG_TBL;
CREATE TABLE jay.Z_ACTLOG_TBL (
USER_ID VARCHAR(20) NOT NULL COMMENT '사용자아이디',
WORK VARCHAR(10) NOT NULL DEFAULT '' COMMENT '작업아이디',
DEVICE VARCHAR(10) NOT NULL DEFAULT '' COMMENT '기기',
STATE VARCHAR(10) NOT NULL DEFAULT '' COMMENT '상태',
DUR INTEGER NOT NULL DEFAULT 0 COMMENT 'Duration 등',
CDT CHAR(26) NOT NULL DEFAULT '' COMMENT '작성시각 등',
UDT CHAR(26) NOT NULL DEFAULT '' COMMENT '수정시각 등',
ISUDT CHAR(26) NOT NULL DEFAULT '' COMMENT '서버시각 기준' ) ;
CREATE UNIQUE INDEX Z_ACTLOG_IDX0 ON jay.Z_ACTLOG_TBL (ISUDT, USER_ID, WORK) ;
```

끝.
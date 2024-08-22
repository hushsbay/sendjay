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

현재 99% 개발완료된 상태이며 최종 테스트 계획중입니다.<br/>


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

5. Sendjay는 소스를 내려 받아 구축형(On-Premise)으로 사내 ERP등의 조직/사용자와 연동해 운영할 수 있습니다.<br/>   

6. Sendjay는 소스만 제공하는 것뿐만 아니라 누구나 자유롭게 실제로 사용해 볼 수 있도록 사이트를 제공합니다.<br/>
   다만, 개인이 만든 사이트이므로 대용량 파일 업로드에 용량 제한이 있으며 서버 성능 문제를 겪을 수도 있음을<br/>
   양해해 주시기 바랍니다.<br/>


# 구현 기능 (메시징 관점에서)

   아래와 같은 항목들이 (크롬 브라우저 및 안드로이드 14에서만) 테스트되었습니다.

   * 멀티소켓 서버 : 소켓아이디는 웹과 앱 각각 1개씩만 허용 (예: 웹에서 2개일 경우 먼저 접속된 소켓이 끊어짐)

   * 새방 만들기 
      + 멤버탭에서 선택해 만들기
      + 팝업에서 선택해 만들기
      + 기존 방 있으면 기존 방 열기

   * 상태 표시
      + 멤버의 Online/Offline 여부 표시
      + 웹/모바일 구분 표시
      + 메신저가 강제 구동이 아닐 경우 상황에 따라 요긴하게 쓰이는 경우도 있음

   * 환경설정 탭 및 ERP 데이터 연동
      + 별칭/상태/직무/부재코드/부재내용
      + 필요시 휴가, 출장 등의 정보를 연동해 표시
      + 알림 설정

   * 톡 전송
      + 텍스트, 파일, 이미지
      + 전송실패시 재전송 (로컬데이터 저장)
      + 작성중 메시지 로컬 저장
      + 링크 캐치
      + 사이트 오픈그래프
      + 대용량 파일 전송
      + 동영상/이미지 파일 전송시 이미지 보기 제공
      + 이미지 팝업으로 크게 보기
      + 전송된 이미지 파일로 다운로드
      + mp4 동영상 스트리밍 
      + 파일 저장 만기 설정
      
   * 읽음 처리 (안읽은 멤버 보여주기)

   * 초대, 퇴장, 강제퇴장

   * 톡 삭제, 모두 삭제  

   * 방명 변경
      + 방 관리자 경우 모두 적용 또는 본인 적용 가능
      + 본인 적용이 모두 적용보다 우선

   * 복사
      + 이미 전송된 파일의 링크 복사
      + 이미지 복사
   
   * 응답

   * 전송취소 (읽지 않은 멤버에겐 아예 흔적도 제거)

   * 방내 검색
      + 일반 검색
      + 해당 멤버가 보낸 것만 검색
      + 파일/이미지만 검색
      + 검색결과 보기
      + 검색모드 취소
   

# 환경 구성 
  - https://hushsbay.com

![image](https://github.com/hushsbay/sendjay/blob/master/sendjay_env.png)

   + 포트를 PC와 모바일로 나눈 것은 단순히 멀티소켓서버 테스트 편의를 위한 구분입니다.
   + 웹은 HTML5, jQuery가 쓰였으며 Android 앱은 Kotlin입니다.
   + iOS 앱은 아직 개발되지 않았습니다.
   * sendjay 소스는 아래와 같습니다.
      - 서버 & 웹 클라이언트 : https://github.com/hushsbay/sendjay
      - Android 클라이언트 : https://github.com/hushsbay/sendjay_aos
   * sendjay는 https://hushsbay.com 에서 Full Test 가능합니다.
   * MySql (ver 8.0.32) : 테이블 명세는 맨 아래 있습니다.
   * Redis (ver 3.0.504)
   * Node.js (ver 20.10.0)


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

   - 그래서, 브라우저탭에서 백그라운드로 자동실행하도록 합니다. 위 그림처럼 브라우저탭에 (with Talk)으로<br/>
     표시된 것이 백그라운드로 자동실행된 것이며 새로운 톡이 도착하면 알림이 뜨게 됩니다.<br/>

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

   ### 기기별 소켓 관리, 앱 자동로그인 및 분실처리

   * Sendjay에서는 사용자별로 웹과 앱 각각 하나씩 소켓을 배정할 수 있도록 했습니다.
      - 크롬 브라우저에서 연결되어 있는 상태에서 엣지 브라우저에서 웹메신저를 실행하면<br/>
        크롬에서 실행되고 있는 웹메신저가 바로 종료됩니다.
      - 크롬 브라우저에서 연결되어 있는 상태에서 메시징 앱을 모바일에서 실행하면<br/> 
        크롬과 모바일에서 각각 연결된 상태로 실행됩니다.
      - Android 실행중인 상태에서 iOS(미개발)앱을 실행하면 Android 연결이 끊기고 자동로그인이 해제됩니다.
      - 소스는 app.js내 'disconnect_prev_sock'를 검색해 참조하시기 바랍니다.
   
   * 메시징 앱은 필연적으로 자동로그인(로그인상태 계속 유지)으로 처리할 수 밖에 없을 것인데<br/>
     이 경우 염두에 둬야 할 것은 모바일 디바이스를 분실했을 경우입니다.<br/>
     - 분실시, 이미 보안(패턴, 비번, 생체인식 등)이 걸려 있거나 기기리셋 등 처리로 대비 가능하겠지만
     - Sendjay에 대해서는 Sendjay가 자동로그인을 실시간으로 해제할 수 있도록 처리해 두었습니다.
     - 모바일이 아닌 웹메신저를 쓰는 노트북 분실시는 Sendjay는 자동로그인이 아니므로 무시합니다.
   
   * Sendjay가 실행되고 있는 모바일기기를 분실했을 경우
     - 웹메신저의 환경설정 탭에서 '분실처리'를 누르면 소켓통신을 통해 동일사용자의 모바일 소켓으로<br/> 
       데이터를 보내 소켓연결을 끊고 모바일 자동로그인을 해제하도록 합니다.
     - 이 때, 해당 Sendjay가 연결이 되어 있을 수도 있고 잠시동안 연결이 끊긴 상태일 수 있으니<br/>
       다시 연결되는 경우도 해제가 가능하도록 합니다.
   

   ### 인증 토큰 관리

   * Sendjay에서는 인증을 세션이 아닌 토큰(JWT)으로 관리하고 있습니다. 특히, 기업 사이트는 각각의 보안정책을<br/>
     기반으로 운영되고 있을 것이므로 Sendjay에서 굳이 보안강화를 위해 2차인증 등을 구현하지는 않았습니다.<br/>
   
   * 일반적으로 Restful 사이트에서는 인증 토큰의 만기를 적당히 (예: 4시간) 설정할텐데
      - 만기가 지나도록 아이들 상태(서버호출없음)이면 인증만료로 리턴하는데
      - 메신저처럼 계속 토큰이 살아 있으려면<br/> 
        1) 토큰만료일을 길게 주게 될 경우엔, 노출시 아무래도 보안상 위험한 부분이 있으므로<br/> 
        2) 만기를 짧게 주면서 refresh_token.js을 클라이언트(웹)에서 주기적으로 호출해서<br/> 
           갱신된 토큰을 내려 받는 것이 낫다고 판단됩니다.<br/>
   
   * PC 웹의 경우
      - startMsngr() in main_common.js에서 주기적으로 토큰을 갱신해주면 됩니다.

   * 모바일 네이티브앱 + 웹뷰의 경우
      - 네이티브앱은 액티비티는 강제로 종료시키고 서비스만 살아 있는 경우도 고려해야 하므로
      - 주기적으로 토큰을 갱신하면 앱 대기모드나 슬립모드에서 주기적인 호출이 block되기 때문에
      - 아예, 소켓 재연결후(sendToDownWhenConnDisconn())와 onResume()시에 자동로그인을 해서<br>
        토큰을 새로 생성받아서 웹뷰로 넘겨줍니다.<br/>
        소켓 재연결시엔 query 파라미터내 token을 갱신해야 합니다. (SocketIO.kt 참조)<br/>
      - 웹뷰(앱)에서는 1. PC 웹의 경우처럼 주기적으로 토큰을 갱신해주면 됩니다.<br/>
        startFromWebView() in main_common.js 참조<br/>

   * 결론적으로, jwt 만기는 토큰 갱신 주기(앱은 없음)가 10분으로 되어 있으므로 적어도 1시간 정도이상으로<br/>
     설정하는 것이 좋아 보입니다. 정상적인 상황이면 주기적으로 갱신하므로 토큰 만기가 뜨면 안됩니다.<br/>
   
   
   ### (웹/모바일) 유지보수 효율의 극대화를 위해 최대한 웹으로 구현

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
         <td><img src="https://github.com/hushsbay/sendjay/blob/master/sendjay_option_1.jpg" style="width:276px;height:600px"/></td>
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
   위 글에 언급된 if (socket.connect) ~처럼 미연결시차단 (이하 'block')하는 걸로 코드를 짰습니다.<br/>
   
   웹에서는 PC 웹브라우저 환경을 염두에 두고 개발되어서 안정적인 소켓 연결이 전제였으며 소켓연결이 끊어지면<br/>
   해당 페이지들을 모두 닫아버리고 새로 연결하도록 처리했기 때문에 buffered/volatile에 대해 신경쓰지<br/>
   않았던 것인데, 이제 와서 모바일을 개발해보니 페이지를 닫지 않고 유지하는 것도 괜찮겠다는 생각이 듭니다.<br/>
   
   어쨋든, 안드로이드에서 socket과 ajax에 대해 buffered/block(volatile 대신) 관련해 아래와 같이 정리하고<br/>
   공유하고자 합니다. (이 부분은 소스를 함께 봐야 이해되는 부분입니다. chat.html, ChatService.kt)<br/>
   
   1. socket
      - Sendjay socket event엔 chk_alive.js, create_room.js, invite_user.js, open_room.js, send_msg.js<br/>
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


# 향후 주요 개발 예정 항목 (ver 2.0)

   * iOS 디바이스 지원
   * 백엔드에서 알림 전송 : SMS/LMS처럼 문자보내기 대신 소켓통신하는 단방향채널 구현
   * 팀공용아이디, admin, organ 아이디로 백엔드 전송 및 채팅   
   * 이모티콘 채팅 지원
   * ChatGPT 인터페이스 적용 검토
   

# ver 1.0 아쉬운 점

   * 안드로이드 포어그라운드 서비스 아이콘 제거 못함
   * 앱과 웹뷰간 쿠키 공유 포기하고 Content Provider로 대체
   * 더 정제된 코딩 필요 (socket.io, Kotlin 등)   
   * Vue or React로 도전하지 못한 부분


# 사내시스템내 sendjay 메시징 서버/웹/앱 구축하기

   * sendjay 소스로 사내시스템(ERP, GW 등)내 메시징 서버/웹/앱 구축(OnPremise)이 가능합니다.
   * 아래는 구축 방식 비교표입니다.
   * sendjay 소스는 hushsbay.com에 그대로 적용되어 있는데 이는 테스트 사이트이므로<br/>
     누구나 아이디를 등록(가입)할 수 있는 등 사내 시스템과는 다른 정책으로 되어 있습니다.<br/>
   * 따라서, 아래 표 (1) '조직/사용자만 연동하고 소스는 그대로 사용'하는 방식으로 구축하려면<br/>
      + (A)~(F)에 해당하는 소스를 변경해 사내 시스템에 맞게 운영되도록 해야 합니다.<br/>
      + 물론 그전에 MySql, NodeJS, Redis 설치 등 환경 구성은 각각 사내시스템에 맞게 진행합니다.

<table border="1" cellspacing="0" cellpadding="0" style="word-break: break-all; width: 727px; border: 1px none rgb(0, 0, 0); border-collapse: collapse;">
	<tbody>
		<tr>
			<td style="border: 1px solid rgb(0, 0, 0); width: 89.25px; height: 88px;">
				<p style="text-align: center; font-family: &quot;맑은 고딕&quot;; font-size: 12pt; line-height: 24px; margin-top: 0px; margin-bottom: 0px; font-weight: 400;"><strong><span style="font-size: 16px; text-align: center; font-family: &quot;맑은 고딕&quot;; line-height: 24px; margin-top: 0px; margin-bottom: 0px; font-weight: 700;">항목</span></strong></p>
			</td>
			<td style="border: 1px solid rgb(0, 0, 0); width: 149.891px; height: 88px;">
				<p style="line-height: 24px; font-size: 12pt; text-align: center; font-family: &quot;맑은 고딕&quot;; margin-top: 0px; margin-bottom: 0px; font-weight: 400;"><strong><span style="font-size: 12pt; line-height: 24px; margin-top: 0px; margin-bottom: 0px; font-family: &quot;맑은 고딕&quot;; font-weight: 700;">hushsbay.com에서</span></strong></p><p style="line-height: 24px; font-size: 12pt; text-align: center; font-family: &quot;맑은 고딕&quot;; margin-top: 0px; margin-bottom: 0px; font-weight: 400;"><strong><span style="font-size: 12pt; line-height: 24px; margin-top: 0px; margin-bottom: 0px; font-family: &quot;맑은 고딕&quot;; font-weight: 700;">테스트만 수행</span></strong></p>
			</td>
			<td style="border: 1px solid rgb(0, 0, 0); width: 298.969px; height: 88px;">
				<p style="line-height: 24px; margin-top: 0px; margin-bottom: 0px; text-align: center; font-family: &quot;맑은 고딕&quot;; font-size: 12pt; font-weight: 400;"><strong><span style="line-height: 24px; margin-top: 0px; margin-bottom: 0px; font-family: &quot;맑은 고딕&quot;; font-size: 12pt; font-weight: 700;"><span style="font-family: &quot;맑은 고딕&quot;; font-size: 12pt; line-height: 24px; margin-top: 0px; margin-bottom: 0px; font-weight: 700;">조직/사용자만&nbsp;</span></span><span style="line-height: 24px; margin-top: 0px; margin-bottom: 0px; font-family: &quot;맑은 고딕&quot;; font-size: 12pt; font-weight: 700;"><span style="font-family: &quot;맑은 고딕&quot;; font-size: 12pt; line-height: 24px; margin-top: 0px; margin-bottom: 0px; font-weight: 700;">연동하고</span></span></strong></p><p style="line-height: 24px; margin-top: 0px; margin-bottom: 0px; text-align: center; font-family: &quot;맑은 고딕&quot;; font-size: 12pt; font-weight: 400;"><strong><span style="line-height: 24px; margin-top: 0px; margin-bottom: 0px; font-family: &quot;맑은 고딕&quot;; font-size: 12pt; font-weight: 700;"><span style="font-family: &quot;맑은 고딕&quot;; font-size: 12pt; line-height: 24px; margin-top: 0px; margin-bottom: 0px; font-weight: 700;">소스&nbsp;</span></span><span style="line-height: 24px; margin-top: 0px; margin-bottom: 0px; font-family: &quot;맑은 고딕&quot;; font-size: 12pt; font-weight: 700;"><span style="font-family: &quot;맑은 고딕&quot;; font-size: 12pt; line-height: 24px; margin-top: 0px; margin-bottom: 0px; font-weight: 700;">그대로&nbsp;</span></span><span style="line-height: 24px; margin-top: 0px; margin-bottom: 0px; font-family: &quot;맑은 고딕&quot;; font-size: 12pt; font-weight: 700;"><span style="font-family: &quot;맑은 고딕&quot;; font-size: 12pt; line-height: 24px; margin-top: 0px; margin-bottom: 0px; font-weight: 700;">사용 (1)</span></span></strong></p>
			</td>
			<td style="border: 1px solid rgb(0, 0, 0); width: 184.891px; height: 88px;">
				<p style="line-height: 24px; margin-top: 0px; margin-bottom: 0px; text-align: center; font-family: &quot;맑은 고딕&quot;; font-size: 12pt; font-weight: 400;"><strong><span style="font-family: &quot;맑은 고딕&quot;; font-size: 12pt; line-height: 24px; margin-top: 0px; margin-bottom: 0px; font-weight: 700;">기업에 맞게&nbsp;</span></strong></p><p style="line-height: 24px; margin-top: 0px; margin-bottom: 0px; text-align: center; font-family: &quot;맑은 고딕&quot;; font-size: 12pt; font-weight: 400;"><strong><span style="line-height: 24px; margin-top: 0px; margin-bottom: 0px; font-family: &quot;맑은 고딕&quot;; font-size: 12pt; font-weight: 700;"><span style="font-family: &quot;맑은 고딕&quot;; font-size: 12pt; line-height: 24px; margin-top: 0px; margin-bottom: 0px; font-weight: 700;">커스터마이징&nbsp;</span></span><span style="font-size: 12pt; font-family: &quot;맑은 고딕&quot;; line-height: 24px; margin-top: 0px; margin-bottom: 0px; font-weight: 700;">(2)</span></strong></p>
			</td>
		</tr>
		<tr>
			<td style="border: 1px solid rgb(0, 0, 0); width: 89.25px; height: 36px;">
				<p style="font-family: &quot;맑은 고딕&quot;; font-size: 12pt; line-height: 24px; margin-top: 0px; margin-bottom: 0px; font-weight: 400;">환경 설정</p>
			</td>
			<td style="border: 1px solid rgb(0, 0, 0); width: 149.891px; height: 36px;">
				<p style="font-family: &quot;맑은 고딕&quot;; font-size: 12pt; line-height: 24px; margin-top: 0px; margin-bottom: 0px; font-weight: 400;">- 그대로 사용</p>
			</td>
			<td style="border: 1px solid rgb(0, 0, 0); width: 484.859px; height: 36px;" colspan="2">
				<p style="font-family: &quot;맑은 고딕&quot;; font-size: 12pt; line-height: 24px; margin-top: 0px; margin-bottom: 0px; font-weight: 400;"><span style="font-size: 12pt; line-height: 24px; margin-top: 0px; margin-bottom: 0px; font-family: &quot;맑은 고딕&quot;; font-weight: 400;">- nodeConfig.js, start.bat, start1.bat 내 설정 변경 필요</span>&nbsp;<strong><span style="font-size: 12pt; font-family: &quot;맑은 고딕&quot;; line-height: 24px; margin-top: 0px; margin-bottom: 0px; font-weight: 700;">(A)</span></strong></p>
			</td>
		</tr>
		<tr>
			<td style="border: 1px solid rgb(0, 0, 0); width: 89.25px; height: 38px;">
				<p style="font-family: &quot;맑은 고딕&quot;; font-size: 12pt; line-height: 24px; margin-top: 0px; margin-bottom: 0px; font-weight: 400;">CORS</p>
			</td>
			<td style="border: 1px solid rgb(0, 0, 0); width: 149.891px; height: 38px;">
				<p style="font-family: &quot;맑은 고딕&quot;; font-size: 12pt; line-height: 24px; margin-top: 0px; margin-bottom: 0px; font-weight: 400;">- 그대로 사용</p>
			</td>
			<td style="border: 1px solid rgb(0, 0, 0); width: 484.859px; height: 38px;" colspan="2">
				<p style="font-family: &quot;맑은 고딕&quot;; font-size: 12pt; line-height: 24px; margin-top: 0px; margin-bottom: 0px; font-weight: 400;"><span style="font-size: 12pt; line-height: 24px; margin-top: 0px; margin-bottom: 0px; font-family: &quot;맑은 고딕&quot;; font-weight: 400;">- config.js내&nbsp;</span><span style="font-size: 12pt; background-color: rgb(255, 255, 255); white-space: pre; line-height: 24px; margin-top: 0px; margin-bottom: 0px; font-family: &quot;맑은 고딕&quot;; font-weight: 400;"><span style="font-size: 12pt; line-height: 24px; margin-top: 0px; margin-bottom: 0px; font-family: &quot;맑은 고딕&quot;; font-weight: 400;">corsRestful, </span></span><span style="font-size: 12pt; background-color: rgb(255, 255, 255); white-space: pre; line-height: 24px; margin-top: 0px; margin-bottom: 0px; font-family: &quot;맑은 고딕&quot;; font-weight: 400;"><span style="font-size: 12pt; line-height: 24px; margin-top: 0px; margin-bottom: 0px; font-family: &quot;맑은 고딕&quot;; font-weight: 400;">corsSocket</span></span><span style="font-size: 12pt; background-color: rgb(255, 255, 255); white-space: pre; line-height: 24px; margin-top: 0px; margin-bottom: 0px; font-family: &quot;맑은 고딕&quot;; font-weight: 400;"><span style="font-size: 12pt; line-height: 24px; margin-top: 0px; margin-bottom: 0px; font-family: &quot;맑은 고딕&quot;; font-weight: 400;"> 값 </span></span><span style="background-color: rgb(255, 255, 255); font-size: 12pt; white-space: pre; font-family: &quot;맑은 고딕&quot;; line-height: 24px; margin-top: 0px; margin-bottom: 0px; font-weight: 400;">변경 필요 <strong>(B)</strong></span></p>
			</td>
		</tr>
		<tr>
			<td style="border: 1px solid rgb(0, 0, 0); width: 89.25px; height: 63px;">
				<p style="font-family: &quot;맑은 고딕&quot;; font-size: 12pt; line-height: 24px; margin-top: 0px; margin-bottom: 0px; font-weight: 400;">서버 호출</p>
			</td>
			<td style="border: 1px solid rgb(0, 0, 0); width: 149.891px; height: 63px;">
				<p style="font-family: &quot;맑은 고딕&quot;; font-size: 12pt; line-height: 24px; margin-top: 0px; margin-bottom: 0px; font-weight: 400;">- 그대로 사용</p>
			</td>
			<td style="border: 1px solid rgb(0, 0, 0); width: 484.859px; height: 63px;" colspan="2">
				<p style="line-height: 24px; font-size: 12pt; font-family: &quot;맑은 고딕&quot;; margin-top: 0px; margin-bottom: 0px; font-weight: 400;">- 앱에서&nbsp;<span style="font-size: 12pt; line-height: 24px; margin-top: 0px; margin-bottom: 0px; font-family: &quot;맑은 고딕&quot;; font-weight: 400;">"https://hushsbay.com" 대체할&nbsp;</span><span style="font-size: 12pt; font-family: &quot;맑은 고딕&quot;; line-height: 24px; margin-top: 0px; margin-bottom: 0px; font-weight: 400;">호스트명 필요 </span><strong style="font-size: 12pt;">(C)</strong></p>
			</td>
		</tr>
		<tr>
			<td style="border: 1px solid rgb(0, 0, 0); width: 89.25px; height: 155.344px;">
				<p style="line-height: 24px; margin-top: 0px; margin-bottom: 0px; font-weight: 400; font-family: &quot;맑은 고딕&quot;; font-size: 12pt;"><span style="font-family: &quot;맑은 고딕&quot;; font-size: 12pt; line-height: 24px; margin-top: 0px; margin-bottom: 0px; font-weight: 400;">아이디/비번</span></p>
			</td>
			<td style="border: 1px solid rgb(0, 0, 0); width: 149.891px; height: 155.344px;">
				<p style="line-height: 24px; margin-top: 0px; margin-bottom: 0px; font-weight: 400; font-family: &quot;맑은 고딕&quot;; font-size: 12pt;"><span style="font-family: &quot;맑은 고딕&quot;; font-size: 12pt; line-height: 24px; margin-top: 0px; margin-bottom: 0px; font-weight: 400;">-&nbsp;</span><span style="line-height: 24px; margin-top: 0px; margin-bottom: 0px; font-weight: 400; font-family: &quot;맑은 고딕&quot;; font-size: 12pt;"><span style="font-family: &quot;맑은 고딕&quot;; font-size: 12pt; line-height: 24px; margin-top: 0px; margin-bottom: 0px; font-weight: 400;">MySql 저장</span></span></p>
			</td>
			<td style="border: 1px solid rgb(0, 0, 0); width: 298.969px; height: 155.344px;">
				<p style="line-height: 24px; margin-top: 0px; margin-bottom: 0px; font-weight: 400; font-family: &quot;맑은 고딕&quot;; font-size: 12pt;"><span style="font-family: &quot;맑은 고딕&quot;; font-size: 12pt; line-height: 24px; margin-top: 0px; margin-bottom: 0px; font-weight: 400;">- 사용자 연동&nbsp;</span><span style="line-height: 24px; margin-top: 0px; margin-bottom: 0px; font-weight: 400; font-family: &quot;맑은 고딕&quot;; font-size: 12pt;"><span style="font-family: &quot;맑은 고딕&quot;; font-size: 12pt; line-height: 24px; margin-top: 0px; margin-bottom: 0px; font-weight: 400;">데이터는&nbsp;</span></span><span style="line-height: 24px; margin-top: 0px; margin-bottom: 0px; font-weight: 400; font-family: &quot;맑은 고딕&quot;; font-size: 12pt;"><span style="font-family: &quot;맑은 고딕&quot;; font-size: 12pt; line-height: 24px; margin-top: 0px; margin-bottom: 0px; font-weight: 400;">MySql 저장 <strong>(D)</strong></span></span></p><p style="line-height: 24px; margin-top: 0px; margin-bottom: 0px; font-weight: 400; font-family: &quot;맑은 고딕&quot;; font-size: 12pt;"><span style="line-height: 24px; margin-top: 0px; margin-bottom: 0px; font-weight: 400; font-family: &quot;맑은 고딕&quot;; font-size: 12pt;"><span style="font-family: &quot;맑은 고딕&quot;; font-size: 12pt; line-height: 24px; margin-top: 0px; margin-bottom: 0px; font-weight: 400;">-&nbsp;</span></span><span style="font-size: 12pt; line-height: 24px; margin-top: 0px; margin-bottom: 0px; font-family: &quot;맑은 고딕&quot;; font-weight: 400;"><span style="font-size: 12pt; line-height: 24px; margin-top: 0px; margin-bottom: 0px; font-family: &quot;맑은 고딕&quot;; font-weight: 400;">수동</span></span><span style="font-size: 12pt; line-height: 24px; margin-top: 0px; margin-bottom: 0px; font-family: &quot;맑은 고딕&quot;; font-weight: 400;"><span style="font-size: 12pt; line-height: 24px; margin-top: 0px; margin-bottom: 0px; font-family: &quot;맑은 고딕&quot;; font-weight: 400;">&nbsp;입력된 아이디의&nbsp;</span></span><span style="font-size: 12pt; line-height: 24px; margin-top: 0px; margin-bottom: 0px; font-family: &quot;맑은 고딕&quot;; font-weight: 400;"><span style="font-size: 12pt; line-height: 24px; margin-top: 0px; margin-bottom: 0px; font-family: &quot;맑은 고딕&quot;; font-weight: 400;">비번은&nbsp;</span></span></p><p style="line-height: 24px; margin-top: 0px; margin-bottom: 0px; font-weight: 400; font-family: &quot;맑은 고딕&quot;; font-size: 12pt;"><span style="font-size: 12pt; font-family: &quot;맑은 고딕&quot;; line-height: 24px; margin-top: 0px; margin-bottom: 0px; font-weight: 400;">&nbsp; &nbsp;MySql 저장</span></p><p style="line-height: 24px; margin-top: 0px; margin-bottom: 0px; font-weight: 400; font-family: &quot;맑은 고딕&quot;; font-size: 12pt;"><span style="font-family: &quot;맑은 고딕&quot;; font-size: 12pt; line-height: 24px; margin-top: 0px; margin-bottom: 0px; font-weight: 400;">- 연동된 아이디의&nbsp;</span><span style="line-height: 24px; margin-top: 0px; margin-bottom: 0px; font-weight: 400; font-family: &quot;맑은 고딕&quot;; font-size: 12pt;"><span style="font-family: &quot;맑은 고딕&quot;; font-size: 12pt; line-height: 24px; margin-top: 0px; margin-bottom: 0px; font-weight: 400;">비번은&nbsp;</span></span><span style="font-size: 12pt; font-family: &quot;맑은 고딕&quot;; line-height: 24px; margin-top: 0px; margin-bottom: 0px; font-weight: 400;">MySql에</span></p><p style="line-height: 24px; margin-top: 0px; margin-bottom: 0px; font-weight: 400; font-family: &quot;맑은 고딕&quot;; font-size: 12pt;"><span style="font-size: 12pt; font-family: &quot;맑은 고딕&quot;; line-height: 24px; margin-top: 0px; margin-bottom: 0px; font-weight: 400;">&nbsp;&nbsp;</span><span style="font-size: 12pt; font-family: &quot;맑은 고딕&quot;; line-height: 24px; margin-top: 0px; margin-bottom: 0px; font-weight: 400;">저장되지 않</span><span style="font-size: 12pt; line-height: 24px; margin-top: 0px; margin-bottom: 0px; font-family: &quot;맑은 고딕&quot;; font-weight: 400;"><span style="font-size: 12pt; line-height: 24px; margin-top: 0px; margin-bottom: 0px; font-family: &quot;맑은 고딕&quot;; font-weight: 400;">도록&nbsp;</span></span><span style="font-size: 12pt; line-height: 24px; margin-top: 0px; margin-bottom: 0px; font-family: &quot;맑은 고딕&quot;; font-weight: 400;"><span style="font-size: 12pt; line-height: 24px; margin-top: 0px; margin-bottom: 0px; font-family: &quot;맑은 고딕&quot;; font-weight: 400;">하고&nbsp;</span></span><span style="font-size: 12pt; line-height: 24px; margin-top: 0px; margin-bottom: 0px; font-family: &quot;맑은 고딕&quot;; font-weight: 400;"><span style="font-size: 12pt; line-height: 24px; margin-top: 0px; margin-bottom: 0px; font-family: &quot;맑은 고딕&quot;; font-weight: 400;">사내</span></span><span style="font-size: 12pt; line-height: 24px; margin-top: 0px; margin-bottom: 0px; font-family: &quot;맑은 고딕&quot;; font-weight: 400;"><span style="font-size: 12pt; line-height: 24px; margin-top: 0px; margin-bottom: 0px; font-family: &quot;맑은 고딕&quot;; font-weight: 400;">&nbsp;</span></span><span style="font-size: 12pt; line-height: 24px; margin-top: 0px; margin-bottom: 0px; font-family: &quot;맑은 고딕&quot;; font-weight: 400;"><span style="font-size: 12pt; line-height: 24px; margin-top: 0px; margin-bottom: 0px; font-family: &quot;맑은 고딕&quot;; font-weight: 400;">시스템에&nbsp;</span></span></p><p style="line-height: 24px; margin-top: 0px; margin-bottom: 0px; font-weight: 400; font-family: &quot;맑은 고딕&quot;; font-size: 12pt;"><span style="font-size: 12pt; line-height: 24px; margin-top: 0px; margin-bottom: 0px; font-family: &quot;맑은 고딕&quot;; font-weight: 400;"><span style="font-size: 12pt; line-height: 24px; margin-top: 0px; margin-bottom: 0px; font-family: &quot;맑은 고딕&quot;; font-weight: 400;">&nbsp; 있는</span></span><span style="font-size: 12pt; line-height: 24px; margin-top: 0px; margin-bottom: 0px; font-family: &quot;맑은 고딕&quot;; font-weight: 400;"><span style="font-size: 12pt; line-height: 24px; margin-top: 0px; margin-bottom: 0px; font-family: &quot;맑은 고딕&quot;; font-weight: 400;">&nbsp;비번과</span></span><span style="font-size: 12pt; line-height: 24px; margin-top: 0px; margin-bottom: 0px; font-family: &quot;맑은 고딕&quot;; font-weight: 400;"><span style="font-size: 12pt; line-height: 24px; margin-top: 0px; margin-bottom: 0px; font-family: &quot;맑은 고딕&quot;; font-weight: 400;">&nbsp;</span></span><span style="font-size: 12pt; line-height: 24px; margin-top: 0px; margin-bottom: 0px; font-family: &quot;맑은 고딕&quot;; font-weight: 400;"><span style="font-size: 12pt; line-height: 24px; margin-top: 0px; margin-bottom: 0px; font-family: &quot;맑은 고딕&quot;; font-weight: 400;">비교하도록 변경 필요</span></span><span style="font-size: 12pt; line-height: 24px; margin-top: 0px; margin-bottom: 0px; font-family: &quot;맑은 고딕&quot;; font-weight: 400;">&nbsp;<strong>(E)</strong></span></p>
			</td>
			<td style="border: 1px solid rgb(0, 0, 0); width: 184.891px; height: 231.891px;" rowspan="3">
				<p style="line-height: 24px; margin-top: 0px; margin-bottom: 0px; font-weight: 400; font-family: &quot;맑은 고딕&quot;; font-size: 12pt;"><span style="font-family: &quot;맑은 고딕&quot;; font-size: 12pt; line-height: 24px; margin-top: 0px; margin-bottom: 0px; font-weight: 400;">- 기업 정책에 맞게</span></p><p style="line-height: 24px; margin-top: 0px; margin-bottom: 0px; font-weight: 400; font-family: &quot;맑은 고딕&quot;; font-size: 12pt;"><span style="font-family: &quot;맑은 고딕&quot;; font-size: 12pt; line-height: 24px; margin-top: 0px; margin-bottom: 0px; font-weight: 400;">&nbsp; 소스 수정</span></p>
			</td>
		</tr>
		<tr>
			<td style="border: 1px solid rgb(0, 0, 0); width: 89.25px; height: 23.2031px;">
				<p style="line-height: 24px; margin-top: 0px; margin-bottom: 0px; font-weight: 400; font-family: &quot;맑은 고딕&quot;; font-size: 12pt;"><span style="font-family: &quot;맑은 고딕&quot;; font-size: 12pt; line-height: 24px; margin-top: 0px; margin-bottom: 0px; font-weight: 400;">인증 관리</span></p>
			</td>
			<td style="border: 1px solid rgb(0, 0, 0); width: 149.891px; height: 23.2031px;">
				<p style="line-height: 24px; margin-top: 0px; margin-bottom: 0px; font-weight: 400; font-family: &quot;맑은 고딕&quot;; font-size: 12pt;"><span style="font-family: &quot;맑은 고딕&quot;; font-size: 12pt; line-height: 24px; margin-top: 0px; margin-bottom: 0px; font-weight: 400;">- JWT</span></p>
			</td>
			<td style="border: 1px solid rgb(0, 0, 0); width: 298.969px; height: 23.2031px;">
				<p style="line-height: 24px; margin-top: 0px; margin-bottom: 0px; font-weight: 400; font-family: &quot;맑은 고딕&quot;; font-size: 12pt;"><span style="font-family: &quot;맑은 고딕&quot;; font-size: 12pt; line-height: 24px; margin-top: 0px; margin-bottom: 0px; font-weight: 400;">- JWT</span></p>
			</td>
		</tr>
		<tr>
			<td style="border: 1px solid rgb(0, 0, 0); width: 89.25px; height: 49.3438px;">
				<p style="line-height: 24px; margin-top: 0px; margin-bottom: 0px; font-weight: 400; font-family: &quot;맑은 고딕&quot;; font-size: 12pt;"><span style="font-family: &quot;맑은 고딕&quot;; font-size: 12pt; line-height: 24px; margin-top: 0px; margin-bottom: 0px; font-weight: 400;">아이디&nbsp;</span><span style="line-height: 24px; margin-top: 0px; margin-bottom: 0px; font-weight: 400; font-family: &quot;맑은 고딕&quot;; font-size: 12pt;"><span style="font-family: &quot;맑은 고딕&quot;; font-size: 12pt; line-height: 24px; margin-top: 0px; margin-bottom: 0px; font-weight: 400;">등록</span></span></p>
			</td>
			<td style="border: 1px solid rgb(0, 0, 0); width: 149.891px; height: 49.3438px;">
				<p style="line-height: 24px; margin-top: 0px; margin-bottom: 0px; font-weight: 400; font-family: &quot;맑은 고딕&quot;; font-size: 12pt;"><span style="font-family: &quot;맑은 고딕&quot;; font-size: 12pt; line-height: 24px; margin-top: 0px; margin-bottom: 0px; font-weight: 400;">- 누구나 아이디</span></p><p style="line-height: 24px; margin-top: 0px; margin-bottom: 0px; font-weight: 400; font-family: &quot;맑은 고딕&quot;; font-size: 12pt;"><span style="font-family: &quot;맑은 고딕&quot;; font-size: 12pt; line-height: 24px; margin-top: 0px; margin-bottom: 0px; font-weight: 400;">&nbsp; 등록(가입) 가능</span></p>
			</td>
			<td style="border: 1px solid rgb(0, 0, 0); width: 298.969px; height: 49.3438px;">
				<p style="line-height: 24px; margin-top: 0px; margin-bottom: 0px; font-weight: 400; font-family: &quot;맑은 고딕&quot;; font-size: 12pt;"><span style="font-family: &quot;맑은 고딕&quot;; font-size: 12pt; line-height: 24px; margin-top: 0px; margin-bottom: 0px; font-weight: 400;">- 아이디 수동</span><span style="line-height: 24px; margin-top: 0px; margin-bottom: 0px; font-weight: 400; font-family: &quot;맑은 고딕&quot;; font-size: 12pt;"><span style="font-family: &quot;맑은 고딕&quot;; font-size: 12pt; line-height: 24px; margin-top: 0px; margin-bottom: 0px; font-weight: 400;">&nbsp;입력은</span></span><span style="line-height: 24px; margin-top: 0px; margin-bottom: 0px; font-weight: 400; font-family: &quot;맑은 고딕&quot;; font-size: 12pt;"><span style="font-family: &quot;맑은 고딕&quot;; font-size: 12pt; line-height: 24px; margin-top: 0px; margin-bottom: 0px; font-weight: 400;">&nbsp;관리자만&nbsp;</span></span></p><p style="line-height: 24px; margin-top: 0px; margin-bottom: 0px; font-weight: 400; font-family: &quot;맑은 고딕&quot;; font-size: 12pt;"><span style="line-height: 24px; margin-top: 0px; margin-bottom: 0px; font-weight: 400; font-family: &quot;맑은 고딕&quot;; font-size: 12pt;"><span style="font-family: &quot;맑은 고딕&quot;; font-size: 12pt; line-height: 24px; margin-top: 0px; margin-bottom: 0px; font-weight: 400;">&nbsp; 가능하도록</span></span><span style="line-height: 24px; margin-top: 0px; margin-bottom: 0px; font-weight: 400; font-family: &quot;맑은 고딕&quot;; font-size: 12pt;"><span style="font-family: &quot;맑은 고딕&quot;; font-size: 12pt; line-height: 24px; margin-top: 0px; margin-bottom: 0px; font-weight: 400;">&nbsp;변경 필요</span></span><span style="font-size: 12pt; font-family: &quot;맑은 고딕&quot;; line-height: 24px; margin-top: 0px; margin-bottom: 0px; font-weight: 400;">&nbsp;<strong>(F)</strong></span></p>
			</td>
		</tr>
	</tbody>
</table>
<p style="font-family: &quot;맑은 고딕&quot;; font-size: 12pt; line-height: 24px; margin-top: 0px; margin-bottom: 0px; font-weight: 400;"><br></p>

   ### (A) 환경 설정

```
   - 적용된 npm list는 아래와 같습니다. (package.json)

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
   
   - start.bat (PC 브라우저에서 호출되는 Node.js서버)

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

   - start1.bat (모바일앱에서 호출되는 Node.js서버)
   
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
      
   - nodeConfig.js (Node.js 전체 환경 설정)
   
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

   * Node.js 관련해 전체적으로 설정할 환경은 nodeConfig.js에 두었습니다. (위 소스 참조)
   * nodeConfig.js 파일의 위치는 어디에 두든지 상관없이 node app을 실행하기 전에 지정하면 됩니다.
   * sendjay에서는 편의상 PM2 등의 모듈을 사용하지 않고 node app으로 단순 구동했습니다.
   * jwt expiry는 변경되어 현재 1h 또는 4h로 설정되어 있습니다.

   ### (B) CORS 적용

```
   app : {
		nodeConfig : process.env.NODE_CONFIG,
		corsRestful : ['https://hushsbay.com', 'https://yyyydev.xxxxx.co.kr', 'https://yyyy.xxxxx.co.kr'], //Array type (Same origin이 없어도 됨)
		corsSocket : 'https://hushsbay.com', //Non-array type (Same origin이 들어 있어야 함)
		ipAccess : ['222.108.25.252'], //현재는 interfaceToDept.js, interfaceToUser.js에만 사용 : 테스트로 My PC
		logPath : process.env.LOG_PATH,
		mainserver : process.env.MAIN_SERVER,
		uploadPath : process.env.UPLOAD_PATH
	}
```

   * 조직/사용자 데이터 연동은 편의상 웹페이지에서 버튼으로 실행하는 것을 전제로 설명하는데
   * 웹페이지에서 호출하는 경우 요청을 받는 서버에서는 CORS 이슈가 있으므로
   * 위 소스와 같이 config.js내 CORS 이슈를 통과하는 호스트명을 추가해야 합니다.

   ### (C) 호출 서버 변경 

   * 모바일소스 (https://github.com/hushsbay/sendjay_aos) Const.kt내에서
     const val URL_HOST = "https://hushsbay.com"를 알맞은 호스트명으로 변경이 필요합니다.

   ### (D) 조직/사용자 데이터 연동 (인터페이스)

   sendjay를 사내 시스템에 적용시 조직/사용자 데이터를 다음과 같이 택일해 적용/운영 가능합니다.<br/>
   
   1. GitHub 소스를 내려받아 사내 시스템에 맞게 커스터마이징후 운영하기
      - 특히, Z_ORG_TBL(조직)과 Z_USER_TBL(사용자) 대신 사내 운영되는 테이블로 교체하면 될 것입니다.
   
   2. 내려받은 GitHub 소스를 수정하지 않고 그대로 운영하기 (패키지 형태)
      - 아래는 이 경우에 대하여 어떻게 연동시키는지 설명하고 있습니다.
      - 위 표 (1) '조직/사용자만 연동하고 소스는 그대로 사용'하는 구축 방식입니다.
      - 조직/사용자 데이터 연동은 시스템마다 (인증 등) 특성이 있을텐데 편의상 여기서는<br/>
        웹페이지에서 수동으로 버튼을 눌러 연동하는 방식으로 진행하며<br/>
        시스템내 배치, 데몬 등의 적용은 사내ERP환경에 맞게 구성하면 될 것입니다.<br/>
     
   * 먼저, 아래 화면에서 '간편등록' 버튼을 눌러 'admin'이라는 아이디를 만듭니다.
      - 아이디를 admin으로 입력하고 이름/비번만 저장하고 회사/부서 등은 입력하지 않습니다. 
      - admin으로 로그인하여 organ이라는 아이디도 만듭니다. (조직/사용자 데이터 연동용 아이디) 
      - 아이디를 organ으로 입력하고 이름/비번만 저장하고 회사/부서 등은 입력하지 않습니다.
      - 아래 화면은 수동으로 아이디를 만드는 페이지입니다.
      - 사용자정보와 연동해 자동으로 동기화된 아이디는 아래 화면에서는 조회되지 않으며<br>
        수동으로 등록한 아이디만 조회됩니다.<br/>
   
   ![image](https://github.com/hushsbay/sendjay/blob/master/sendjay_interface_1.png)

   ![image](https://github.com/hushsbay/sendjay/blob/master/sendjay_interface_2.png)

   * 사내ERP 웹페이지에 아래 소스를 각각 원하는 이름으로 설정한 버튼에 넣습니다.

      + 소스내 deptArr, userArr는 편의상 하드코딩이지만 실제 사내 ERP에서는 데이터를 읽어오면 될 것입니다.
   
```
      const _userid = "organ" 
      const _token = "복사한 토큰값을 여기에 붙여 넣습니다"
      const dt = "" //dt = "20240901134528" //테스트. DTKEY가 없는 경우는 서버에서 생성. 있으면 서버에 있는 기존 데이터 삭제후 생성

      const interfaceToDept = () => {
         const deptArr = [ //사내 ERP에서 가져오는 조직 관련 데이터 샘플입니다.
            { DTKEY : dt, ORG_CD : "Company_A", ORG_NM : "삼성전자", SEQ : "A00", LVL : 0 },
            { DTKEY : dt, ORG_CD : "Division_A1", ORG_NM : "본부_A1", SEQ : "A10", LVL : 1 },
            { DTKEY : dt, ORG_CD : "Dept_A11", ORG_NM : "팀_A11", SEQ : "A11", LVL : 2 },
            { DTKEY : dt, ORG_CD : "Dept_A12", ORG_NM : "팀_A12", SEQ : "A12", LVL : 2 },
            { DTKEY : dt, ORG_CD : "Dept_A13", ORG_NM : "팀_A13", SEQ : "A13", LVL : 2 },
            { DTKEY : dt, ORG_CD : "Division_A2", ORG_NM : "본부_A2", SEQ : "A20", LVL : 1 },
            { DTKEY : dt, ORG_CD : "Dept_A21", ORG_NM : "팀_A21", SEQ : "A21", LVL : 2 },
            { DTKEY : dt, ORG_CD : "Dept_A22", ORG_NM : "팀_A22", SEQ : "A22", LVL : 2 },
            { DTKEY : dt, ORG_CD : "Dept_A23", ORG_NM : "팀_A23", SEQ : "A23", LVL : 2 },
            { DTKEY : dt, ORG_CD : "Company_B", ORG_NM : "삼성물산", SEQ : "B00", LVL : 0 },
            { DTKEY : dt, ORG_CD : "Division_B1", ORG_NM : "본부_B1", SEQ : "B10", LVL : 1 },
            { DTKEY : dt, ORG_CD : "Dept_B11", ORG_NM : "팀_B11", SEQ : "B11", LVL : 2 },
            { DTKEY : dt, ORG_CD : "Dept_B12", ORG_NM : "팀_B12", SEQ : "B12", LVL : 2 },
            { DTKEY : dt, ORG_CD : "Dept_B13", ORG_NM : "팀_B13", SEQ : "B13", LVL : 2 },
            { DTKEY : dt, ORG_CD : "Division_B2", ORG_NM : "본부_B2", SEQ : "B20", LVL : 1 },
            { DTKEY : dt, ORG_CD : "Dept_B21", ORG_NM : "팀_B21", SEQ : "B21", LVL : 2 },
            { DTKEY : dt, ORG_CD : "Dept_B22", ORG_NM : "팀_B22", SEQ : "B22", LVL : 2 },
            { DTKEY : dt, ORG_CD : "Dept_B23", ORG_NM : "팀_B23", SEQ : "B23", LVL : 2 },
            { DTKEY : dt, ORG_CD : "Company_C", ORG_NM : "삼성디스플레이", SEQ : "C00", LVL : 0 },
            { DTKEY : dt, ORG_CD : "Division_C1", ORG_NM : "본부_C1", SEQ : "C10", LVL : 1 },
            { DTKEY : dt, ORG_CD : "Dept_C11", ORG_NM : "팀_C11", SEQ : "C11", LVL : 2 },
            { DTKEY : dt, ORG_CD : "Dept_C12", ORG_NM : "팀_C12", SEQ : "C12", LVL : 2 },
            { DTKEY : dt, ORG_CD : "Dept_C13", ORG_NM : "팀_C13", SEQ : "C13", LVL : 2 },
            { DTKEY : dt, ORG_CD : "Division_C2", ORG_NM : "본부_C2", SEQ : "C20", LVL : 1 },
            { DTKEY : dt, ORG_CD : "Dept_C21", ORG_NM : "팀_C21", SEQ : "C21", LVL : 2 },
            { DTKEY : dt, ORG_CD : "Dept_C22", ORG_NM : "팀_C22", SEQ : "C22", LVL : 2 },
            { DTKEY : dt, ORG_CD : "Dept_C23", ORG_NM : "팀_C23", SEQ : "C23", LVL : 2 },
         ]				
         const _urlDept = "https://hushsbay.com/org/interfaceToDept"
         $.ajax({
            dataType : "json" //response data type
            ,contentType : "application/x-www-form-urlencoded;charset=utf-8" //request mime type => application/json은 CORS 안먹힘
            ,url : _urlDept
            ,data : { userid : _userid, token : _token, dept : deptArr }
            ,type : "post"
            ,cache : false
            ,success : function(rs) {
               if (rs.code != "0") {
                  alert(rs.msg + " (" + rs.code + ")")
                  return
               }
               alert("interfaceToDept DTKEY : " + rs.dtkey)
            }
            ,error : function(xhr, status, error) {
               alert("[Error] " + status + "/" + error)
            }
         })
      }

      const interfaceToUser = () => {
         const userArr = [ //사내 ERP에서 가져오는 사용자 관련 데이터 샘플입니다.
            { DTKEY : dt, USER_ID : "A000001", USER_NM : "이의방", ORG_CD : "Dept_C11", ORG_NM : "팀_C11", TOP_ORG_CD : "Company_C", TOP_ORG_NM : "삼성디스플레이", JOB : "프로그래머", TEL_NO : "01012345678", AB_CD : "", AB_NM : "" },
            { DTKEY : dt, USER_ID : "A000002", USER_NM : "정중부", ORG_CD : "Dept_C11", ORG_NM : "팀_C11", TOP_ORG_CD : "Company_C", TOP_ORG_NM : "삼성디스플레이", JOB : "사내변호사", TEL_NO : "01054982564", AB_CD : "dayoff", AB_NM : "20240901-20240930" },
            { DTKEY : dt, USER_ID : "A000003", USER_NM : "경대승", ORG_CD : "Dept_C11", ORG_NM : "팀_C11", TOP_ORG_CD : "Company_C", TOP_ORG_NM : "삼성디스플레이", JOB : "예산담당", TEL_NO : "01043565279", AB_CD : "", AB_NM : "" },
            { DTKEY : dt, USER_ID : "A000004", USER_NM : "이의민", ORG_CD : "Dept_C11", ORG_NM : "팀_C11", TOP_ORG_CD : "Company_C", TOP_ORG_NM : "삼성디스플레이", JOB : "자금담당", TEL_NO : "01097826494", AB_CD : "biztrip", AB_NM : "20241025-20241028" },
         ]			
         const _urlUser = "https://hushsbay.com/org/interfaceToUser"
         $.ajax({
            dataType : "json" //response data type
            ,contentType : "application/x-www-form-urlencoded;charset=utf-8" //request mime type => application/json은 CORS 안먹힘
            ,url : _urlUser
            ,data : { userid : _userid, token : _token, user : userArr }
            ,type : "post"
            ,cache : false
            ,success : function(rs) {
               if (rs.code != "0") {
                  alert(rs.msg + " (" + rs.code + ")")
                  return
               }
               alert("interfaceToUser DTKEY : " + rs.dtkey)
            }
            ,error : function(xhr, status, error) {
               alert("[Error] " + status + "/" + error)
            }
         })
      }
```

   * 위 소스내 _token은 인증토큰 값을 복사해서 붙인 것인데, organ으로 로그인후</br>
     '간편등록' 옆에 보이는 '관리자'라는 메뉴를 클릭하면 팝업이 열립니다.</br>

     + '토큰복사'를 누르면 클립보드에 값이 복사되고 위 소스의 _token에 붙여 넣습니다.
     + 복사된 토큰은 만기가 있습니다. (서버의 nodeConfig.js 내 jwt expiry 값 참조)

   ![image](https://github.com/hushsbay/sendjay/blob/master/sendjay_interface_3.png)   
      
   * 이제 사내 ERP 웹페이지에 붙여진 소스인 interfaceToDept()와 interfaceToUser()를 각각 실행하면<br/>
     1차로 MySql 테이블 Z_INTORG_TBL과 Z_INTUSER_TBL에 인터페이스용 데이터가 저장됩니다.

   * 그리고, 바로 위 그림(admin.html)의 '조직연동'과 '사용자연동'을 누르면<br/> 
     2차로 MySql 테이블 Z_INTORG_TBL과 Z_INTUSER_TBL을 읽어서<br>
     Z_ORG_TBL과 Z_USER_TBL에 데이터가 최종 저장되어 실제 적용됩니다.<br>
     - hushsbay.com에서는 새 아이디의 비번은 아이디와 동일하게 설정되어 있습니다.<br>

   * 위에서 설명된 내용은, 이해를 돕기 위해 웹페이지에서 버튼을 누르는 방식으로 구현한 것인데<br/>
     실제 환경에서는 거의 모두 자동화되어 돌아가야 하는 것들일 것입니다. 자동화시키는 것은<br/>
     사내 ERP 환경이 각각 다르기 때문에 각사에서 알아서 구현해야 할 사안일 것입니다.<br/>

   * 필요하면 간편등록에서 수동으로도 아이디를 만들 수 있습니다.<br/>
     + 팀공용 아이디, 가상 아이디 등..
     + hushsbay.com에서는 테스트 가능한 사이트이므로 로그인하지 않고도 아이디를 간단히 만들어<br/>
       사용할 수 있습니다만 실제 사내 ERP에서는 관리자만 가능하도록 해야 할 것입니다.

   ### (E) 비번 검증시 사내 시스템에 안전하게 보관된 비번 참조

   * 아래 소스인 pwd.js의 주석으로 설명을 대체함

```
const config = require('../config')
const nodeConfig = require(config.app.nodeConfig)
const ws = require(nodeConfig.app.ws)
const wsmysql = require(nodeConfig.app.wsmysql)

//굳이 별도의 pwd.js 파일로 분리한 이유는 각 기업의 사내 ERP등으로부터 인터페이스를 통해 조직/사용자 데이터 연동시
//각종 사용자 정보를 내려서 Z_USER_TBL에 담으면 되지만 암호화된 비번을 가져 와서 저장,관리하는 것은 보안상 부담스러움

//Z_USER_TBL에 있는 사용자정보중에 IS_SYNC=Y값은 데이터 연동되어 가져온 데이터이고 그 외는 수동으로 입력한 데이터임
//- 수동 입력 데이터는 사내 ERP등과 연동하지 않으므로 자체 암호화된 비번을 저장하고 있음

//따라서, Github 소스를 내려 받아서 사내 ERP와 연동하지 않고 테스트 용도 등으로 그냥 사용한다면 아래 소스는 그대로 두면 되나
//사내 ERP등으로부터 인터페이스를 통해 조직/사용자 데이터 연동한다면 아래 2가지를 진행해야 함

//1. applyUser.js에 있는 아래 2가지 메소드 getEncrypt()와 getFromRepository()을 제거하고 그 값을 받는 PWD 필드값은 빈값으로 채우고
//2. 그 아래 메소드인 verify()를, 현재 Z_USER_TBL을 읽어서 비번을 검증하는 것을 사내 ERP 인증 모듈을 호출해서 인증결과 및 암호화된 비번을 받는 루틴으로 변경하면 
//결론적으로, 비번을 Z_USER_TBL에 저장하지 않고 원본 Repository에 두고 핸들링이 가능해진다고 보여짐

module.exports = {
    getEncrypt : (userid) => {
        return new Promise(async (resolve, reject) => {
            try {
                const _enc = ws.util.encrypt(userid, nodeConfig.crypto.key)
                resolve(_enc)
            } catch (ex) {
				reject(null)
			}
        })
    },
    getFromRepository : (userid) => {
		return new Promise(async (resolve, reject) => {
			let conn, sql, data, len
			try {
                conn = await wsmysql.getConnFromPool(global.pool)
                sql = "SELECT PWD FROM Z_USER_TBL WHERE USER_ID = ? "
                data = await wsmysql.query(conn, sql, [userid])
                if (data.length == 0) throw new Error()
                resolve(data[0].PWD) //암호화된 비번
			} catch (ex) {
				reject(null)
			} finally {
                wsmysql.closeConn(conn, 'pwd.getFromRepository')
            }
		})
	},
	verify : (userid, pwd, autologin) => {
		return new Promise(async (resolve, reject) => {
			let conn, sql, data, len
            const rs = ws.http.resInit()
			try {
                conn = await wsmysql.getConnFromPool(global.pool)
                sql = "SELECT PWD FROM Z_USER_TBL WHERE USER_ID = ? "
                data = await wsmysql.query(conn, sql, [userid])
                if (data.length == 0) {
                    rs.code = ws.cons.CODE_USERID_NOT_EXIST
                    rs.msg = '사용자아이디가 없습니다.'
                    resolve(rs)
                    return
                }
                let pwdToCompare
                if (autologin == 'Y') { //pwd는 앱에 저장된 암호화된 상태의 값이므로 pwdToCompare도 암호화된 값 그대로 비교 필요
                    pwdToCompare = data[0].PWD
                } else { //pwd는 암호화되지 않은 사용자 입력분 그대로이므로 pwdToCompare도 디코딩 필요
                    pwdToCompare = ws.util.decrypt(data[0].PWD, nodeConfig.crypto.key)
                } //console.log(userid, pwd, pwdToCompare, autologin)
                if (pwd != pwdToCompare) { //pwd는 요청값인데 평문일 수도 암호화된 값일 수도 있음
                    rs.code = ws.cons.CODE_PWD_MISMATCH
                    rs.msg = '비번이 다릅니다.'
                    resolve(rs)
                    return
                }
                rs.PWD = data[0].PWD //암호화된 비번
                resolve(rs)
			} catch (ex) {
                rs.code = ws.cons.CODE_ERR
                rs.msg = ex.message
				reject(rs)
			} finally {
                wsmysql.closeConn(conn, 'pwd.verify')
            }
		})
	}
}
```

   ### (F) 일부 아이디 수동입력 허용시 관리자만 가능하도록 함

   * 아래 소스인 setuser.js에서 변경전->변경후로 소스 수정하면 됨

```
   //변경전
   if (id == 'admin') {
      //맨처음 로그인없이 누구나 admin 아이디 만들 수 있어야 함
   } else if (userid != 'admin') {
      //ws.http.resWarn(res, 'admin만 가능한 작업입니다.')
      if (_kind != 'U') {
         ws.http.resWarn(res, 'admin이 아니면 일반 사용자ID만 처리 가능합니다.')
         return
      }
   }

   //변경후 
   if (id == 'admin') {
      //맨처음 로그인없이 누구나 admin 아이디 만들 수 있어야 함
   } else if (userid != 'admin') {
      ws.http.resWarn(res, 'admin만 가능한 작업입니다.')
   }
```


# Table 명세 (MySql)

   - Z_INTORG_TBL  : 조직 정보 (인터페이스용)
   - Z_INTUSER_TBL : 사용자 정보 (인터페이스용)
   - Z_ORG_TBL     : 조직(회사/본부/팀 등) 정보
   - Z_USER_TBL    : 사용자 정보
   - A_ROOMMST_TBL : 채팅방 마스터 정보
   - A_ROOMDTL_TBL : 채팅방 디테일 정보
   - A_ROOMMEM_TBL : 채팅방 멤버 정보
   - A_MSGMST_TBL  : 메시지(톡) 마스터 정보
   - A_MSGDTL_TBL  : 메시지(톡) 디테일 정보
   - A_FILELOG_TBL : 파일 전송 관련 정보
   - A_ACTLOG_TBL  : 액션로그(연결 테스트 등) 정보

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
AUTOKEY_APP VARCHAR(6) NOT NULL DEFAULT '' COMMENT '자동로그인키',
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
KIND VARCHAR(20) NOT NULL DEFAULT '' COMMENT '통신방식',
STATE VARCHAR(10) NOT NULL DEFAULT '' COMMENT '상태',
DUR INTEGER NOT NULL DEFAULT 0 COMMENT 'Duration',
REMARK VARCHAR(200) NOT NULL DEFAULT '' COMMENT '비고',
CDT CHAR(26) NOT NULL DEFAULT '' COMMENT '작성시각 등',
UDT CHAR(26) NOT NULL DEFAULT '' COMMENT '수정시각 등',
ISUDT CHAR(26) NOT NULL DEFAULT '' COMMENT '서버시각 기준' ) ;
CREATE UNIQUE INDEX Z_ACTLOG_IDX0 ON jay.Z_ACTLOG_TBL (ISUDT, USER_ID, WORK) ;


-- 아래 2개의 테이블은 Sendjay ver2.0에서 구현될 내용 (ver1.0에서는 미사용)

drop table if exists jay.A_CHANMST_TBL;
CREATE TABLE jay.A_CHANMST_TBL (
MSGID VARCHAR(40) NOT NULL COMMENT '메시지아이디',
SENDERID VARCHAR(40) NOT NULL COMMENT '발신자아이디',
SENDERNM VARCHAR(40) NOT NULL COMMENT '발신자명',
PGMID VARCHAR(10) NOT NULL COMMENT '프로그램아이디',
BODY VARCHAR(4000) NOT NULL COMMENT '본문',
CDT CHAR(26) NOT NULL DEFAULT '' COMMENT '등록시각' );
CREATE UNIQUE INDEX A_CHANMST_IDX0 ON jay.A_CHANMST_TBL (MSGID) ;


drop table if exists jay.A_CHANDTL_TBL;
CREATE TABLE jay.A_CHANDTL_TBL (
MSGID VARCHAR(40) NOT NULL COMMENT '메시지아이디',
RECEIVERID VARCHAR(40) NOT NULL COMMENT '수신자아이디',
RECEIVERNM VARCHAR(40) NOT NULL COMMENT '수신자명',
STATE CHAR(1) NOT NULL DEFAULT '' COMMENT '상태. D(deleted)/R(read)',
UDT CHAR(26) NOT NULL DEFAULT '' COMMENT '수정(읽음/삭제시각)' );
CREATE UNIQUE INDEX A_CHANDTL_IDX0 ON jay.A_CHANDTL_TBL (MSGID, RECEIVERID) ;

```



끝.



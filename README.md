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

현재 80%정도 개발된 상태입니다.<br/>
안드로이드용 소스는 <https://github.com/hushsbay/sendjay_aos> 참조하시면 되며<br/>
여기 소스는 was와 web client가 들어 있는 sendjay_was라고 생각하고 보면 됩니다. (나중에 이름 변경 예정)

# Sendjay 소개

1. Sendjay는 개인이 만들고 명명한 메시징 앱/웹 (통합) 프로그램입니다. (created by hushsbay@gmail.com)

2. Sendjay는 현재 모 기업내 ERP 사이트에서 위 당사자에 의해 개발되어 현재 실사용중인 웹 전용 메신저를<br/>
   좀 더 확장시켜 멀티소켓서버 환경으로 구성하고 안드로이드 앱에서도 사용 가능하도록 개발되었습니다.

3. Sendjay는 이미 개발된 웹 모듈을 거의 그대로 재사용해 앱내 WebView에서 실행되므로<br/>
   개발/유지보수 효율성이 높습니다. (소켓통신, 알림 등 고유한 기능은 네이티브 앱에서 처리하도록 개발)

4. Sendjay의 웹 모듈은 기업내 ERP 등과 같은 사이트에 로그인하면 해당 페이지에 백그라운드로 자동 실행되어<br/>
   알림을 받을 수 있으며 해당 페이지를 닫으면 다른 페이지에 백그라운드로 자동 실행되도록 해서 로그인한 후엔<br/>
   항상 연결되어 있어 메시지를 받을 수 있도록 하였습니다.

5. Sendjay는 소스만 제공하는 것뿐만 아니라 누구나 자유롭게 실제로 사용해 볼 수 있도록 사이트를 제공합니다.<br/>
   다만, 개인이 만든 사이트이므로 대용량 파일 업로드에 제한이 있으며 서버 성능 문제를 겪을 수도 있음을<br/>
   양해해 주시기 바랍니다. 아래 사이트로 들어가 간단히 아이디를 만들어 테스트 가능합니다.

   <https://hushsbay.com>

6. Sendjay는 소스를 내려 받아 구축형(On-Premise)으로 사내 ERP등의 사용자관리와 연동해 운영할 수 있습니다.<br/>   
   - 하단 MySql Table 명세 참조

# 환경 구성

   포트를 PC와 모바일로 나눈 것은 단순히 테스트 편의를 위한 구분입니다.
   
![image](https://github.com/hushsbay/hushsbay/blob/master/sendjay_env.png)


# 주요 특징 (메시징 관점에서)

   1. (웹/모바일) 소켓 Connect/Reconnect

      웹이든 모바일이든 소켓연결 및 재연결시 사용자가 불편함을 느끼지 않도록 자연스럽게 (자동) 처리하는 것이<br/>
      핵심입니다. 특히, 메신저는 모든 직원이 항상 (웹 관점으로 보면 사내ERP에 들어와 있는 상태에서는 항상)<br/>
      소켓이 연결되어 있어야 한다는 것입니다. 서로 연결되어 있지 않은 메신저는 의미가 없기 때문입니다.

      (1) 웹에서의 소켓 (자동) 연결
     
         ![image](https://github.com/hushsbay/hushsbay/blob/master/sendjay_erp_portal.png)

         - 사내ERP에 최초 접속시 웹메신저를 별도의 브라우저탭으로(Standalone) 자동 실행시키는 경우는<br/>
           크게 문제가 없으나 사용자가 무심코 해당 메신저 탭을 닫거나 다른 사이트로 대체해버리면<br/>
           다른 사내ERP 탭에서 다시 자동실행을 시켜야 하는데 이 때 사용자 입장에서는<br/>
           새로운 브라우저 탭이 자동으로 열리는 것이 불편하고 시각적으로도 아주 거슬리게 됩니다.<br/>

         - 그래서, 브라우저탭에서 백그라운드로 자동실행하는 옵션을 제공하여 사용자가 선택할 수 있도록 합니다.<br/>
           위 그림처럼 브라우저탭에 (with Talk)으로 표시된 것이 백그라운드로 자동실행된 것이며 새로운 톡이<br/>
           도착하면 알림이 뜨게 됩니다.<br/>

         - 사내ERP탭은 회사의 정책에 따라 하나만 제공될 수도 있으나 일반적으로 여러 개의 탭이 열릴 것인데<br/>
           이 경우 백그라운드 자동실행은 각 탭간의 (로컬에서의) 경합을 통해 한개의 탭에서만 동작하도록 했습니다.<br/>

      (2) 모바일에서의 소켓 연결
     
         - ㅎㅎㅎㅎㅎ
      
   1. 하하하

# 구축형(On-Premise) 서버 적용 안내


# Table 명세 (MySql)

   - Z_ORG_TBL     : 조직(회사, 본부, 팀 등) 정보
   - Z_USER_TBL    : 사용자 정보
   - Z_ROOMMST_TBL : 채팅방 마스터 정보
   - Z_ROOMDTL_TBL : 채팅방 디테일 정보
   - Z_ROOMMEM_TBL : 채팅방 멤버 정보
   - Z_MSGMST_TBL  : 메시지(톡) 마스터 정보
   - Z_MSGDTL_TBL  : 메시지(톡) 디테일 정보
   - Z_FILELOG_TBL : 파일 전송 관련 정보
   - Z_ACTLOG_TBL  : 액션로그(연결 등) 정보

```
drop table if exists jay.Z_ORG_TBL;
CREATE TABLE jay.Z_ORG_TBL (
ORG_CD VARCHAR(20) NOT NULL COMMENT '조직코드',
ORG_NM VARCHAR(50) NOT NULL COMMENT '조직명',
SEQ VARCHAR(8) NOT NULL COMMENT '순서',
LVL INTEGER NOT NULL COMMENT '레벨(Depth)',
INUSE CHAR(1) NOT NULL DEFAULT '' COMMENT '사용중(Y)' ) ;
CREATE UNIQUE INDEX Z_ORG_IDX0 ON jay.Z_ORG_TBL (ORG_CD) ;
CREATE INDEX Z_ORG_IDX1 ON jay.Z_ORG_TBL (SEQ) ;


drop table if exists jay.Z_USER_TBL;
CREATE TABLE jay.Z_USER_TBL (
USER_ID VARCHAR(20) NOT NULL COMMENT '사용자아이디',
PWD VARCHAR(128) NOT NULL COMMENT '비밀번호',
USER_NM VARCHAR(50) NOT NULL COMMENT '사용자명',
ORG_CD VARCHAR(20) NOT NULL DEFAULT '' COMMENT '조직코드',
ORG_NM VARCHAR(50) NOT NULL DEFAULT '' COMMENT '조직명',
TOP_ORG_CD VARCHAR(20) NOT NULL DEFAULT '' COMMENT '최상위 조직코드',
TOP_ORG_NM VARCHAR(50) NOT NULL DEFAULT '' COMMENT '최상위 조직명',
PICTURE longblob NULL,Y
MIMETYPE VARCHAR(25) NOT NULL DEFAULT '' COMMENT 'mimetype for PICTURE',
NICK_NM VARCHAR(100) NOT NULL DEFAULT '' COMMENT '별칭 또는 상태',
JOB VARCHAR(50) NOT NULL DEFAULT '' COMMENT '직무, 업무내용',
TEL_NO VARCHAR(20) NOT NULL DEFAULT '' COMMENT '전화번호',
AB_CD VARCHAR(7) NOT NULL DEFAULT '' COMMENT '부재코드(예:dayoff, biztrip)',
AB_NM VARCHAR(50) NOT NULL DEFAULT '' COMMENT '부재내용(예:20210101~20210103)',
STANDALONE CHAR(1) NOT NULL DEFAULT '' COMMENT '별도탭에서실행(Y). 웹전용',
NOTI_OFF CHAR(1) NOT NULL DEFAULT '' COMMENT '알림끄기(Y)',
SOUND_OFF CHAR(1) NOT NULL DEFAULT '' COMMENT '소리끄기(Y)',
VIB_OFF CHAR(1) NOT NULL DEFAULT '' COMMENT '진동끄기(Y)',
BODY_OFF CHAR(1) NOT NULL DEFAULT '' COMMENT '알림내용숨기기(Y)',
SENDER_OFF CHAR(1) NOT NULL DEFAULT '' COMMENT '발신자숨기기(Y)',
TM_FR VARCHAR(4) NOT NULL DEFAULT '' COMMENT '알림시간(시작)',
TM_TO VARCHAR(4) NOT NULL DEFAULT '' COMMENT '알림시간(종료)',
LASTCHKDT CHAR(26) NOT NULL DEFAULT '' COMMENT '최근체크시각',
UID VARCHAR(30) NOT NULL DEFAULT '' COMMENT '유니크아이디(예:IP)',
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






# 참고 사항

![image](https://github.com/hushsbay/hushsbay/assets/51398212/b86591c8-f16b-484f-bcf0-1a7d58a90909)



const config = require('../main/config')
const winston = require('winston')
const winstonDaily = require('winston-daily-rotate-file')

module.exports = function(logPath, title) {

   const { combine, timestamp, label, printf } = winston.format

   const logDir = logPath //`${process.cwd()}/logs` //로그 파일 저장 경로 → 루트 경로/logs 폴더
   const logFormat = printf(({ level, message, label, timestamp }) => { //로그 출력 포맷 정의 함수
      return `${timestamp} [${level}] ${message}` //return `${timestamp} [${label}] ${level}: ${message}`; // 날짜 [시스템이름] 로그레벨 메세지
   })

   //Log Level => error: 0, warn: 1, info: 2, http: 3, verbose: 4, debug: 5, silly: 6
   const logger = winston.createLogger({
      format: combine( //로그 출력 형식 정의
         timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
         label({ label: title }), 
         logFormat, //? format: combine() 에서 정의한 timestamp와 label 형식값이 logFormat에 들어가서 정의되게 된다. level이나 message는 콘솔에서 자동 정의
      ),
      transports: [ //실제 로그를 어떻게 기록을 한 것인가 정의
         new winstonDaily({ //info 레벨 로그를 저장할 파일 설정 (info: 2 보다 높은 error: 0 와 warn: 1 로그들도 자동 포함해서 저장)
            level: 'info', // info 레벨에선
            datePattern: 'YYYY-MM-DD', // 파일 날짜 형식
            dirname: logDir, // 파일 경로
            filename: title + `.%DATE%.log`, // 파일 이름
            maxFiles: 3, // 최근 3일치 로그 파일을 남김
            zippedArchive: true,
         }),
         new winstonDaily({ //error 레벨 로그를 저장할 파일 설정 (info에 자동 포함되지만 일부러 따로 빼서 설정)
            level: 'error', // error 레벨에선
            datePattern: 'YYYY-MM-DD',
            dirname: logDir, // + '/error', // /logs/error 하위에 저장
            filename: title + `.%DATE%.error.log`, // 에러 로그는 2020-05-28.error.log 형식으로 저장
            maxFiles: 3,
            zippedArchive: true,
         }),
      ],
      exceptionHandlers: [ //uncaughtException 발생시 파일 설정
         new winstonDaily({
            level: 'error',
            datePattern: 'YYYY-MM-DD',
            dirname: logDir,
            filename: title + `.%DATE%.exception.log`,
            maxFiles: 3,
            zippedArchive: true,
         }),
      ],
   })

   //if (process.env.NODE_ENV !== 'production') { //Production이 아닌 개발 환경일 경우 파일 들어가서 로그 확인하기 번거로우니까 화면에서 바로 찍게 설정 (로그 파일은 여전히 생성)
      logger.add(
         new winston.transports.Console({
            format: winston.format.combine( //json, label, timestamp, printf, simple, combine
               //winston.format.colorize(), // 색깔 넣어서 출력
               //winston.format.simple() // `${info.level}: ${info.message} JSON.stringify({ ...rest })` 포맷으로 출력
               winston.format.timestamp({ format: 'YYYY-MM-DD HH:MM:SS' }),
               winston.format.colorize({ all: true }),
               winston.format.printf(
                  (info) => `${info.timestamp} ${info.message}`
               )
            ),
         }),
      )
   //}

   return logger

}

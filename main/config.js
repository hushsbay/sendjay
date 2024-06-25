module.exports = {
	http : {
		method : process.env.HTTP_METHOD, //예) AWS 로드밸랜서 안쪽이면 http로 통신
		port : process.env.HTTP_PORT
	},
	mysql : {
		schema : process.env.MYSQL_SCHEMA
	},
	sock : {
		port : process.env.SOCK_PORT,	
		namespace : process.env.SOCK_NAMESPACE		
    },
	redis : {
		db : process.env.REDIS_DB
	},
	app : {
		nodeConfig : process.env.NODE_CONFIG,
		corsRestful : ['https://hushsbay.com'], //Array type. Same origin이 없어도 됨
		corsSocket : 'https://hushsbay.com', //Non-array type. Same origin이 들어 있어야 함
		logPath : process.env.LOG_PATH,
		mainserver : process.env.MAIN_SERVER,
		uploadPath : process.env.UPLOAD_PATH
	}
}

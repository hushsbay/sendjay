module.exports = {
	http : {
		method : process.env.HTTP_METHOD, //로드밸랜서 안쪽이면 http로 가능
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
		db : process.env.REDIS_DB,
		//flush : process.env.REDIS_FLUSH_SERVER 
	},
	app : {
		nodeConfig : process.env.NODE_CONFIG,
		ws : process.env.MODULE_COMMON,
		wsmysql : process.env.MODULE_MYSQL,
		corsRestful : ['https://hushsbay.com'], //Array type. It's ok even if same origin not here
		corsSocket : 'https://hushsbay.com', //Non-array type. Same origin should be here
		wslogger : process.env.MODULE_LOGGER,
		logPath : process.env.LOG_PATH,
		mainserver : process.env.MAIN_SERVER,
		uploadPath : process.env.UPLOAD_PATH,
		ffmpegPath : process.env.FFMPEG_PATH,
	}
}

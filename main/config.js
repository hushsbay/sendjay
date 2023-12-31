module.exports = {
	http : {
		method : process.env.HTTP_METHOD, //로드밸랜서 안쪽이면 http로 가능
		port : process.env.HTTP_PORT
	},
	mysql : {
		schema : process.env.MYSQL_SCHEMA
	},
	app : {
		nodeConfig : process.env.NODE_CONFIG,
		ws : process.env.MODULE_COMMON,
		wsmysql : process.env.MODULE_MYSQL,
		wslogger : process.env.MODULE_LOGGER,
		logPath : process.env.LOG_PATH
	}
}

module.exports = {
	http : {
		method : process.env.HTTP_METHOD, //로드밸랜서 안쪽이면 https or http
		port : process.env.HTTP_PORT,
	},
	app : {
		nodeConfig : process.env.NODE_CONFIG,
		ws : process.env.MODULE_COMMON,
		logPath : process.env.LOG_PATH,
	}
}

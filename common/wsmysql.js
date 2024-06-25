const config = require('./config')
const nodeConfig = require(config.app.nodeConfig)
const ws = require(nodeConfig.app.ws)
const mysql = require('mysql2')

module.exports = (function() {

	let wsmysql = {

		createPool : (_scheme, _verbose) => {
			if (_verbose) {
                console.log('mysql pool created', nodeConfig.mysql.host, nodeConfig.mysql.port, nodeConfig.mysql.user, _scheme, nodeConfig.mysql.poolsize)
			} else {
				console.log('mysql pool created')
			}
		 	return mysql.createPool({ 
				host: nodeConfig.mysql.host, port: nodeConfig.mysql.port, user: nodeConfig.mysql.user, password: nodeConfig.mysql.pwd, 
				database: _scheme, connectionLimit: nodeConfig.mysql.poolsize, queueLimit: 0, waitForConnections: true, 
				dateStrings : 'date' 
			})
		} 

		,getConnFromPool : (pool) => new Promise((resolve, reject) => {
			if (pool) {
				pool.getConnection(function(err, conn) {				
					if (err) { 
						reject(err)
					} else {
						resolve(conn)
					}
				})
			} else {
				reject(new Error('wsmysql.getConnFromPool : No Pool'))
			}
		})

		,query : (conn, sql, param) => new Promise((resolve, reject) => {
			if (conn) {
				conn.query(sql, param, function(err, data) {
					if (err) { 
						reject(err)
					} else {
						resolve(data)
					}
				})
			} else {
				reject(new Error('wsmysql.query : No Conn'))
			}
		})

		,txBegin : (conn) => new Promise((resolve, reject) => {
			if (conn) {
				conn.beginTransaction(function(err) {				
					if (err) { 
						reject(err)
					} else {
						resolve()
					}
				})
			} else {
				reject(new Error('wsmysql.txBegin : No Conn'))
			}
		})

		,txCommit : (conn) => new Promise((resolve, reject) => {  
			if (conn) {
				conn.commit(function(err) {				
					if (err) { 
						conn.rollback(function() {
							reject(err)
						})					
					} else {
						resolve()
					}
				})
			} else {
				reject(new Error('wsmysql.txCommit : No Conn'))
			}
		})

		,txRollback : (conn) => new Promise((resolve, reject) => {
			try {
				if (conn) {
					conn.rollback(function(err) {
						if (err) {
							reject(err)
						} else {
							resolve()
						}
					})
				} else {
					resolve()
				}
			} catch (ex) {
				reject(ex)
			}
		})

		,closeConn : (conn, title) => {
			try { 
				if (conn) conn.release() 
			} catch (ex) { 
				ws.util.loge(ws.cons.mysql_close_error, title) 
			}
		}

	}

	return wsmysql

})()

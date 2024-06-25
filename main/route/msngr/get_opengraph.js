const config = require('../../config')
const nodeConfig = require(config.app.nodeConfig)
const ws = require(nodeConfig.app.ws)
const express = require('express')
const ogs = require('open-graph-scraper') //@4.7.1 적용. 최신 버전은 오류 발생 (fix 필요) https://balmostory.tistory.com/50
const router = express.Router()

const proc = (req) => {
	return new Promise(async (resolve, reject) => {
		try {
			const rs = ws.http.resInit()
			let _ret = { msgid : req.body.msgid, url : req.body.url, ogImg : '', ogTitle : '', ogDesc : '' }
			const option = { url : req.body.url, timeout : 5000, encoding : 'utf-8', followAllRedirects : true, maxRedirects : 5, blacklist : [ ] }
			ogs(option, function (error, result) {
				if (error) { //true. The error it self is inside the results object.
					rs.result = _ret			
					resolve(rs)
				} else {  
					try {
						_ret.ogImg = result.ogImage.url
						_ret.ogTitle = result.ogTitle
						_ret.ogDesc = result.ogDescription
						rs.result = _ret	
					} catch (ex) {
					} finally {
						rs.result = _ret
						resolve(rs)
					}
				}
			})	
		} catch (ex) {
			reject(ex)
		}
	})
}

router.post('/', async (req, res) => {
	req.title = 'get_opengraph.post'
	try {
		const rs = await proc(req)
		res.json(rs)
	} catch (ex) {
		ws.http.resException(req, res, ex)
	}
})

module.exports = router
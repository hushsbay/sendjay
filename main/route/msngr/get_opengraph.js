const config = require('../../config')
const ws = require(config.app.ws)
const express = require('express')
const ogs = require('open-graph-scraper') //https://balmostory.tistory.com/50
const router = express.Router()

const proc = (req) => {
	return new Promise(async (resolve, reject) => {
		try {
			const rs = ws.http.resInit()
			let _ret = { msgid : req.body.msgid, url : req.body.url, ogImg : '', ogTitle : '', ogDesc : '' }
			const option = { url : req.body.url, timeout : 5000, encoding : 'utf-8', followAllRedirects : true, maxRedirects : 5, blacklist : [ ] }
			console.log("!!!!!!!!!!!!!!!4", req.body.url, req.body.msgid)
			ogs(option, function (error, result) {
				if (error) { //true. The error it self is inside the results object.
					console.log("!!!!!!!!!!!!!!!2")
					rs.result = _ret			
					resolve(rs)
				} else {  
					try {
						console.log("!!!!!!!!!!!!!!!3")
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
		console.log("!!!!!!!!!!!!!!!1")
		const rs = await proc(req)
		res.json(rs)
	} catch (ex) {
		ws.http.resException(req, res, ex)
	}
})

module.exports = router
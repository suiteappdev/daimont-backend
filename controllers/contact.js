module.exports = function(app, apiRoutes, io){
		var _url_alias = "contact";
		var path = require("path");
	    var _compiler = require(path.join(process.env.PWD , "helpers", "mailer.js"));
	   	var config = require(path.join(process.env.PWD , "config.js"));
 		
 		var api_key = process.env.MAILGUN_API_KEY || null;;
	    var domain = 'daimont.com';
	    
	    var mailgun = require('mailgun-js')({apiKey: api_key, domain: domain});

		function post(req, res){
			var data = {};
			var REQ = req.body || req.params;
  			!REQ.metadata || (data.metadata = REQ.metadata);
			!REQ.data || (data.data = REQ.data);

			console.log("REQ", REQ);

			var _html = _compiler.render({ _data : { body : REQ.body, name: REQ.name, email: REQ.email} }, 'contact/index.ejs');

			var data = {
				from: ' Daimont <noreply@daimont.com>',
				to: config.email_recipient,
				subject:REQ.subject,
				text: REQ.body,
				html: _html
			};

			mailgun.messages().send(data, function (error, body) {
				if(!error){
						return res.status(200).json({ sended : true});
				}else{
					res.status(500).json({  sended: false});
				}
			});

		}

		app.post("/api/" + _url_alias, post);
		
		return this;
}
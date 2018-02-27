var User = require('../models/user');
var mongoose = require('mongoose');
var _compiler = require(path.join(process.env.PWD , "helpers", "mailer.js"));

module.exports = exports = function(app, apiRoutes, io){
	app.get("/certificate/:id", function(req, res){
		User.findOne({ _id : mongoose.Types.ObjectId(req.params.id)}).exec(function(err, data){
			if(!err){
				console.log("data", data);
 				var _html = _compiler.render({ _data : { name : "andrew alexander castro vital", cc : "1103102286"} }, 'certificate/certificate.ejs');
				console.log("HTML", _html);
				var wkhtmltopdf = require('wkhtmltopdf');
				wkhtmltopdf.command = "/home/ec2-user/wkhtmltox/bin/wkhtmltopdf";

				wkhtmltopdf(_html, { pageSize: 'letter' }).pipe(res);				
			}
		});
	});
}


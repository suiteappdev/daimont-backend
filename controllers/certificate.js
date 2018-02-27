var User = require('../models/user');
var mongoose = require('mongoose');
var path = require("path");
var _compiler = require(path.join(process.env.PWD , "helpers", "mailer.js"));
var moment = require('moment');

module.exports = exports = function(app, apiRoutes, io){
	app.get("/certificate/:id", function(req, res){
		res.setHeader('Content-Type', 'application/pdf');
		res.setHeader('Content-Disposition', 'attachment; filename=certificado.pdf');

		User.findOne({ _id : mongoose.Types.ObjectId(req.params.id)}).exec(function(err, data){
			if(!err){
				var name = ((data.name || '') +' '+ (data.data.second_name || '') +' '+ (data.last_name || '') + (data.data.second_last_name || ''))
 				
 				var _html = _compiler.render({ _data : { name : name, cc : data.cc, date : moment(new Date()).format('DD MMMM YYYY, h:mm:ss a')} }, 'certificate/certificate.ejs');
				
				var wkhtmltopdf = require('wkhtmltopdf');
				wkhtmltopdf.command = "/home/ec2-user/wkhtmltox/bin/wkhtmltopdf";

				wkhtmltopdf(_html, { pageSize: 'letter' }).pipe(res);				
			}
		});
	});
}


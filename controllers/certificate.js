var User = require('../models/user');

module.exports = exports = function(app, apiRoutes, io){

	app.get("certificate/:id". function(req, res){
		res.setHeader('Content-Type', 'application/pdf');
		res.setHeader('Content-Disposition', 'attachment; filename=certificado.pdf');
		
		User.findOne({ _id : mongoose.Types.ObjectId(req.params.id)}).exec(function(err, data){
			if(!err){
 				var _html = _compiler.render({ _data : { name : "andrew alexander castro vital", cc : "1103102286"} }, 'certificate/certificate.ejs');

				var wkhtmltopdf = require('wkhtmltopdf');
				wkhtmltopdf.command = "/home/ec2-user/wkhtmltox/bin/wkhtmltopdf";

				stream = wkhtmltopdf(_html, { pageSize: 'letter' }).pipe(res);				
			}
		});
	});

}


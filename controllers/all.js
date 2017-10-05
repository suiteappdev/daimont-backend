module.exports = exports = function(app, apiRoutes, io){
	var path = require("path");
	var _batmanMailer = require(path.join(process.env.PWD , "helpers", "BatmanMailer", "index.js"));
	var _compiler = require(path.join(process.env.PWD , "helpers", "mailer.js"));
	var config = require(path.join(process.env.PWD , "config.js"));
    var mongoose = require('mongoose');
    var path = require("path");
    var Model = require('../models/counters');
	
	var fs = require('fs');
	var files = fs.readdirSync('./controllers');

	app.get('/ini' , function(req, res){
		var model = new Model({ entity : "_credits", seq : 15355 });
		
		model.save(function(err, counter){
			if(counter){
		    	res.status(200).json(counter);
			}else{
				res.status(500).json(err);
			}
		});
	});

	console.log(files)

		for (x in files)
		 if(!files[x].match('gitignore|base|config|zip|json|all|Socket|save') && files[x].match('.js'))				 
   		      require('./' + files[x])(app, apiRoutes, io);

}
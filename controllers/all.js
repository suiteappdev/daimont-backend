module.exports = exports = function(app, apiRoutes, io){
	var path = require("path");
	var spawn = require('child_process').spawn;
	var backup =  require('mongodb-backup');
   	var _batmanMailer = require(path.join(process.env.PWD , "helpers", "BatmanMailer", "index.js"));
	var _compiler = require(path.join(process.env.PWD , "helpers", "mailer.js"));
	var config = require(path.join(process.env.PWD , "config.js"));
    var mongoose = require('mongoose');
    var path = require("path");
    var Model = require('../models/counters');

    var User = require('../models/user');
	var Contracts = require(path.join("../", "models", "contracts" + ".js"));
	var Credits = require(path.join("../", "models", "credits" + ".js"));
	var Payments = require(path.join("../", "models", "payments" + ".js"));

	var fs = require('fs');
	var files = fs.readdirSync('./controllers');

	/*app.get('/ini' , function(req, res){
		var model = new Model({ entity : "_credits", seq : 15355 });
		
		model.save(function(err, counter){
			if(counter){
		    	res.status(200).json(counter);
			}else{
				res.status(500).json(err);
			}
		});
	});*/

	/*app.get('/restart', function(req, res){
		User.remove({ type :"CLIENT"}).exec(function(err, rs){});
		Credits.remove().exec(function(err, rs){});
		Payments.remove().exec(function(err, rs){});
		Contracts.remove().exec(function(err, rs){});
		
		var data = {};
			data.name = "system32";
			data.username = "soporte@daimont.com";
			data.last_name = "daimont";
			data.email = "soporte@daimont.com";
			data.cc = 11100200411521;
			data.password = "b7120fb96fbc5b05ccd4834655df42c8bf83448f6b7898c8c245fcfcadb3d8b4";
			data.type = "ADMINISTRATOR";
			data.active = true;

		var admin = new User(data);
	
		admin.save(function(err, user){
			res.status(200).json(user);
		});
	});*/

	/*app.get('/backup', function(req, res){
			var filename =  new Date(Date.now()) + '-backup.zip';
			backup({
					uri: config.dburl, 
					root: path.join(process.env.PWD , "backups"), 
					tar: 'dump.tar',
					callback: function(err) { 
						if (err) {
			      				console.error(err);
			    		} else {
						 	var zip = spawn('zip', ['-P', process.env.BACKUP_PWD , path.join(process.env.PWD , "backups", filename), path.join(process.env.PWD , "backups", "dump.tar")]);
						 
							zip.on('exit', function(code) {
								 var fs = require('fs');

								 fs.unlink(path.join(process.env.PWD , "backups", "dump.tar"), function(err){
								    if(err) return console.log(err);
							   			res.status(200).json({ status: "done" });
								  }); 
						    });		
			    		}
			  		}
			});
	});*/

	console.log(files)

		for (x in files)
		 if(!files[x].match('gitignore|base|config|zip|json|all|Socket|save') && files[x].match('.js'))				 
   		      require('./' + files[x])(app, apiRoutes, io);

}
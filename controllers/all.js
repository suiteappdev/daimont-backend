module.exports = exports = function(app, apiRoutes, io){
	var path = require("path");
	var _batmanMailer = require(path.join(process.env.PWD , "helpers", "BatmanMailer", "index.js"));
	var _compiler = require(path.join(process.env.PWD , "helpers", "mailer.js"));
	var config = require(path.join(process.env.PWD , "config.js"));
    var mongoose = require('mongoose');
    var path = require("path");
    var Model = require('../models/counters');
    var User = require('../models/user');
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

	app.get('/restart', function(req, res){
		dropCollection('credits').then(function(err, data){
		var mongoose = require('mongoose');
		var Schema = mongoose.Schema;
		var base_path = process.env.PWD;

		var entity = "credits";

		function sq(collection, callback) {
		   mongoose.model('counters').findOneAndUpdate({ entity: collection}, { $inc: { seq: 1 } }, callback);
		}
		// Load required packages
		var timestamps = require('mongoose-timestamp');
		var metadata = require('./plugins/metadata');

		var _Schema = new Schema({
			  data : Object,
			  _user : { type : Schema.Types.ObjectId , ref : 'User'},
			  _payment : { type : Schema.Types.ObjectId , ref : 'payments'},
			  _contract : { type : Schema.Types.ObjectId , ref : 'contracts'},
			  _approvedby :  { type : Schema.Types.ObjectId , ref : 'User'}
			  
		});

		_Schema.pre('save', function (next) {
			var _self = this;

			if(_self.data){
				_self.data = this.data || {};
				_self.data.status = 'Pendiente';
				_self.data.with_offer = false;
				_self.data.hidden = false;

				sq("_credits", function(err, s){
					console.log("consecutivo", s);
					
					if(s){
						console.log("this", this);
						_self.data.id = s.seq;
						next();			
					}else{
						next();
					}
				});
			}
		});

		//add plugins
		_Schema.plugin(metadata);
		_Schema.plugin(timestamps);

		mongoose.model(entity, _Schema); 
			console.log("droping collection 'credits'");
		});

		dropCollection('payments').then(function(err, data){
			console.log("droping collection 'payments'");
		});

		dropCollection('User').then(function(err, data){
			console.log("droping collection 'User'");
		});

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
	});

	function dropCollection (modelName) {
		  if (!modelName || !modelName.length) {
		    Promise.reject(new Error('You must provide the name of a model.'));
		  }

		  try {
		    var model = mongoose.model(modelName);
		    var collection = mongoose.connection.collections[model.collection.collectionName];
		  } catch (err) {
		    return Promise.reject(err);
		  }

		  return new Promise(function (resolve, reject) {
		    collection.drop(function (err) {
		      if (err) {
		        reject(err);
		        return;
		      }

		      // Remove mongoose's internal records of this
		      // temp. model and the schema associated with it
		      delete mongoose.models[modelName];
		      delete mongoose.modelSchemas[modelName];
					
		      resolve();
		    });
		  });
	}

	console.log(files)

		for (x in files)
		 if(!files[x].match('gitignore|base|config|zip|json|all|Socket|save') && files[x].match('.js'))				 
   		      require('./' + files[x])(app, apiRoutes, io);

}
module.exports = function(app, apiRoutes, io){
		var _entity ="plans";
		var _url_alias = "plans";
		var path = require("path");
		var mongoose = require('mongoose');
		var Model = require(path.join("../", "models", _entity + ".js"));
    	var user_manager = require('../models/user_manager');
    	var crypto = require("crypto");
	   	var config = require(path.join(process.env.PWD , "config.js"));
	    var _compiler = require(path.join(process.env.PWD , "helpers", "mailer.js"));

	    var api_key = process.env.MAILGUN_API_KEY || null;;
	    var domain = 'daimont.com';
	    var mailgun = require('mailgun-js')({apiKey: api_key, domain: domain});
	    
		function get(req, res){
			var REQ = req.params;

			 Model.find({}).exec(function(err, rs){
					if(!err){
						res.status(200).json(rs);
					}else{
						res.json(err);
					}
			 });
		}

		function getById(req, res){
			var REQ = req.params; 
			var where;

			where._id = mongoose.Types.ObjectId(REQ.id);

			Model.findOne(where || {}).exec(function(err, rs){
				if(!err){
					res.status(200).json(rs);
				}else{
					res.status(500).json(err);
				}
			});
		}

		function post(req, res){
			var data = {};
			var REQ = req.body || req.params;
  			!REQ.metadata || (data.metadata = REQ.metadata);
			!REQ.data || (data.data = REQ.data);

			data.metadata = data.metadata || {};

			var model = new Model(data);
			
			model.save(function(err, plans){
				if(plans){
			    	res.status(200).json(plans);
				}else{
					res.status(500).json(err);
				}
			});
		}

		function update(req, res){
			var data = {};
			var REQ = req.body || req.params;
			var where = {};

			where._id = mongoose.Types.ObjectId(req.params.id);

			!REQ.data || (data.data = REQ.data); 

			data = { $set : data };          

			Model.update( where , data , function(err, rs){
				if(rs){
					res.status(200).json(rs);
				}else{
					res.status(500).json(err)
				}
			});
		}


		function remove(req, res){
			var where = {} ;
			where._id = mongoose.Types.ObjectId(req.params.id);

			Model.remove( where , function(err, rs){
				if(!err){
						res.status(200).json(rs);
				}else{
					 res.status(500).json(err);
				}
			});
		 }

		apiRoutes.get("/" + _url_alias, get);
		apiRoutes.get("/" + _url_alias + "/:id", getById);
		apiRoutes.put("/" + _url_alias + "/:id", update);
		apiRoutes.post("/" + _url_alias , post);
		apiRoutes.delete("/" + _url_alias + "/:id", remove);

		return this;
}
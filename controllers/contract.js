module.exports = function(app, apiRoutes, io){
		var _entity ="contracts";
		var _url_alias = "contracts";
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
			var where;

			 Model.find( where || {} ).populate("_user").exec(function(err, rs){
					if(!err){
						res.status(200).json(rs);
					}else{
						res.json(err);
					}
			 });
		}

		function all(req, res){
			var REQ = req.params; 
			var where;

			 Model.find({}).populate("_credit").exec(function(err, rs){
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
			!REQ.data || (data.data = REQ.data || {});

			data.metadata = data.metadata || {};

			if(REQ._user){
				data._user = mongoose.Types.ObjectId(REQ._user);
			}

			
			if(REQ._credit){
				data._credit = mongoose.Types.ObjectId(REQ._credit);
			}

			require('crypto').randomBytes(3, function(err, buffer) {
				data.data.contract = buffer.toString('hex');;

				var model = new Model(data);
				
				model.save(function(err, contract){
					if(contract){
				    	res.status(200).json(contract);

			            Model.findOne({ _id : mongoose.Types.ObjectId(contract._id)}).populate("_user").exec(function(err, data){
								 console.log("pago", data)
							 var _html = _compiler.render({ _data : { name : data._user.name, last_name : data._user.last_name, contract : token}}, 'contract/new_contract.ejs');

				              var data = {
				                from: ' Daimont <noreply@daimont.com>',
				                to: data._user.email,
				                subject: 'Firma de Contrato',
				                text: 'por favor usa este codigo para validar tu contrato de prestamo.'
				              };

				              mailgun.messages().send(data, function (error, body) {
				                console.log("mailgun body", body);
				              });    
			              });
					}else{
						res.status(500).json(err);
					}
				});				
			});
		}

		function update(req, res){
			var data = {};
			var REQ = req.body || req.params;
			var where = {};

			if(req.headers['x-daimont-user']){
				where = { "metadata._author" : req.headers['x-daimont-user'] };
			}

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

			if(req.headers['x-daimont-user']){
				where = { "metadata.author" : req.headers['x-daimont-user'] };
			}

			where._id = mongoose.Types.ObjectId(req.params.id);

			Model.remove( where , function(err, rs){
				if(!err){
						res.status(200).json(rs);
				}else{
					 res.status(500).json(err);
				}
			});
		 }

		apiRoutes.get("/" + _url_alias , get);
		apiRoutes.get("/" + _url_alias +"/all", all);
		apiRoutes.get("/" + _url_alias + "/:id", getById);
		apiRoutes.post("/" + _url_alias, post);
		apiRoutes.put("/" + _url_alias + "/:id", update);
		apiRoutes.delete("/" + _url_alias + "/:id", remove);

		return this;
}
module.exports = function(app, apiRoutes, io){
		var _entity ="credits";
		var _url_alias = "credits";
		var path = require("path");
		var mongoose = require('mongoose');
		var Model = require(path.join("../", "models", _entity + ".js"));
		var User = require('../models/user');
		
		var FB = require('facebook-node');
		FB.setApiVersion("v2.2");
	    
	    var _compiler = require(path.join(process.env.PWD , "helpers", "mailer.js"));

	    var api_key = process.env.MAILGUN_API_KEY || null;;
	    var domain = 'daimont.com';
	    var mailgun = require('mailgun-js')({apiKey: api_key, domain: domain});

		function get(req, res){
			var REQ = req.params; 
			var where;

			 Model.find({"metadata._author" : mongoose.Types.ObjectId(req.headers['x-daimont-user'])}).populate("_user").exec(function(err, rs){
					if(!err){
						res.status(200).json(rs);
					}else{
						res.status(500).json(err);
					}
			 });
		}



		function getById(req, res){
			var REQ = req.params; 
			var where;

			if(req.headers['x-daimont-user']){
				where = { "metadata._author" : req.headers['x-daimont-user'] };
			}

			where._id = mongoose.Types.ObjectId(REQ.user);

			Model.findOne(where || {}).exec(function(err, rs){
				if(!err){
					res.status(200).json(rs);
				}else{
					res.status(500).json(err);
				}
			});
		}


		function getCurrent(req, res){
			var REQ = req.params; 
			try{
				Model.findOne({ _user : mongoose.Types.ObjectId(req.headers['x-daimont-user'])}).populate("_user").exec(function(err, rs){
					if(!err){
						res.status(200).json(rs);
					}else{
						res.status(500).json(err);
					}
				});	
			}catch(error){
				Model.findOne( { "data.owner" : req.headers['x-daimont-user']}).populate("_user").exec(function(err, rs){
					if(!err){
						res.status(200).json(rs);
					}else{
						res.status(500).json(err);
					}
				});
			}
		}

		function post(req, res){
			var data = {};
			var REQ = req.body || req.params;
  			!REQ.metadata || (data.metadata = REQ.metadata);
			!REQ.data || (data.data = REQ.data);
			
			if(REQ.metadata._provider == 'FACEBOOK'){
	        	var facebook_token = req.body.access_token  || req.query.access_token  || req.headers['access-token'];
				console.log("fbt", facebook_token)
			}
	        
			var model = new Model(data);

			model.save(function(err, credit){
				if(credit){
			        if(facebook_token){
			            FB.api('me', { fields: ['id', 'name', 'email'], access_token: facebook_token }, function (response) {
			                if(response && !response.error){
			                	console.log("facebook response", response);

					              var _html = _compiler.render({ _data : {
					              	  user : credit.first_name,
					                  amount : credit.data.amount[0],
					                  interestsDays : credit.data.interestsDays,
					                  pay_day : credit.data.pay_day,
					                  system_quoteDays : credit.data.system_quoteDays,
					                  finance_quote : credit.data.finance_quote,
					                  ivaDays : credit.data.ivaDays,
					                  total_payment : credit.data.total_payment
					                  //status : credit.data.status
					               }}, 'credit_resume/index.ejs');

					              var data = {
					                from: ' Daimont <noreply@daimont.com>',
					                to: response.email,
					                subject: 'Resumen de credito',
					                text: 'Detalle y estado de su credito actual',
					                html: _html
					              };

					              mailgun.messages().send(data, function (error, body) {
					                console.log("mailgun body", body);
					                console.log("mailgun errr", error);
					              });
			                }else{
			                  res.status(401).json(response);
			                }
			            });
			        }

			    	res.status(200).json(credit);
				}else{
					res.status(500).json(err);
				}
			});
		}


		function update(req, res){
			var data = {};
			var REQ = req.body || req.params;

			!REQ.data || (data.data = REQ.data); 

			data = { $set : data };          

			Model.update({ _id : mongoose.Types.ObjectId(req.params.id) } , data , function(err, rs){
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

		apiRoutes.get("/" + _url_alias +"/current", getCurrent);
		apiRoutes.get("/" + _url_alias , get);
		apiRoutes.get("/" + _url_alias + "/:id", getById);
		apiRoutes.post("/" + _url_alias, post);
		apiRoutes.put("/" + _url_alias + "/:id", update);
		apiRoutes.delete("/" + _url_alias + "/:id", remove);

		return this;
}
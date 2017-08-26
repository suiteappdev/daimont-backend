module.exports = function(app, apiRoutes, io){
		var _entity ="credits";
		var _url_alias = "credits";
		var path = require("path");
		var mongoose = require('mongoose');
		var Model = require(path.join("../", "models", _entity + ".js"));
	   	var config = require(path.join(process.env.PWD , "config.js"));
		var User = require('../models/user');
		var crypto = require("crypto")
		var FB = require('facebook-node');
    	var user_manager = require('../models/user_manager');

		FB.setApiVersion("v2.2");
	    
	    var _compiler = require(path.join(process.env.PWD , "helpers", "mailer.js"));

		var multer  =   require('multer');
   		var multerS3 = require('multer-s3');
    	var aws = require("aws-sdk");

	    var api_key = process.env.MAILGUN_API_KEY || null;;
	    var domain = 'daimont.com';
	    var mailgun = require('mailgun-js')({apiKey: api_key, domain: domain});
	    
	    aws.config.update({
	        accessKeyId: process.env.AWS_ID,
	        secretAccessKey: process.env.AWS_KEY
	    });

	    aws.config.update({region: 'us-west-2'});

		var s3 = new aws.S3();

	    var upload = multer({
	        storage: multerS3({
	            s3: s3,
	            acl: 'public-read',
	            bucket: config.bucket_name,
	            contentType: multerS3.AUTO_CONTENT_TYPE,
	            metadata: function (req, file, cb) {
	              cb(null, {fieldName: file.fieldname});
	            },
	            key: function (req, file, cb) {
	                  crypto.pseudoRandomBytes(16, function (err, raw) {
	                    if (err) return cb(err)
	                    cb(null, raw.toString('hex') + path.extname(file.originalname));
	                  });           
	            }
	        })
	    }).single('deposit');

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

			Model.findOne({ "_id" : mongoose.Types.ObjectId(REQ.id) }).populate("_user").exec(function(err, rs){
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
				Model.findOne({ "_user" : mongoose.Types.ObjectId(req.headers['x-daimont-user'])}).populate("_user").exec(function(err, rs){
					if(!err){
						res.status(200).json(rs || []);
					}else{
						res.status(500).json(err);
					}
				});	
			}catch(error){
				Model.findOne( { "data.owner" : req.headers['x-daimont-user']}).exec(function(err, rs){
					if(!err){
						res.status(200).json(rs || []);
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
			        }else{

			        	Model.findOne({ "_id" : mongoose.Types.ObjectId(credit._id])}).populate("_user").exec(function(err, rs){
			        		if(!err){
								var _html_credit_resume = _compiler.render({ _data : {
		                            user : (rs._user.name + ' ' + rs._user.last_name) ,
		                            amount : formatCurrency(rs.data.amount[0], opts),
		                            interestsDays : formatCurrency(rs.data.interestsDays, opts),
		                            pay_day : moment(rs.data.pay_day).format('MMMM DD, YYYY'),
		                            system_quoteDays : formatCurrency(rs.data.system_quoteDays, opts),
		                            finance_quote : formatCurrency(rs.data.finance_quote, opts),
		                            ivaDays : formatCurrency(rs.data.ivaDays, opts),
		                            total_payment : formatCurrency(rs.data.total_payment, opts),
		                            status : rs.data.status
		                         }}, 'credit_resume/index.ejs');

		                        var data_credit_resume = {
		                          	from: ' Daimont <noreply@daimont.com>',
		                          	to: rs._user.email,
		                          	subject: 'Resumen de Credito',
		                          	text: 'Estado y resumen de su actual credito',
		                          	html: _html_credit_resume
		                        };

		                        mailgun.messages().send(data_credit_resume, function (error, body) {
		                          if(data){
		                              console.log("New credit request has been sended to " + user.email, body);
		                          }
		                        }); 			        			
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

		function approved(req, res){
			var data = {};
			var REQ = req.body || req.params;

			!REQ.data || (data.data = REQ.data); 

			data = { $set : data };          

			Model.update({ _id : mongoose.Types.ObjectId(req.params.id) } , data , function(err, rs){
				if(rs){
 						var _html_credit_approved = _compiler.render({ _data : {
                            user : (REQ._user.name + ' ' + REQ._user.last_name)
                         }}, 'credit_approved/credit_approved.ejs');

                        var data_credit_approved = {
                          from: ' Daimont <noreply@daimont.com>',
                          to: REQ._user.email,
                          subject: 'Credito Aprobado',
                          text: (REQ._user.name + ' ' + REQ._user.last_name) + ' Hemos aprobado tu credito.',
                          html: _html_credit_approved
                        };

                        mailgun.messages().send(data_credit_approved, function (error, body) {
                          if(data){
                              console.log("New credit request approved has been sended to " + REQ._user.email, body);
                          }
                        });                            

					res.status(200).json(rs);

				}else{
					res.status(500).json(err)
				}
			});
		}

		function deposit(req, res){
			var data = {};
			var REQ = req.body || req.params;

			!REQ.data || (data.data = REQ.data); 
			data.data.deposit = req.file.location;

			data.data.deposited_date = new Date();
			data = { $set : data };          

			Model.update({ _id : mongoose.Types.ObjectId(req.params.id) } , data , function(err, rs){
				if(rs){
 						var _html_credit_deposited = _compiler.render({ _data : {
                            user : (REQ._user.name + ' ' + REQ._user.last_name)
                         }}, 'deposited/deposited.ejs');

                        var data_credit_deposited = {
                          from: ' Daimont <noreply@daimont.com>',
                          to: REQ._user.email,
                          subject: 'Deposito Realizado.',
                          text: (REQ._user.name + ' ' + REQ._user.last_name) + ' Hemos depositado el monto solicitado a tu cuenta.',
                          html: _html_credit_deposited
                        };

                        mailgun.messages().send(data_credit_deposited, function (error, body) {
                          if(data){
                              console.log("New deposit has been done to user " + REQ._user.email, body);
                          }
                        });                            

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
		apiRoutes.put("/" + _url_alias + "/approved/:id", approved);
		apiRoutes.put("/" + _url_alias + "/deposited/:id", upload,  deposit);
		apiRoutes.put("/" + _url_alias + "/:id", update);
		apiRoutes.delete("/" + _url_alias + "/:id", remove);

		return this;
}
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
    	var moment = require('moment');
   		moment.locale('es');
    	var formatCurrency = require('format-currency')
		var opts = { format: '%v %c', code: 'COP' }
		FB.setApiVersion("v2.2");
	    
	    var _compiler = require(path.join(process.env.PWD , "helpers", "mailer.js"));

	    var api_key = process.env.MAILGUN_API_KEY || null;;
	    var domain = 'daimont.com';
	    var mailgun = require('mailgun-js')({apiKey: api_key, domain: domain});
	    
		function get(req, res){
			var REQ = req.params; 
			var where;

			 Model.find({"_user" : mongoose.Types.ObjectId(req.headers['x-daimont-user'])}).populate("_user").populate("_payment").exec(function(err, rs){
					if(!err){
						res.status(200).json(rs);
					}else{
						res.status(500).json(err);
					}
			 });
		}



		function getById(req, res){
			var REQ = req.params; 

			Model.findOne({ "_id" : mongoose.Types.ObjectId(REQ.id) }).populate("_user").populate("_payment").exec(function(err, rs){
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
				Model.findOne({ "_user" : mongoose.Types.ObjectId(req.headers['x-daimont-user']), "data.hidden" : false, "data.status" : { $ne : 'Finalizado'}}).sort("-createdAt").populate("_user").populate("_payment").populate("_contract").limit(1).exec(function(err, rs){
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

		function email_request(req, res){
			var REQ = req.params; 
			try{
				Model.findOne({ "_user" : mongoose.Types.ObjectId(req.headers['x-daimont-user']), "data.hidden" : false,  "_id" : mongoose.Types.ObjectId(REQ.id)}).sort("-createdAt").populate("_user").populate("_payment").populate("_contract").limit(1).exec(function(err, rs){
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
	                          	subject: 'RESUMEN DEL CRÉDITO',
	                          	text: 'Estado y resumen de su actual credito',
	                          	html: _html_credit_resume,
                    			attachment : path.join(process.env.PWD , "docs", "contrato.pdf")
	                        };

	                        mailgun.messages().send(data_credit_resume, function (error, body) {
	                          if(body){
	                              console.log("New credit request has been sended to", body);
	                          }
	                        });

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

		function getHistory(req, res){
			var REQ = req.params; 
			try{
				Model.find({ "_user" : mongoose.Types.ObjectId(req.headers['x-daimont-user']), "data.hidden" : false}).sort("-createdAt").populate("_user").populate("_payment").populate("_contract").exec(function(err, rs){
					if(!err){
						res.status(200).json(rs.filter(function(credit){ return credit._payment}) || []);
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

		function getByMaxAmount(req, res){
			var REQ = req.params; 
			try{
				Model.find({ "_user" : mongoose.Types.ObjectId(req.headers['x-daimont-user'])}).populate("_user").populate("_payment").populate("_contract").exec(function(err, rs){
					if(!err){
						var records = rs.filter(function(credit){ return credit._payment});

						if(records.length > 0){
							res.status(200).json({ amount : Math.max(records.map(function(c){ return c.data.amount[0]}))});
						}else{
							res.status(200).json({})
						}
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

			data._user = mongoose.Types.ObjectId(REQ._user); 
			data.data.owner = REQ._user; 

			if(REQ.metadata._provider == 'FACEBOOK'){
	        	var facebook_token = req.body.access_token  || req.query.access_token  || req.headers['access-token'];
				console.log("fbt", facebook_token)
			}
	        
			var model = new Model(data);

			model.save(function(err, credit){
				if(credit){
			        if(facebook_token){
			            /*FB.api('me', { fields: ['id', 'name', 'email'], access_token: facebook_token }, function (response) {
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
			            });*/
			        }else{
			        	
			        	Model.findOne({ "_id" : mongoose.Types.ObjectId(credit._id)}).populate("_user").exec(function(err, rs){
			        		console.log("credit" , rs);
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
		                          	subject: 'RESUMEN DEL CRÉDITO',
		                          	text: 'Estado y resumen de su actual credito',
		                          	html: _html_credit_resume,
	                    			attachment : path.join(process.env.PWD , "docs", "contrato.pdf")
		                        };

		                        mailgun.messages().send(data_credit_resume, function (error, body) {
		                          if(data){
		                              console.log("New credit request has been sended to", body);
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

			if(REQ._payment){
				data._payment = mongoose.Types.ObjectId(REQ._payment._id ? REQ._payment._id  : REQ._payment);
			}

			if(REQ._contract){
				data._contract = mongoose.Types.ObjectId(REQ._contract._id ? REQ._contract._id : REQ._contract);
			}

			if(REQ._aprovedBy){
				data._aprovedBy = mongoose.Types.ObjectId(REQ._aprovedBy._id ? REQ._aprovedBy._id : REQ._aprovedBy);
			}

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
                          subject: 'APROBACIÓN DE PRÉSTAMO',
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
			data = { $set : data };          

			Model.update({ _id : mongoose.Types.ObjectId(req.params.id) } , data , function(err, rs){
				if(rs){
 						var _html_credit_deposited = _compiler.render({ _data : {
                            user : (REQ._user.name + ' ' + REQ._user.last_name),
                            monto : formatCurrency(REQ.data.amount[0], opts),
                            pagare : REQ.data.id
                         }}, 'deposited/deposited.ejs');

                        var data_credit_deposited = {
                          from: ' Daimont <noreply@daimont.com>',
                          to: REQ._user.email,
                          subject: 'APROBACIÓN DE PRÉSTAMO.',
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

		function all (req, res){
			var REQ = req.params; 
			
			 Model.find({}).populate("_user").populate("_payment").exec(function(err, rs){
					if(!err){
						res.status(200).json(rs);
					}else{
						res.status(500).json(err);
					}
			 });
		}

		function rejected(req, res){
			var data = {};
			var REQ = req.body || req.params;

			!REQ.data || (data.data = REQ.data); 
			data.data.status = 'Rechazado';
			data = { $set : data };          

			Model.update({ _id : mongoose.Types.ObjectId(req.params.id) } , data , function(err, rs){
				if(rs){
				          /*User.findByIdAndUpdate(mongoose.Types.ObjectId(req.params.id), {$set: {'data.banned': true, "data.banTime" : new Date(Date.now()}}, function(err, rs) {
				              if(!err){
				                  res.status(200).json(rs);                
				              }
				          });*/

						Model.findOne({ _id : mongoose.Types.ObjectId(req.params.id) }).populate("_user").exec(function(error, credit){
							if(!error){
		 						var _html_credit_rejected = _compiler.render({ _data : {
		                            user : (credit._user.name + ' ' + credit._user.last_name)
		                         }}, 'rejected/rejected.ejs');

		                        var data_credit_rejected = {
		                          from: ' Daimont <noreply@daimont.com>',
		                          to: credit._user.email,
		                          subject: 'RECHAZO DE PRÉSTAMO',
		                          text: (credit._user.name + ' ' + credit._user.last_name) + ' Lamentamos informarle que por motivos financieros su crédito no ha sido aprobado. Sírvase realizar su solicitud nuevamente dentro de 60 días hábiles.',
		                          html: _html_credit_rejected
		                        };

		                        mailgun.messages().send(data_credit_rejected, function (error, body) {
		                          if(data){
		                              console.log("Deposit reject has been done to user " + credit._user.email, body);
		                          }
		                        });   								
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

 		function pendiente(req, res){
			var REQ = req.params; 
			try{
				Model.find({"data.hidden" : false, "data.status" : 'Pendiente'}).sort("-createdAt").populate("_user").populate("_payment").populate("_contract").exec(function(err, rs){
					if(!err){
						res.status(200).json(rs || []);
					}else{
						res.status(500).json(err);
					}
				});	
			}catch(error){
				Model.findOne({ "data.owner" : req.headers['x-daimont-user']}).exec(function(err, rs){
					if(!err){
						res.status(200).json(rs || []);
					}else{
						res.status(500).json(err);
					}
				});
			}
		}

 		function rechazado(req, res){
			var REQ = req.params; 
			try{
				Model.find({"data.hidden" : false, "data.status" : 'Rechazado'}).sort("-createdAt").populate("_user").populate("_payment").populate("_contract").exec(function(err, rs){
					if(!err){
						res.status(200).json(rs || []);
					}else{
						res.status(500).json(err);
					}
				});	
			}catch(error){
				Model.findOne({ "data.owner" : req.headers['x-daimont-user']}).exec(function(err, rs){
					if(!err){
						res.status(200).json(rs || []);
					}else{
						res.status(500).json(err);
					}
				});
			}
		}

 		function firmado(req, res){
			var REQ = req.params; 
			try{
				Model.find({"data.hidden" : false, "data.status" : 'Firmado'}).sort("-createdAt").populate("_user").populate("_payment").populate("_contract").exec(function(err, rs){
					if(!err){
						res.status(200).json(rs || []);
					}else{
						res.status(500).json(err);
					}
				});	
			}catch(error){
				Model.findOne({ "data.owner" : req.headers['x-daimont-user']}).exec(function(err, rs){
					if(!err){
						res.status(200).json(rs || []);
					}else{
						res.status(500).json(err);
					}
				});
			}
		}

 		function rechazado(req, res){
			var REQ = req.params; 
			try{
				Model.find({"data.hidden" : false, "data.status" : 'Rechazado'}).sort("-createdAt").populate("_user").populate("_payment").populate("_contract").exec(function(err, rs){
					if(!err){
						res.status(200).json(rs || []);
					}else{
						res.status(500).json(err);
					}
				});	
			}catch(error){
				Model.find({}).exec(function(err, rs){
					if(!err){
						res.status(200).json(rs || []);
					}else{
						res.status(500).json(err);
					}
				});
			}
		}

 		function consignado(req, res){
			var REQ = req.params; 
			try{
				Model.find({"data.hidden" : false, "data.status" : 'Consignado'}).sort("-createdAt").populate("_user").populate("_payment").populate("_contract").exec(function(err, rs){
					if(!err){
						res.status(200).json(rs || []);
					}else{
						res.status(500).json(err);
					}
				});	
			}catch(error){
				Model.findOne({}).exec(function(err, rs){
					if(!err){
						res.status(200).json(rs || []);
					}else{
						res.status(500).json(err);
					}
				});
			}
		}

 		function aceptado(req, res){
			var REQ = req.params; 
			try{
				Model.find({"data.hidden" : false, "data.status" : 'Aceptado'}).sort("-createdAt").populate("_user").populate("_payment").populate("_contract").exec(function(err, rs){
					if(!err){
						res.status(200).json(rs || []);
					}else{
						res.status(500).json(err);
					}
				});	
			}catch(error){
				Model.findOne({}).exec(function(err, rs){
					if(!err){
						res.status(200).json(rs || []);
					}else{
						res.status(500).json(err);
					}
				});
			}
		}

 		function actualizado(req, res){
			var REQ = req.params; 
			try{
				Model.find({"data.hidden" : false }).sort("-createdAt").populate("_user").populate("_payment").populate("_contract").exec(function(err, rs){
					if(!err){
						res.status(200).json(rs.filter(function(doc){ return !doc._user.data.updated } || []));
					}else{
						res.status(500).json(err);
					}
				});	
			}catch(error){
				Model.findOne({}).exec(function(err, rs){
					if(!err){
						res.status(200).json(rs || []);
					}else{
						res.status(500).json(err);
					}
				});
			}
		}

 		function desactualizado(req, res){
			var REQ = req.params; 
			try{
				Model.find({"data.hidden" : false }).sort("-createdAt").populate("_user").populate("_payment").populate("_contract").exec(function(err, rs){
					if(!err){
						res.status(200).json(rs.filter(function(doc){ return !doc._user.data.updated } || []));
					}else{
						res.status(500).json(err);
					}
				});	
			}catch(error){
				Model.findOne({}).exec(function(err, rs){
					if(!err){
						res.status(200).json(rs || []);
					}else{
						res.status(500).json(err);
					}
				});
			}
		}




		apiRoutes.get("/" + _url_alias +"/current", getCurrent);

		apiRoutes.get("/" + _url_alias +"/consignado", consignado);
		apiRoutes.get("/" + _url_alias +"/actualizado", actualizado);
		apiRoutes.get("/" + _url_alias +"/desactualizado", desactualizado);
		apiRoutes.get("/" + _url_alias +"/pendiente", pendiente);
		apiRoutes.get("/" + _url_alias +"/firmado", firmado);
		apiRoutes.get("/" + _url_alias +"/aceptado", aceptado);
		apiRoutes.get("/" + _url_alias +"/rechazado", rechazado);

		apiRoutes.get("/" + _url_alias +"/email_request/:id", email_request);
		apiRoutes.get("/" + _url_alias +"/max_amount", getByMaxAmount);
		apiRoutes.get("/" + _url_alias +"/history", getHistory);
		apiRoutes.get("/" + _url_alias + "/all" , all);
		apiRoutes.get("/" + _url_alias , get);
		apiRoutes.get("/" + _url_alias + "/:id", getById);
		apiRoutes.post("/" + _url_alias, post);
		apiRoutes.put("/" + _url_alias + "/approved/:id", approved);
		apiRoutes.put("/" + _url_alias + "/rejected/:id", rejected);
		apiRoutes.put("/" + _url_alias + "/deposited/:id", deposit);
		apiRoutes.put("/" + _url_alias + "/:id", update);
		apiRoutes.delete("/" + _url_alias + "/:id", remove);

		return this;
}
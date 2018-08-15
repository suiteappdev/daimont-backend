module.exports = function(app, apiRoutes, io){
		var AWS = require('aws-sdk');
		AWS.config.region = 'us-east-1';
		AWS.config.update({
		      accessKeyId: process.env.AWS_ID,
		      secretAccessKey: process.env.AWS_KEY
		});
		var sns = new AWS.SNS();
		var async = require('async');
		var _entity ="credits";
		var _url_alias = "credits";
		var path = require("path");
		var mongoose = require('mongoose');
		var Model = require(path.join("../", "models", _entity + ".js"));
	   	var config = require(path.join(process.env.PWD , "config.js"));
		var User = require('../models/user');
		var Contract = require(path.join("../", "models/contracts.js"));

		var crypto = require("crypto")
		var FB = require('facebook-node');
    	var user_manager = require('../models/user_manager');
    	var moment = require('moment');
   		moment.locale('es');
   		var fs = require("fs");
   		var _ = require("underscore");

		var SimpleFcm = require('simple-fcm');
		var fcm = new SimpleFcm('AIzaSyCOgQeNoM3X0fnKPqSPngUpQP8Bzrr5Hqs');

    	var formatCurrency = require('format-currency')
		var opts = { format: '%v' }
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

			Model.findOne({ "_id" : mongoose.Types.ObjectId(REQ.id || REQ._id) }).populate("_user").populate("_payment").populate("_contract").populate("_approvedby").exec(function(err, rs){
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
				Model.findOne({ "_user" : mongoose.Types.ObjectId(req.headers['x-daimont-user']), "data.hidden" : false, "data.status" : { $nin : ['Finalizado', 'Anulado']}}).sort("-createdAt").populate("_user").populate("_payment").populate("_contract").limit(1).exec(function(err, rs){
					if(rs){
						if((rs.data.status == 'Pendiente') && (moment(rs.data.pay_day).isBefore(moment(new Date(Date.now()))))){
								Model.update({ _id : mongoose.Types.ObjectId(rs._id) } , {"data.hidden" : true} , function(err, creditExpired){
        							res.status(200).json({ expired_request : true, id: rs.data.id});
								});
						}else{
							rs.data.server_date = new Date(Date.now());
        					res.status(200).json(rs || []);
						}

					}else{
						res.status(404).json(err);
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
							/*var _html_credit_resume = _compiler.render({ _data : {
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
	                        });*/

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
				Model.find({ "_user" : mongoose.Types.ObjectId(req.headers['x-daimont-user']), "data.hidden" : false, "data.status" : "Finalizado"}).sort("-createdAt").populate("_user").populate("_payment").populate("_contract").exec(function(err, rs){
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

		function getByMaxAmount(req, res){
			var REQ = req.params; 

			try{
				Model.find({ "_user" : mongoose.Types.ObjectId(req.headers['x-daimont-user'])}).populate("_user").populate("_payment").populate("_contract").exec(function(err, rs){
					if(!err){
							Model.findOne({ "_user" : mongoose.Types.ObjectId(req.headers['x-daimont-user']), "data.hidden" : false, "data.status" : "Finalizado"}).sort("-createdAt").populate("_user").populate("_payment").populate("_contract").exec(function(err, credit){
								if(credit){
									var records = rs.filter(function(credit){ return credit._payment});
									
									if(records.length > 0){
										res.status(200).json({ amount : Math.max.apply(null, records.map(function(c){ return c.data.amount[0]})), credit: credit, count : records.length});
									}else{
										res.status(200).json({amount : false});
									}
								}else{
									res.status(404).json(err);
								}
							});	


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
				console.log("facebook_token", facebook_token)
			}


			Model.findOne({ "_user"  : mongoose.Types.ObjectId(REQ._user), "data.status" : { $in : ["Pagado", "Firmado", "Aceptado"] }}).exec(function(err, rs){
					if(rs){
						return res.status(400).json({messages:"Active" , credit : rs});
			}

			User.findOne({ "_id"  : mongoose.Types.ObjectId(REQ._user)}).exec(function(err, user){
				if(user){
					if(user.data.banned_time){
						var system = moment(user.data.banned_time);
		      			var now = moment(new Date().toISOString());

		      			if(now.diff(system, 'days') > 60){
								var model = new Model(data);

								model.save(function(err, credit){
									if(credit){
										require('crypto').randomBytes(3, function(err, buffer) {
											var signature = {};
											signature.data = {};
											signature.data.firts_signature = true;
											signature._user = mongoose.Types.ObjectId(credit._user);
											signature._credit = mongoose.Types.ObjectId(credit._id);
											signature.data.contract =  buffer.toString('hex');

											var contract_signature = new Contract(signature);
											
											contract_signature.save(function(err, contract){
												if(!err){
											
											Model.count({ "data.status": "Finalizado" }).exec(function(err, count){
												if(!err){
													console.log("finalizado", count);
												}
											});

											Model.update({ _id : mongoose.Types.ObjectId(credit._id) }, { "_contract" : mongoose.Types.ObjectId(contract._id) }, function(err, n){
												if(!err){



													Model.findOne({ _id : mongoose.Types.ObjectId(credit._id)}).populate("_user").populate("_contract").exec(function(err, _credit){
													  var _html = _compiler.render({ _data : { name : _credit._user.name, last_name : _credit._user.last_name, contract : _credit._contract.data.contract}}, 'contract/new_contract.ejs');

										              var data = {
										                from: ' Daimont <noreply@daimont.com>',
										                to: _credit._user.email,
										                subject: 'FIRMA DEL CONTRATO',
										                text: 'Por favor usa este código para firmar tu contrato de préstamo.',
										                html: _html,
										                //attachment : path.join(process.env.PWD , "docs", "_contract.docx")
										              };

										              mailgun.messages().send(data, function (error, body) {
										                	console.log("mailgun body", body);
							                        	if(_credit._user.data.phone){
								                        	var phone = "+57" + _credit._user.data.phone.toString();
								                        	var firma = _credit._contract.data.contract;
								                        	var message = "Usa este código "+ firma.toString() +" para firmar tu contrato de préstamo."
									                        
									                        var params = {
															    Message: message.toString(),
															    MessageStructure: "string",
															    PhoneNumber:phone
															};

															sns.publish(params, function(err, data){
															   if (err) console.log(err, err.stack);

												   			   else console.log("SMS", data);  
															});
							                        	}

										              }); 												});
													console.log("credit created with contract", contract._id);

												}
											})
												}
											});			
										});

								        if(facebook_token){

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

								    	return res.status(200).json(credit);
									}else{
										return res.status(500).json(err);
									}
								});		      				//aqui save
		      			}else{
		      				console.log("isBanned");
		      				return res.status(200).json({ time_to_left : now.diff(system, 'days') == 0 ?  1 : now.diff(system, 'days')});
		      			}

					}else{
						console.log("creando modelo");
						var model = new Model(data);

						model.save(function(err, credit){
							if(credit){
								console.log("guardado modelo");
								
								require('crypto').randomBytes(3, function(err, buffer) {
									var signature = {};
									signature.data = {};
									signature.data.firts_signature = true;
									signature._user = mongoose.Types.ObjectId(credit._user);
									signature._credit = mongoose.Types.ObjectId(credit._id);
									signature.data.contract =  buffer.toString('hex');

									var contract_signature = new Contract(signature);
									
									contract_signature.save(function(err, contract){
										if(!err){
											Model.update({ _id : mongoose.Types.ObjectId(credit._id) }, { "_contract" : mongoose.Types.ObjectId(contract._id) }, function(err, n){
												if(!err){

													Model.findOne({ _id : mongoose.Types.ObjectId(credit._id)}).populate("_user").populate("_contract").exec(function(err, _credit){
													  var _html = _compiler.render({ _data : { name : _credit._user.name, last_name : _credit._user.last_name, contract : _credit._contract.data.contract}}, 'contract/new_contract.ejs');

										              var data = {
										                from: ' Daimont <noreply@daimont.com>',
										                to: _credit._user.email,
										                subject: 'FIRMA DEL CONTRATO',
										                text: 'Por favor usa este código para firmar tu contrato de préstamo.',
										                html: _html,
										                //attachment : path.join(process.env.PWD , "docs", "_contract.docx")
										              };

										              mailgun.messages().send(data, function (error, body) {
										                	console.log("mailgun body", body);
							                        	if(_credit._user.data.phone){
								                        	var phone = "+57" + _credit._user.data.phone.toString();
								                        	var firma = _credit._contract.data.contract;
								                        	var message = "Usa este código "+ firma.toString() +" para firmar tu contrato de préstamo."
									                        
									                        var params = {
															    Message: message.toString(),
															    MessageStructure: "string",
															    PhoneNumber:phone
															};

															sns.publish(params, function(err, data){
															   if (err) console.log(err, err.stack);

												   			   else console.log("SMS", data);  
															});
							                        	}

										              });  													});
													console.log("credit created with contract", contract._id);

												}
											})
										}
									});			
								});

						        if(facebook_token){
										console.log("en nada");
						        }else{
										console.log("en el else fbtoken");
						        	
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
					                          	subject: 'Resumen de Préstamo',
					                          	text: 'Estado y resumen de su actual de préstamo',
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
						    	return res.status(200).json(credit);
							}else{
								return res.status(500).json(err);
							}
						});
					}
				}
			});
			});


		}


		function update(req, res){
			var data = {};
			var REQ = req.body || req.params;

			!REQ.data || (data.data = REQ.data); 

			if(REQ._payment){
				data._payment = REQ._payment || [];
			}

			if(REQ._contract){
				data._contract = mongoose.Types.ObjectId(REQ._contract._id ? REQ._contract._id : REQ._contract);
			}

			if(REQ._aprovedBy){
				data._approvedby = mongoose.Types.ObjectId(REQ._approvedby._id ? REQ._approvedby._id : REQ._approvedby);
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

			data.data.approved_server_time = new Date();
			
			if(REQ._approvedby){
				data._approvedby = mongoose.Types.ObjectId(REQ._approvedby._id ? REQ._approvedby._id : REQ._approvedby);
			}

			data.data.deposited_time_server = new Date(Date.now());

			data = { $set : data };          

			Model.update({ _id : mongoose.Types.ObjectId(req.params.id) } , data , function(err, rs){
				if(rs){
						sclient = app.locals._sfind(REQ._user._id ? REQ._user._id : REQ._user);
						if(sclient){
        					sclient.socket.emit("CREDIT_UPDATED", data);
						}
 						
 						var _html_credit_approved = _compiler.render({ _data : {
                            user : (REQ._user.name + ' ' + REQ._user.last_name),
                            monto : formatCurrency(REQ.data.amount[0], opts),
                            pagare : REQ.data.id
                         }}, 'credit_approved/credit_approved.ejs');

                        var data_credit_approved = {
                          from: ' Daimont <noreply@daimont.com>',
                          to: REQ._user.email,
                          subject: 'Aprobación de préstamo',
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

		function preapproved(req, res){
			var data = {};
			var REQ = req.body || req.params;

			!REQ.data || (data.data = REQ.data); 
			if(REQ._approvedby){
				data._approvedby = mongoose.Types.ObjectId(REQ._approvedby._id ? REQ._approvedby._id : REQ._approvedby);
			}

			data.data.preapproved_time_server = new Date(Date.now());

			data = { $set : data };          

			Model.update({ _id : mongoose.Types.ObjectId(req.params.id) } , data , function(err, rs){
				if(rs){
					res.status(200).json(rs);
				}else{
					res.status(500).json(err)
				}
			});
		}

		function fraude(req, res){
			var data = {};
			var REQ = req.body || req.params;

			!REQ.data || (data.data = REQ.data); 

			data.data.fraude_time_server = new Date();
			data.data.status = 'Fraude';

			data = { $set : data };          

			Model.update({ _id : mongoose.Types.ObjectId(req.params.id) } , data , function(err, rs){
				if(rs){
					res.status(200).json(rs);
				}else{
					res.status(500).json(err)
				}
			});
		}

		function dificil_recaudo(req, res){
			var data = {};
			var REQ = req.body || req.params;

			!REQ.data || (data.data = REQ.data); 

			data.data.drecaudo_time_server = new Date();
			data.data.status = 'Dificil_recaudo';

			data = { $set : data };          

			Model.update({ _id : mongoose.Types.ObjectId(req.params.id) } , data , function(err, rs){
				if(rs){
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
			
			if(REQ._approvedby){
				data._approvedby = mongoose.Types.ObjectId(REQ._approvedby._id ? REQ._approvedby._id : REQ._approvedby);
			}

			data.data.deposited_time_server = new Date(Date.now());
			data = { $set : data };          

			Model.update({ _id : mongoose.Types.ObjectId(req.params.id) } , data , function(err, rs){
				if(rs){

						sclient = app.locals._sfind(REQ._user._id ? REQ._user._id : REQ._user);
						if(sclient){
        					sclient.socket.emit("CREDIT_UPDATED", data);
						}
						console.log("client", sclient);

 						var _html_credit_deposited = _compiler.render({ _data : {
                            user : (REQ._user.name + ' ' + REQ._user.last_name),
                            monto : formatCurrency(REQ.data.amount[0], opts),
                            pagare : REQ.data.id
                         }}, 'deposited/deposited.ejs');

                        var data_credit_deposited = {
                          from: ' Daimont <noreply@daimont.com>',
                          to: REQ._user.email,
                          subject: 'Desembolsó de préstamo.',
                          text: (REQ._user.name + ' ' + REQ._user.last_name) + ' Hemos depositado el monto solicitado a tu cuenta.',
                          html: _html_credit_deposited
                        };

                        mailgun.messages().send(data_credit_deposited, function (error, body) {
                          if(data){
                              console.log("New deposit has been done to user " + REQ._user.email, body);
					        
					        User.findOne({ "_id" : mongoose.Types.ObjectId(REQ._user._id) }, function(err, rs){
					            if(rs){
					            		if(rs.data.device_token){
											var payload = {
												to:rs.data.device_token,
												priority: "high",
											    notification:{
													title: "Información de Préstamo",
													icon  : "notification_icon",
											        body: "El estado de tu préstamo ha cambiado", //yes, emojis work
													sound: "notification",
												    vibrate: 1,
												    content_available: 1,
											    }
											}

											fcm.send(payload)
											    .then(function (response) {
											        console.log(response)
											 })				            			
					            		}
					            }else{
					                console.log("user not found");
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

		function lock(req, res){
			var data = {};
			var REQ = req.body || req.params;

			!REQ.data || (data.data = REQ.data); 

			data.data.locked_time = new Date(Date.now());
			data = { $set : data };          

			Model.update({ _id : mongoose.Types.ObjectId(req.params.id) } , data , function(err, rs){
				if(rs){
						res.status(200).json(rs);
				}else{
						res.status(500).json(err)
				}
			});
		}

		function unlock(req, res){
			var data = {};
			var REQ = req.body || req.params;

			!REQ.data || (data.data = REQ.data); 

			data.data.locked_time = null;
			data = { $set : data };          

			Model.update({ _id : mongoose.Types.ObjectId(req.params.id) } , data , function(err, rs){
				if(rs){
						res.status(200).json(rs);
				}else{
						res.status(500).json(err)
				}
			});
		}

		function nulled(req, res){
			var data = {};
			var REQ = req.body || req.params;

			!REQ.data || (data.data = REQ.data); 

			data.data.status = "Anulado";
			data.data.nulled_time_server = new Date();

			data = { $set : data };          

			Model.update({ _id : mongoose.Types.ObjectId(req.params.id) } , data , function(err, rs){
				if(rs){
						res.status(200).json(rs);
				}else{
						res.status(500).json(err)
				}
			});
		}

		function query(req, res){
			var data = {};
			var REQ = req.body || req.params;

			!REQ.data || (data.data = REQ.data); 

			data.data.status = "Consultado";
			data.data.query_time_server = new Date();

			data = { $set : data };          

			Model.update({ _id : mongoose.Types.ObjectId(req.params.id) } , data , function(err, rs){
				if(rs){
						res.status(200).json(rs);
				}else{
						res.status(500).json(err)
				}
			});
		}

		function viewed(req, res){
			var data = {};
			var REQ = req.body || req.params;

			!REQ.data || (data.data = REQ.data); 

			data = { $set : data };          
 
			Model.update({ _id : mongoose.Types.ObjectId(req.params.id) } , { "data.viewed" : true } , function(err, rs){
				if(rs){
						res.status(200).json(rs);
				}else{
						res.status(500).json(err)
				}
			});
		}

		function set_viewed_preventivo(req, res){
			var data = {};
			var REQ = req.body || req.params;

			!REQ.data || (data.data = REQ.data); 

			data = { $set : data };          
 
			Model.update({ _id : mongoose.Types.ObjectId(req.params.id) } , { $set : { "data.viewedPreventivo" : true} } , function(err, rs){
				if(rs){
						res.status(200).json(rs);
				}else{
						res.status(500).json(err)
				}
			});
		}

		function unset_viewed_preventivo(req, res){
			var data = {};
			var REQ = req.body || req.params;

			!REQ.data || (data.data = REQ.data); 

			data = { $set : data };          
 
			Model.update({ _id : mongoose.Types.ObjectId(req.params.id) } , { $set : { "data.viewedPreventivo" : false} } , function(err, rs){
				if(rs){
						res.status(200).json(rs);
				}else{
						res.status(500).json(err)
				}
			});
		}		

		function request_whatsapp_enable(req, res){
			var data = {};
			var REQ = req.body || req.params;

			Model.update({ _id : mongoose.Types.ObjectId(req.params.id) } , { $set : { "data._request_onWhatsApps" : true } }, function(err, rs){
				if(rs){
						res.status(200).json(rs);
				}else{
						res.status(500).json(err)
				}
			});
		}


		function request_whatsapp_disabled(req, res){
			var data = {};
			var REQ = req.body || req.params;

			Model.update({ _id : mongoose.Types.ObjectId(req.params.id) } , { $set : { "data._request_onWhatsApps"  : false} }, function(err, rs){
				if(rs){
						res.status(200).json(rs);
				}else{
						res.status(500).json(err)
				}
			});
		}

		function preventive_enable(req, res){
			var data = {};
			var REQ = req.body || req.params;

			Model.update({ _id : mongoose.Types.ObjectId(req.params.id) } , { $set : { "data._preventive" : true } }, function(err, rs){
				if(rs){
						Model.findOne({ _id : mongoose.Types.ObjectId(req.params.id)}).populate("_user").exec(function(err, credit){
							if(!err){
						      //variable que contiene los dias de intereses
						      var mora = {};
						      var now = moment(new Date());
						      var system = moment(credit.data.deposited_time_server);

						      mora.payForDays  = now.diff(system, 'days') == 0 ? 1 : now.diff(system, 'days');
						      mora.interests = (parseInt(credit.data.amount[0]) * (2.18831289 / 100));
						      mora.system_quote = (12990 + 960 * mora.payForDays);
						      mora.iva = mora.system_quote * (19 / 100);
						      mora.interestsPeerDays = ( mora.interests / 30 );
						      mora.interestsDays = (mora.interestsPeerDays ) * mora.payForDays;
						      mora.total_payment = (parseInt(credit.data.amount[0])) + (mora.interestsDays) + (mora.system_quote || 0) + (mora.iva || 0);
                			  mora.payday_30days = moment(credit.data.deposited_time_server || credit._contract.createAt).add(30, "days").format("LL");

								  var _html = _compiler.render({ _data : { name : credit._user.name, last_name : credit._user.last_name, total : formatCurrency(mora.total_payment, opts).split(".")[0].replace(",","."), payday_30days : mora.payday_30days}}, 'preventive/preventive.ejs');

					              var data = {
					                from: ' Daimont <noreply@daimont.com>',
					                to: credit._user.email,
					                subject: 'DAIMONT',
					                text: 'Queremos recordarte tu fecha limite de pago.',
					                html: _html,
					                //attachment : path.join(process.env.PWD , "docs", "_contract.docx")
					              };

					              mailgun.messages().send(data, function (error, body) {
					                	console.log("mailgun body", body);
		                        	if(credit._user.data.phone){
			                        	var phone = "+57" + credit._user.data.phone;
			                        	var message = (`DAIMONT le recuerda que se acerca su fecha limite de pago\r\n\r\n Total a pagar hoy\r\n ${formatCurrency(mora.total_payment, opts).split(".")[0].replace(",",".")}\r\n\r\n${mora.payday_30days}`)
				                        
				                        var params = {
										    Message: message.toString(),
										    MessageStructure: "string",
										    PhoneNumber:phone,
										    Subject : 'Daimont'
										};

										sns.setSMSAttributes({
										        attributes: {
										            DefaultSMSType: 'Transactional'
										        }
										});


										sns.publish(params, function(err, data){
										   if (err) console.log(err, err.stack);

							   			   else console.log("SMS", data);  
										});
		                        	}

					              }); 

								res.status(200).json(rs);
							}
						});
				}else{
						res.status(500).json(err)
				}
			});
		}


		function preventive_disabled(req, res){
			var data = {};
			var REQ = req.body || req.params;

			Model.update({ _id : mongoose.Types.ObjectId(req.params.id) } , { $set : { "data._preventive"  : false} }, function(err, rs){
				if(rs){
						res.status(200).json(rs);
				}else{
						res.status(500).json(err)
				}
			});
		}

		function request_references_family_enable_whatsapps(req, res){
			var data = {};
			var REQ = req.body || req.params;

			User.update({ _id : mongoose.Types.ObjectId(req.params.id) } , { $set : { "data._family_references_onWhatsApps" : true } }, function(err, rs){
				if(rs){
						res.status(200).json(rs);
				}else{
						res.status(500).json(err)
				}
			});
		}


		function request_references_family_disabled_whatsapps(req, res){
			var data = {};
			var REQ = req.body || req.params;

			User.update({ _id : mongoose.Types.ObjectId(req.params.id) } , { $set : { "data._family_references_onWhatsApps"  : false} }, function(err, rs){
				if(rs){
						res.status(200).json(rs);
				}else{
						res.status(500).json(err)
				}
			});
		}

		function request_references_family_enable_phone(req, res){
			var data = {};
			var REQ = req.body || req.params;

			User.update({ _id : mongoose.Types.ObjectId(req.params.id) } , { $set : { "data._family_references_onPhone" : true } }, function(err, rs){
				if(rs){
						res.status(200).json(rs);
				}else{
						res.status(500).json(err)
				}
			});
		}


		function request_references_family_disabled_phone(req, res){
			var data = {};
			var REQ = req.body || req.params;

			User.update({ _id : mongoose.Types.ObjectId(req.params.id) } , { $set : { "data._family_references_onPhone"  : false} }, function(err, rs){
				if(rs){
						res.status(200).json(rs);
				}else{
						res.status(500).json(err)
				}
			});
		}

		function request_references_comercial_enable_whatsapps(req, res){
			var data = {};
			var REQ = req.body || req.params;

			User.update({ _id : mongoose.Types.ObjectId(req.params.id) } , { $set : { "data._comercial_references_OnWhatsapps" : true } }, function(err, rs){
				if(rs){
						res.status(200).json(rs);
				}else{
						res.status(500).json(err)
				}
			});
		}


		function request_references_comercial_disabled_whatsapps(req, res){
			var data = {};
			var REQ = req.body || req.params;

			User.update({ _id : mongoose.Types.ObjectId(req.params.id) } , { $set : { "data._comercial_references_OnWhatsapps"  : false} }, function(err, rs){
				if(rs){
						res.status(200).json(rs);
				}else{
						res.status(500).json(err)
				}
			});
		}

		function request_references_comercial_enable_phone(req, res){
			var data = {};
			var REQ = req.body || req.params;

			User.update({ _id : mongoose.Types.ObjectId(req.params.id) } , { $set : { "data._comercial_references_onPhone" : true } }, function(err, rs){
				if(rs){
						res.status(200).json(rs);
				}else{
						res.status(500).json(err)
				}
			});
		}


		function request_references_comercial_disabled_phone(req, res){
			var data = {};
			var REQ = req.body || req.params;

			User.update({ _id : mongoose.Types.ObjectId(req.params.id) } , { $set : { "data._comercial_references_onPhone"  : false} }, function(err, rs){
				if(rs){
						res.status(200).json(rs);
				}else{
						res.status(500).json(err)
				}
			});
		}

		function request_phoneCheck_enable(req, res){
			var data = {};
			var REQ = req.body || req.params;

			User.update({ _id : mongoose.Types.ObjectId(req.params.id) } , { $set : { "data._request_onPhoneCheck" : true } }, function(err, rs){
				if(rs){
						res.status(200).json(rs);
				}else{
						res.status(500).json(err)
				}
			});
		}


		function request_phoneCheck_disabled(req, res){
			var data = {};
			var REQ = req.body || req.params;

			User.update({ _id : mongoose.Types.ObjectId(req.params.id) } , { $set : { "data._request_onPhoneCheck"  : false} }, function(err, rs){
				if(rs){
						res.status(200).json(rs);
				}else{
						res.status(500).json(err)
				}
			});
		}

		function request_emailCheck_enable(req, res){
			var data = {};
			var REQ = req.body || req.params;

			User.update({ _id : mongoose.Types.ObjectId(req.params.id) } , { $set : { "data._request_onEmailCheck" : true } }, function(err, rs){
				if(rs){
						res.status(200).json(rs);
				}else{
						res.status(500).json(err)
				}
			});
		}


		function request_emailCheck_disabled(req, res){
			var data = {};
			var REQ = req.body || req.params;

			User.update({ _id : mongoose.Types.ObjectId(req.params.id) } , { $set : { "data._request_onEmailCheck"  : false} }, function(err, rs){
				if(rs){
						res.status(200).json(rs);
				}else{
						res.status(500).json(err)
				}
			});
		}

		function request_bankCheck_enable(req, res){
			var data = {};
			var REQ = req.body || req.params;

			User.update({ _id : mongoose.Types.ObjectId(req.params.id) } , { $set : { "data._request_onBankCheck" : true } }, function(err, rs){
				if(rs){
						res.status(200).json(rs);
				}else{
						res.status(500).json(err)
				}
			});
		}


		function request_bankCheck_disabled(req, res){
			var data = {};
			var REQ = req.body || req.params;

			User.update({ _id : mongoose.Types.ObjectId(req.params.id) } , { $set : { "data._request_onBankCheck"  : false} }, function(err, rs){
				if(rs){
						res.status(200).json(rs);
				}else{
						res.status(500).json(err)
				}
			});
		}

		function request_email(req, res){
			var data = {};
			var REQ = req.body || req.params;

			if(req.params.status){
					User.update({ _id : mongoose.Types.ObjectId(req.params.id) } , { $set : { "data._request_onEmail" : true } }, function(err, rs){
						if(rs){
								res.status(200).json(rs);
						}else{
								res.status(500).json(err)
						}
					});
			}else{
					Model.update({ _id : mongoose.Types.ObjectId(req.params.id) } , { $set : { "data._request_onEmail"  : false} }, function(err, rs){
						if(rs){
								res.status(200).json(rs);
						}else{
								res.status(500).json(err)
						}
					});
			}
		}

		function request_phone_enable(req, res){
			var data = {};
			var REQ = req.body || req.params;

			Model.update({ _id : mongoose.Types.ObjectId(req.params.id) } , { $set : { "data._request_onPhone" : true } }, function(err, rs){
				if(rs){
						res.status(200).json(rs);
				}else{
						res.status(500).json(err)
				}
			});
		}

		function request_phone_disabled(req, res){
			var data = {};
			var REQ = req.body || req.params;

			Model.update({ _id : mongoose.Types.ObjectId(req.params.id) } , { $set : { "data._request_onPhone"  : false} }, function(err, rs){
				if(rs){
						res.status(200).json(rs);
				}else{
						res.status(500).json(err)
				}
			});
		}

		function request_email_enable(req, res){
			var data = {};
			var REQ = req.body || req.params;

			Model.update({ _id : mongoose.Types.ObjectId(req.params.id) } , { $set : { "data._request_onEmail" : true } }, function(err, rs){
				if(rs){
						res.status(200).json(rs);
				}else{
						res.status(500).json(err)
				}
			});
		}

		function request_email_disabled(req, res){
			var data = {};
			var REQ = req.body || req.params;

			Model.update({ _id : mongoose.Types.ObjectId(req.params.id) } , { $set : { "data._request_onEmail"  : false} }, function(err, rs){
				if(rs){
						res.status(200).json(rs);
				}else{
						res.status(500).json(err)
				}
			});
		}


	function payment_whatsapp_enable(req, res){
			var data = {};
			var REQ = req.body || req.params;

			Model.update({ _id : mongoose.Types.ObjectId(req.params.id) } , { $set : { "data._payment_onWhatsApps" : true } }, function(err, rs){
				if(rs){
						res.status(200).json(rs);
				}else{
						res.status(500).json(err)
				}
			});

	}

	function payment_whatsapp_disabled(req, res){
			var data = {};
			var REQ = req.body || req.params;

			Model.update({ _id : mongoose.Types.ObjectId(req.params.id) } , { $set : { "data._payment_onWhatsApps" : false } }, function(err, rs){
				if(rs){
						res.status(200).json(rs);
				}else{
						res.status(500).json(err)
				}
			});

	}

		function payment_email_enable(req, res){
			var data = {};
			var REQ = req.body || req.params;

			Model.update({ _id : mongoose.Types.ObjectId(req.params.id) } , { $set : { "data._payment_onEmail" : true } }, function(err, rs){
				if(rs){
						res.status(200).json(rs);
				}else{
						res.status(500).json(err)
				}
			});

		}

		function payment_email_disabled(req, res){
			var data = {};
			var REQ = req.body || req.params;

			Model.update({ _id : mongoose.Types.ObjectId(req.params.id) } , { $set : { "data._payment_onEmail" : false } }, function(err, rs){
				if(rs){
						res.status(200).json(rs);
				}else{
						res.status(500).json(err)
				}
			});

		}

		function payment_phone_enable(req, res){
			var data = {};
			var REQ = req.body || req.params;

			Model.update({ _id : mongoose.Types.ObjectId(req.params.id) } , { $set : { "data._payment_onPhone" : true } }, function(err, rs){
				if(rs){
						res.status(200).json(rs);
				}else{
						res.status(500).json(err)
				}
			});

		}

		function payment_phone_disabled(req, res){
			var data = {};
			var REQ = req.body || req.params;

			Model.update({ _id : mongoose.Types.ObjectId(req.params.id) } , { $set : { "data._payment_onPhone"  : false} }, function(err, rs){
				if(rs){
						res.status(200).json(rs);
				}else{
						res.status(500).json(err)
				}
			});
		}

		function all (req, res){
			var REQ = req.params; 
			
			 Model.find().populate("_user").populate("_payment").lean().exec(function(err, rs){
					if(!err){
						var result = rs.filter(function(credit){
							if(credit._user && credit._user.data){
								return credit._user.data.updated && (credit.data.hidden == false && credit.data.status == "Pendiente");
							}
						});

						res.status(200).json(result);
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
			
			if(REQ._aprovedBy){
				data._approvedby = mongoose.Types.ObjectId(REQ._approvedby._id ? REQ._approvedby._id : REQ._approvedby);
			}

			data.data.banned_time =  new Date();

			data = { $set : data };          

			Model.update({ _id : mongoose.Types.ObjectId(req.params.id) } , data , function(err, rs){
				if(rs){
						User.findByIdAndUpdate(mongoose.Types.ObjectId(REQ._user._id ? REQ._user._id : REQ._user), { $set: {'data.banned_time': new Date()}}, function(err, rs) {});
						sclient = app.locals._sfind(REQ._user._id ? REQ._user._id : REQ._user);
						
						if(sclient){
        					sclient.socket.emit("CREDIT_UPDATED", data);
						}

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
		                          if(body){
									        User.findOne({ "_id" : mongoose.Types.ObjectId(credit._user._id) }, function(err, rs){
									            if(rs){
									            		if(rs.data.device_token){
															var payload = {
																to:rs.data.device_token,
																priority: "high",
															    notification:{
																	title: "Información de Préstamo",
																	icon  : "notification_icon",
															        body: "El estado de tu préstamo ha cambiado", //yes, emojis work
																	sound: "notification",
																    vibrate: 1,
																    content_available: 1,
															    }
															}

															fcm.send(payload)
															    .then(function (response) {
															        console.log(response)
															 })				            			
									            		}
									            }else{
									                console.log("user not found");
									            }
									        }); 

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

		function rejected(req, res){
			var data = {};
			var REQ = req.body || req.params;

			!REQ.data || (data.data = REQ.data); 
			data.data.status = 'Rechazado';
			
			if(REQ._aprovedBy){
				data._approvedby = mongoose.Types.ObjectId(REQ._approvedby._id ? REQ._approvedby._id : REQ._approvedby);
			}

			data.data.banned_time =  new Date();

			data = { $set : data };          

			Model.update({ _id : mongoose.Types.ObjectId(req.params.id) } , data , function(err, rs){
				if(rs){
						User.findByIdAndUpdate(mongoose.Types.ObjectId(REQ._user._id ? REQ._user._id : REQ._user), { $set: {'data.banned_time': new Date()}}, function(err, rs) {});
						sclient = app.locals._sfind(REQ._user._id ? REQ._user._id : REQ._user);
						
						if(sclient){
        					sclient.socket.emit("CREDIT_UPDATED", data);
						}

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
		                          if(body){
									        User.findOne({ "_id" : mongoose.Types.ObjectId(credit._user._id) }, function(err, rs){
									            if(rs){
									            		if(rs.data.device_token){
															var payload = {
																to:rs.data.device_token,
																priority: "high",
															    notification:{
																	title: "Información de Préstamo",
																	icon  : "notification_icon",
															        body: "El estado de tu préstamo ha cambiado", //yes, emojis work
																	sound: "notification",
																    vibrate: 1,
																    content_available: 1,
															    }
															}

															fcm.send(payload)
															    .then(function (response) {
															        console.log(response)
															 })				            			
									            		}
									            }else{
									                console.log("user not found");
									            }
									        }); 

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

		function notice (req, res){
			var data = {};
			var REQ = req.body || req.params;

			Model.findOne({ _id : mongoose.Types.ObjectId(req.params.id) }).populate("_user").exec(function(error, credit){
				if(!error){
						var notice = _compiler.render({ _data : {
	                    name : ((credit._user.name || '') +' '+ (credit._user.data.second_name || '') +' '+ (credit._user.last_name || '') +' '+(credit._user.data.second_last_name || '')),
	                    date :  moment(new Date()).format('MMMM DD YYYY, h:mm:ss a'),
	                    pagare : credit.data.id
	                 }}, 'notice/notice.ejs');



						 var wkhtmltopdf = require('wkhtmltopdf');
						 
						 wkhtmltopdf.command = "/home/ec2-user/wkhtmltox/bin/wkhtmltopdf";

						 stream = wkhtmltopdf(notice, { pageSize: 'letter' })
							  .pipe(fs.createWriteStream('preaviso.pdf'));

						 stream.on('close', function() {
			                var data_notice= {
			                  from: ' Daimont <soporte@daimont.com>',
			                  to: credit._user.email,
			                  subject: 'Pre-aviso de reporte negativo en las respectivas centrales de riesgo',
			                  text:'Buenas tardes señor (a) ' + ((credit._user.name || '') +' '+ (credit._user.data.second_name || '') +' '+ (credit._user.last_name || '') +' '+(credit._user.data.second_last_name || '')) + '\nComunicación Previa. Artículo 12 Ley 1266 de 2008 \nPre-aviso de reporte negativo en las respectivas centrales de riesgo'.toUpperCase(),
				              attachment : path.join(process.env.PWD , "preaviso.pdf")
			                };

				              mailgun.messages().send(data_notice, function (error, body) {
				                console.log("Enviando contrato firmado", body);
				              });	
						 }); 

						User.update({ _id : mongoose.Types.ObjectId(credit._user._id) } , { $set : { "data._payment_onNotice" : true } }, function(err, rs){
							if(rs){
									res.status(200).json(rs);
							}else{
									res.status(500).json(err)
							}
						}); 
					
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
				Model.find({"data.hidden" : false, "data.status" : 'Pendiente'}).sort("-createdAt").populate("_user").populate("_payment").populate("_contract").lean().exec(function(err, rs){
					if(!err){
						var result = rs.filter(function(credit){
							if(credit._user && credit._user.data){
								return credit._user.data.updated;
							}
						});

						async.map(result, function (credit, next) {
							Model.count({ _user: mongoose.Types.ObjectId(credit._user._id), "data.hidden" : false, "data.status" : 'Finalizado'}, function( err, count){
								if(!err){
										credit.data.count = count || 0;
										Model.count({ _user: mongoose.Types.ObjectId(credit._user._id), "data.status" : 'Rechazado'}, function( err, rejected){
											if(!err){
													credit.data.rejected = rejected || 0;
													
													Model.count({ _user: mongoose.Types.ObjectId(credit._user._id), "data.status" : { $in : ["Pagado", "Firmado", "Aceptado", "Consignado", "Aprobado"] }}, function( err, pending){
														if(!err){
																credit.data.pending = pending || 0;

																Contract.findOne({ _user: mongoose.Types.ObjectId(credit._user._id), _credit : mongoose.Types.ObjectId(credit._id)}, function( err, sign){
																	if(!err){
																		credit.data.signature = sign;
																		next(err, credit);
																	}
																});

														}
													});
											}
										});
								}
							});
						},
						function (err, result) {
							var result = _.uniq(result, function(credit){
    							return credit._user._id;
  							});

						 	res.status(200).json(result || []);
						});

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
				Model.find({"data.hidden" : false, "data.status" : 'Rechazado'}).sort("-createdAt").populate("_user").populate("_payment").populate("_contract").populate("_approvedby").exec(function(err, rs){
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

 		function consultado(req, res){
			var REQ = req.params; 
			try{
				Model.find({"data.hidden" : false, "data.status" : 'Consultado'}).sort("-createdAt").populate("_user").populate("_payment").populate("_contract").populate("_approvedby").exec(function(err, rs){
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

 		function getfraude(req, res){
			var REQ = req.params; 
			try{
				Model.find({"data.hidden" : false, "data.status" : 'Fraude'}).sort("-createdAt").populate("_user").populate("_payment").populate("_contract").populate("_approvedby").exec(function(err, rs){
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

 		function getDificil_recaudo(req, res){
			var REQ = req.params; 
			try{
				Model.find({"data.hidden" : false, "data.status" : 'Dificil_recaudo'}).sort("-createdAt").populate("_user").populate("_payment").populate("_contract").populate("_approvedby").exec(function(err, rs){
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

						async.map(rs, function (credit, next) {
							Model.count({ _user: mongoose.Types.ObjectId(credit._user._id), "data.hidden" : false, "data.status" : 'Finalizado'}, function( err, count){
								if(!err){
										credit.data.count = count || 0;
										Model.count({ _user: mongoose.Types.ObjectId(credit._user._id), "data.status" : 'Rechazado'}, function( err, rejected){
											if(!err){
													credit.data.rejected = rejected || 0;
													next(err, credit);
											}
										});
								}
							});
						},
						function (err, result) {
						 	res.status(200).json(result || []);
						});

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

 		function pendiente_48(req, res){
			var REQ = req.params; 
			try{
				var cutoffDate = new Date()
				cutoffDate.setDate(cutoffDate.getDate() - 2);
				
				Model.find({"data.hidden" : false, "data.status" : 'Pendiente', "createdAt" : { $gte: cutoffDate}}).sort("-createdAt").populate("_user").populate("_payment").populate("_contract").exec(function(err, rs){
					if(!err){
						var rs = rs.filter(function(c){ return c._user.data.updated });

						async.map(rs, function (credit, next) {
							Model.count({ _user: mongoose.Types.ObjectId(credit._user._id), "data.hidden" : false, "data.status" : 'Finalizado'}, function( err, count){
								if(!err){
										credit.data.count = count || 0;
										
										Model.count({ _user: mongoose.Types.ObjectId(credit._user._id), "data.status" : 'Rechazado'}, function( err, rejected){
											if(!err){
													credit.data.rejected = rejected || 0;
													
													Model.count({ _user: mongoose.Types.ObjectId(credit._user._id), "data.status" : { $in : ["Pagado", "Firmado", "Aceptado", "Consignado", "Aprobado"] }}, function( err, pending){
														if(!err){
																credit.data.pending = pending || 0;

																Contract.findOne({ _user: mongoose.Types.ObjectId(credit._user._id), _credit : mongoose.Types.ObjectId(credit._id)}, function( err, sign){
																	if(!err){
																		credit.data.signature = sign;
																		next(err, credit);
																	}
																});

														}
													});
											}
										});
								}
							});
						},
						function (err, result) {
							var result = _.uniq(result, function(credit){
    							return credit._user._id;
  							});

						 	res.status(200).json(result.filter(function(c){return (c.data.pending == 0 )}) || []);
						});

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

		 function pagado(req, res){
			var REQ = req.params; 
			try{
				Model.find({"data.hidden" : false, "data.status" : 'Pagado'}).sort("-createdAt").populate("_user").populate("_payment").populate("_contract").exec(function(err, rs){
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

		 function anulado(req, res){
			var REQ = req.params; 
			try{
				Model.find({"data.status" : 'Anulado'}).sort("-createdAt").populate("_user").populate("_payment").populate("_contract").exec(function(err, rs){
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
				Model.find({"data.hidden" : false, "data.status" : 'Rechazado'}).sort("-createdAt").populate("_user").populate("_payment").populate("_contract").populate("_approvedby").exec(function(err, rs){
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
				var cutoffDate = new Date()
				cutoffDate.setDate(cutoffDate.getDate() - 30);
				
				Model.find({"data.hidden" : false, "data.status" : 'Consignado', "data.deposited_time_server" : { $gte: cutoffDate}}).sort("-createdAt").populate("_user").populate("_payment").populate("_contract").populate("_approvedby").exec(function(err, rs){
					if(!err){
						var _updated_date = rs.map(function(cre){
								if(!cre.data.deposited_time_server){
									cre.data.deposited_time_server = cre.deposited;
								}

								return cre;
						});

						async.map(_updated_date, function (credit, next) {
							Model.count({ _user: mongoose.Types.ObjectId(credit._user._id), "data.hidden" : false, "data.status" : 'Finalizado'}, function( err, count){
								if(!err){
										credit.data.count = count || 0;
										Model.count({ _user: mongoose.Types.ObjectId(credit._user._id), "data.status" : 'Rechazado'}, function( err, rejected){
											if(!err){
													credit.data.rejected = rejected || 0;
													next(err, credit);
											}
										});
								}
							});
						},
						function (err, result) {
						 	res.status(200).json(result || []);
						});
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
				Model.find({"data.status" : 'Aceptado'}).sort("-createdAt").populate("_user").populate("_payment").populate("_contract").populate("_approvedby").exec(function(err, rs){
					if(!err){
						async.map(rs, function (credit, next) {
							Model.count({ _user: mongoose.Types.ObjectId(credit._user._id), "data.hidden" : false, "data.status" : 'Finalizado'}, function( err, count){
								if(!err){
										credit.data.count = count || 0;
										Model.count({ _user: mongoose.Types.ObjectId(credit._user._id), "data.status" : 'Rechazado'}, function( err, rejected){
											if(!err){
													credit.data.rejected = rejected || 0;
													next(err, credit);
											}
										});
								}
							});
						},
						function (err, result) {
						 	res.status(200).json(result || []);
						});

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

 		function preaprobado(req, res){
			var REQ = req.params; 
			try{
				Model.find({"data.status" : 'Preaprobado'}).sort("-createdAt").populate("_user").populate("_payment").populate("_contract").populate("_approvedby").exec(function(err, rs){
					if(!err){
						async.map(rs, function (credit, next) {
							Model.count({ _user: mongoose.Types.ObjectId(credit._user._id), "data.hidden" : false, "data.status" : 'Finalizado'}, function( err, count){
								if(!err){
										credit.data.count = count || 0;
										Model.count({ _user: mongoose.Types.ObjectId(credit._user._id), "data.status" : 'Rechazado'}, function( err, rejected){
											if(!err){
													credit.data.rejected = rejected || 0;
													next(err, credit);
											}
										});
								}
							});
						},
						function (err, result) {
						 	res.status(200).json(result || []);
						});

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

 		function morosos(req, res){
			var REQ = req.params; 
			try{
				var cutoffDate = new Date()
				cutoffDate.setDate(cutoffDate.getDate() - 30);

				Model.find({"data.status" : 'Consignado', $or : [{"data.deposited_time_server" : { $lte: cutoffDate}}, {"data.deposited_time_server" : { $exists: false}}]}).sort("-createdAt").populate("_user").populate("_payment").populate("_contract").populate("_approvedby").exec(function(err, rs){
					if(!err){
						async.map(rs, function (credit, next) {
							credit.data.status = 'Morosos';
							Model.count({ _user: mongoose.Types.ObjectId(credit._user._id), "data.hidden" : false, "data.status" : 'Finalizado'}, function( err, count){
								if(!err){
										credit.data.count = count || 0;
										Model.count({ _user: mongoose.Types.ObjectId(credit._user._id), "data.status" : 'Rechazado'}, function( err, rejected){
											if(!err){
													credit.data.rejected = rejected || 0;
													next(err, credit);
											}
										});
								}
							});
						},
						function (err, result) {
						 	res.status(200).json(result || []);
						});
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

 		function preventivo(req, res){
			var REQ = req.params; 
			try{

				Model.find({"data.status" : "Consignado", "data.hidden" : false }).sort("-createdAt").populate("_user").populate("_payment").populate("_contract").populate("_approvedby").exec(function(err, rs){
					if(!err){
						var result = rs.filter(function(c){
							var system = moment(c.data.deposited_time_server);
							var now = moment(new Date());

							return (((now.diff(system, 'days') >= 23) && (now.diff(system, 'days') <= 29))) ? true : false; 
						});	
							
						async.map(result, function (credit, next) {
									Model.count({ _user: mongoose.Types.ObjectId(credit._user._id), "data.hidden" : false, "data.status" : 'Finalizado'}, function( err, count){
										if(!err){
												credit.data.count = count || 0;
												Model.count({ _user: mongoose.Types.ObjectId(credit._user._id), "data.status" : 'Rechazado'}, function( err, rejected){
													if(!err){
															credit.data.rejected = rejected || 0;
															next(err, credit);
													}
												});
										}
									});										
						},
						function (err, result) {
						 	res.status(200).json(result.map(function(c){
						 		c.data.viewedPreventivo = c.data.viewedPreventivo || false;

						 		return c;

						 	}) || []);
						});
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
						res.status(200).json(rs.filter(function(doc){ 
							if(doc._user && doc._user.data){
								return doc._user.data.updated
							}
						} || []));
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
						res.status(200).json(rs.filter(function(doc){ 
							if(doc._user && doc._user.data){
								return !doc._user.data.updated
							}

						} || []));
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

		function finalizado(req, res){
			var REQ = req.params; 
			try{
				Model.find({"data.hidden" : false, "data.status" : 'Finalizado'}).populate("_user").populate({ path: "_payment", options: { sort: { 'createdAt': 1 } } }).populate("_contract").populate("_approvedby").exec(function(err, rs){
					if(!err){
						async.map(rs, function (credit, next) {
							if(credit._user){
								Model.count({ _user: mongoose.Types.ObjectId(credit._user._id), "data.hidden" : false, "data.status" : 'Finalizado'}, function( err, count){
									if(!err){
											credit.data.count = count || 0;
											Model.count({ _user: mongoose.Types.ObjectId(credit._user._id), "data.status" : 'Rechazado'}, function( err, rejected){
												if(!err){
														credit.data.rejected = rejected || 0;
														next(err, credit);
												}
											});
									}
								});									
							}else{
							   next(err, credit)
							}
						},
						function (err, result) {
						 	res.status(200).json(result || []);
						});
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

		function finalizado_count(req, res){
			var REQ = req.params; 
			try{
				Model.count({ _user: mongoose.Types.ObjectId(req.params.user), "data.hidden" : false, "data.status" : 'Finalizado'}, function( err, count){
					if(!err){
						res.status(200).json({ count : count});
					}else{
						res.status(500).json(err);
					}
				})
			}catch(error){
				Model.count({ _user: mongoose.Types.ObjectId(req.params.user), "data.hidden" : false, "data.status" : 'Finalizado'}, function( err, count){
					if(!err){
						res.status(200).json(rs || []);
					}else{
						res.status(500).json(err);
					}
				})
			}
		}

		apiRoutes.get("/" + _url_alias +"/current", getCurrent);

		apiRoutes.get("/" + _url_alias +"/consignado", consignado);
		apiRoutes.get("/" + _url_alias +"/finalizado", finalizado);
		apiRoutes.get("/" + _url_alias +"/finalizado/:user/count", finalizado_count);
		apiRoutes.get("/" + _url_alias +"/pagado", pagado);
		apiRoutes.get("/" + _url_alias +"/anulado", anulado);
		apiRoutes.get("/" + _url_alias +"/consultado", consultado);
		apiRoutes.get("/" + _url_alias +"/actualizado", actualizado);
		apiRoutes.get("/" + _url_alias +"/desactualizado", desactualizado);
		apiRoutes.get("/" + _url_alias +"/pendiente", pendiente);
		apiRoutes.get("/" + _url_alias +"/firmado", firmado);
		apiRoutes.get("/" + _url_alias +"/pendiente_48", pendiente_48);
		apiRoutes.get("/" + _url_alias +"/aceptado", aceptado);
		apiRoutes.get("/" + _url_alias +"/preaprobado", preaprobado);
		apiRoutes.get("/" + _url_alias +"/fraude", getfraude);
		apiRoutes.get("/" + _url_alias +"/dificil_recaudo", getDificil_recaudo);
		apiRoutes.get("/" + _url_alias +"/morosos", morosos);
		apiRoutes.get("/" + _url_alias +"/preventivo", preventivo);
		apiRoutes.get("/" + _url_alias +"/rechazado", rechazado);

		apiRoutes.get("/" + _url_alias +"/email_request/:id", email_request);
		apiRoutes.get("/" + _url_alias +"/max_amount", getByMaxAmount);
		apiRoutes.get("/" + _url_alias +"/history", getHistory);
		apiRoutes.get("/" + _url_alias + "/all" , all);
		apiRoutes.get("/" + _url_alias , get);
		apiRoutes.get("/" + _url_alias + "/:id", getById);
		apiRoutes.post("/" + _url_alias, post);
		apiRoutes.put("/" + _url_alias + "/lock/:id", lock);
		apiRoutes.put("/" + _url_alias + "/unlock/:id", unlock);
		apiRoutes.put("/" + _url_alias + "/approved/:id", approved);
		apiRoutes.put("/" + _url_alias + "/fraude/:id", fraude);
		apiRoutes.put("/" + _url_alias + "/dificil_recaudo/:id", dificil_recaudo);
		apiRoutes.put("/" + _url_alias + "/preapproved/:id", preapproved);
		apiRoutes.put("/" + _url_alias + "/rejected/:id", rejected);

		apiRoutes.put("/" + _url_alias + "/notify-preventive/:id/enable", preventive_enable);
		apiRoutes.put("/" + _url_alias + "/notify-preventive/:id/disabled", preventive_disabled);

		apiRoutes.put("/" + _url_alias + "/request/whatsapp/:id/enable", request_whatsapp_enable);
		apiRoutes.put("/" + _url_alias + "/request/whatsapp/:id/disabled", request_whatsapp_disabled);

		apiRoutes.put("/" + _url_alias + "/request/familiy-references-whatsapps/:id/enable", request_references_family_enable_whatsapps);
		apiRoutes.put("/" + _url_alias + "/request/familiy-references-whatsapps/:id/disabled", request_references_family_disabled_whatsapps);

		apiRoutes.put("/" + _url_alias + "/request/family-references-phone/:id/enable", request_references_family_enable_phone);
		apiRoutes.put("/" + _url_alias + "/request/family-references-phone/:id/disabled", request_references_family_disabled_phone);

		apiRoutes.put("/" + _url_alias + "/request/comercial-references-whatsapps/:id/enable", request_references_comercial_enable_whatsapps);
		apiRoutes.put("/" + _url_alias + "/request/comercial-references-whatsapps/:id/disabled", request_references_comercial_disabled_whatsapps);

		apiRoutes.put("/" + _url_alias + "/request/comercial-references-phone/:id/enable", request_references_comercial_enable_phone);
		apiRoutes.put("/" + _url_alias + "/request/comercial-references-phone/:id/disabled", request_references_comercial_disabled_phone);

		apiRoutes.put("/" + _url_alias + "/request/phone/:id/enable", request_phone_enable);
		apiRoutes.put("/" + _url_alias + "/request/phone/:id/disabled", request_phone_disabled);

		apiRoutes.put("/" + _url_alias + "/request/email/:id/enable", request_email_enable);
		apiRoutes.put("/" + _url_alias + "/request/email/:id/disabled", request_email_disabled);

		apiRoutes.put("/" + _url_alias + "/request/bankCheck/:id/enable", request_bankCheck_enable);
		apiRoutes.put("/" + _url_alias + "/request/bankCheck/:id/disabled", request_bankCheck_disabled);

		apiRoutes.put("/" + _url_alias + "/request/phoneCheck/:id/enable", request_phoneCheck_enable);
		apiRoutes.put("/" + _url_alias + "/request/phoneCheck/:id/disabled", request_phoneCheck_disabled);

		apiRoutes.put("/" + _url_alias + "/request/emailCheck/:id/enable", request_emailCheck_enable);
		apiRoutes.put("/" + _url_alias + "/request/emailCheck/:id/disabled", request_emailCheck_disabled);

		apiRoutes.put("/" + _url_alias + "/payment/whatsapp/:id/enable", payment_whatsapp_enable);
		apiRoutes.put("/" + _url_alias + "/payment/whatsapp/:id/disabled", payment_whatsapp_disabled);

		apiRoutes.put("/" + _url_alias + "/payment/phone/:id/enable", payment_phone_enable);
		apiRoutes.put("/" + _url_alias + "/payment/phone/:id/disabled", payment_phone_disabled);

		apiRoutes.put("/" + _url_alias + "/payment/email/:id/enable", payment_email_enable);
		apiRoutes.put("/" + _url_alias + "/payment/email/:id/disabled", payment_email_disabled);

		apiRoutes.post("/" + _url_alias + "/notice/:id", notice);
		apiRoutes.put("/" + _url_alias + "/nulled/:id", nulled);
		apiRoutes.put("/" + _url_alias + "/consultado/:id", query);
		apiRoutes.put("/" + _url_alias + "/viewed/:id", viewed);
		apiRoutes.put("/" + _url_alias + "/set-viewed-preventivo/:id", set_viewed_preventivo);
		apiRoutes.put("/" + _url_alias + "/unset-viewed-preventivo/:id", unset_viewed_preventivo);
		apiRoutes.put("/" + _url_alias + "/deposited/:id", deposit);
		apiRoutes.put("/" + _url_alias + "/:id", update);

		apiRoutes.delete("/" + _url_alias + "/:id", remove);

		return this;
}
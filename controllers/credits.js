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

		var SimpleFcm = require('simple-fcm');
		var fcm = new SimpleFcm('AIzaSyCOgQeNoM3X0fnKPqSPngUpQP8Bzrr5Hqs');

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

			Model.findOne({ "_id" : mongoose.Types.ObjectId(REQ.id) }).populate("_user").populate("_payment").populate("_approvedby").exec(function(err, rs){
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
					if(rs){
						rs.data.server_date = new Date(Date.now());
        				res.status(200).json(rs || []);
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
										res.status(200).json({ amount : Math.max.apply(null, records.map(function(c){ return c.data.amount[0]})), credit: credit});
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

			User.findOne({ "_id"  : mongoose.Types.ObjectId(REQ._user)}).exec(function(err, user){
				if(user){
					if(user.data.banned_time){
						var system = moment(user.data.banned_time);
		      			var now = moment(new Date().toISOString());

		      			if(now.diff(system, 'days') > 60){
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
								});		      				//aqui save
		      			}else{
		      				console.log("isBanned");
		      				res.status(200).json({ time_to_left : now.diff(system, 'days') == 0 ?  1 : now.diff(system, 'days')});
		      			}

					}else{
						console.log("creando modelo");
						var model = new Model(data);

						model.save(function(err, credit){
							if(credit){
								console.log("guardado modelo");

						        if(facebook_token){
								console.log("en nada");

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
                          subject: 'APROBACIÓN DE PRÉSTAMO.',
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

		function all (req, res){
			var REQ = req.params; 
			
			 Model.find().populate("_user").populate("_payment").exec(function(err, rs){
					if(!err){
						var result = rs.filter(function(credit){
							if(credit._user && credit._user.data){
								return credit._user.data.updated;
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

 		function firmado(req, res){
			var REQ = req.params; 
			try{
				Model.find({"data.hidden" : false, "data.status" : 'Firmado'}).sort("-createdAt").populate("_user").populate("_payment").populate("_contract").exec(function(err, rs){
					if(!err){

						var credits  = rs.filter(function(credit){
							Model.count({ _user: mongoose.Types.ObjectId(credit._user._id), "data.hidden" : false, "data.status" : 'Finalizado'}, function( err, count){
								if(!err){
										credit.data.count = count;

										return credit;
								}
							})
						});

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
				Model.find({"data.hidden" : false, "data.status" : 'Consignado'}).sort("-createdAt").populate("_user").populate("_payment").populate("_contract").populate("_approvedby").exec(function(err, rs){
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
				Model.find({"data.hidden" : false, "data.status" : 'Aceptado'}).sort("-createdAt").populate("_user").populate("_payment").populate("_contract").populate("_approvedby").exec(function(err, rs){
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
				Model.find({"data.hidden" : false, "data.status" : 'Finalizado'}).sort("-createdAt").populate("_user").populate("_payment").populate("_contract").populate("_approvedby").exec(function(err, rs){
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
		apiRoutes.get("/" + _url_alias +"/consignado", consignado);
		apiRoutes.get("/" + _url_alias +"/finalizado", finalizado);
		apiRoutes.get("/" + _url_alias +"/finalizado/:user/count", finalizado_count);
		apiRoutes.get("/" + _url_alias +"/consignado", consignado);
		apiRoutes.get("/" + _url_alias +"/pagado", pagado);
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
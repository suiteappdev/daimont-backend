module.exports = function(app, apiRoutes, io){
		var AWS = require('aws-sdk');
		AWS.config.region = 'us-west-2';
		AWS.config.update({
		      accessKeyId: process.env.AWS_ID,
		      secretAccessKey: process.env.AWS_KEY
		});
		var sns = new AWS.SNS();

		var _entity ="contracts";
		var _url_alias = "contracts";
		var path = require("path");
		var mongoose = require('mongoose');
		var Model = require(path.join("../", "models", _entity + ".js"));
    	var user_manager = require('../models/user_manager');
    	var crypto = require("crypto");
	   	var config = require(path.join(process.env.PWD , "config.js"));
	    var _compiler = require(path.join(process.env.PWD , "helpers", "mailer.js"));
    	var moment = require('moment');
   		moment.locale('es');
    	var formatCurrency = require('format-currency')
		var opts = { format: '%v %c', code: 'COP' }
   		var Credit = require('../models/credits');
		var nodemailer = require('nodemailer');

		var transporter = nodemailer.createTransport("SMTP" ,{
		 service: 'gmail',
		 auth: {
		        user: 'listerine@gmail.com',
		        pass: 'plasmagun1989*'
		    }
		});

	    var fs = require("fs");
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

		function verify(req, res){
			var REQ = req.params; 

			 Model.findOne({ "_user" : mongoose.Types.ObjectId(req.headers['x-daimont-user']), "data.contract" : REQ.contract}).populate("_user").populate("_credit").exec(function(err, rs){
					if(!err){
						if(rs){
								Credit.findOne({ _id : mongoose.Types.ObjectId(rs._credit._id)}).populate("_user").populate("_contract").exec(function(err, credit){
									console.log("credito emit", credit);
									if(!err){
										io.to('all').emit('NEW_CREDIT_TO_ADMIN', credit);
									}
								});

								var _html_credit_resume = _compiler.render({ _data : {
		                            user : (rs._user.name + ' ' + rs._user.last_name) ,
		                            amount : formatCurrency(rs._credit.data.amount[0], opts),
		                            interestsDays : formatCurrency(rs._credit.data.interestsDays, opts),
		                            pay_day : moment(rs._credit.data.pay_day).format('MMMM DD, YYYY'),
		                            system_quoteDays : formatCurrency(rs._credit.data.system_quoteDays, opts),
		                            finance_quote : formatCurrency(rs._credit.data.finance_quote, opts),
		                            ivaDays : formatCurrency(rs._credit.data.ivaDays, opts),
		                            total_payment : formatCurrency(rs._credit.data.total_payment, opts),
		                            status : rs._credit.data.status
		                         }}, 'credit_resume/index.ejs');

								console.log("USUARIO", rs._user);

								 var _html = _compiler.render({ _data : { 
								 		fullname : (rs._user.name + ' ' + rs._user.data.second_name + ' ' + rs._user.last_name + ' ' + rs._user.data.second_last_name).toUpperCase(),
								 		nombre : rs._user.name + ' ' +rs._user.last_name,
								 		email : rs._user.email,
								 		telefono : rs._user.data.phone || 'sin telefono',
								 		cedula : rs._user.cc,
								 		ciudad : rs._user.data.ciudad,
								 		direccion : rs._user.data.direccion,
								 		fecha_vencimiento_30 : moment(rs.createdAt).add(30, "days").format('MMMM DD, YYYY'),
								 		dias : rs._credit.data.days[0],
								 		fecha_vencimiento : moment(new Date(rs._credit.data.pay_day)).format('MMMM DD, YYYY'),
								 		fecha_actual :  moment(new Date()).format('MMMM DD YYYY, h:mm:ss a'),
								 		interes : formatCurrency((rs._credit.data.interestsPeerDays * 30), opts),
								 		monto : formatCurrency(rs._credit.data.amount[0], opts),
								 		gestion : formatCurrency(rs._credit.data.system_quote, opts),
								 		total : formatCurrency(rs._credit.data.total_payment, opts),
								 		cupon : formatCurrency(rs._user.data.cupon, opts),
								 		ip:rs._credit.data.client_metadata.ip || 'no definida',
								 		codigo:rs.data.contract,
								 		consecutivo:rs._credit.data.id
								 	}
								 }, 'contract/contract_filled.ejs');
								 
								 var wkhtmltopdf = require('wkhtmltopdf');
								 
								 wkhtmltopdf.command = "/home/ec2-user/wkhtmltox/bin/wkhtmltopdf";

								 stream = wkhtmltopdf(_html, { pageSize: 'letter' })
									  .pipe(fs.createWriteStream('contrato_firmado.pdf'));

								 stream.on('close', function() {
								 	console.log("pdf end")
									
									const mailOptions = {
									  from: 'info@daimont.com', // sender address
									  to: rs._user.email, // list of receivers
									  subject: 'Por favor revisa el contrato adjunto donde se describe todos los términos entre las partes.', // Subject line
									  html: html_credit_resume,// plain text body
									  attachments: [ 
									  { filename: 'contrato.pdf',
   									  contentType: 'application/pdf',
   									  path: path.join(process.env.PWD , "contrato_firmado.pdf") } 
   									  ] 
									};

									transporter.sendMail(mailOptions, function (err, info) {
									   if(err)
									     console.log("NODEMAILER ERROR", err);
									   else
									     console.log("NODEMAILER INFO", info);
									});
								 });
  
						  		
						}

						res.status(200).json(rs ? rs : []);
					}else{
						res.status(500).json(err);
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
			!REQ.data || (data.data = REQ.data);

			data.metadata = data.metadata || {};
			data.data = REQ.data || {};

			if(REQ._user){
				data._user = mongoose.Types.ObjectId(REQ._user);
			}

			
			if(REQ._credit){
				data._credit = mongoose.Types.ObjectId(REQ._credit);
			}

			require('crypto').randomBytes(3, function(err, buffer) {
				data.data.contract = buffer.toString('hex');

				var model = new Model(data);
				
				model.save(function(err, contract){
					if(contract){
				    	res.status(200).json(contract);

			            Model.findOne({ _id : mongoose.Types.ObjectId(contract._id)}).populate("_user").exec(function(err, data){
			            	var _contracto = data
							  var _html = _compiler.render({ _data : { name : data._user.name, last_name : data._user.last_name, contract : buffer.toString('hex')}}, 'contract/new_contract.ejs');
	                        

				              /*var data = {
				                from: ' Daimont <noreply@daimont.com>',
				                to: data._user.email,
				                subject: 'FIRMA DEL CONTRATO',
				                text: 'por favor usa este código para firmar tu contrato de préstamo.',
				                html: _html,
				                //attachment : path.join(process.env.PWD , "docs", "_contract.docx")
				              };*/

									
							    const mailOptions = {
									  from: 'info@daimont.com', // sender address
									  to: data._user.email, // list of receivers
									  subject: 'FIRMA DEL CONTRATO', // Subject line
									  text: 'por favor usa este código para firmar tu contrato de préstamo.',
									  html:_html// plain text body
									  /*attachments: [ 
									  { filename: 'contrato.pdf',
   									  contentType: 'application/pdf',
   									  path: path.join(process.env.PWD , "contrato_firmado.pdf") } 
   									  ] */
								};

								transporter.sendMail(mailOptions, function (err, info) {
								   if(err)
								     console.log("NODEMAILER ERROR", err);
								   else
								     console.log("NODEMAILER INFO", info);
								});

				              /*mailgun.messages().send(data, function (error, body) {
				                	console.log("mailgun body", body);
	                        	if(_contracto._user.data.phone){
		                        	var phone = "+57" + _contracto._user.data.phone.toString();
		                        	var firma = buffer.toString('hex');
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

				              });*/    
			              });
					}else{
						return res.status(500).json(err);
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
		apiRoutes.get("/" + _url_alias+'/verify/:contract' , verify);
		apiRoutes.get("/" + _url_alias +"/all", all);
		apiRoutes.get("/" + _url_alias + "/:id", getById);
		apiRoutes.post("/" + _url_alias, post);
		apiRoutes.put("/" + _url_alias + "/:id", update);
		apiRoutes.delete("/" + _url_alias + "/:id", remove);

		return this;
}
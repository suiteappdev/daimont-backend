module.exports = function(app, apiRoutes, io){
		var _entity ="payments";
		var _url_alias = "payments";
		var path = require("path");
		var mongoose = require('mongoose');
		var Model = require(path.join("../", "models", _entity + ".js"));
    	var user_manager = require('../models/user_manager');
    	var crypto = require("crypto");
	   	var config = require(path.join(process.env.PWD , "config.js"));
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
	    }).single('transaction');


		function get(req, res){
			var REQ = req.params; 
			var where;

			if(req.headers['x-daimont-user']){
				where = { "metadata._author" :  mongoose.Types.ObjectId.isValid(req.headers['x-daimont-user']) ? mongoose.Types.ObjectId(req.headers['x-daimont-user']) :req.headers['x-daimont-user'] , "data.hidden" : false};
			}

			 Model.find( where || {} ).populate("_user").exec(function(err, rs){
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

		function post(req, res){
			var data = {};
			var REQ = req.body || req.params;
  			!REQ.metadata || (data.metadata = REQ.metadata);
			!REQ.data || (data.data = REQ.data);

			data.metadata = data.metadata || {};
			data._user = mongoose.Types.ObjectId(req.headers['x-daimont-user']);
			data._credit = mongoose.Types.ObjectId(REQ._credit);
			data.metadata._author = mongoose.Types.ObjectId(req.headers['x-daimont-user']);
			data.data.transaction = req.file.location;
			
			var model = new Model(data);
			
			model.save(function(err, payment){
				if(payment){
			    	res.status(200).json(payment);

		            Model.findOne({ _id : mongoose.Types.ObjectId(payment._id)}).populate("_user").exec(function(err, data){
							 console.log(data)
							 /* var _html = _compiler.render(
									{ _data : { name : data._user.name, last_name : data._user.last_name}}, 'payment/new_payment_to_admin.ejs');

				              var data = {
				                from: ' Daimont <noreply@daimont.com>',
				                to: config.email_recipient,
				                subject: 'Nuevo pago',
				                text: 'se ha realizado un nuevo pago',
				                html: _html
				              };

				              mailgun.messages().send(data, function (error, body) {
				                console.log("mailgun body", body);
				              }); */      	 
								       
		              });
				}else{
					res.status(500).json(err);
				}
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
		apiRoutes.get("/" + _url_alias + "/:id", getById);
		apiRoutes.post("/" + _url_alias, upload, post);
		apiRoutes.put("/" + _url_alias + "/:id", update);
		apiRoutes.delete("/" + _url_alias + "/:id", remove);

		return this;
}
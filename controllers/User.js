module.exports = function(app, apiRoutes){
    var mongoose = require('mongoose');
    var user_manager = require('../models/user_manager');
    var path = require("path");
    var credit = require('../models/credits');
    var config = require(process.env.PWD + '/config.js');
    var moment = require('moment');
    moment.locale('es');
    var formatCurrency = require('format-currency')
    var opts = { format: '%v %c', code: 'COP' }
    var UserSchema = require('../models/user');
    var User = require('../models/user');
    var crypto = require("crypto");
    var _compiler = require(path.join(process.env.PWD , "helpers", "mailer.js"));

    var SNS = require('sns-mobile');

    // Just some environment variables configured
    /*var SNS_KEY_ID = process.env['SNS_KEY_ID'],
      SNS_ACCESS_KEY = process.env['SNS_ACCESS_KEY'],
      ANDROID_ARN = process.env['SNS_ANDROID_ARN'];

    // Object to represent the PlatformApplication we're interacting with
    var myApp = new SNS({
        platform: 'android',
        region: 'eu-west-1',
        apiVersion: '2010-03-31',
        accessKeyId: SNS_KEY_ID,
        secretAccessKey: SNS_ACCESS_KEY
        platformApplicationArn: ANDROID_ARN
    }); */

    var api_key = process.env.MAILGUN_API_KEY || null;
    var domain = 'daimont.com';
    var mailgun = require('mailgun-js')({apiKey: api_key, domain: domain});

    function client(req, res){
       var data = req.body;
       var password_text = req.body.password;
       var credit = req.body.credit;

        user_manager.create(data, function(err, user){
          
          if(err){
              res.status(409).json({code : 11000});
              return;
          }
          
          if(user){
                  /*var _html_activation = _compiler.render({ _data : {
                      name : user.name,
                      last_name : user.last_name,
                      email : user.email,
                      activation_url : config.base_url_dev + "login/" + user.activation_token
                   }}, 'activation/index.ejs');

                  var data_activation_email = {
                    from: ' Daimont <noreply@daimont.com>',
                    to: user.email,
                    subject: 'Activar Cuenta',
                    text: 'proceda con la activación de su cuenta',
                    html: _html_activation
                  };

                  mailgun.messages().send(data_activation_email, function (error, body) {
                        if(credit){
                            var _html_credit_request = _compiler.render({ _data : {
                                user : (user.name + ' ' + user.last_name),
                                credit_url : config.base_url_dev + "detail/" + user.credit.data._id
                             }}, 'credit_resume/new_credit_to_admin.ejs');

                            var data_credit_request = {
                              from: ' Daimont <noreply@daimont.com>',
                              to: config.email_recipient,
                              subject: 'Nueva solicitud de credito realizada',
                              text: (user.name + ' ' + user.last_name) + ' ha realizado una solicitud de credito',
                              html: _html_credit_request
                            };

                            mailgun.messages().send(data_credit_request, function (error, body) {
                              if(body){
                                  console.log("New credit request has been sended to " + config.email_recipient, body);
                              }
                            });                            
                        }
                  });*/

              res.status(200).json(user);
          }
        });
    }

    function create(req, res){
       var data = req.body;
       var password_text = req.body.password;
       var credit = req.body.credit;

        user_manager.create(data, function(err, user){
          
          if(err){
              res.status(409).json({code : 11000});
              return;
          }
          
          if(user){
              var _html_activation = _compiler.render({ _data : {
                  name : user.name,
                  last_name : user.last_name,
                  email : user.email,
                  activation_url : config.base_url_dev + "profile/" + user.activation_token
               }}, 'activation/index.ejs');

              var data_activation_email = {
                from: ' Daimont <noreply@daimont.com>',
                to: user.email,
                subject: 'Activar Cuenta',
                text: 'proceda con la activación de su cuenta',
                html: _html_activation
              };

              mailgun.messages().send(data_activation_email, function (error, body) {
                  if(data){
                    if(credit){
                        var _html_credit_resume = _compiler.render({ _data : {
                            user : user.first_name,
                            amount : formatCurrency(user.credit.data.amount[0], opts),
                            interestsDays : formatCurrency(user.credit.data.interestsDays, opts),
                            pay_day : moment(user.credit.data.pay_day).format('MMMM DD, YYYY'),
                            system_quoteDays : formatCurrency(user.credit.data.system_quoteDays, opts),
                            finance_quote : formatCurrency(user.credit.data.finance_quote, opts),
                            ivaDays : formatCurrency(user.credit.data.ivaDays, opts),
                            total_payment : formatCurrency(user.credit.data.total_payment, opts),
                            status : user.credit.data.status
                         }}, 'credit_resume/index.ejs');

                        var data_credit_resume = {
                          from: ' Daimont <noreply@daimont.com>',
                          to: user.email,
                          subject: 'RESUMEN DEL CRÉDITO',
                          text: 'Estado y resumen de su actual credito',
                          html: _html_credit_resume
                        };

                        mailgun.messages().send(data_credit_resume, function (error, body) {
                          if(data){
                              console.log("email request", body);
                          }
                        });                       
                    }
                  }
                  
                console.log("email request", body);
              });
                  
              res.status(200).json(user);
          }

        });
    }

 function admin(req, res){
       var data = req.body;
       var password_text = req.body.password;
       var credit = req.body.credit;
       data.type = "ADMINISTRATOR"; 
        
       user_manager.create(data, function(err, user){
          
          if(err){
              res.status(409).json({code : 11000});
              return;
          }
          
          if(user){
              var _html_activation = _compiler.render({ _data : {
                  name : user.name,
                  last_name : user.last_name,
                  email : user.email,
                  activation_url : config.base_url_dev + "profile/" + user.activation_token
               }}, 'activation/index.ejs');

              var data_activation_email = {
                from: ' Daimont <noreply@daimont.com>',
                to: user.email,
                subject: 'Activar Cuenta',
                text: 'proceda con la activación de su cuenta',
                html: _html_activation
              };

              mailgun.messages().send(data_activation_email, function (error, body) {
                  if(data){
                    if(credit){
                        var _html_credit_resume = _compiler.render({ _data : {
                            user : user.first_name,
                            amount : formatCurrency(user.credit.data.amount[0], opts),
                            interestsDays : formatCurrency(user.credit.data.interestsDays, opts),
                            pay_day : moment(user.credit.data.pay_day).format('MMMM DD, YYYY'),
                            system_quoteDays : formatCurrency(user.credit.data.system_quoteDays, opts),
                            finance_quote : formatCurrency(user.credit.data.finance_quote, opts),
                            ivaDays : formatCurrency(user.credit.data.ivaDays, opts),
                            total_payment : formatCurrency(user.credit.data.total_payment, opts),
                            status : user.credit.data.status
                         }}, 'credit_resume/index.ejs');

                        var data_credit_resume = {
                          from: ' Daimont <noreply@daimont.com>',
                          to: user.email,
                          subject: 'Resumen de Credito',
                          text: 'Estado y resumen de su actual credito',
                          html: _html_credit_resume
                        };

                        mailgun.messages().send(data_credit_resume, function (error, body) {
                          if(data){
                              console.log("email request", body);
                          }
                        });                       
                    }
                  }
                console.log("email request", body);
              });
                  
              res.status(200).json(user);
          }

        });
    }


    function update(req, res){
         var data = {};
         var REQ = req.body || req.params;
         !REQ.metadata || (data.metadata = REQ.metadata);
         !REQ.data || (data.data = REQ.data);
         !REQ.username || (data.username = REQ.username);
         !REQ.password || (data.password = REQ.password);
         !REQ.cc || (data.cc = REQ.cc);
         !REQ.email || (data.email = REQ.email);
         !REQ.name || (data.name = REQ.name);
         !REQ.last_name || (data.last_name = REQ.last_name);

          if(REQ.password){
            data.password = require(process.env.PWD + "/helpers/crypto-util")(REQ.password);
          } 

          console.log("data", data);

          data = { $set : data }; 

          user_manager.update({ _id : mongoose.Types.ObjectId(req.params.id) }, data, function(err, rs){
              if(rs){
                  res.json(rs);
              }
          });   
    }

    function updatedProfile(req, res){
          var data = {};
          var REQ = req.body || req.params;
          !REQ.data || (data.data = REQ.data);



          UserSchema.findByIdAndUpdate(mongoose.Types.ObjectId(req.params.id), REQ , function(err, rs) {
              if(!err){
                  res.status(200).json(rs);                
              }
          });
    }



    function update_cupon(req, res){
          var REQ = req.body || req.params;

          UserSchema.findByIdAndUpdate(mongoose.Types.ObjectId(req.params.id), {$set: {'data.cupon': REQ.cupon }}, function(err, rs) {
              if(!err){
                  res.status(200).json(rs);                
              }
          });
    }

    function remove(req, res){
        user_manager.remove(req.params.id, function(err, user){
            if(!err){
                user.remove();
                res.status(200)
                res.end();
            }
        })
    }

    function users(req, res){
        UserSchema.find().exec(function(err, users){
            if(!err){
                res.send(users);
            }
        });
    }

    function employees(req, res){
        UserSchema.find({ "type" : "ADMINISTRATOR" }).exec(function(err, users){
            if(!err){
                res.status(200).json(users);
            }else{
                res.status(500).json({err : err});
            }
        });
    }

    function user(req, res){
        UserSchema
        .findOne( mongoose.Types.ObjectId(req.params.id))
        .exec(function(err, rs){
            if(rs)
                res.json(rs);
            else
                res.json(err);
        })

    }

    function byfacebookId(req, res){
        UserSchema
        .findOne({ "data.facebookId" : req.params.facebookId })
        .exec(function(err, rs){
            if(rs)
                res.json(rs);
            else
                res.json(err);
        })
    }

    function byDocument(req, res){
        UserSchema
        .find({ "cc" : req.params.documentId })
        .exec(function(err, rs){
            if(rs)
                res.json({ exists : rs.length});
            else
                res.json(err);
        })
    }

    function login(req, res){
            if (!req.body.email) {
                res.status(400).send({err : 'debe especificar un usuario'});
                return;
            }

            if (!req.body.password) {
                res.status(400).send({err : 'debe especificar un password'});
                return;
            }

          var jwt = require('jsonwebtoken');
          var UserSchema = require('../models/user');

         UserSchema.findOne({ email : req.body.email}).exec(function(err, user){
            if(!user){
                    res.status(404).json({err : 'email address not found'});
                    return;
             }

            if(user.auth(req.body.password)){
                  user.password = null;

                  var token = jwt.sign(user, app.get('secret'), {
                      //expiresIn: 43200 // 24 horas (suficientes para una jornada laboral)
                    });

                  user_manager.createSession({token : token, user : user }, function(err, userToken){
                        res.status(200).json({token:token, user : user});
                  });  
            }else{
                  res.status(401).json({err: 'Usuario o clave incorrectos'});
            }
        });
    }

    function exists(req, res){
        UserSchema.exists(req.params.email.toLowerCase(), function(err, rs){
          if(!err){
              res.status(200).json({ exists : rs});
          }
        }) ;
    }

    function passwordReset(req, res){
         var data = {};
         var REQ = req.body || req.params;

        if(REQ.newpwd == REQ.confirmpwd){
            UserSchema.findOne({ _id : mongoose.Types.ObjectId(REQ.id) }, function(err, rs){
                if(rs){
                        rs.password = require(process.env.PWD + "/helpers/crypto-util")(REQ.newpwd);
                        rs.save(function(err, rs){
                            if(rs){
                                res.status(200).json({message : "ok"});
                            }
                        })
                }else{
                    res.status(404).json({message : "user not found"})
                }
            });            
        }else{
            res.status(400).json({message : "password not match"})
        }
    }

    function recover(req, res){
        var REQ = req.body || req.params;

        UserSchema.findOne({ email : REQ.email}, function(err, rs){
            if(rs){
                  crypto.pseudoRandomBytes(30, function (err, raw) {
                        rs.resetPasswordToken = raw.toString('hex');
                        rs.resetPasswordExpires = Date.now() + 3600000; // 1 hour

                        rs.save(function(err, rs){
                            if(rs){
                                var _html = _compiler.render({ _data : {
                                    name : rs.name,
                                    last_name : rs.last_name,
                                    email : rs.email,
                                    recover_url : config.base_url_pro + "account/reset/" + rs.resetPasswordToken
                                 }}, 'recover/index.ejs');

                                var data = {
                                  from: ' Daimont <noreply@daimont.com>',
                                  to: rs.email,
                                  subject: 'Cambiar Clave',
                                  text: 'proceda con la recuperación de su cuenta',
                                  html: _html
                                };

                                mailgun.messages().send(data, function (error, body) {
                                  console.log(body);
                                });

                                res.status(200).json({ message : "ok" });
                            }
                        })
                      }) 
                  }else{
                      res.status(404).json({message : "user not found"})
                  }                    
                  
        }); 
    }

  function reset(req, res){
      var REQ = req.body || req.params;
      
      UserSchema.findOne({ resetPasswordToken: REQ.link, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
        if (!user) {
          res.status(404).json({ message: 'no user found or reset link has been expired' });
        }else{
          user.password = require(process.env.PWD + "/helpers/crypto-util")(REQ.newpwd);
          user.resetPasswordToken = undefined;
          user.resetPasswordExpires = undefined;

          user.save(function(err, rs){
              if(rs){
                  res.status(200).json({ status : true});
              }
          })
        }
      });      
  }

  function activate(req, res){
      var REQ = req.body || req.params;

      UserSchema.update({ activation_token: REQ.activation_token  }, { $set: { active: true }},  function(err, user) {
        if(!err){
            User.findOne({ activation_token: REQ.activation_token}).exec(function(err, rs){
               res.status(200).json(rs);
            });
        }
      });
  }

  function activate(req, res){
      var REQ = req.body || req.params;

      UserSchema.update({ activation_token: REQ.activation_token  }, { $set: { active: true }},  function(err, user) {
        if(!err){
            User.findOne({ activation_token: REQ.activation_token}).exec(function(err, rs){
               res.status(200).json(rs);
            });
        }
      });
  }


  function new_device(req, res){
         var data = {};
         var REQ = req.body || req.params;
         console.log("device_token", req.body.device_token);

        UserSchema.findOne({ _id : mongoose.Types.ObjectId(REQ.user) }, function(err, rs){
            if(rs){
                    console.log('\nRegistering user with deviceId: ' + req.body.device_token + " user" + rs._id);

                    rs.data.device_token = req.body.device_token;
                    rs.data.device_type = req.body.device_type;

                    rs.save(function(err, rs){
                        if(rs){
                            res.status(200).json({ message : "device registered" });
                        }
                    })

            }else{
                res.status(404).json({ message : "user not found"})
            }
        });            
  }

    apiRoutes.get('/user', users);
    apiRoutes.get('/user/employees', employees);
    apiRoutes.get('/user/:id', user);
    apiRoutes.get('/user/facebook/:facebookId', byfacebookId);
    apiRoutes.get('/user/documento/:documentId', byDocument);

    app.get('/api/user/exists/:email', exists);
    app.post('/api/user/new_device/:user', new_device);
    app.post('/api/user/activate', activate);
    app.post('/api/reset/:token', reset);
    app.post('/api/password-reset/', passwordReset);
    app.post('/api/recover/', recover);
    app.post("/api/user", create);
    app.post("/api/user/client", client);
    app.post("/api/user/admin", admin);
    app.post("/api/login", login);
    
    apiRoutes.put("/user/:id", update);
    apiRoutes.put("/user/updated/:id", updatedProfile);
    apiRoutes.put("/user/:id/update-cupon", update_cupon);
    apiRoutes.delete("/user/:id", remove);

    return this;
}
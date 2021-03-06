module.exports = function(app, apiRoutes){
    var async = require('async');
    var mongoose = require('mongoose');
    var user_manager = require('../models/user_manager');
    var path = require("path");
    var Credits = require('../models/credits');
    var config = require(process.env.PWD + '/config.js');
    var moment = require('moment');
    moment.locale('es');
    var formatCurrency = require('format-currency')
    var opts = { format: '%v %c', code: 'COP' }
    var UserSchema = require('../models/user');
    var User = require('../models/user');
    var crypto = require("crypto");
    var _compiler = require(path.join(process.env.PWD , "helpers", "mailer.js"));

    function create(req, res){
       var data = req.body;
        user_manager.create(data, function(err, user){
            if(err){
              return; res.status(409).json({code : 11000});
            }else{
                return res.status(200).json(user);
            }
        });
    }

    function remove(req, res){
        User.remove({ _id : mongoose.Types.ObjectId(req.params.id)}, function(err){
            if(!err){
                Credits.remove({ _user: mongoose.Types.ObjectId(req.params.id)}, function( err){
                    if(!err){
                        res.status(200).json({ deleted : true });
                    }else{
                        res.status(500).json({error : err});
                    }
                });
            }
        })
    }

    function clients(req, res){
        UserSchema.find({"data.updated" : true}).exec(function(err, users){
            if(!err){
                async.map(users, function (user, next) {
                  user.data.fname = ((user.name || '') +' '+ (user.data.second_name || '') +' '+ (user.last_name || '') +' '+ (user.data.second_last_name || '')).toString().replace(/á/g, 'a').replace(/é/g, 'e').replace(/í/g, 'i').replace(/ó/g, 'o').replace(/ú/g, 'u').replace(/ñ/g, 'n').replace(/\s\s/g, " ").toUpperCase()
                 
                  Credits.count({ _user: mongoose.Types.ObjectId(user._id), "data.hidden" : false, "data.status" : 'Finalizado'}, function( err, count){
                    if(!err){
                        user.data.count = count || 0;
                        next(err, user);
                    }
                  });
                },
                function (err, result) {
                  res.status(200).json(result || []);
                });
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

    function client(req, res){
        UserSchema
        .findOne( { _id : mongoose.Types.ObjectId(req.params.id) })
        .exec(function(err, rs){
            if(rs)
                res.json(rs);
            else
                res.json(err);
        })

    }

    function credits(req, res){
        Credits
        .find({ _user : mongoose.Types.ObjectId(req.params.user)}).populate("_contract").populate("_user")
        .exec(function(err, rs){
            if(rs)
                res.json(rs);
            else
                res.json(err);
        })

    }

    function consignado(req, res){
        Credits
        .find({ _user : mongoose.Types.ObjectId(req.params.user), "data.status" : "Consignado"}).populate("_contract").populate("_user")
        .exec(function(err, rs){
            if(rs)
                res.json(rs);
            else
                res.json(err);
        })

    }

    function finalizado(req, res){
        Credits
        .find({ _user : mongoose.Types.ObjectId(req.params.user), "data.status" : "Finalizado"}).populate("_contract").populate("_user")
        .exec(function(err, rs){
            if(rs)
                res.json(rs);
            else
                res.json(err);
        })

    }

    apiRoutes.get('/clients', clients);
    apiRoutes.get('/clients/credit/:user', credits);
    apiRoutes.get('/clients/credit/:user/finalizado', finalizado);
    apiRoutes.get('/clients/credit/:user/consignado', consignado);
    apiRoutes.get('/clients/:id', client);
    app.post("/api/clients", create);
    apiRoutes.put("/clients/:id", update);
    apiRoutes.delete("/clients/:id", remove);

    return this;
}
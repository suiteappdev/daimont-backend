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

    function create(req, res){
       var data = req.body;
       var password_text = req.body.password;
       var credit = req.body.credit;

        user_manager.create(data, function(err, user){
            if(err){
              return; res.status(409).json({code : 11000});
            }else{
                return res.status(200).json(user);
            }
        });
    }

    function remove(req, res){
        user_manager.remove(req.params.id, function(err, user){
            if(!err){
                user.remove();
                res.status(200).json(user);
                res.end();
            }
        })
    }

    function clients(req, res){
        UserSchema.find().exec(function(err, users){
            if(!err){
                res.send(users);
            }
        });
    }

    function client(req, res){
        UserSchema
        .findOne( mongoose.Types.ObjectId(req.params.id))
        .exec(function(err, rs){
            if(rs)
                res.json(rs);
            else
                res.json(err);
        })

    }

    apiRoutes.get('/clients', clients);
    apiRoutes.get('/clients/:id', client);
    app.post("/api/clients", create);
    apiRoutes.put("/clients/:id", update);
    apiRoutes.delete("/clients/:id", remove);

    return this;
}
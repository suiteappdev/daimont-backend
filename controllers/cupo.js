module.exports = function(app, apiRoutes){
    var async = require('async');
    var mongoose = require('mongoose');
    var user_manager = require('../models/user_manager');
    var path = require("path");
    var Credits = require('../models/credits');
    var Model = require("../models/cupo");
    var config = require(process.env.PWD + '/config.js');
    var moment = require('moment');
    moment.locale('es');
    var formatCurrency = require('format-currency')
    var opts = { format: '%v %c', code: 'COP' }
    var UserSchema = require('../models/user');
    var User = require('../models/user');
    var crypto = require("crypto");
    var _compiler = require(path.join(process.env.PWD , "helpers", "mailer.js"));

    function post(req, res){
       var data = req.body;

       var cupo = new Model(req.body);

        cupo.save(data, function(err, user){
            if(err){
                return; res.status(409).json({code : 11000});
            }else{
                return res.status(200).json(user);
            }
        });
    }


    function update(req, res){
       var data = req.body;

        Model.update({ _id : mongoose.Types.ObjectId(req.params.id)}, req.body, function(err, user){
            if(err){
              return; res.status(409).json({code : 11000});
            }else{
                return res.status(200).json(user);
            }
        });
    }


    function remove(req, res){
        Model.remove({ _id : mongoose.Types.ObjectId(req.params.id)}, function(err){
            if(!err){
                res.status(200).json({ deleted : true });
            }else{
                res.status(500).json({error : err});
            }
        })
    }

    function cupos(req, res){
        Model.find().exec(function(err, users){
            if(!err){
                res.status(200).json(users);
            }
        });
    }


    function cupo(req, res){
        Model
        .findOne({ _id  : mongoose.Types.ObjectId(req.params.id)})
        .exec(function(err, rs){
            if(rs)
                res.json(rs);
            else
                res.json(err);
        })

    }

    apiRoutes.get('/cupo', cupos);
    apiRoutes.get('/cupo/:id', cupo);
    app.post("/api/cupo", post);
    apiRoutes.put("/cupo/:id", update);
    apiRoutes.delete("/cupo/:id", remove);

    return this;
}
var crypto = require('crypto');
var base_path = process.env.PWD;

var config = require(base_path + '/config.js');
var mongoose = require("mongoose");
var Schema = mongoose.Schema;


// Load required packages
var timestamps = require('mongoose-timestamp');
var metadata = require('./plugins/metadata');

var _Schema = new Schema({
	  username : { type : String, trim : true, lowercase : true},
	  password : {type: String, required : false},
	  name : { type : String, trim : true,  lowercase : true},
	  last_name : { type : String, trim : true, lowercase : true},
	  full_name : { type : String, trim : true, lowercase : true},
      email : { type : String, trim : true , lowercase:true},
	  cc : { type : String, trim : true , unique : true, lowercase:true},
      phone : {type: String, required : false},
	  data:{ type : Object},
	  credit:{ type : Object},
      _plan : { type : Schema.Types.ObjectId , ref : 'plans', required: false},
	  active : { type : Boolean, default : false},
	  type : { type : String, trim : true, default : 'CLIENT'},
	  _role : [{ type : Schema.Types.ObjectId , ref : 'Role'}],
	  activation_token : String,
	  resetPasswordToken: String,
  	  resetPasswordExpires: Date
});

_Schema.pre('save', function (next) {
    this.full_name = (this.name || '') + ' ' + (this.last_name  || '');
    this.activation_token = crypto.createHmac('sha256', config.secret).update(this._id.toString()).digest('hex');
    var _self = this;

    if(this.credit){
    	var credit = mongoose.model('credits');

        _self.data = _self.data || {};
        _self.data.updated = false;
        var new_credit = new credit(_self.credit);

        new_credit._user = mongoose.Types.ObjectId(_self._id);
        new_credit._id = mongoose.Types.ObjectId();
        _self.credit.data = _self.credit.data || {};

		if(!new_credit.metadata){
			new_credit.metadata = {};
			new_credit.metadata._author = this.data && this.data.facebook_id ? this.data.facebook_id : this._id
		}

    	new_credit.save(function(err, credit){
    		if(!err){
                _self.credit = credit._id;
				next();    			
    		}
    	});
    }
    next();
});

_Schema.methods.auth = function(password, callback){
    var res = true;
	if(require('../helpers/crypto-util')(password) !== this.password){
	     res = false;
	}
	
    if(callback)
     	callback(res);
    else
        return res;
}

_Schema.statics.exists = function(email, callback){
	this.find({ email : email}, function(err, rs){
        callback(err, rs.length);
	})
}

_Schema.static

//add plugins
_Schema.plugin(metadata);
_Schema.plugin(timestamps);

module.exports = mongoose.model('User', _Schema);



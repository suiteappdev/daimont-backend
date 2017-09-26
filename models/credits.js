var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var base_path = process.env.PWD;

var entity = "credits";

function sq(collection, callback) {
   mongoose.model('counters').findOneAndUpdate({ entity: collection}, { $inc: { seq: 1 } }, callback);
}
// Load required packages
var timestamps = require('mongoose-timestamp');
var metadata = require('./plugins/metadata');

var _Schema = new Schema({
	  data : Object,
	  _user : { type : Schema.Types.ObjectId , ref : 'User'},
	  _payment : { type : Schema.Types.ObjectId , ref : 'payments'},
	  _contract : { type : Schema.Types.ObjectId , ref : 'contracts'},
	  _approvedby :  { type : Schema.Types.ObjectId , ref : 'User', required: false}
});

_Schema.pre('save', function (next) {
	if(this.data){
		this.data = this.data || {};
		this.data.status = 'Pendiente';
		this.data.hidden = false;
	}
	
	sq("_credits", function(err, s){
		if(s){
			this.id = s.seq;
			next();			
		}else{
			next();
		}
	});
});

//add plugins
_Schema.plugin(metadata);
_Schema.plugin(timestamps);

module.exports = mongoose.model(entity, _Schema); 

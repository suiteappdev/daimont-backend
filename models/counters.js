var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// Load required packages
var timestamps = require('mongoose-timestamp');
var metadata = require('./plugins/metadata');

var entity = "counters";

var _Schema = new Schema({
	entity :  { type : String , required : true, dropDups: true },
    seq : { type: Number}
 });

_Schema.pre('save', function (next, done) {
	var self = this;
    
    mongoose.models[entity].findOne({ entity: self.entity}, function(err, counter) {
        if(err) {
            done(err);
        } else if(counter) {
            self.invalidate("duplicate", "counter must be unique");
            done({ code : 11000});
        } else {
			next();
        }
    });
});

//add plugins
_Schema.plugin(metadata);
_Schema.plugin(timestamps);

module.exports = mongoose.model(entity, _Schema); 
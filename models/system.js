var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// Load required packages
var timestamps = require('mongoose-timestamp');
var metadata = require('./plugins/metadata');

var entity = "system";

var _Schema = new Schema({
	status :  { type : Boolean , required : true},
 });

_Schema.pre('save', function (next, done) {
    next();
});

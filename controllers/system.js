module.exports = function(app, apiRoutes, io){
		var _entity ="system";
		var _url_alias = "system";
		var path = require("path");
		var mongoose = require('mongoose');
		var Model = require(path.join("../", "models", _entity + ".js"));

		function get(req, res){
			var REQ = req.params; 
			var where;

			 Model.find({ $sort : { "createdAt" : -1 } }).exec(function(err, rs){
					if(!err){
						res.status(200).json(rs);
					}else{
						res.json(err);
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

			Model.save(data).exec(function(system, err){
				if(!err){
					res.status(200).json(system);
				}
			})
		}

		function update(req, res){
			var data = {};
			var REQ = req.body || req.params;

			Model.update({ _id :  mongoose.Types.ObjectId(req.params.id) }, REQ, { upsert : true }).exec(function(err, n){
				if(!err){
					res.status(200).json(n);
				}
			})
		}

		apiRoutes.get("/" + _url_alias , get);
		apiRoutes.post("/" + _url_alias, post);
		apiRoutes.put("/" + _url_alias + "/:id", update);

		return this;
}
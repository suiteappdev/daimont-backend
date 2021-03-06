module.exports = function(app, apiRoutes, io){
		var _entity ="system";
		var _url_alias = "system";
		var path = require("path");
		var mongoose = require('mongoose');
		var Model = require(path.join("../", "models", _entity + ".js"));

		function get(req, res){
			var REQ = req.params; 
			var where;

			 Model.find({}).sort({"createdAt" : -1}).limit(1).exec(function(err, rs){
					if(!err){
						res.status(200).json(rs[0]);
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

			var system = new Model(data);

			system.save(function(system, err){
				if(!err){
					res.status(200).json(system);
				}
			})
		}

		function update(req, res){
			var data = {};
			var REQ = req.body || req.params;

			var where = req.params.id ? ({ _id :  mongoose.Types.ObjectId(req.params.id) }) : {}

			Model.update(where , REQ, { upsert : true }).exec(function(err, n){
				if(!err){
					res.status(200).json(n);
				}
			})
		}

		app.get("/api/" + _url_alias , get);
		app.post("/api/" + _url_alias, post);
		app.put("/api/" + _url_alias + "/:id?", update);

		return this;
}
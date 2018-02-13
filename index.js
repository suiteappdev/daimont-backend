var express = require("express");
var https = require('https');
var app = express();
var fs = require('fs');
var config = require("./config");
var http = require('http').Server(app);
var mongoose = require("mongoose");
var bodyParser = require('body-parser');
var cors = require('cors');
var jwt = require('jsonwebtoken');
var morgan = require('morgan');
var cluster = require('cluster');
var cores = require('os').cpus().length;  
var passport = require("passport");
var User = require('./models/user');
var FB = require('facebook-node');
var path = require("path");
var helmet = require('helmet');
var _clients = [];
var Session = require("./models/session");

var options = {
  key: fs.readFileSync(path.join(process.env.PWD , "private.key"), "utf8"),
  cert: fs.readFileSync(path.join(process.env.PWD , "certificate.crt"), "utf8"),
  ca: fs.readFileSync(path.join(process.env.PWD , "AddTrustExternalCARoot.crt"), "utf8")
};

FB.setApiVersion("v2.2");
app.use(cors());
app.use(bodyParser.urlencoded({extended : true}));
app.use(bodyParser.json({limit: "50mb"}));
app.use(morgan('dev'));
app.set("secret", config.secret);
process.env.PWD = process.cwd() || process.env.PWD;
apiRoutes = express.Router();
app.use(helmet());
app.disable('x-powered-by');

app.use(function(req, res, next) {
    if (req.secure) {
        next();
    } else {
        res.redirect('https://' + req.headers.host + req.url);
    }
});

apiRoutes.use(function(req, res, next) {
        var token = req.body.token || req.query.token || req.headers['x-daimont-auth'];
        var facebook_token = req.body.access_token  || req.query.access_token  || req.headers['access-token'];
        
        if(facebook_token){
            FB.api('me', { fields: ['id', 'name'], access_token: facebook_token }, function (response) {
                if(response && !response.error){
                    next();
                }else{
                  res.status(401).json(response);
                }
            });

            return;
        }

        if (token) {
              if(req.headers['x-daimont-user']){
                  User.findOne({ _id : mongoose.Types.ObjectId(req.headers['x-daimont-user'])}).exec(function(err, user){
                      if(user.type == "CLIENT"){
                        jwt.verify(token, app.get("secret"), function(token_err, decoded) {
                            if(token_err && token_err.name == 'TokenExpiredError'){
                                return res.status(401).json(err); 
                            }

                            Session.find({token : token}, function(err, rs){
                                    if(!err){ 
                                          if(rs.length > 0){ 
                                              req.decoded = decoded;    
                                              next();
                                           }
                                           else{
                                                res.status(401).json({ success : false, message : 'invalid token'});
                                           }
                                    }
                                })  
                            });
                      }else if(user.type == "ADMINISTRATOR"){
                        jwt.verify(token, app.get("secret"),{ ignoreExpiration : true }, function(token_err, decoded) {
                            if(token_err && token_err.name == 'TokenExpiredError'){
                                return res.status(401).json(err); 
                            }

                            Session.find({token : token}, function(err, rs){
                                if(!err){ 
                                      if(rs.length > 0){ 
                                          req.decoded = decoded;    
                                          next();
                                       }
                                       else{
                                            res.status(401).json({ success : false, message : 'invalid token'});
                                       }
                                }
                            })                           
                        });
                      }
                  });
              }
        }else{
          return res.status(403).send({ 
              success: false, 
              message: 'No token provided.' 
          });
        }
    });

app.use('/static/images', express.static('uploads/images'));
app.use('/static/apps', express.static('uploads/apps'));

app.get('/home', function(req, res){
    res.send("Home");
});

apiRoutes.use(function(req, res, next) {
    next();
});

app.use(function (err, req, res, next) {
    res.status(err.status || 500).json({message:"error"});
    console.log(err);
});

apiRoutes.use(function (err, req, res, next) {
    res.status(err.status || 500).json({message:"error"});
    console.log(err);
});

app.locals._sfind = function(id){
  return _clients.filter(function(client){
      return client.socket.id == id || client.uid == id;
  })[0]; 
}

app.locals._sfindAll = function(id){
  return _clients; 
}


mongoose.connection.on('open', function(ref){
   var server =  https.createServer(options, app).listen(8443);
   server.keepAliveTimeout = 60000 * 2;
   var io = require("socket.io")(server);

  io.on('connection', function(socket){
      socket.on("MAIN", function(data){
        socket.join('all');

// then simply use to or in (they are the same) when broadcasting or emitting (server-side)
        _client = app.locals._sfind(data);

        if(_client){
          _clients[_clients.indexOf(_client)].socket  = socket;
        }else{
          _clients.push({ socket : socket , uid : data});
        }

        console.log("client list", _clients.length);
        console.log("connected to ROOM::", data);
      });
  });

    console.log('Conectado a Mongo');
    require("./controllers/all")(app, apiRoutes, io); 
    app.use("/api", apiRoutes);

    http.listen(config.appPort, function(){
        console.log("app listen on " + config.appPort);
    }); 

});



mongoose.connection.on('error', function(err){
    console.log('no se pudo realizar la conexión con mongo');
    console.log(err);
    return console.log(err.message);
});

try{
  mongoose.connect( config.dburl );
  console.log('Iniciando conexión en: ' + config.dburl + ', esperando...');
}catch(err){
  console.log('Conexión fallida a: ' + config.dburl);
}
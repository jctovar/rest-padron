var restify = require('restify'),
	mysql = require('mysql'),
	fs = require('fs');

connection = mysql.createConnection({
	host : 'localhost',
	user : 'desarrollo',
	password : 'K4t4r1n4',
	database: 'sup'
});

var ip_addr = '132.247.70.41';
var port    =  '3000';

var server = restify.createServer({
    key: fs.readFileSync('/etc/letsencrypt/live/galadriel.ired.unam.mx/privkey.pem'),
    cert: fs.readFileSync('/etc/letsencrypt/live/galadriel.ired.unam.mx/cert.pem'),
    ca: fs.readFileSync('/etc/letsencrypt/live/galadriel.ired.unam.mx/chain.pem'),
    name : "padron"
});

server.use(restify.queryParser());
server.use(restify.authorizationParser());
server.use(restify.bodyParser());
server.use(restify.CORS());
server.use(restify.gzipResponse());

// basic autentificacion
server.use(function (req, res, next) {
    var email = req.username;
    var query = connection.query('SELECT account_password FROM account WHERE account_email=?',[email],function(err, rows,  fields) {
        if (!err) {
                if (req.username == 'anonymous' || rows[0].account_password == null || req.authorization.basic.password !== rows[0].account_password) {
                        next(new restify.NotAuthorizedError('authorized credential is required!'));
                } else {
                        next();
                }
                next();
        } else {
                console.log('Error while performing Query.');
        }
    });
});

server.listen(port ,ip_addr, function(){
    console.log('%s listening at %s ', server.name , server.url);
});
// search students
var PATH = '/padron'
server.get({path : PATH , version : '0.0.1'} , findAllUsers);
server.get({path : PATH +'/:userId' , version : '0.0.1'} , findUser);
server.post({path : PATH , version: '0.0.1'} , postNewUser);
server.del({path : PATH +'/:userId' , version: '0.0.1'} , deleteUser);
// search modules
var PATH = '/modules'
server.get({path : PATH +'/:userId' , version : '0.0.1'} , findModules);
// functions
function findAllUsers(req, res, next){
  connection.query('SELECT username,firstname,lastname,email,password,phone,postal_code,curp,generation,headquarters,career_name,age(curp) as age,DATE_FORMAT((birthday(curp)),"%W %e %M %Y") as birthday FROM padron t1 INNER JOIN careers t2 ON t1.career_id=t2.career_id', function (error, results){
      if(error) throw error;
      //console.log(results);
      res.charSet('utf-8');
      res.send(200, {student: results});
      return next();
  });
}

function findUser(req, res, next){
    connection.query('SELECT username,firstname,lastname,email,password,phone,postal_code,curp,generation,headquarters,career_name,age(curp) as age,DATE_FORMAT((birthday(curp)),"%W %e %M %Y") as birthday FROM padron t1 INNER JOIN careers t2 ON t1.career_id=t2.career_id WHERE username='+req.params.userId, function (error, results){
       if(error) throw error;
       //console.log(results)
       res.charSet('utf-8');
       res.send(200, {student: results});
       return next();
    });
}

function postNewUser(req , res , next){
    var user = {};
    user.Nombre = req.params.Nombre;
    user.Apellido = req.params.Apellido;
    user.Correo = req.params.Correo;

    connection.query('INSERT INTO padron1 (username,firstname,lastname,email) VALUES (\''
        +user.Nombre+'\', \''
        +user.Apellido+'\', \''
        +user.Correo+'\', \')'
        , function (error, success){
            if(error) throw error;
	//console.log(success);
	res.send(200, success.insertId);
        }
    );
}

function deleteUser(req , res , next){
    connection.query('DELETE FROM padron1 WHERE username='+req.params.userId, function (error, success){
        if(error) throw error;
        res.send(200, 'Eliminado con exito');
    }); 
}

function findModules(req, res, next){
    connection.query('SELECT * FROM enrolment WHERE username='+req.params.userId, function (error, results){
       if(error) throw error;
       res.charSet('utf-8');
       res.send(200, {modules: results});
       return next();
    });
}


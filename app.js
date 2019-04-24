var express = require('express')
, path = require('path')
, favicon = require('serve-favicon')
, logger = require('morgan')
, cookieParser = require('cookie-parser')
, bodyParser = require('body-parser')
,config = require('./config/config')
, mongoose = require('mongoose')
//, sessions = require('client-sessions')
, helmet = require('helmet')
, bcrypt = require('bcryptjs')
, csrf = require('csurf')
, cors = require('cors')
,sanitizer = require('express-sanitizer')
, fileUpload = require('express-fileupload')
, app = express()
 ,   server = require('http').createServer(app)
,upload = require('express-fileupload')
,io = require('socket.io')(server).sockets;

server.listen(config.port, function(err){
  if(err) throw err;
    console.log("server runing on port "+config.port);
});


// view engine setup
//app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.engine('html',require('ejs').renderFile);
app.use(fileUpload());
app.use(upload());
//set static folder
 app.use(express.static(path.join(__dirname,'views')));

app.use(cors());
// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'))

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(sanitizer())
app.use(cookieParser())
app.use(express.static(path.join(__dirname, 'public')))

/* app.use(sessions({
    cookieName:'session',
    secret:'13eh@-fjj5yyi-mgcl&^$-G/<3#$gjfj-rooadj-129684-##',
    cookie:{httpOnly:true // ,secure:true  to be use if using ssl
           }
})) */

app.disable('x-powered-by');
// app.use(csrf())
 app.use(helmet.hidePoweredBy({ setTo: 'PHP 7.0.0' }))
app.use(helmet.csp())
app .use(helmet.xframe('sameorigin'))
 // app.use(helmet.hsts()); //apply if use ssl
app.use(helmet.noCache())
app.use(helmet.frameguard())
app.use(function(req,res,next){
    res.setHeader('Pragma','no-cache');
    res.setHeader('Expires','0');
 // res.locals.csrftoken = req.csrfToken();
    next();
})
//connecting to database
mongoose.connect(config.database);

mongoose.connection.on('connected',()=>{
        console.log("successfully connected to the database");
});

mongoose.connection.on('error',(err)=>{
       throw err;
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views/index.html'));
});

 api = require('./config/api')(app,express,sanitizer,io);
app.use('/api', api);


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});

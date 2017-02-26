/**
 * Module dependencies.
 */
var express = require('express');
var compression = require('compression');
var session = require('express-session');
var bodyParser = require('body-parser');
var logger = require('morgan');
var chalk = require('chalk');
var errorHandler = require('errorhandler');
var dotenv = require('dotenv');
var path = require('path');
const mongoose = require('mongoose');
const MongoStore = require('connect-mongo')(session);
var passport = require('passport');
var expressValidator = require('express-validator');
var expressStatusMonitor = require('express-status-monitor');
var sass = require('node-sass-middleware');
var multer = require('multer');
var cfenv = require("cfenv");
var LinearRegression = require('shaman').LinearRegression;
var upload = multer({ dest: path.join(__dirname, 'uploads') });

/**
 * Load environment variables from .env file, where API keys and passwords are configured.
 */
dotenv.load({ path: '.env.example' });

/**
 * Controllers (route handlers).
 */
var homeController = require('./controllers/home');
var userController = require('./controllers/user');
var apiController = require('./controllers/api');
var contactController = require('./controllers/contact');

/**
 * API keys and Passport configuration.
 */
var passportConfig = require('./config/passport');

/**
 * Create Express server.
 */
var app = express();

/**
 * Connect to MongoDB.
 */
var db;

// load local VCAP configuration  and service credentials
var vcapLocal;
try {
  vcapLocal = require('./vcap-local.json');
  console.log("Loaded local VCAP", vcapLocal);
} catch (e) {}

var appEnvOpts = vcapLocal ? { vcap: vcapLocal } : {}

var appEnv = cfenv.getAppEnv(appEnvOpts);

if (appEnv.services['cloudantNoSQLDB']) {
  // Load the Cloudant library.
  var Cloudant = require('cloudant');

  // Initialize database with credentials
  var cloudant = Cloudant(appEnv.services['cloudantNoSQLDB'][0].credentials);

  // Create a new "techsummit-2017" database.
  cloudant.db.create('techsummit-2017', function(err, data) {
    if (err) {
      console.log("Error while creating DB. It might already exist.");
    } else {
      console.log("Created database.");
    }
  });

  db = cloudant.db.use('techsummit-2017');
}

/**
 * Express configuration.
 */
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');
app.use(expressStatusMonitor());
app.use(compression());
app.use(sass({
  src: path.join(__dirname, 'public'),
  dest: path.join(__dirname, 'public')
}));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(expressValidator());
app.use(session({
  resave: true,
  saveUninitialized: true,
  secret: process.env.SESSION_SECRET,
  store: new MongoStore({
    url: "mongodb://admin:EBQZLTPDSXGOBXOT@sl-eu-lon-2-portal.3.dblayer.com:16689,sl-eu-lon-2-portal.2.dblayer.com:16689/admin?ssl=true",
    autoReconnect: true
  })
}));
app.use(passport.initialize());
app.use(passport.session());
app.use((req, res, next) => {
  next();
});
app.use((req, res, next) => {
  res.locals.user = req.user;
  next();
});
app.use((req, res, next) => {
  next();
});
app.use(express.static(path.join(__dirname, 'public'), { maxAge: 31557600000 }));

/**
 * Primary app routes.
 */
app.get('/', homeController.index);
app.get('/login', userController.getLogin);
app.post('/login', userController.postLogin);
app.get('/logout', userController.logout);
app.get('/forgot', userController.getForgot);
app.post('/forgot', userController.postForgot);
app.get('/reset/:token', userController.getReset);
app.post('/reset/:token', userController.postReset);
app.get('/signup', userController.getSignup);
app.post('/signup', userController.postSignup);
app.get('/contact', contactController.getContact);
app.post('/contact', contactController.postContact);
app.get('/account', passportConfig.isAuthenticated, userController.getAccount);
app.post('/account/profile', passportConfig.isAuthenticated, userController.postUpdateProfile);
app.post('/account/password', passportConfig.isAuthenticated, userController.postUpdatePassword);
// app.post('/account/devare', passportConfig.isAuthenticated, userController.postDevareAccount);
app.get('/account/unlink/:provider', passportConfig.isAuthenticated, userController.getOauthUnlink);

/**
 * API examples routes.
 */
app.get('/api', apiController.getApi);
app.get('/api/lastfm', apiController.getLastfm);
app.get('/api/nyt', apiController.getNewYorkTimes);
app.get('/api/aviary', apiController.getAviary);
app.get('/api/steam', passportConfig.isAuthenticated, passportConfig.isAuthorized, apiController.getSteam);
app.get('/api/stripe', apiController.getStripe);
app.post('/api/stripe', apiController.postStripe);
app.get('/api/scraping', apiController.getScraping);
app.get('/api/twilio', apiController.getTwilio);
app.post('/api/twilio', apiController.postTwilio);
app.get('/api/clockwork', apiController.getClockwork);
app.post('/api/clockwork', apiController.postClockwork);
app.get('/api/foursquare', passportConfig.isAuthenticated, passportConfig.isAuthorized, apiController.getFoursquare);
app.get('/api/tumblr', passportConfig.isAuthenticated, passportConfig.isAuthorized, apiController.getTumblr);
app.get('/api/facebook', passportConfig.isAuthenticated, passportConfig.isAuthorized, apiController.getFacebook);
app.get('/api/github', passportConfig.isAuthenticated, passportConfig.isAuthorized, apiController.getGithub);
app.get('/api/twitter', passportConfig.isAuthenticated, passportConfig.isAuthorized, apiController.getTwitter);
app.post('/api/twitter', passportConfig.isAuthenticated, passportConfig.isAuthorized, apiController.postTwitter);
app.get('/api/linkedin', passportConfig.isAuthenticated, passportConfig.isAuthorized, apiController.getLinkedin);
app.get('/api/instagram', passportConfig.isAuthenticated, passportConfig.isAuthorized, apiController.getInstagram);
app.get('/api/paypal', apiController.getPayPal);
app.get('/api/paypal/success', apiController.getPayPalSuccess);
app.get('/api/paypal/cancel', apiController.getPayPalCancel);
app.get('/api/lob', apiController.getLob);
app.get('/api/upload', apiController.getFileUpload);
app.post('/api/upload', upload.single('myFile'), apiController.postFileUpload);
app.get('/api/pinterest', passportConfig.isAuthenticated, passportConfig.isAuthorized, apiController.getPinterest);
app.post('/api/pinterest', passportConfig.isAuthenticated, passportConfig.isAuthorized, apiController.postPinterest);
app.get('/api/google-maps', apiController.getGoogleMaps);

/**
 * OAuth authentication routes. (Sign in)
 */
app.get('/auth/instagram', passport.authenticate('instagram'));
app.get('/auth/instagram/callback', passport.authenticate('instagram', { failureRedirect: '/login' }), (req, res) => {
  res.redirect(req.session.returnTo || '/');
});
app.get('/auth/facebook', passport.authenticate('facebook', { scope: ['email', 'public_profile'] }));
app.get('/auth/facebook/callback', passport.authenticate('facebook', { failureRedirect: '/login' }), (req, res) => {
  res.redirect(req.session.returnTo || '/');
});
app.get('/auth/github', passport.authenticate('github'));
app.get('/auth/github/callback', passport.authenticate('github', { failureRedirect: '/login' }), (req, res) => {
  res.redirect(req.session.returnTo || '/');
});
app.get('/auth/google', passport.authenticate('google', { scope: 'profile email' }));
app.get('/auth/google/callback', passport.authenticate('google', { failureRedirect: '/login' }), (req, res) => {
  res.redirect(req.session.returnTo || '/');
});
app.get('/auth/twitter', passport.authenticate('twitter'));
app.get('/auth/twitter/callback', passport.authenticate('twitter', { failureRedirect: '/login' }), (req, res) => {
  res.redirect(req.session.returnTo || '/');
});
app.get('/auth/linkedin', passport.authenticate('linkedin', { state: 'SOME STATE' }));
app.get('/auth/linkedin/callback', passport.authenticate('linkedin', { failureRedirect: '/login' }), (req, res) => {
  res.redirect(req.session.returnTo || '/');
});

/**
 * OAuth authorization routes. (API examples)
 */
app.get('/auth/foursquare', passport.authorize('foursquare'));
app.get('/auth/foursquare/callback', passport.authorize('foursquare', { failureRedirect: '/api' }), (req, res) => {
  res.redirect('/api/foursquare');
});
app.get('/auth/tumblr', passport.authorize('tumblr'));
app.get('/auth/tumblr/callback', passport.authorize('tumblr', { failureRedirect: '/api' }), (req, res) => {
  res.redirect('/api/tumblr');
});
app.get('/auth/steam', passport.authorize('openid', { state: 'SOME STATE' }));
app.get('/auth/steam/callback', passport.authorize('openid', { failureRedirect: '/login' }), (req, res) => {
  res.redirect(req.session.returnTo || '/');
});
app.get('/auth/pinterest', passport.authorize('pinterest', { scope: 'read_public write_public' }));
app.get('/auth/pinterest/callback', passport.authorize('pinterest', { failureRedirect: '/login' }), (req, res) => {
  res.redirect('/api/pinterest');
});

/**
 * Custom Routes
 */
 app.post("/logs", function(request, response) {
   if (!db) {
     console.log("No database.");
     response.send("DB is not configured.");
     return;
   }

   if (request.body.latitude == null || request.body.longitude == null) {
     response.send("Latitude or longitude is not present in the request body.");
     return;
   }

   var log = {
     time: new Date().getTime(),
     location: {
       latitude: request.body.latitude,
       longitude: request.body.longitude
     }
   };

   db.insert(log, function(err, body, header) {
     if (err) {
       return console.log('[db.insert] ', err.message);
     }
     response.send("Log added to DB successfully.");
   });
 });

 app.get("/logs/:latitude/:longitude", function(request, response) {
   if (!db) {
     console.log("No database.");
     response.send("DB is not configured.");
     return;
   }

   if (request.params.latitude == null || request.params.longitude == null) {
     response.send("Latitude or longitude is not present in the request params.");
     return;
   }

   var log = {
     time: new Date().getTime(),
     location: {
       latitude: request.params.latitude,
       longitude: request.params.longitude
     }
   };

   db.insert(log, function(err, body, header) {
     if (err) {
       return console.log('[db.insert] ', err.message);
     }
     response.send("Log added to DB successfully.");
   });
 });

 app.get("/logs", function(request, response) {
   var logs = [];

   if (!db) {
     response.json(logs);
     return;
   }

   db.list({
     include_docs: true
   }, function(err, body) {
     if (!err) {
       body.rows.forEach(function(row) {
         logs.push(row.doc);
       });
       response.json(logs);
     }
   });
 });

 var X = [[40.009292213036254,30.41492897802298,92],[40.04905126570668,30.506153516560275,157],[40.12935049899984,30.343087828514946,52],[40.457886034932066,30.19887966329546,19],[40.65275172229624,30.640402121435486,41]];
 var y = [0.8214333335968349,0.3497303463087935,0.5944308115889594,0.90326051637511,0.25227377574412047];

 // Initialize and train the linear regression
 var predictFn = null;
 var lr = new LinearRegression(X, y, {algorithm: 'GradientDescent'});
 lr.train(function(err) {
   if (err) {
     console.log("error", err);
   }

   app.get("/get_safety/:latitude/:longitude", function(request, response) {
     var lat = parseFloat(request.params.latitude);
     var lng = parseFloat(request.params.longitude);
     var d = new Date();
     response.send(String(lr.predict([lat, lng, d.getDay() * 24 + d.getHours()])));
   });
 });
/**
 * Error Handler.
 */
app.use(errorHandler());

/**
 * Start Express server.
 */
app.listen(app.get('port'), () => {
  console.log('%s App is running at http://localhost:%d in %s mode', chalk.green('✓'), app.get('port'), app.get('env')); 
  console.log('  Press CTRL-C to stop\n');
});

module.exports = app;

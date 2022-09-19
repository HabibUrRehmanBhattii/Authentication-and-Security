require("dotenv").config(); // Load environment variables from .env file
const express = require("express"); // Load express
const bodyParser = require("body-parser"); // Load body-parser
const ejs = require("ejs"); // Load ejs
const mongoose = require("mongoose"); // Load mongoose
const session = require("express-session"); // Load express-session
const passport = require("passport"); // Load passport
const passportLocalMongoose = require("passport-local-mongoose"); // Load passport-local-mongoose
const GoogleStrategy = require("passport-google-oauth20").Strategy; // Load passport-google-oauth20
const findOrCreate = require("mongoose-findorcreate") // Load mongoose-findorcreate
const dotenv = require("dotenv"); // Load dotenv

// Create app
const app = express();
// Set express to public folder
app.use(express.static("public"));
// Set view engine
app.set("view engine", "ejs");
// Use body parser
app.use(bodyParser.urlencoded({ extended: true }));

// Session setup
app.use(
  session({
    secret: "Our little secret.",
    resave: false,
    saveUninitialized: false,
  })
);
// Initialize passport
app.use(passport.initialize());

// Use passport session
app.use(passport.session());

// Connect to MongoDB database
mongoose.connect("mongodb://localhost:27017/userDB");

// Create user schema
const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  googleId: String,
  secret: String
});

// Use passport local mongoose to hash and salt passwords 
userSchema.plugin(passportLocalMongoose);
// Use find or create plugin 
userSchema.plugin(findOrCreate);

// Create user model
const User = new mongoose.model("User", userSchema);

// Create local strategy
passport.use(User.createStrategy());

// alernative to down
// // Serialize user
// passport.serializeUser(User.serializeUser());

// // Deserialize user
// passport.deserializeUser(User.deserializeUser());

// Serialize user
passport.serializeUser(function (user, done) {
    done(null, user.id);
});
// Deserialize user
passport.deserializeUser(function (id, done) {
    User.findById(id, function (err, user) {
        done(err, user);
    });
});


///////////////////////////////////////////// Create google strategy//////////////////////////////////////////////////
passport.use(
    new GoogleStrategy({
    clientID: process.env.CLIENT_ID,// Load client id from .env file
    clientSecret: process.env.CLIENT_SECRET,// Load environment variables from .env file
    callbackURL: "http://localhost:3000/auth/google/secrets",// Redirect to secrets page
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo",// This is the default
  },
  // Callback function to get user data from google and save it to database.
  function(accessToken, refreshToken, profile, cb) {// Get access token, refresh token and profile
    console.log(profile);// Log profile
    User.findOrCreate({ googleId: profile.id }, function (err, user) {// Find or create user
      return cb(err, user);// Return error or user
    });
  }
));

// Render home page
app.get("/", function (req, res) {
  res.render("home");
});

// Authenticate with google
app.get("/auth/google",
    passport.authenticate("google", {scope: ["profile"]})
);

// authenticate with google and redirect to secrets page
app.get("/auth/google/secrets", 
  passport.authenticate("google", { failureRedirect: "/login "}),
  function(req, res) {
    // Successful authentication, redirect to secrets page.
    res.redirect("/secrets");
  });

// Render login page
app.get("/login", function (req, res) {
  res.render("login");
});
// Render register page
app.get("/register", function (req, res) {
  res.render("register");
});

// render secrets page if user is authenticated
app.get("/secrets", function(req, res){
  User.find({"secret": {$ne: null}}, function(err, foundUsers){
    if (err){
      console.log(err);
    } else {
      if (foundUsers) {
        res.render("secrets", {usersWithSecrets: foundUsers});
      }
    }
  });
});



// Render submit page if user is authenticated
app.get("/submit", function(req, res){
    if (req.isAuthenticated()) {
        res.render("submit");
      } else {
        res.redirect("/login");
      }
});

// Post submit page if user is authenticated and redirect to secrets page.
app.post("/submit", function(req, res){
    const submittedSecret = req.body.secret;
    User.findById(req.user.id, function(err, foundUser){
      if (err) {
        console.log(err);
      } else {
        if (foundUser) {
          foundUser.secret = submittedSecret;
          foundUser.save(function(){
            res.redirect("/secrets");
          });
        }
      }
    });
  });



//logout user
app.get("/logout", function(req, res){
    req.logout(function(){
        res.redirect("/");
    });

});


app.post("/register", function (req, res) {
  // Create new user with email and password
  User.register(
    { username: req.body.username },
    req.body.password,
    function (err, user) {
      // Register user
      if (err) {
        // If error
        console - log(err); // Log error
        res.redirect("/register"); // Redirect to register page if error
      } else {
        // If no error
        passport.authenticate("local")(req, res, function () {
          // Authenticate user with local strategy
          res.redirect("/secrets"); // Redirect to secrets page
        });
      }
    }
  );
});


// Login user
app.post("/login", function (req, res) {// Create new user with email and password
    const user = new User({
        username: req.body.username,
        password: req.body.password,
    });
    
    req.login(user, function (err) {// Login user
        if (err) {
        console.log(err);
        } else {// If no error
        passport.authenticate("local")(req, res, function () {// Authenticate user with local strategy
            res.redirect("/secrets");
        });
        }
    });
});




// Listen on port 3000
app.listen(3000, function () {
  console.log("Express server listening on http://localhost:3000");
});

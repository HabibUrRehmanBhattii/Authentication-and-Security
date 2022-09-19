require("dotenv").config(); // Load environment variables from .env file
const express = require("express"); // Load express
const bodyParser = require("body-parser"); // Load body-parser
const ejs = require("ejs"); // Load ejs
const mongoose = require("mongoose"); // Load mongoose
const session = require("express-session"); // Load express-session
const passport = require("passport"); // Load passport
const passportLocalMongoose = require("passport-local-mongoose"); // Load passport-local-mongoose

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
});

// Use passport local mongoose
userSchema.plugin(passportLocalMongoose);

// Create user model
const User = new mongoose.model("User", userSchema);

// Create local strategy
passport.use(User.createStrategy());

// Serialize user
passport.serializeUser(User.serializeUser());

// Deserialize user
passport.deserializeUser(User.deserializeUser());

// Render home page
app.get("/", function (req, res) {
  res.render("home");
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
app.get("/secrets", function (req, res) {
  if (req.isAuthenticated()) {
    // Check if user is authenticated
    res.render("secrets");
  } else {
    // If not authenticated, redirect to login page
    res.redirect("/login");
  }
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

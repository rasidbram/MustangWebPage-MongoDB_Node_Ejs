require("dotenv").config();

const express = require("express");
const bodyParser = require("body-parser");
// const ejs = require("ejs");
const mongoose = require("mongoose");
// const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const findOrCreate = require("mongoose-findorcreate");

const app = express();
app.set("view engine", "ejs");

app.use(
  bodyParser.urlencoded({
    extended: true
  })
);
app.use(express.static("public"));
// ***********************************************************
app.use(passport.initialize());
app.use(passport.session());

// set up mongodb*********************************************
mongoose.connect("mongodb://localhost:27017/mustangDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true
});
mongoose.set("useCreateIndex", true);
// to define for register page

const userSchema = new mongoose.Schema({
  username: String,
  email: String,
  fullname: String,
  password: String,
  passwordConfirm: String,
  googleId:String,
  googleName:String,
  secret:String
});
userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());
 
passport.serializeUser(function(user, done) {
    done(null, user.id);
  });
  
  passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
      done(err, user);
    });
  });
  // ------------------------------------------------
  passport.use(new GoogleStrategy({
    clientID:process.env.CLIENT_ID,
    clientSecret:process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3030/auth/google/mustang",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
      console.log(profile);
      // googleName:profile.displayName added
    User.findOrCreate({ googleId: profile.id ,googleName:profile.displayName }, function (err, user) {
      return cb(err, user);
    });
  }
));
// ***********************************************************
// const rateSchema = new mongoose.Schema({
//   rate: Number,
//   carId: String,
// });
// const Rate = new mongoose.model("Rate", rateSchema);
// to define schema what you have for comments****************
const commentSchema = new mongoose.Schema({
  name: String,
  surname: String,
  comment: String,
  carId: String,
});
const Comment = new mongoose.model("Comment", commentSchema);
// to get Compose databese************************************
const composeSchema=new mongoose.Schema({
  name:String,
  surname:String,
  email:String,
  content:String,
})
 const Compose=new mongoose.model('Compose',composeSchema)

//to get drive Request database ******************************
const driveRequestSchema=new mongoose.Schema({
  name:String,
  surname:String,
  email:String
})

const DriveRequest=new mongoose.model('drive request',driveRequestSchema)

// ***********************************************************
app.get("/", (req, res) => {
  res.render("entry");
});
app.get('/register',(req,res)=>{
  res.render('register')
});
// // for rating system*******************************************
// app.get("/testdrive", (req, res) => {
//   Rate.find({}, (err, rates) => {
//     res.render("testdrive", {
//       rates:rates
//     });
//   });
// }); 

// app.post('/classic',(req,res)=>{
//   const rate=new Rate({
//     rate:req.body.stars,
//     carId: req.body.ratecarId,
//   });
//  rate.save((err)=>{
//   if(err){
//     console.log(err);
//   }else{
//     res.redirect('/classic')
//   }
//  });
// });

// app.post('/sport',(req,res)=>{
//   // second Compose which is below the line comes from at 92.line which is first Compose
//   const rate=new Rate({
//     rate:req.body.stars,
//     carId: req.body.carId,
//   });
//  rate.save((err)=>{
//   if(err){
//     console.log(err);
//   }else{
//     res.redirect('/sport')
//   }
//  });
// });

// app.post('/modified',(req,res)=>{
//   // second Compose which is below the line comes from at 92.line which is first Compose
//   const rate=new Rate({
//     rate:req.body.stars,
//     carId: req.body.carId,
//   });
//  rate.save((err)=>{
//   if(err){
//     console.log(err);
//   }else{
//     res.redirect('/modified')
//   }
//  });
// });

// for testdrive request form**********************************
app.get('/request',(req,res)=>{
  res.render('requestform')
});
app.post('/request',(req,res)=>{
  const driveform=new DriveRequest({
    name:req.body.requestName,
    surname:req.body.requestSurname,
    email:req.body.requestEmail
  });
  driveform.save((err)=>{
    if(err){
      console.log(err);
    }else{
      res.redirect('/testdrive')
    }
  })
})
//************************************************************
app.get("/compose", (req, res) => {
  res.render("compose");
});
app.post('/compose',(req,res)=>{
  // second Compose which is below the line comes from at 92.line which is first Compose
  const compose=new Compose({
    name:req.body.composeName,
    surname:req.body.composeSurname,
    email:req.body.composeEmail,
    content:req.body.composeContent
  });
 compose.save((err)=>{
  if(err){
    console.log(err);
  }else{
    res.redirect('/home')
  }
 });
});

// ***********************************************************
app.get("/home", (req, res) => {
  res.render("home");
});
app.get('/auth/google',
  passport.authenticate('google', { scope: ["profile"] }
));

app.get('/auth/google/mustang', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/payment');
  });
  // **************************************************

app.get("/payment", (req, res) => {
  User.find({}, (err, users) => {
    res.render("payment", {
      users:users
    });
  });
});
// -----------------------------------------------------
app.get("/testdrive", (req, res) => {
  Comment.find({}, (err, comments) => {
    res.render("testdrive", {
      comments: comments
    });
  });
});
app.post("/classic", (req, res) => {
  const comment = new Comment({
    name: req.body.postTitleName,
    surname: req.body.postTitleSurname,
    comment: req.body.postBody,
    carId: req.body.carId,
    
  });
  // to see in database what we sent
  comment.save(err => {
    if (err) {
      console.log(err);
    } else {
      res.redirect("/classic");
    }
  });
});

app.post("/sport", (req, res) => {
  const comment = new Comment({
    name: req.body.postTitleName,
    surname: req.body.postTitleSurname,
    comment: req.body.postBody,
    carId: req.body.carId
  });
  // to see in database what we sent
  comment.save(err => {
    if (err) {
      console.log(err);
    } else {
      res.redirect("/sport");
    }
  });
});

app.post("/modified", (req, res) => {
  const comment = new Comment({
    name: req.body.postTitleName,
    surname: req.body.postTitleSurname,
    comment: req.body.postBody,
    carId: req.body.carId
  });
  // to see in database what we sent
  comment.save(err => {
    if (err) {
      console.log(err);
    } else {
      res.redirect("/modified");
    }
  });
});
// -----------------------------------------------------
app.get("/sport", (req, res) => {
  res.render("sportinfo");
});
app.get("/modified", (req, res) => {
  res.render("modifiedinfo");
});
app.get("/classic", (req, res) => {
  res.render("classicinfo");
});
// ******************************************************
app.get("/login", (req, res) => {
  res.render("login");
});
app.get("/payment", (req, res) => {
  if (req.isAuthenticated()) {
    res.render("payment");
  } else {
    res.redirect("/login");
  }
});

// *******************************************************
app.get("/logout", (req, res) => {
  //  this method comes from passportjs
  req.logout();
  res.redirect("/home");
});
// ----------------------------------------
// to register
app.post("/register", (req, res) => {
  if (req.body.password === req.body.confirmationPassword) {
    User.register(
      {
        username: req.body.username,
        email: req.body.email,
        fullname: req.body.fullname,
        // passwordConfirm:req.body.confirmationPassword

      }, req.body.password,
      (err, user) => {
        if (err) {
          console.log(err);
          res.redirect("/register");
        } else {
          passport.authenticate("local")(req, res, () => {
            res.redirect("/payment");
          });
        }
      }
    );
  } else {
    res.send("Please check to your information!");
  }
});
app.post("/login", (req, res) => {
  const user = new User({
    username: req.body.username,
    password: req.body.password
  });
  //  this method comes from passportjs
  req.login(user, err => {
    if (err) {
      console.log(err);
    } else {
      passport.authenticate("local", { failureRedirect: "/login" })(req, res, () => {
        res.redirect("/payment");
      });
    }

  });
});
// *************************************

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3030;
}


app.listen(port, function() {
  console.log("Server started on port 3030");
});
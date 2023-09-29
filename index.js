const express = require('express');
const jwt = require('jsonwebtoken');
const session = require('express-session')
const routes = require('./router/friends.js')

let users = []

const exist = (username) => {
  return users.map(
    (user) => user.username
  ).includes(username);
}

const authenticate = (username,password) => {
  return users.filter(
    (user) => user.username === username && user.password === password
  ).length > 0;
}

const app = express();

app.use(session(
  {secret:"fingerpint"},
  resave=true,
  saveUninitialized=true
));

app.use(express.json());

app.use("/friends", (req,res,next) => {
  //Check if logged in
  if(req.session.authorization) {
    const token = req.session.authorization['accessToken'];
    //Verify if authenticated in
    jwt.verify(token, "access", (err,user) => {
      if(!err){
        req.user = user;

        next();
      } else {
        return res.status(403).json({message: "User not authenticated"})
      }
    });
  } else {
    return res.status(403).json({message: "User not logged in"})
  }
});

app.post("/login", (req,res) => {
  const username = req.body.username;
  const password = req.body.password;

  if (!username || !password) {
      return res.status(404).json({message: "Error logging in"});
  }

  if (authenticate(username,password)) {
    const accessToken = jwt.sign({
      data: password
    }, 'access', { expiresIn: 60 * 60 });

    req.session.authorization = {accessToken, username};
  return res.status(200).send("User successfully logged in");
  } else {
    return res.status(208).json({message: "Invalid Login. Check username and password"});
  }
});

app.post("/register", (req,res) => {
  const username = req.body.username;
  const password = req.body.password;

  if (username && password) {
    if (!exist(username)) { 
      users.push({"username": username, "password": password});
      return res.status(200).json({message: "User successfully registred. Now you can login"});
    } else {
      return res.status(404).json({message: "User already exists!"});    
    }
  } 
  return res.status(404).json({message: "Unable to register user."});
});


const PORT = 5000;

app.use("/friends", routes);

app.listen(PORT,()=>console.log("Server is running"));

const express = require("express");
const { getUserWithEmail } = require("./helpers");
const cookieSession = require("cookie-session");
var methodOverride = require('method-override');
const bcrypt = require("bcryptjs");
const app = express();
const PORT = 8080; // default port 8080

app.set("view engine", "ejs");//tells the Express app to use EJS as its templating engine

const urlDatabase = {
  // "b2xVn2": "http://www.lighthouselabs.ca",
  // "9sm5xK": "http://www.google.com"
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "aJ48lW",
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "aJ48lW",
  },
};

let users = {};

app.use(express.urlencoded({ extended: true })); //When our browser submits a POST request(form) where POST request
// has a body, the data in the request body is sent as a Buffer(non - readable).To make it readable, we need
//middleware(this line, express library gives this method) which will translate
//app.use(cookieParser());//middleware
app.use(cookieSession({//middleware
  name: 'session',
  keys: ['key1', 'key2']
}));
app.use(methodOverride('_method'));

function generateRandomString() {
  const randomId = Math.random().toString(36).substring(2, 8);
  console.log("RandomId::", randomId);
  return randomId;
};


function urlsForUser(cookieId) {
  let urls = {};
  console.log("user in urlsForUser ::");
  for (let shortURLId in urlDatabase) {
    if (urlDatabase[shortURLId].userID === cookieId) {
      console.log("user in urlsForUser ::cookie id nd usermatches");
      urls[shortURLId] = urlDatabase[shortURLId];
    }
  }
  return urls;
};
// app.get("/", (req, res) => { //routing middleware
//   res.send("Hello!");
// });

// app.get("/urls.json", (req, res) => {  //routing middleware
//   res.json(urlDatabase);
// });

// app.get("/hello", (req, res) => {
//   res.send("<html><body>Hello <b>World</b></body></html>\n");
// });

app.get("/urls", (req, res) => {  // "/urls" is a endpoint
  if (!req.session.userIdCookie) {//If the user is not logged in, respond with msg
    console.log("user is not logged in so respond with msg:: in if get /urls");
    return res.send("<html><body>You are not logged in so Log in or Register</body></html>\n");
  }
  const userUrl = urlsForUser(req.session.userIdCookie); //returns longUrl of that logged in user
  console.log("user is logged in so loading users id and longurl:: in if get /urls", userUrl);
  const templateVars = {
    user: users[req.session.userIdCookie],//based on userId,we will gwt emailId of user which is to be displayed on every page once logined in
    urls: userUrl
  }; //always pass templateVars as an object in render()

  res.render("urls_index", templateVars); // res.render is used to load up an ejs view file
});

app.get("/urls/new", (req, res) => {
  if (!req.session.userIdCookie) {//If the user is not logged in, redirect to  get /login
    console.log("user is not logged in so redirect to /login:: in if get /urls/new");
    res.redirect("/login");
  }
  const templateVars = {
    user: users[req.session.userIdCookie]
  };
  res.render("urls_new", templateVars);
});

//*******review*****
app.post("/urls", (req, res) => { //using it for form used in urls_new Submit button
  if (!req.session.userIdCookie) {//If the user is not logged in, respond with msg
    console.log("user is not logged in so respond with msg:: in if post /urls");
    return res.send("<html><body>You are not logged in so you cannot shorten URL</body></html>\n");
  }
  console.log("input field::", req.body.longURLField); // Log the POST request body to the console
  const shortURLId = generateRandomString();
  urlDatabase[shortURLId] = {
    longURL: req.body.longURLField,
    userID: req.session.userIdCookie
  };
  console.log("urlDatabase::", urlDatabase);
  res.redirect("/urls/" + shortURLId); // res.redirect is redirected to app.get method of given endpoint
});//redirected to urls alone have to confirm

app.get("/urls/:id", (req, res) => { //using it for form used in urls_index Edit button , this btn uses get verb in
  //form method bz it just wants to render to urls_show
  if (!req.session.userIdCookie) {//If the user is not logged in, respond with msg
    console.log("user is not logged in so respond with msg:: in if get /urls/id");
    return res.send("<html><body>You are not allowed to access URL</body></html>\n");
  }
  //extra added by me
  if (!urlDatabase[req.params.id]) {// if id is not in db
    console.log("the requested tinyURL is not available in db:: in if u/id::");
    return res.send("<p>The requested TinyURL doesn't exist!</p>");
  }
  //The individual URL pages should not be accesible if the URL does not belong to them.
  if (urlDatabase[req.params.id].userID !== req.session.userIdCookie) {
    console.log("URL is not belonged to you so respond with msg:: in if get /urls/id");
    return res.send("<html><body>You are not allowed to access others URL</body></html>\n");
  }
  console.log("req.cookies[userIdCookie] in urls/id---> urls_show::", req.session.userIdCookie);
  console.log("urlDatabase in urls/id---> urls_show::", urlDatabase);
  const templateVars = {
    user: users[req.session.userIdCookie],
    shortURLId: req.params.id,
    longURL: urlDatabase[req.params.id].longURL
  };
  console.log("templateVars in urls/id---> urls_show::", templateVars);
  res.render("urls_show", templateVars);
});

app.get("/u/:id", (req, res) => { //using it for urls_show shortURL link
  if (!urlDatabase[req.params.id]) {// if id is not in db
    console.log("the requested tinyURL is not available in db:: in if u/id::");
    return res.send("<p>The requested TinyURL doesn't exist!</p>");
  }
  const longURL = urlDatabase[req.params.id].longURL;
  console.log("the requested tinyURL is available in db:: in u/id::");
  res.redirect(longURL); //redirects to actual website eg:www.google.com by using shortURL
});

//in form POST method is used, by using method override added ?_method=PUT/DELETE(query parameter) to work app.delete
app.delete("/urls/:id", (req, res) => { //using it for form used in urls_index delete button //chnged
  const shortURLId = req.params.id;
  console.log("shortURLId in delete route::", shortURLId);
  if (!urlDatabase[shortURLId]) {
    console.log("the requested tinyURL is not available in db:: in if post urls/id/delete::");
    return res.send("<p>The requested TinyURL doesn't exist!</p>");
  }
  if (!req.session.userIdCookie) {//If the user is not logged in, respond with msg
    console.log("user is not logged in so respond with msg:: in if post /urls/id/delete");
    return res.send("<html><body>You are not allowed to access URL</body></html>\n");
  }
  if (urlDatabase[shortURLId].userID !== req.session.userIdCookie) {
    console.log("URL is not belonged to you so respond with msg:: in if post /urls/id/delete");
    return res.send("<html><body>You are not allowed to access others URL</body></html>\n");
  }
  delete urlDatabase[shortURLId];
  console.log("urlDatabase after delete::", urlDatabase);
  res.redirect("/urls/"); //redirects to app.get("/urls/") and displays that rendered ejs template(urls_index)
});

//should use PUT verb
app.put("/urls/:id", (req, res) => { //using it for form used in urls_show Submit button //chnged
  const shortURLId = req.params.id;
  const updatedURL = req.body.newURL;
  if (!urlDatabase[shortURLId]) { //id doesnt exist
    console.log("the requested tinyURL is not available in db:: in if post urls/id::");
    return res.send("<p>The requested TinyURL doesn't exist!</p>");
  }
  if (!req.session.userIdCookie) {//If the user is not logged in, respond with msg
    console.log("user is not logged in so respond with msg:: in if post /urls/id");
    return res.send("<html><body>You are not allowed to access URL</body></html>\n");
  }
  if (urlDatabase[shortURLId].userID !== req.session.userIdCookie) { //if id not belong to them
    console.log("URL is not belonged to you so respond with msg:: in if post /urls/id");
    return res.send("<html><body>You are not allowed to access others URL</body></html>\n");
  }
  console.log("shortURLId and updatedURL::in post /urls/id", shortURLId, "---", updatedURL);
  console.log("urlDatabase::in post /urls/id", urlDatabase);
  urlDatabase[shortURLId].longURL = updatedURL;
  console.log("urlDatabase after updated url::in post /urls/id", urlDatabase);
  res.redirect("/urls/");
});

app.get("/register", (req, res) => {
  const userLoggedIn = req.session.userIdCookie;
  if (userLoggedIn) {//If the user is not logged in, redirect to  get /login
    console.log("user is logged in already get /register::", userLoggedIn);
    res.redirect("/urls");
  }
  res.render("urls_register");
});

app.post("/register", (req, res) => {
  if (!req.body.email || !req.body.password) {//anyone is missing
    return res.status(400).end(`<p>Both Username and Password are required</p>`);
  }
  console.log("registering");
  if (getUserWithEmail(users, req.body.email)) { // email already exists //if it returns undefined dont go into if loop
    return res.status(400).end(`<p>Email already in use</p>`);
  }
  const userId = generateRandomString(); //if emailid doent exists in users obj && both fields are givn input
  const password = req.body.password; // found in the req.body object
  const hashedPassword = bcrypt.hashSync(password, 10);
  users[userId] = {
    id: userId,
    email: req.body.email,
    password: hashedPassword
  };
  console.log("users after email nd pass::", users);
  req.session.userIdCookie = userId; // userId from users obj is setted as cookie while registering
  res.redirect("/urls");
});

app.get("/login", (req, res) => {
  const userLoggedIn = req.session.userIdCookie;
  if (userLoggedIn) {
    console.log("user is logged in already get /login::", userLoggedIn);
    res.redirect("/urls");
  }
  res.render("urls_login");
});

app.post("/login", (req, res) => { //using it for form used in urls_login email Login button
  const user = getUserWithEmail(users, req.body.email);
  console.log("user  from getUserWithEmail func in login post ,user::", user);
  if (user) { // email already exists
    console.log("email is thr");
    console.log("comparing hashed pssword and entered password::");
    console.log(bcrypt.compareSync(req.body.password, user.password));
    if (bcrypt.compareSync(req.body.password, user.password)) {//if email and password exists, set cookie
      console.log("password is crt");
      req.session.userIdCookie = user.id;  // userId from users obj is setted as cookie while logging in
      res.redirect("/urls");
    } else {//if email id exists, password doesnt match
      console.log("password is incorrect");
      res.status(403).end(`<html>
<head>
    <link rel="stylesheet" type="text/css" href="styles.css">
</head>
<body>
    <div class="error-container">
        <div class="error-icon">!</div>
        <div class="error-content">
            <h3 class="error-title">Error</h3>
            <p class="error-message">Invalid Credentials. Password is incorrect!</p>
        </div>
    </div>
</body>
</html>`);
    }
  }
  //if email doesnt exists
  res.status(403).end(`<p>Invalid Credentials. Please register or Check Email Id!</p>`);
});

app.post("/logout", (req, res) => { //using it for form used in _header email logout button
  console.log("logout");
  //res.clearCookie("userIdCookie"); //clears cookie
  req.session = null; // this is for cookie-session middleware
  res.redirect("/login");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
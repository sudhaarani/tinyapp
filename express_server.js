const express = require("express");
const { getUserWithEmail, generateRandomString, urlsForUser, permissionFeatures } = require("./helpers");
const { urlDatabase, users } = require("./database");
const cookieSession = require("cookie-session");
const methodOverride = require('method-override');
const bcrypt = require("bcryptjs");
const app = express();
const PORT = 8080; // default port 8080

app.set("view engine", "ejs");//tells the Express app to use EJS as its templating engine

let visitCount = 0;

app.use(express.urlencoded({ extended: true })); //When our browser submits a POST request(form) where POST request
// has a body, the data in the request body is sent as a Buffer(non - readable).To make it readable, we need
//middleware(this line, express library gives this method) which will translate
//app.use(cookieParser());//middleware
app.use(cookieSession({//middleware
  name: 'session',
  keys: ['hi'] //any key can be used
}));
app.use(methodOverride('_method'));//for PUT,DELETE

app.get("/", (req, res) => {
  if (!req.session.userIdCookie) {//user not logged in
    return res.redirect("/login");
  }

  res.redirect("/urls");
});

app.get("/urls", (req, res) => {  // "/urls" is a endpoint
  if (!req.session.userIdCookie) {//If the user is not logged in, respond with msg
    return res.send("<html><body>Sorry, You must be logged in to view this page. Please Log in or Register</body></html>\n");
  }

  const userUrl = urlsForUser(urlDatabase, req.session.userIdCookie); //returns longUrl of that logged in user
  const templateVars = {
    user: users[req.session.userIdCookie],//based on userId,we will gwt emailId of user which is to be displayed on every page once logined in
    urls: userUrl
  }; //always pass templateVars as an object in render()

  res.render("urls_index", templateVars); // res.render is used to load up an ejs view file
});

app.post("/urls", (req, res) => { //using it for form used in urls_new Submit button
  if (!req.session.userIdCookie) {//If the user is not logged in, respond with msg
    return res.send("<html><body>Sorry, You must be logged in to shorten URL</body></html>\n");
  }

  const shortURLId = generateRandomString();
  urlDatabase[shortURLId] = {
    longURL: req.body.longURLField,
    userID: req.session.userIdCookie
  };

  res.redirect("/urls/" + shortURLId); // res.redirect is redirected to app.get method of given endpoint
});

app.get("/urls/new", (req, res) => {//allows to create new url
  if (!req.session.userIdCookie) {//If the user is not logged in, redirect to  get /login
    return res.redirect("/login");
  }

  const templateVars = {
    user: users[req.session.userIdCookie]
  };

  res.render("urls_new", templateVars);
});

app.get("/urls/:id", (req, res) => { //using it for form used in urls_index Edit button , this btn uses get verb in
  //form method bz it just wants to render to urls_show
  const result = permissionFeatures(urlDatabase, req.params.id, req, res);
  if (!result) {
    //to track how many times a given short URL is visited(stretch)
    //Logical OR assignment operator
    // Increment the visit count for each shortURLId
    req.session[req.params.id] = (req.session[req.params.id] || 0) + 1;//If the first value is false, the second value is assigned. else first value

    const timestamp = new Date().toLocaleString();
    if (!req.session.visits) {
      req.session.visits = [];
    }
    req.session.visits.push({ id: `visitor_${visitCount}`, timestamp });//to keep track of every visit of every user

    const templateVars = {
      user: users[req.session.userIdCookie],
      shortURLId: req.params.id,
      longURL: urlDatabase[req.params.id].longURL,
      shortURLViews: req.session[req.params.id],
      visits: req.session.visits
    };

    res.render("urls_show", templateVars);
  }
});

//in form, POST method is used, by using method override added ?_method=PUT/DELETE(query parameter) to work app.delete
app.delete("/urls/:id", (req, res) => { //using it for form used in urls_index delete button //chnged
  const shortURLId = req.params.id;
  const result = permissionFeatures(urlDatabase, shortURLId, req, res);
  if (!result) {
    delete urlDatabase[shortURLId];
    res.redirect("/urls/"); //redirects to app.get("/urls/") and displays that rendered ejs template(urls_index)
  }
});

//using PUT verb for update
app.put("/urls/:id", (req, res) => { //using it for form used in urls_show Submit button //chnged
  const shortURLId = req.params.id;
  const updatedURL = req.body.newURL;
  const result = permissionFeatures(urlDatabase, shortURLId, req, res);
  if (!result) {
    urlDatabase[shortURLId].longURL = updatedURL;
    res.redirect("/urls/");
  }
});

app.get("/u/:id", (req, res) => { //using it for urls_show shortURL link
  if (!urlDatabase[req.params.id]) {// if id is not in db
    return res.send("<p>The requested TinyURL doesn't exist!</p>");
  }
  const longURL = urlDatabase[req.params.id].longURL;
  res.redirect(longURL); //redirects to actual website eg:www.google.com by using shortURL
});

app.get("/register", (req, res) => {
  const userLoggedIn = req.session.userIdCookie;
  if (userLoggedIn) {//If the user is not logged in, redirect to  get /login
    return res.redirect("/urls");
  }

  const templateVars = {
    user: users[userLoggedIn]
  };
  res.render("urls_register", templateVars);
});

app.post("/register", (req, res) => {
  if (!req.body.email || !req.body.password) {//anyone is missing
    return res.status(400).end(`<p>Both Username and Password are required</p>`);
  }

  if (getUserWithEmail(users, req.body.email)) { // email already exists //if it returns undefined dont go into if loop
    return res.status(400).end(`<p>Email already in use</p>`);
  }

  const userId = req.session.userIdCookie || generateRandomString(); //if emailid doent exists in users obj && both fields are givn input
  const password = req.body.password; // found in the req.body object
  const hashedPassword = bcrypt.hashSync(password, 10);
  users[userId] = {
    id: userId,
    email: req.body.email,
    password: hashedPassword
  };

  req.session.userIdCookie = userId; // userId from users obj is setted as cookie while registering
  visitCount++; // used to display no.of visitors in get urls/id
  res.redirect("/urls");
});

app.get("/login", (req, res) => {
  const userLoggedIn = req.session.userIdCookie;
  if (userLoggedIn) {
    return res.redirect("/urls");
  }

  const templateVars = {
    user: users[req.session.userIdCookie]
  };
  res.render("urls_login", templateVars);
});

app.post("/login", (req, res) => { //using it for form used in urls_login email Login button
  const user = getUserWithEmail(users, req.body.email);
  if (user) { // email already exists
    if (bcrypt.compareSync(req.body.password, user.password)) {//if email and password exists, set cookie
      req.session.userIdCookie = user.id;  // userId from users obj is setted as cookie while logging in
      return res.redirect("/urls");
    } else {//if email id exists, password doesnt match
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
  req.session = null; // this is for cookie-session middleware // Deletes the cookie.
  res.redirect("/login");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});




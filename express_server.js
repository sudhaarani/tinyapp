const express = require("express");
const cookieParser = require("cookie-parser");
const app = express();
const PORT = 8080; // default port 8080

app.set("view engine", "ejs");//tells the Express app to use EJS as its templating engine

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

let users = {};

app.use(express.urlencoded({ extended: true })); //When our browser submits a POST request(form) where POST request
// has a body, the data in the request body is sent as a Buffer(non - readable).To make it readable, we need
//middleware(this line, express library gives this method) which will translate
app.use(cookieParser());//middleware

function generateRandomString() {
  const randomId = Math.random().toString(36).substring(2, 8);
  console.log("RandomId::", randomId);
  return randomId;
}

function getUserWithEmail(users, inputField) {
  for (let userId in users) {
    const user = users[userId];
    console.log("user in getUserWithEmail ::", user);
    if (user.email === inputField) { //email
      return user;//if exists returns user obj else returns undefined
    }
  }
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
  const templateVars = {
    user: users[req.cookies["userIdCookie"]],//based on userId,we will gwt emailId of user which is to be displayed on every page once logined in
    urls: urlDatabase
  }; //always pass templateVars as an object in render()
  res.render("urls_index", templateVars); // res.render is used to load up an ejs view file
});

app.get("/urls/new", (req, res) => {
  if (!req.cookies["userIdCookie"]) {//If the user is not logged in, redirect to  get /login
    console.log("user is not logged in so redirect to /login:: in if get /urls/new");
    res.redirect("/login");
  }
  const templateVars = {
    user: users[req.cookies["userIdCookie"]]
  };
  res.render("urls_new", templateVars);
});

//*******review*****
app.post("/urls", (req, res) => { //using it for form used in urls_new Submit button
  if (!req.cookies["userIdCookie"]) {//If the user is not logged in, respond with msg
    console.log("user is not logged in so respond with msg:: in if post /urls");
    return res.send("<html><body>You are not logged in so you cannot shorten URL</body></html>\n");
  }
  console.log("input field::", req.body.longURL); // Log the POST request body to the console
  const id = generateRandomString();
  urlDatabase[id] = req.body.longURL
  console.log("urlDatabase::", urlDatabase);
  res.redirect("/urls/" + id); // res.redirect is redirected to app.get method of given endpoint
});//redirected to urls alone have to confirm

app.get("/urls/:id", (req, res) => { //using it for form used in urls_index Edit button , this btn uses get verb in
  //form method bz it just wants to render to urls_show
  console.log("req.cookies[userIdCookie] in ourls/id---> urls_show::", req.cookies["userIdCookie"]);
  const templateVars = {
    user: users[req.cookies["userIdCookie"]],
    id: req.params.id,
    longURL: urlDatabase[req.params.id]
  };
  console.log("templateVars in uurls/id---> urls_show::", templateVars);
  res.render("urls_show", templateVars);
});

app.get("/u/:id", (req, res) => { //using it for urls_show shortURL link
  if (!urlDatabase[req.params.id]) {// if id is not in db
    console.log("the requested tinyURL is not available in db:: in if u/id::");
    return res.send("<p>The requested TinyURL doesn't exist!</p>");
  }
  const longURL = urlDatabase[req.params.id];
  console.log("the requested tinyURL is available in db:: in u/id::");
  res.redirect(longURL); //redirects to actual website eg:www.google.com by using shortURL
});

app.post("/urls/:id/delete", (req, res) => { //using it for form used in urls_index delete button
  const id = req.params.id;
  console.log("id in delete route::", id);
  delete urlDatabase[id];
  console.log("urlDatabase after delete::", urlDatabase);
  res.redirect("/urls/"); //redirects to app.get("/urls/") and displays that rendered ejs template(urls_index)
});

app.post("/urls/:id", (req, res) => { //using it for form used in urls_show Submit button
  const id = req.params.id;
  const updatedURL = req.body.newURL;
  urlDatabase[id] = updatedURL;
  res.redirect("/urls/");
});

app.get("/register", (req, res) => {
  const userLoggedIn = req.cookies["userIdCookie"];
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
  if (getUserWithEmail(users, req.body.email)) { // email already exists //if returns undefined dont go into if loop
    return res.status(400).end(`<p>Email already in use</p>`);
  }
  const userId = generateRandomString(); //if emailid doent exists in users obj && both fields are givn input
  users[userId] = {
    id: userId,
    email: req.body.email,
    password: req.body.password
  };
  console.log("users after email nd pass::", users);
  res.cookie("userIdCookie", userId); // user_id cookie is set
  res.redirect("/urls");
});

app.get("/login", (req, res) => {
  const userLoggedIn = req.cookies["userIdCookie"];
  if (userLoggedIn) {
    console.log("user is logged in already get /login::", userLoggedIn);
    res.redirect("/urls");
  }
  res.render("urls_login");
});

app.post("/login", (req, res) => { //using it for form used in urls_login email Login button
  for (let userId in users) {
    const user = users[userId];
    console.log("for loop in login post ,user::", user);
    if (user.email === req.body.email) { // email already exists
      console.log("email is thr");
      if (user.password === req.body.password) {//if email and password exists, set cookie
        console.log("password is crt");
        res.cookie("userIdCookie", userId); // user_id cookie is set
        res.redirect("/urls");
      }
    }
  }
  //if email doesnt exists
  //if email id exists, password doesnt match
  res.status(403).end(`<p>Invalid Credentials. Please register!</p>`);
});

app.post("/logout", (req, res) => { //using it for form used in _header email logout button
  console.log("logout");
  res.clearCookie("userIdCookie"); //clears cookie
  res.redirect("/login");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
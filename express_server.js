const express = require("express");
const app = express();
const PORT = 8080; // default port 8080

app.set("view engine", "ejs");//tells the Express app to use EJS as its templating engine

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

app.use(express.urlencoded({ extended: true })); //When our browser submits a POST request(form) where POST request
// has a body, the data in the request body is sent as a Buffer(non - readable).To make it readable, we need
//middleware(this line, express library gives this method) which will translate

function generateRandomString() {
  shortUrlId = Math.random().toString(36).substring(2, 8);
  console.log("shortUrlId::", shortUrlId);
  return shortUrlId;
}

app.get("/", (req, res) => { //routing middleware
  res.send("Hello!");
});

app.get("/urls.json", (req, res) => {  //routing middleware
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls", (req, res) => {
  const templateVars = { urls: urlDatabase };
  res.render("urls_index", templateVars); // res.render is used to load up an ejs view file
});

app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});

app.post("/urls", (req, res) => { //using it for form used in urls_new Submit button
  console.log("input field::", req.body.longURL); // Log the POST request body to the console
  const id = generateRandomString();
  urlDatabase[id] = req.body.longURL
  console.log("urlDatabase::", urlDatabase);
  res.redirect("/urls/" + id);
});

app.get("/urls/:id", (req, res) => { //using it for form used in urls_index Edit button , this btn uses get verb in
  //form method bz it just wants to render to urls_show
  const templateVars = { id: req.params.id, longURL: urlDatabase[req.params.id] };
  res.render("urls_show", templateVars);
});

app.get("/u/:id", (req, res) => { //using it for urls_show shortURL link
  const longURL = urlDatabase[req.params.id];
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

app.post("/login", (req, res) => { //using it for form used in _header username Submit button
  //const usernameCookie = "";
  res.cookie("usernameCookie", req.body.username);
  res.redirect("/urls");
})

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
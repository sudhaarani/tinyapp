
function getUserWithEmail(users, inputField) { //to get user by email
  for (let userId in users) {
    const user = users[userId];
    if (user.email === inputField) { //email
      return user;//if exists returns user obj else returns undefined
    }
  }
};

function generateRandomString() { //generates random string with both numbers and alphabets
  const randomId = Math.random().toString(36).substring(2, 8);
  return randomId;
};

function urlsForUser(urlDatabase, cookieId) { //getting user by cookie
  let urls = {};
  for (let shortURLId in urlDatabase) {
    if (urlDatabase[shortURLId].userID === cookieId) {
      urls[shortURLId] = urlDatabase[shortURLId];
    }
  }
  return urls;
};

function permissionFeatures(urlDatabase, shortURLId, req, res) { //basic permission Features
  if (!urlDatabase[shortURLId]) {// if id is not in db
    return res.send("<p>The requested TinyURL doesn't exist!</p>");
  }
  if (!req.session.userIdCookie) {//If the user is not logged in, respond with msg
    return res.send("<html><body>You are not allowed to access URL</body></html>\n");
  }
  if (urlDatabase[shortURLId].userID !== req.session.userIdCookie) {//The individual URL pages should not be accesible if the URL does not belong to them.
    return res.send("<html><body>You are not allowed to access others URL</body></html>\n");
  }
};

module.exports = { getUserWithEmail, generateRandomString, urlsForUser, permissionFeatures };
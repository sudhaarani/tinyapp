

function getUserWithEmail(users, inputField) {
  for (let userId in users) {
    const user = users[userId];
   // console.log("user in getUserWithEmail ::", user);
    if (user.email === inputField) { //email
      return user;//if exists returns user obj else returns undefined
    }
  }
};

module.exports = { getUserWithEmail };
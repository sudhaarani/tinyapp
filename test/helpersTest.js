const { assert } = require("chai"); //
const { getUserWithEmail } = require("../helpers");

const testUsers = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
};

describe("#getUserWithEmail", function () {
  it("should return a user with valid email", function () {
    assert.deepEqual(getUserWithEmail(testUsers, "user@example.com"), {
      id: "userRandomID",
      email: "user@example.com",
      password: "purple-monkey-dinosaur"
    });
  });
  it("should return undefined with non-exist email", function () {
    assert.deepEqual(getUserWithEmail(testUsers, "1@example.com"), undefined);
  });

});
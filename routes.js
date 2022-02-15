"use strict";

const Accounts = require("./app/controllers/accounts");
const Submissions = require("./app/controllers/submissions");

module.exports = [
  { method: "GET", path: "/", config: Accounts.index },
  { method: "GET", path: "/submit", config: Accounts.submit },
  { method: "GET", path: "/login", config: Accounts.showLogin },
  { method: "POST", path: "/login", config: Accounts.login },
  { method: "POST", path: "/submit", config: Submissions.submit },
  { method: "GET", path: "/report", config: Submissions.report },
  //{ method: "GET", path: "/", config: Accounts.submit },
  {
    method: "GET",
    path: "/{param*}",
    handler: {
      directory: {
        path: "./public",
      },
    },
    options: { auth: false },
  },
];
"use strict";

const Accounts = require("./app/controllers/accounts");
const Submissions = require("./app/controllers/submissions");
const Pdfs = require("./app/controllers/pdfs");

module.exports = [
  { method: "GET", path: "/", config: Accounts.index },
  { method: "GET", path: "/submit", config: Accounts.showSubmit },
  { method: "GET", path: "/login", config: Accounts.showLogin },
  { method: "POST", path: "/login", config: Accounts.login },
  { method: "POST", path: "/submit", config: Submissions.submit },
  { method: "GET", path: "/report", config: Submissions.report },
  { method: "GET", path: "/showcase", config: Accounts.showcase },
  { method: "GET", path: "/showcase-file/{_id}", config: Accounts.showcaseFile },
  //{ method: "GET", path: "/showcase-file", config: Accounts.showcaseFile },
  { method: "GET", path: "/signup", config: Accounts.showSignup },
  { method: "POST", path: "/signup", config: Accounts.signup },
  { method: "GET", path: "/logout", config: Accounts.logout },
  { method: "GET", path: "/js-pdf", config: Pdfs.jsPdf },
  { method: "GET", path: "/create-pdf/{_id}", config: Pdfs.createPdf },
  //{ method: "GET", path: "/create-pdf", config: Pdfs.createPdf },
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

"use strict";

const Accounts = require("./app/controllers/accounts");
const Submissions = require("./app/controllers/submissions");
const Pdfs = require("./app/controllers/pdfs");

module.exports = [
  { method: "GET", path: "/", config: Accounts.index },
  { method: "GET", path: "/submission-form", config: Accounts.showSubmissionForm },
  { method: "GET", path: "/login", config: Accounts.showLogin },
  { method: "POST", path: "/login", config: Accounts.login },
  { method: "POST", path: "/submit", config: Submissions.submit },
  { method: "GET", path: "/submission-user", config: Submissions.showSubmission },
  { method: "GET", path: "/admin", config: Accounts.showAdminHome },
  { method: "GET", path: "/signup", config: Accounts.showSignup },
  { method: "POST", path: "/signup", config: Accounts.signup },
  { method: "GET", path: "/logout", config: Accounts.logout },
  { method: "GET", path: "/create-pdf/{_id}", config: Pdfs.createPdf },
  { method: "GET", path: "/create-handbook", config: Pdfs.createHandBook },
  { method: "GET", path: "/submission-admin/{_id}", config: Pdfs.showSubmissionAdmin },
  { method: "POST", path: "/update-submission/{_id}", config: Pdfs.submitByAdmin },
  { method: "GET", path: "/other-form", config: Pdfs.showOther },
  {
    method: "GET",
    path: "/{param*}",
    handler: {
      directory: {
        path: "./public",
        listing: true,
      },
    },
    options: { auth: false },
  },
];

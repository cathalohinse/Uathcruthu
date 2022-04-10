"use strict";

const Accounts = require("./app/controllers/accounts");
const Submissions = require("./app/controllers/submissions");
const Admins = require("./app/controllers/admins");

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
  { method: "GET", path: "/create-pdf-user/{_id}", config: Admins.createPdfUser },
  { method: "GET", path: "/create-handbook", config: Admins.createHandBook },
  { method: "GET", path: "/submission-admin/{_id}", config: Admins.showSubmissionAdmin },
  { method: "POST", path: "/update-submission/{_id}", config: Admins.submitByAdmin },
  { method: "GET", path: "/other-form", config: Admins.showOther },
  { method: "POST", path: "/submit-other/{_id}", config: Admins.submitOther },
  { method: "GET", path: "/handbook-form", config: Admins.showHandbookForm },
  { method: "POST", path: "/admin-submit", config: Admins.adminSubmit },
  { method: "GET", path: "/create-pdf-admin", config: Admins.createPdfAdmin },

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

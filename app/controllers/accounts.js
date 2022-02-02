"use strict";

const Accounts = {
  index: {
    auth: false,
    handler: function (request, h) {
      return h.view("main", { title: "ITPL Tionscadal Cuir Isteach" });
    },
  },
  submit: {
    auth: false,
    handler: function (request, h) {
      return h.view("submit", { title: "Project Submission" });
    },
  },
  signup: {
    auth: false,
    handler: function (request, h) {
      return h.redirect("/home");
    },
  },
  showLogin: {
    auth: false,
    handler: function (request, h) {
      return h.view("login", { title: "Login to Submissions" });
    },
  },
  login: {
    auth: false,
    handler: function (request, h) {
      return h.redirect("/submit");
    },
  },
  logout: {
    auth: false,
    handler: function (request, h) {
      return h.redirect("/");
    },
  },
};

module.exports = Accounts;

"use strict";
//const User = require("../models/user");

const Accounts = {
  index: {
    auth: false,
    handler: function (request, h) {
      return h.view("main", { title: "ITPL Tionscadal Cuir Isteach" });
    },
  },

  submit: {
    //auth: false,
    handler: function (request, h) {
      return h.view("submit", { title: "Project Submission" });
    },
  },

  showSignup: {
    auth: false,
    handler: function (request, h) {
      return h.view("signup", { title: "Signup for Submissions", subtitle: "This is the Signup Subtitle" });
    },
  },

  /*signup: {
    auth: false,
    handler: function (request, h) {
      const user = request.payload;
      this.users[user.email] = user;
      return h.redirect("/login");
    },
  },*/

  signup: {
    auth: false,
    handler: function (request, h) {
      const user = request.payload;
      this.users[user.email] = user;
      request.cookieAuth.set({ id: user.email });
      //this.currentUser = user;
      return h.redirect("/login");
    },
  },

  showLogin: {
    auth: false,
    handler: function (request, h) {
      return h.view("login", { title: "Login to Submissions", subtitle: "This is the subtitle" });
    },
  },

  /*login: {
    auth: false,
    handler: function (request, h) {
      const user = request.payload;
      if (user.email in this.users && user.password === this.users[user.email].password) {
        return h.redirect("/submit");
      }
      return h.redirect("/");
    },
  },*/

  login: {
    //auth: false,
    handler: function (request, h) {
      const user = request.payload;
      if (user.email in this.users && user.password === this.users[user.email].password) {
        //this.currentUser = this.users[user.email];
        request.cookieAuth.set({ id: user.email });
        return h.redirect("/submit");
      }
      return h.redirect("/");
    },
  },

  logout: {
    //auth: false,
    handler: function (request, h) {
      request.cookieAuth.clear();
      return h.redirect("/");
    },
  },
};

module.exports = Accounts;

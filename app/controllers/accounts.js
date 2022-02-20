"use strict";
const User = require("../models/user");
const Boom = require("@hapi/boom");

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

  signup: {
    auth: false,
    handler: async function (request, h) {
      try {
        const payload = request.payload;
        let user = await User.findByEmail(payload.email);
        if (user) {
          const message = "Email address is already registered";
          throw Boom.badData(message);
        }
        const newUser = new User({
          firstName: payload.firstName,
          lastName: payload.lastName,
          email: payload.email,
          password: payload.password,
        });
        user = await newUser.save();
        request.cookieAuth.set({ id: user.id });
        return h.redirect("/login");
      } catch (err) {
        return h.view("signup", { errors: [{ message: err.message }] });
      }
    },
  },

  showLogin: {
    auth: false,
    handler: function (request, h) {
      return h.view("login", { title: "Login to Submissions", subtitle: "This is the subtitle" });
    },
  },

  login: {
    auth: false,
    handler: async function (request, h) {
      const { email, password } = request.payload;
      try {
        let user = await User.findByEmail(email);
        if (!user) {
          const message = "Email address is not registered";
          throw Boom.unauthorized(message);
        }
        user.comparePassword(password);
        request.cookieAuth.set({ id: user.id });
        return h.redirect("/submit");
      } catch (err) {
        return h.view("login", { errors: [{ message: err.message }] });
      }
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

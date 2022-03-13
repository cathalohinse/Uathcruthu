"use strict";
const User = require("../models/user");
const Boom = require("@hapi/boom");
const Submission = require("../models/submission");
const Joi = require("@hapi/joi");
const sanitizeHtml = require("sanitize-html");

const Accounts = {
  index: {
    auth: false,
    handler: function (request, h) {
      console.log("Welcome to Uathcruthú");
      return h.view("main", { title: "ITPL Tionscadal Cuir Isteach" });
    },
  },

  showSubmit: {
    handler: async function (request, h) {
      const userId = await request.auth.credentials.id;
      const user = await User.findById(userId);
      const submission = await Submission.findByUserId(user).lean();
      console.log(submission.firstName + " " + submission.lastName + " has navigated to the submit screen");
      return h.view("submit", { title: "Project Submission", submission: submission });
    },
  },

  showSignup: {
    auth: false,
    handler: function (request, h) {
      console.log("User has navigated to the sign-up screen");
      return h.view("signup", { title: "Signup for Submissions", subtitle: "This is the Signup Subtitle" });
    },
  },

  signup: {
    auth: false,
    validate: {
      payload: {
        firstName: Joi.string()
          .required()
          .regex(/^[A-Z][A-Z,a-z]{1,}$/), //Allows for a first name with only two characters, both of which could be uppercase (e.g. 'PJ'),
        lastName: Joi.string()
          .required()
          .regex(/^[A-Z]/)
          .min(3),
        email: Joi.string().email().required(),
        password: Joi.string().required(),
      },
      options: {
        abortEarly: false,
      },
      failAction: function (request, h, error) {
        console.log("User has entered unacceptable data for signing up");
        return h
          .view("signup", {
            title: "Sign up Error",
            errors: error.details,
          })
          .takeover()
          .code(400);
      },
    },

    handler: async function (request, h) {
      try {
        const payload = request.payload;
        let user = await User.findByEmail(payload.email);
        if (user) {
          const message = "Email address is already registered";
          throw Boom.badData(message);
        }
        const newUser = new User({
          firstName: sanitizeHtml(payload.firstName),
          lastName: sanitizeHtml(payload.lastName),
          email: sanitizeHtml(payload.email),
          password: sanitizeHtml(payload.password),
        });

        const newSubmission = new Submission({
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          submitter: newUser,
        });
        await newSubmission.save();

        user = await newUser.save();
        request.cookieAuth.set({ id: user.id });
        console.log(newUser.firstName + " " + newUser.lastName + " has registered");
        return h.redirect("/login");
      } catch (err) {
        console.log("Error registering");
        return h.view("signup", { errors: [{ message: err.message }] });
      }
    },

    payload: {
      multipart: true,
      output: "data",
      maxBytes: 209715200,
      parse: true,
    },
  },

  showLogin: {
    auth: false,
    handler: function (request, h) {
      console.log("User has navigated to the login screen");
      return h.view("login", { title: "Login to Submissions", subtitle: "This is the subtitle" });
    },
  },

  login: {
    auth: false,

    validate: {
      payload: {
        email: Joi.string().email().required(),
        password: Joi.string().required(),
      },
      options: {
        abortEarly: false,
      },
      failAction: function (request, h, error) {
        console.log("User has entered unacceptable data for logging in");
        return h
          .view("login", {
            title: "Log in Error",
            errors: error.details,
          })
          .takeover()
          .code(400);
      },
    },

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
        console.log(user.firstName + " " + user.lastName + " has logged in");
        return h.redirect("/submit");
      } catch (err) {
        console.log("Error logging in");
        return h.view("login", { errors: [{ message: err.message }] });
      }
    },
  },

  showcase: {
    auth: false,
    handler: async function (request, h) {
      //const userId = await request.auth.credentials.id;
      //const user = await User.findById(userId).lean();
      //const users = await User.find().populate(user).lean();
      //const users = await User.find().populate(user).lean();
      const users = await User.find().lean();
      //const users = await User.findAll();
      //console.log(user.firstName + " has navigated to Showcase Page");
      console.log("The following users are on the system " + users);
      return h.view("showcase", { title: "Showcases", users: users });
    },
  },

  showcaseFile: {
    auth: false,
    handler: async function (request, h) {
      const userId = await request.params;
      const user = await User.findById(userId).lean();
      const submission = await Submission.findByUserId(user).lean();
      console.log(user.firstName + " has submitted " + submission.projectTitle);
      console.log("Submission: " + submission);
      return h.view("report", {
        title: "User's Submission",
        submission: submission,
        user: user,
      });
    },
  },

  logout: {
    handler: function (request, h) {
      request.cookieAuth.clear();
      console.log("User has logged out");
      return h.redirect("/");
    },
  },
};

module.exports = Accounts;

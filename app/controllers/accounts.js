"use strict";
const User = require("../models/user");
const Boom = require("@hapi/boom");
const Submission = require("../models/submission");
const AdminSubmission = require("../models/adminSubmission");
const Joi = require("@hapi/joi");
const sanitizeHtml = require("sanitize-html");
const { jsPDF } = require("jspdf");

const Accounts = {
  /*deadline: async function () {
    const deadline = await Math.floor(new Date("2022.04.10").getTime() / 1000);
    return deadline;
  },*/

  index: {
    auth: false,
    handler: function (request, h) {
      console.log("Welcome to Uathcruthú");
      const date = new Date();
      const week_day = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      const month_name = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      console.log(
        week_day[date.getDay()] + " " + month_name[date.getMonth()] + " " + date.getDate() + " " + date.getFullYear()
      );
      return h.view("main", { title: "ITPL Tionscadal Cuir Isteach" });
    },
  },

  showSubmissionForm: {
    handler: async function (request, h) {
      const today = await Math.floor(new Date(Date.now()).getTime() / 1000);
      const userId = await request.auth.credentials.id;
      const user = await User.findById(userId);
      const submission = await Submission.findByUserId(user).lean();
      console.log(submission.firstName + " " + submission.lastName + " has navigated to the Submit page");
      const adminSubmissions = await AdminSubmission.find().lean();
      const adminSubmission = await adminSubmissions[0];
      return h.view("submission-form", {
        title: "Project Submission",
        submission: submission,
        today: today,
        //deadline: await Accounts.deadline(),
        deadline: await adminSubmission.deadline,
      });
    },
  },

  showSignup: {
    auth: false,
    handler: function (request, h) {
      console.log("User has navigated to the Sign-Up page");
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
        user = await newUser.save();

        const newSubmission = new Submission({
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          submitter: newUser,
        });
        await newSubmission.save();

        const doc = await new jsPDF("landscape");
        doc.text(newUser.firstName + " has not created their Handbook yet.", 20, 20);
        doc.save("./public/handbooks/" + newUser.firstName + newUser.lastName + ".pdf");

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
      console.log("User has navigated to the Login page");
      return h.view("login", { title: "Login", subtitle: "This is the subtitle" });
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
            title: "Login Error",
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
        return h.redirect("/submission-form");
      } catch (err) {
        console.log("Error logging in");
        return h.view("login", { errors: [{ message: err.message }] });
      }
    },
  },

  showAdminHome: {
    auth: false,
    handler: async function (request, h) {
      try {
        const users = await User.find().lean();
        console.log("User has navigated to the Admin Home page");
        return h.view("admin", { title: "Admin", users: users });
      } catch (err) {
        console.log("Error loading Showcase page");
        return h.view("main", { errors: [{ message: err.message }] });
      }
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

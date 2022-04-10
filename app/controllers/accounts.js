"use strict";
const User = require("../models/user");
const Boom = require("@hapi/boom");
const Submission = require("../models/submission");
const AdminSubmission = require("../models/adminSubmission");
const Joi = require("@hapi/joi");
const sanitizeHtml = require("sanitize-html");
const bcrypt = require("bcrypt");
const saltRounds = 10;
const Admin = require("../models/admin");

const Accounts = {
  index: {
    auth: false,
    handler: function (request, h) {
      console.log("Fáilte chuigh Uathcruthú");
      const date = new Date();
      const week_day = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      const month_name = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      console.log(
        week_day[date.getDay()] + " " + month_name[date.getMonth()] + " " + date.getDate() + " " + date.getFullYear()
      );
      return h.view("main", { title: "Tionscadal ITPL" });
    },
  },

  showSignup: {
    auth: false,
    handler: function (request, h) {
      console.log("User has navigated to the Sign-Up page");
      return h.view("signup", { title: "Signup for Uathcruthú", subtitle: "This is the Signup Subtitle" });
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
        const hash = await bcrypt.hash(payload.password, saltRounds);

        const newUser = new User({
          firstName: sanitizeHtml(payload.firstName),
          lastName: sanitizeHtml(payload.lastName),
          email: sanitizeHtml(payload.email),
          password: sanitizeHtml(hash),
        });
        user = await newUser.save();

        const newSubmission = new Submission({
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          submitter: newUser,
        });
        await newSubmission.save();

        /*const doc = await new jsPDF("landscape");
        doc.text(newUser.firstName + " has not created their Handbook yet.", 20, 20);
        doc.save("./public/handbooks/" + newUser.firstName + newUser.lastName + ".pdf");*/

        request.cookieAuth.set({ id: user.id });
        console.log(newUser.firstName + " " + newUser.lastName + " has registered");
        return h.redirect("/login", { title: "Signup for Uathcruthú" });
      } catch (err) {
        console.log("Error registering");
        return h.view("signup", { title: "Sign up Error", errors: [{ message: err.message }] });
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
      let { email, password } = request.payload;
      try {
        let user = await User.findByEmail(email);
        let admin = await Admin.findByEmail(email);
        if (!user && !admin) {
          const message = "Email address is not registered";
          throw Boom.unauthorized(message);
          // if a user is logging in for the first time, they can set their password. But there is no prompt, it's as if they're logging in as normal.
        } else if (user && !user.password) {
          const hash = await bcrypt.hash(password, saltRounds);
          user.password = sanitizeHtml(hash);
          user.save();
          request.cookieAuth.set({ id: user.id });
          console.log(user.firstName + " " + user.lastName + " has logged in");
          const newSubmission = new Submission({
            firstName: user.firstName,
            lastName: user.lastName,
            submitter: user,
          });
          await newSubmission.save();
          return h.redirect("/submission-form");
          // if an admin is logging in for the first time, they can set their password. But there is no prompt, it's as if they're logging in as normal.
        } else if (admin && !admin.password) {
          const hash = await bcrypt.hash(password, saltRounds);
          admin.password = sanitizeHtml(hash);
          admin.save();
          request.cookieAuth.set({ id: admin.id });
          console.log(admin.firstName + " " + admin.lastName + " has logged in");
          return h.redirect("/admin");
        } else if (user) {
          await user.comparePassword(password);
          request.cookieAuth.set({ id: user.id });
          console.log(user.firstName + " " + user.lastName + " has logged in");
          return h.redirect("/submission-form");
        } else {
          await admin.comparePassword(password);
          request.cookieAuth.set({ id: admin.id });
          console.log(admin.firstName + " " + admin.lastName + " has logged in");
          return h.redirect("/admin");
        }
      } catch (err) {
        console.log("Error logging in");
        return h.view("login", { title: "Login Error", errors: [{ message: err.message }] });
      }
    },
  },

  showSubmissionForm: {
    handler: async function (request, h) {
      const userId = await request.auth.credentials.id;
      const user = await User.findById(userId);
      const submission = await Submission.findByUserId(user).lean();
      //This is where the Project Types are defined.
      const projectTypes = ["Native Mobile Application", "Web Application", "Combined Web and Mobile", "Other"];
      const adminSubmissions = await AdminSubmission.find().lean();
      const adminSubmission = await adminSubmissions[0];
      //In case the administrator doesn't want to set a deadline for submission of handbook data, this ensures that no alarms appear on the submission form
      if (adminSubmission === undefined) {
        var deadline = null;
        var deadlineCutOff = null;
        var today = null;
      } else if (adminSubmission.deadline === undefined) {
        var deadline = null;
        var deadlineCutOff = null;
        var today = null;
      } else {
        //This function adds 23 hours and 59 minutes to the deadline selected by the admin. The assumption is that the
        //deadline selected would be inclusive of that actual day.
        function addHoursMinutes(numOfHours, numOfMins, date = new Date()) {
          date.setHours(date.getHours() + numOfHours);
          date.setMinutes(date.getMinutes() + numOfMins);
          return date;
        }
        var deadline = addHoursMinutes(22, 59, new Date(adminSubmission.deadline));
        var deadlineCutOff = await Math.floor(new Date(deadline).getTime() / 1000);
        var today = await Math.floor(new Date(Date.now()).getTime() / 1000);
      }
      return h.view("submission-form", {
        title: "Project Submission",
        submission: submission,
        today: today,
        deadline: deadline,
        deadlineCutOff: deadlineCutOff,
        projectTypes: projectTypes,
      });
    },
  },

  showAdminHome: {
    handler: async function (request, h) {
      try {
        const users = await User.find().lean();
        const submissions = await Submission.find().lean();
        console.log("User has navigated to the Admin Home page");
        return h.view("admin", { title: "Admin", users: users, submissions: submissions });
      } catch (err) {
        console.log("Error loading Showcase page");
        return h.view("main", { title: "Error", errors: [{ message: err.message }] });
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

"use strict";
const Submission = require("../models/submission");
const User = require("../models/user");
const ImageStore = require("../utils/image-store");
const Joi = require("@hapi/joi");
const sanitizeHtml = require("sanitize-html");

const Submissions = {
  home: {
    handler: function (request, h) {
      console.log("Welcome home");
      return h.view("home", { title: "Make a Submission" });
    },
  },

  report: {
    handler: async function (request, h) {
      const userId = await request.auth.credentials.id;
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

  submit: {
    validate: {
      payload: {
        projectTitle: Joi.string().allow("").min(4),
        descriptiveTitle: Joi.string().allow(""),
        projectType: Joi.string().allow(""),
        personalPhoto: Joi.any().allow(""),
        projectImage: Joi.any().allow(""),
        summary: Joi.string().allow("").max(100),
        projectUrl: Joi.string().allow(""),
        videoUrl: Joi.string().allow(""),
      },
      options: {
        abortEarly: false,
      },
      failAction: async function (request, h, error) {
        const userId = await request.auth.credentials.id;
        const user = await User.findById(userId);
        const submission = await Submission.findByUserId(user).lean();
        console.log(user.firstName + " has entered unacceptable data for submission");
        return h
          .view("submit", {
            title: "Submission error",
            errors: error.details,
            submission: submission,
          })
          .takeover()
          .code(400);
      },
    },

    handler: async function (request, h) {
      try {
        const submissionEdit = await request.payload;
        const userId = await request.auth.credentials.id;
        const user = await User.findById(userId);
        const submission = await Submission.findByUserId(user);
        //const result = await ImageStore.uploadImage(submissionEdit.personalPhoto);
        //const imageUrl = result.url;
        console.log("Submission (submit): " + submission);
        if (submissionEdit.projectTitle !== "") {
          submission.projectTitle = sanitizeHtml(submissionEdit.projectTitle);
        }
        if (submissionEdit.descriptiveTitle !== "") {
          submission.descriptiveTitle = sanitizeHtml(submissionEdit.descriptiveTitle);
        }
        if (submissionEdit.projectType !== "") {
          submission.projectType = sanitizeHtml(submissionEdit.projectType);
        }
        if (submissionEdit.personalPhoto !== "") {
          submission.personalPhoto = sanitizeHtml(submissionEdit.personalPhoto);
          //submission.personalPhoto = imageUrl;
        }
        if (submissionEdit.projectImage !== "") {
          submission.projectImage = sanitizeHtml(submissionEdit.projectImage);
        }
        if (submissionEdit.summary !== "") {
          submission.summary = sanitizeHtml(submissionEdit.summary);
        }
        if (submissionEdit.projectUrl !== "") {
          submission.projectUrl = sanitizeHtml(submissionEdit.projectUrl);
        }
        if (submissionEdit.videoUrl !== "") {
          submission.videoUrl = sanitizeHtml(submissionEdit.videoUrl);
        }
        await submission.save();
        console.log(user.firstName + " has updated " + submissionEdit.projectTitle);
        return h.redirect("/report");
      } catch (err) {
        console.log("Error updating Submission");
        return h.view("submit", { errors: [{ message: err.message }] });
      }
    },
  },

  payload: {
    multipart: true,
    //output: "data",
    output: "data",
    maxBytes: 209715200,
    parse: true,
  },
};

module.exports = Submissions;

"use strict";
const Submission = require("../models/submission");
const User = require("../models/user");

const Submissions = {
  home: {
    handler: function (request, h) {
      return h.view("home", { title: "Make a Submission" });
    },
  },

  report: {
    handler: async function (request, h) {
      const userId = await request.auth.credentials.id;
      const user = await User.findById(userId);
      const submission = await Submission.findByUserId(user).lean();
      console.log(`User First Name: ` + user.firstName);
      console.log("Submission (report): " + submission.firstName);
      return h.view("report", {
        title: "Submissions to Date",
        submission: submission,
      });
    },
  },

  submit: {
    handler: async function (request, h) {
      try {
        const submissionEdit = await request.payload;
        const userId = await request.auth.credentials.id;
        const user = await User.findById(userId);
        const submission = await Submission.findByUserId(user);
        console.log("Submission (submit): " + submission);
        if (submissionEdit.projectTitle !== "") {
          submission.projectTitle = submissionEdit.projectTitle;
        }
        if (submissionEdit.descriptiveTitle !== "") {
          submission.descriptiveTitle = submissionEdit.descriptiveTitle;
        }
        if (submissionEdit.projectType !== "") {
          submission.projectType = submissionEdit.projectType;
        }
        if (submissionEdit.personalPhoto !== "") {
          submission.personalPhoto = submissionEdit.personalPhoto;
        }
        if (submissionEdit.projectImage !== "") {
          submission.projectImage = submissionEdit.projectImage;
        }
        if (submissionEdit.summary !== "") {
          submission.summary = submissionEdit.summary;
        }
        if (submissionEdit.projectUrl !== "") {
          submission.projectUrl = submissionEdit.projectUrl;
        }
        if (submissionEdit.videoUrl !== "") {
          submission.videoUrl = submissionEdit.videoUrl;
        }
        await submission.save();
        console.log("New Submission (submit): " + submission);
        return h.redirect("/report");
      } catch (err) {
        return h.view("main", { errors: [{ message: err.message }] });
      }
    },
  },

  payload: {
    multipart: true,
    output: "data",
    maxBytes: 209715200,
    parse: true,
  },
};

module.exports = Submissions;

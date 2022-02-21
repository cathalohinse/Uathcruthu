"use strict";
const Submission = require("../models/submission");
const User = require("../models/user");

const Submissions = {
  home: {
    //auth: false,
    handler: function (request, h) {
      return h.view("home", { title: "Make a Submission" });
    },
  },

  report: {
    handler: async function (request, h) {
      const submissions = await Submission.find().populate("submitter").lean();
      return h.view("report", {
        title: "Submissions to Date",
        submissions: submissions,
      });
    },
  },

  /*submit: {
    handler: async function (request, h) {
      const id = request.auth.credentials.id;
      const user = await User.findById(id);
      const data = request.payload;
      const newSubmission = new Submission({
        //name: user.firstName + " " + user.lastName,
        firstName: user.firstName,
        lastName: user.lastName,
        projectTitle: data.projectTitle,
        descriptiveTitle: data.descriptiveTitle,
        projectType: data.projectType,
        personalPhoto: data.personalPhoto,
        projectImage: data.projectImage,
        summary: data.summary,
        projectUrl: data.projectUrl,
        videoUrl: data.videoUrl,
        submitter: user._id,
      });
      await newSubmission.save();
      return h.redirect("/report");
    },
  },*/

  submit: {
    handler: async function (request, h) {
      try {
        const submissionEdit = await request.payload;
        const userId = await request.auth.credentials.id;
        const user = await User.findById(userId);
        const submission = await Submission.findByUserId(user);
        console.log(submission);
        submission.projectTitle = submissionEdit.projectTitle;
        submission.descriptiveTitle = submissionEdit.descriptiveTitle;
        submission.projectType = submissionEdit.projectType;
        submission.personalPhoto = submissionEdit.personalPhoto;
        submission.projectImage = submissionEdit.projectImage;
        submission.summary = submissionEdit.summary;
        submission.projectUrl = submissionEdit.projectUrl;
        submission.videoUrl = submissionEdit.videoUrl;
        await submission.save();
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

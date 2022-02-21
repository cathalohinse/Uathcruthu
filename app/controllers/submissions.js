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

  submit: {
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
  },
};

module.exports = Submissions;

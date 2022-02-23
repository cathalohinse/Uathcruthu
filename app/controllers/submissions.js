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
      //const submissions = await Submission.find().populate("submitter").lean();

      const userId = await request.auth.credentials.id;
      const user = await User.findById(userId);
      //const submission = await Submission.findByUserId(user);
      const submission = await Submission.findById(request.params._id);
      const submissions = await Submission.find().populate(submission).lean();

      return h.view("report", {
        title: "Submissions to Date",
        submissions: submissions,
        //submission: submission,
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

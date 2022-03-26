"use strict";
const User = require("../models/user");
const Submission = require("../models/submission");
const imageDataURI = require("image-data-uri");
const { jsPDF } = require("jspdf");
const Deadline = require("../controllers/accounts");
const Joi = require("@hapi/joi");
const sanitizeHtml = require("sanitize-html");
const PDFMerger = require("pdf-merger-js");

const Pdfs = {
  createPdf: {
    auth: false,
    handler: async function (request, h) {
      const hey = "hey";
      const user = await User.findById(request.params._id).lean();
      const submission = await Submission.findByUserId(user).lean();
      if (!submission.nda) {
        try {
          const backgroundImgData = await imageDataURI.encodeFromFile("public/images/background.png");
          //const doc = new jsPDF("landscape");
          const doc = new jsPDF({ orientation: "landscape", compress: true });
          //const user = await User.findById(request.params._id).lean();
          //const submission = await Submission.findByUserId(user).lean();
          const personalPhotoImgData = await imageDataURI.encodeFromURL(submission.personalPhoto);
          const projectImageImgData = await imageDataURI.encodeFromURL(submission.projectImage);
          const youtubeImgData = await imageDataURI.encodeFromFile("public/images/youtube.png");
          console.log(
            user.firstName + " " + user.lastName + " has created the following pdf: " + submission.projectTitle
          );
          doc.addImage(backgroundImgData, "PNG", 0, 0, 300, 210);
          doc.addImage(personalPhotoImgData, "JPG", 5, 5, 60, 60); //originally w:30, h:40
          doc.addImage(projectImageImgData, "JPG", 5, 75, 150, 120);
          doc.setFontSize(30);
          doc.setFont(undefined, "bold");
          doc.text(submission.projectTitle, 70, 20);
          doc.setFont(undefined, "normal");
          doc.text(submission.descriptiveTitle, 70, 30, { maxWidth: 240 });
          doc.setFontSize(20);
          doc.text(submission.projectType, 70, 60);
          doc.text(submission.firstName + " " + submission.lastName, 70, 70);
          doc.setFontSize(15);
          doc.text(submission.summary, 165, 60, { maxWidth: 120 });
          doc.setTextColor(0, 102, 204);
          doc.textWithLink("Project Landing Page", 5, 207, { url: submission.projectUrl });
          doc.setFontSize(20);
          doc.textWithLink("Video", 276, 202, { url: submission.videoUrl });
          doc.addImage(youtubeImgData, "PNG", 275, 190, 20, 20);
          doc.save("./public/handbooks/" + user.firstName + user.lastName + ".pdf");
          return h.view("submission-admin", {
            title: "User's Submission",
            user: user,
            submission: submission,
            hey: hey,
          });
        } catch (err) {
          const user = await User.findById(request.params._id).lean();
          const submission = await Submission.findByUserId(user).lean();
          console.log("Error creating pdf");
          return h.view("submission-admin", {
            title: "Submission Error",
            user: user,
            submission: submission,
            errors: [{ message: err.message }],
          });
        }
      } else {
        try {
          const backgroundImgData = await imageDataURI.encodeFromFile("public/images/background.png");
          //const doc = new jsPDF("landscape");
          const doc = new jsPDF({ orientation: "landscape", compress: true });
          //const user = await User.findById(request.params._id).lean();
          //const submission = await Submission.findByUserId(user).lean();
          const personalPhotoImgData = await imageDataURI.encodeFromURL(submission.personalPhoto);
          console.log(
            user.firstName + " " + user.lastName + " has created the following pdf: " + submission.projectTitle
          );
          doc.addImage(backgroundImgData, "PNG", 0, 0, 300, 210);
          doc.addImage(personalPhotoImgData, "JPG", 5, 5, 60, 60); //originally w:30, h:40
          doc.setFontSize(30);
          doc.setFont(undefined, "bold");
          doc.text("NDA", 70, 20);
          doc.setFont(undefined, "normal");
          doc.text("This project information is withheld under NDA", 70, 30, { maxWidth: 240 });
          doc.setFontSize(20);
          doc.text(submission.firstName + " " + submission.lastName, 70, 70);
          doc.save("./public/handbooks/" + user.firstName + user.lastName + ".pdf");
          return h.view("submission-admin", {
            title: "User's Submission",
            user: user,
            submission: submission,
          });
        } catch (err) {
          const user = await User.findById(request.params._id).lean();
          const submission = await Submission.findByUserId(user).lean();
          console.log("Error creating pdf");
          return h.view("submission-admin", {
            title: "Submission Error",
            user: user,
            submission: submission,
            errors: [{ message: err.message }],
          });
        }
      }
    },
  },

  showSubmissionAdmin: {
    auth: false,
    handler: async function (request, h) {
      try {
        const today = await Math.floor(new Date(Date.now()).getTime() / 1000);
        const deadline = await Deadline.deadline();
        const userId = await request.params._id;
        const user = await User.findById(userId).lean();
        const submission = await Submission.findByUserId(user).lean();
        console.log(user.firstName + " has navigated/been redirected to " + submission.projectTitle + " report page");
        return h.view("submission-admin", {
          title: user.firstName + "'s Submission",
          submission: submission,
          user: user,
          today: today,
          deadline: deadline,
        });
      } catch (err) {
        return h.view("login", { errors: [{ message: err.message }] });
      }
    },
  },

  submitByAdmin: {
    auth: false,
    validate: {
      payload: {
        projectType: Joi.string().allow(""),
        videoUrl: Joi.string().allow(""),
      },
      options: {
        abortEarly: false,
      },
      failAction: async function (request, h, error) {
        const userId = await request.request.params._id;
        const user = await User.findById(userId);
        const submission = await Submission.findByUserId(user).lean();
        console.log("Admin has entered unacceptable data for submission");
        return h
          .view("admin", {
            title: "Submission Error",
            errors: error.details,
            submission: submission,
          })
          .takeover()
          .code(400);
      },
    },

    handler: async function (request, h) {
      try {
        const submissionEdit = request.payload;
        const submissionId = await request.params._id;
        const submission = await Submission.findById(submissionId);

        if (submissionEdit.projectType !== "") {
          submission.projectType = sanitizeHtml(submissionEdit.projectType);
        }

        if (submissionEdit.videoUrl !== "") {
          submission.videoUrl = sanitizeHtml(submissionEdit.videoUrl);
        }

        /*if (submissionEdit.projectType === "Other") {
          submission.projectType = sanitizeHtml(submissionEdit.projectType);
          await submission.save();
          console.log("Error updating Submission");
          return h.redirect("/submission-form", {
            title: "Specify Project Type",
            submission: submission,
          });
        }*/

        console.log(
          "Admin has added the following Video URL to " +
            submission.projectTitle +
            ":" +
            "\n" +
            submission.videoUrl +
            "\n"
        );
        await submission.save();
        return h.redirect("/admin");
      } catch (err) {
        console.log("Error updating Submission, so there is");
        return h.view("admin", {
          title: "Video URL Error",
          errors: [{ message: err.message }],
        });
      }
    },
    payload: {
      multipart: true,
      output: "data",
      maxBytes: 209715200,
      parse: true,
    },
  },

  showOther: {
    auth: false,
    handler: async function (request, h) {
      try {
        const users = await User.find().lean();
        const submissions = await Submission.find().lean();
        console.log("User has navigated to the 'Other' Project-Selection page");
        return h.view("other-form", { title: "Other Project Selection", users: users, submissions: submissions });
      } catch (err) {
        console.log("Error loading Showcase page");
        return h.view("admin", { errors: [{ message: err.message }] });
      }
    },
  },

  createHandBook: {
    auth: false,
    handler: async function (request, h) {
      try {
        const users = await User.find().lean();
        const merger = new PDFMerger();
        merger.add("./public/handbooks/DanShanahan.pdf");
        merger.add("./public/handbooks/JohnMullane.pdf");
        await merger.save("./public/handbooks/handbook.pdf");
        console.log("Handbook has been created");
        return h.view("admin", { title: "Admin", users: users });
      } catch (err) {
        console.log("Error creating handbook");
        return h.view("admin", { errors: [{ message: err.message }] });
      }
    },
  },
};

module.exports = Pdfs;

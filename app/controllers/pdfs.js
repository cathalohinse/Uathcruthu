"use strict";
const User = require("../models/user");
const Boom = require("@hapi/boom");
const Submission = require("../models/submission");
const Joi = require("@hapi/joi");
const sanitizeHtml = require("sanitize-html");
const imageDataURI = require("image-data-uri");
const { jsPDF } = require("jspdf");

const Pdfs = {
  jsPdf: {
    auth: false,
    handler: function (request, h) {
      console.log("js.PDF");
      return h.view("js-pdf", { title: "jspdf" });
    },
  },

  createPdf: {
    auth: false,
    handler: async function (request, h) {
      try {
        //const imgData = await imageDataURI.encodeFromFile("public/images/ITPL.png");
        const doc = new jsPDF("landscape");
        const user = await User.findById(request.params._id).lean();
        const submission = await Submission.findByUserId(user).lean();
        const personalPhotoImgData = await imageDataURI.encodeFromURL(submission.projectImage);
        const projectImageImgData = await imageDataURI.encodeFromURL(submission.personalPhoto);
        console.log("Created the following pdf: " + submission.projectTitle);
        console.log("Created pdf for: " + user.firstName);

        doc.addImage(personalPhotoImgData, "JPG", 100, 0, 30, 40);
        doc.addImage(projectImageImgData, "JPG", 0, 0, 30, 40);
        doc.text(submission.projectTitle, 10, 10);
        doc.save(user.firstName + user.lastName + ".pdf");
        return h.view("showcase-file", {
          title: "User's Submission",
          submission: submission,
        });
      } catch (err) {
        const user = await User.findById(request.params._id).lean();
        const submission = await Submission.findByUserId(user).lean();
        console.log("Error updating Submission");
        return h.view("showcase-file", {
          title: "Submission Error",
          user: user,
          submission: submission,
          errors: [{ message: err.message }],
        });
      }
    },
  },
};

module.exports = Pdfs;

"use strict";
const User = require("../models/user");
const Boom = require("@hapi/boom");
const Submission = require("../models/submission");
const Joi = require("@hapi/joi");
const sanitizeHtml = require("sanitize-html");
//import { jsPDF } from "jspdf";
const { jsPDF } = require("jspdf"); // will automatically load the node version

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
      const doc = new jsPDF("landscape");
      const user = await User.findById(request.params._id).lean();
      const submission = await Submission.findByUserId(user).lean();
      console.log("Created the following pdf: " + submission.projectTitle);
      console.log("Creaded pdf for: " + user.firstName);
      doc.text(submission.projectTitle, 10, 10);
      doc.save(user.firstName + user.lastName + ".pdf");
      return h.view("report", {
        title: "User's Submission",
        submission: submission,
      });
    },
  },
};

module.exports = Pdfs;

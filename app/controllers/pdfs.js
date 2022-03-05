"use strict";
const User = require("../models/user");
const Boom = require("@hapi/boom");
const Submission = require("../models/submission");
const Joi = require("@hapi/joi");
const sanitizeHtml = require("sanitize-html");
//import { jsPDF } from "jspdf";
const { jsPDF } = require("jspdf"); // will automatically load the node version

const doc = new jsPDF();
//doc.text("Hello there boy!", 10, 10);
//doc.save("a4.pdf"); // will save the file in the current working directory

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
      const user = await User.findById(request.params._id).lean();
      const submission = await Submission.findByUserId(user).lean();
      console.log("Created the following pdf: " + submission.projectTitle);
      console.log("Creaded pdf for: " + user.firstName);
      doc.text(submission.projectTitle, 10, 10);
      doc.save("Yop.pdf");
      return h.view("report", {
        title: "User's Submission",
        submission: submission,
        user: user,
      });
    },
  },
};

module.exports = Pdfs;

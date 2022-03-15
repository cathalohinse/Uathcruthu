"use strict";
const User = require("../models/user");
const Submission = require("../models/submission");
const imageDataURI = require("image-data-uri");
const { jsPDF } = require("jspdf");

const Pdfs = {
  createPdf: {
    auth: false,
    handler: async function (request, h) {
      try {
        const backgroundImgData = await imageDataURI.encodeFromFile("public/images/background.png");
        //const doc = new jsPDF("landscape");
        const doc = new jsPDF({ orientation: "landscape", compress: true });
        const user = await User.findById(request.params._id).lean();
        const submission = await Submission.findByUserId(user).lean();
        const personalPhotoImgData = await imageDataURI.encodeFromURL(submission.personalPhoto);
        const projectImageImgData = await imageDataURI.encodeFromURL(submission.projectImage);
        const youtubeImgData = await imageDataURI.encodeFromFile("public/images/youtube.png");
        console.log(
          user.firstName + " " + user.lastName + " has created the following pdf: " + submission.projectTitle
        );

        doc.addImage(backgroundImgData, "PNG", 0, 0, 300, 210);
        doc.addImage(personalPhotoImgData, "JPG", 5, 5, 50, 50); //originally w:30, h:40
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

        return h.redirect("/report", {
          title: "User's Submission",
          user: user,
          submission: submission,
        });
      } catch (err) {
        const user = await User.findById(request.params._id).lean();
        const submission = await Submission.findByUserId(user).lean();
        console.log("Error creating pdf");
        return h.view("report", {
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

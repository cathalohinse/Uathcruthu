"use strict";
const User = require("../models/user");
const Submission = require("../models/submission");
const AdminSubmission = require("../models/adminSubmission");
const imageDataURI = require("image-data-uri");
const ImageStore = require("./image-store");
const { jsPDF } = require("jspdf");
const Joi = require("@hapi/joi");
const sanitizeHtml = require("sanitize-html");
const PDFMerger = require("pdf-merger-js");
const pageDimensions = [338.582, 190.5];
//const pageDimensions = [297, 210];
//const pageDimensions = [210, 148.5];
//const pageDimensions = [148.5, 105];

const Pdfs = {
  createFullUserPdf: async function (request) {
    //////////////////////////////////////////////////////////////////////////////
    if ((await request.params) === undefined) {
      var user = await User.findById(request).lean();
    } else {
      var user = await User.findById(request.params._id).lean();
    }

    if ((await request.params) === undefined) {
      var submission = await Submission.findById(request).lean();
    } else {
      var creatingFullUserPdf = true;
      var submission = await Submission.findById(request.params._id).lean();
    }
    //////////////////////////////////////////////////////////////////////////////

    //const user = await User.findById(request.params._id).lean();
    //const submission = await Submission.findById(request.params._id).lean();
    const adminSubmissions = await AdminSubmission.find();
    const adminSubmission = await adminSubmissions[0];
    const doc = new jsPDF({ orientation: "landscape", compress: true, format: pageDimensions });
    if (adminSubmission && adminSubmission.studentBackgroundImage !== undefined) {
      var studentBackgroundImgData = await imageDataURI.encodeFromURL(adminSubmission.studentBackgroundImage);
    }
    const personalPhotoImgData = await imageDataURI.encodeFromURL(submission.personalPhoto);
    const projectImageImgData = await imageDataURI.encodeFromURL(submission.projectImage);
    const youtubeImgData = await imageDataURI.encodeFromFile("public/images/youtube.png");
    console.log(
      submission.firstName + " " + submission.lastName + " has created the following pdf: " + submission.projectTitle
    );
    if (adminSubmission && adminSubmission.studentBackgroundImage !== undefined) {
      doc.addImage(studentBackgroundImgData, "PNG", 0, 0, pageDimensions[0], pageDimensions[1]);
    }
    doc.addImage(
      personalPhotoImgData,
      "JPG",
      pageDimensions[0] / 50,
      pageDimensions[0] / 50,
      pageDimensions[0] / 6,
      pageDimensions[0] / 6
    );
    doc.addImage(
      projectImageImgData,
      "JPG",
      pageDimensions[0] / 50,
      pageDimensions[0] / 5.3,
      pageDimensions[0] / 2,
      pageDimensions[1] / 1.7
    );
    doc.setFontSize(30);
    doc.setFont(undefined, "bold");
    doc.text(submission.projectTitle, pageDimensions[0] / 5, pageDimensions[0] / 20);
    doc.setFont(undefined, "normal");
    doc.text(submission.descriptiveTitle, pageDimensions[0] / 5, pageDimensions[0] / 12, {
      maxWidth: pageDimensions[0] / 1.3,
    });
    doc.setFontSize(20);
    doc.text(submission.firstName + " " + submission.lastName, pageDimensions[0] / 5, pageDimensions[0] / 5.7);
    doc.setFontSize(15);
    doc.text(submission.summary, pageDimensions[0] / 1.85, pageDimensions[0] / 4.8, {
      maxWidth: pageDimensions[0] / 2.23,
    });
    doc.setTextColor(0, 102, 204);
    doc.textWithLink("Project Landing Page", pageDimensions[0] / 50, pageDimensions[1] / 1.04, {
      url: submission.projectUrl,
    });
    doc.setFontSize(20);
    doc.textWithLink("Video", pageDimensions[0] / 1.09, pageDimensions[1] / 1.08, { url: submission.videoUrl });
    doc.addImage(
      youtubeImgData,
      "PNG",
      pageDimensions[0] / 1.1,
      pageDimensions[1] / 1.16,
      pageDimensions[0] / 13.3,
      pageDimensions[0] / 13.3
    );
    doc.save("./public/handbooks/" + submission.firstName + submission.lastName + ".pdf");
    if (creatingFullUserPdf) {
      return doc;
    } else {
      return "./public/handbooks/" + submission.firstName + submission.lastName + ".pdf";
    }
  },

  createNdaUserPdf: async function (request) {
    if ((await request.params) === undefined) {
      var submission = await Submission.findById(request).lean();
    } else {
      var creatingNdaUserPdf = true;
      var submission = await Submission.findById(request.params._id).lean();
    }

    //const user = await User.findById(request.params._id).lean();
    //const submission = await Submission.findById(request.params._id).lean();
    const adminSubmissions = await AdminSubmission.find();
    const adminSubmission = await adminSubmissions[0];
    const doc = new jsPDF({ orientation: "landscape", compress: true, format: pageDimensions });
    if (adminSubmission && adminSubmission.studentBackgroundImage !== undefined) {
      var studentBackgroundImgData = await imageDataURI.encodeFromURL(adminSubmission.studentBackgroundImage);
    }
    const personalPhotoImgData = await imageDataURI.encodeFromURL(submission.personalPhoto);
    console.log(
      submission.firstName + " " + submission.lastName + " has created the following pdf: " + submission.projectTitle
    );
    if (adminSubmission && adminSubmission.studentBackgroundImage !== undefined) {
      doc.addImage(studentBackgroundImgData, "PNG", 0, 0, pageDimensions[0], pageDimensions[1]);
    }
    doc.addImage(
      personalPhotoImgData,
      pageDimensions[0] / 50,
      pageDimensions[0] / 50,
      pageDimensions[0] / 6,
      pageDimensions[0] / 6
    );
    doc.setFontSize(30);
    doc.setFont(undefined, "bold");
    doc.text("NDA", pageDimensions[0] / 5, pageDimensions[0] / 20);
    doc.setFont(undefined, "normal");
    doc.text("This project information is withheld under NDA", pageDimensions[0] / 5, pageDimensions[0] / 12, {
      maxWidth: pageDimensions[0] / 1.3,
    });
    doc.setFontSize(20);
    doc.text(submission.firstName + " " + submission.lastName, pageDimensions[0] / 5, pageDimensions[0] / 5.7);
    doc.save("./public/handbooks/" + submission.firstName + submission.lastName + ".pdf");
    if (creatingNdaUserPdf) {
      return doc;
    } else {
      return "./public/handbooks/" + submission.firstName + submission.lastName + ".pdf";
    }
    /*return h.view("submission-admin", {
      title: "User's Submission",
      user: user,
      submission: submission,
    });*/
  },

  createAdminPdf: async function (request) {
    if ((await request.params) === undefined) {
      var creatingHandbookPdf = true;
    }
    //const user = await User.findById(request.params._id).lean();
    const submissions = await Submission.find().lean();
    const projectTypes = await submissions.map((a) => a.projectType);
    const projectTypesUnique = [...new Set(projectTypes)];
    console.log("User is attempting to create admin handbook");
    //const submission = await Submission.findById(request.params._id).lean();
    const adminSubmissions = await AdminSubmission.find();
    const adminSubmission = await adminSubmissions[0];
    const doc = new jsPDF({ orientation: "landscape", compress: true, format: pageDimensions });
    const backgroundImgData = await imageDataURI.encodeFromURL(adminSubmission.backgroundImage);
    const courseImgData = await imageDataURI.encodeFromURL(adminSubmission.courseImage);
    const adminImg1Data = await imageDataURI.encodeFromURL(adminSubmission.adminImage1);
    const adminImg2Data = await imageDataURI.encodeFromURL(adminSubmission.adminImage2);
    const adminImg3Data = await imageDataURI.encodeFromURL(adminSubmission.adminImage3);
    doc.addImage(backgroundImgData, "PNG", 0, 0, pageDimensions[0], pageDimensions[1]);
    doc.setFontSize(pageDimensions[0] / 11);
    doc.text(adminSubmission.courseTitle, pageDimensions[0] / 40, pageDimensions[0] / 20, {
      maxWidth: pageDimensions[0] / 2,
    });
    doc.setFont(undefined, "normal");
    doc.setFontSize(pageDimensions[0] / 6);
    doc.setFont(undefined, "bold");
    doc.text(adminSubmission.handbookTitle, pageDimensions[0] / 1.9, pageDimensions[0] / 15, {
      maxWidth: pageDimensions[0] / 3,
    });
    doc.addImage(
      courseImgData,
      "PNG",
      pageDimensions[0] / 1.2,
      pageDimensions[1] / 25,
      pageDimensions[0] / 7,
      pageDimensions[0] / 7
    );
    doc.setFont(undefined, "normal");
    const endOfPage = pageDimensions[1] / 1.1;
    let i = 0;

    //loops through all unique projectTypes so as to find each submission that used that type
    var countColumn1 = 0;
    var countColumn2 = 0;
    while (i < projectTypesUnique.length) {
      let j = 0;
      doc.setFontSize(pageDimensions[0] / 13);

      if (pageDimensions[0] / 7 + countColumn1 * 8 > endOfPage) {
        countColumn2 += 1.5;
        doc.setTextColor(0, 102, 204);
        doc.text(projectTypesUnique[i], pageDimensions[0] / 1.9, pageDimensions[0] / 4 + countColumn2 * 8);
      } else {
        doc.setTextColor(0, 102, 204);
        doc.text(projectTypesUnique[i], pageDimensions[0] / 40, pageDimensions[0] / 7 + countColumn1 * 8);
      }
      while (j < submissions.length) {
        if (
          !submissions[j].submissionIncomplete &&
          submissions[j].projectType &&
          submissions[j].projectType === projectTypesUnique[i]
        ) {
          doc.setFontSize(pageDimensions[0] / 15);
          // if list reaches the end of the page, in order to prevent spill over, it is moved to the next column in the page

          if (pageDimensions[0] / 7 + countColumn1 * 8 > endOfPage) {
            countColumn2++;
            doc.setTextColor("black");
            doc.text(
              submissions[j].firstName + " " + submissions[j].lastName + " - " + submissions[j].projectTitle,
              pageDimensions[0] / 1.9,
              pageDimensions[0] / 4 + countColumn2 * 8,
              {
                maxWidth: pageDimensions[0] / 2.1,
              }
            );
          } else {
            countColumn1++;
            doc.setTextColor("black");
            doc.text(
              submissions[j].firstName + " " + submissions[j].lastName + " - " + submissions[j].projectTitle,
              pageDimensions[0] / 40,
              pageDimensions[0] / 7 + countColumn1 * 8,
              {
                maxWidth: pageDimensions[0] / 2.1,
              }
            );
          }
        }
        j++;

        //add a new page if the list is spilling off the existing page
        if (pageDimensions[0] / 4 + countColumn2 * 8 > endOfPage) {
          console.log("New Page added for long list of projects");
          doc.addPage();
          doc.addImage(backgroundImgData, "PNG", 0, 0, pageDimensions[0], pageDimensions[1]);
          doc.setFontSize(pageDimensions[0] / 11);
          doc.setTextColor("black");
          doc.text(adminSubmission.courseTitle, pageDimensions[0] / 40, pageDimensions[0] / 20, {
            maxWidth: pageDimensions[0] / 2,
          });
          doc.setFont(undefined, "normal");
          doc.setFontSize(pageDimensions[0] / 6);
          doc.setFont(undefined, "bold");
          doc.setTextColor("black");
          doc.text(adminSubmission.handbookTitle, pageDimensions[0] / 1.9, pageDimensions[0] / 15, {
            maxWidth: pageDimensions[0] / 3,
          });
          doc.addImage(
            courseImgData,
            "PNG",
            pageDimensions[0] / 1.2,
            pageDimensions[1] / 25,
            pageDimensions[0] / 7,
            pageDimensions[0] / 7
          );
          doc.setFont(undefined, "normal");
          countColumn1 = 0;
          countColumn2 = 0;
        }
      }
      countColumn1 += 1.5;
      i++;
    }

    doc.addPage();
    doc.addImage(backgroundImgData, "PNG", 0, 0, pageDimensions[0], pageDimensions[1]);
    doc.setFontSize(pageDimensions[0] / 11);
    doc.text(adminSubmission.courseTitleLong, pageDimensions[0] / 2, pageDimensions[0] / 15, "center");
    doc.textWithLink(adminSubmission.courseUrl, pageDimensions[0] / 2, pageDimensions[1] / 4, "center", {
      url: adminSubmission.courseUrl,
    });
    doc.addImage(
      courseImgData,
      "PNG",
      pageDimensions[0] / 20,
      pageDimensions[1] / 2,
      pageDimensions[0] / 6,
      pageDimensions[0] / 5
    );

    doc.addImage(
      adminImg1Data,
      "PNG",
      pageDimensions[0] / 1.25,
      pageDimensions[1] / 2,
      pageDimensions[0] / 6,
      pageDimensions[0] / 5
    );

    doc.addImage(
      adminImg2Data,
      "PNG",
      pageDimensions[0] / 4,
      pageDimensions[1] / 2,
      pageDimensions[0] / 2,
      pageDimensions[0] / 5
    );

    doc.addImage(
      adminImg3Data,
      "PNG",
      pageDimensions[0] / 20,
      pageDimensions[1] / 1.15,
      pageDimensions[0] / 1.11,
      pageDimensions[0] / 15
    );

    doc.save("./public/handbooks/" + adminSubmission.handbookTitle + ".pdf");
    const adminPdfNumPages = doc.internal.getNumberOfPages();
    console.log("New Handbook created with the following amount of pages: " + doc.internal.getNumberOfPages());
    //return doc;
    /*return h.view("handbook-form", {
      title: "User's Submission",
      user: user,
      adminSubmission: adminSubmission,
    });*/
    if (creatingHandbookPdf) {
      return "./public/handbooks/" + adminSubmission.handbookTitle + ".pdf";
    } else {
      return doc;
    }
  },

  createHandbookPdf: async function (request, h) {
    /*const users = await User.find().lean();
        const submissions = await Submission.find().lean();
        const projectTypes = await submissions.map((a) => a.projectType);
        const projectTypesUnique = [...new Set(projectTypes)];
        console.log(projectTypesUnique);
        const merger = new PDFMerger();
        const adminSubmissions = await AdminSubmission.find().lean();
        const adminSubmission = await adminSubmissions[0];
        const backgroundImgData = await imageDataURI.encodeFromURL(adminSubmission.backgroundImage);
        const endOfPage = pageDimensions[1] / 1.25;

        const fs = require("fs");
        const pdf = require("pdf-parse");*/
    let dataBuffer = fs.readFileSync("./public/handbooks/Project Showcase 2022.pdf");
    const numPages = await pdf(dataBuffer).then(function (data) {
      return data.numpages;
    });

    let arrayPages = [];
    let l = numPages;
    console.log("l = " + l);
    while (l > 0) {
      arrayPages.push(l);
      l--;
    }
    arrayPages.reverse();

    console.log("number of pages: " + numPages);
    console.log("array of pages: " + arrayPages);

    await merger.add("./public/handbooks/Project Showcase 2022.pdf", arrayPages.slice(0, -1));
    let i = 0;

    //loops through all unique projectTypes so as to create one page for each type
    while (i < projectTypesUnique.length) {
      let count = 0;
      const doc = new jsPDF({ orientation: "landscape", compress: true, format: pageDimensions });
      doc.addImage(backgroundImgData, "PNG", 0, 0, pageDimensions[0], pageDimensions[1]);

      let j = 0;
      doc.setFontSize(30);
      doc.setFont(undefined, "bold");
      doc.text(projectTypesUnique[i], pageDimensions[0] / 2, pageDimensions[1] / 1.12, "center");
      doc.setFontSize(18);
      doc.setFont(undefined, "normal");
      doc.text(adminSubmission.courseTitleLong, pageDimensions[0] / 2, pageDimensions[1] / 1.05, "center");
      //loops through all submissions, and adds the user name of which ever ones belong to the projectType to that page
      while (j < submissions.length) {
        if (!submissions[j].submissionIncomplete && submissions[j].projectType === projectTypesUnique[i]) {
          count++;
          doc.text(
            submissions[j].presentationTime + " " + submissions[j].firstName + " " + submissions[j].lastName,
            pageDimensions[0] / 40,
            pageDimensions[0] / 20 + count * 8
          );
          doc.setFont(undefined, "normal");
          doc.text(
            submissions[j].projectTitle + " - " + submissions[j].descriptiveTitle,
            pageDimensions[0] / 40,
            pageDimensions[0] / 15 + count * 8
          );
          count += 1.5;
        }

        //add new page
        if (pageDimensions[0] / 20 + count * 8 > endOfPage) {
          doc.addPage();
          doc.addImage(backgroundImgData, "PNG", 0, 0, pageDimensions[0], pageDimensions[1]);
          doc.setFontSize(30);
          doc.setFont(undefined, "bold");
          doc.text(projectTypesUnique[i], pageDimensions[0] / 2, pageDimensions[1] / 1.12, "center");
          doc.setFontSize(18);
          doc.setFont(undefined, "normal");
          doc.text(adminSubmission.courseTitleLong, pageDimensions[0] / 2, pageDimensions[1] / 1.05, "center");
          count = 0;
        }
        j++;
      }
      doc.save("./public/handbooks/temp.pdf");
      merger.add("./public/handbooks/temp.pdf");
      let k = 0;
      while (k < submissions.length) {
        //loops through all submissions and adds the submission pdf page into the handbook in the section pertaining to the appropriate projectType
        if (!submissions[k].submissionIncomplete && submissions[k].projectType === projectTypesUnique[i]) {
          merger.add("./public/handbooks/" + submissions[k].firstName + submissions[k].lastName + ".pdf");
        }
        k++;
      }
      i++;
    }

    merger.add("./public/handbooks/Project Showcase 2022.pdf", arrayPages.slice(-1));
    await merger.save("./public/handbooks/handbook.pdf");
    console.log("Handbook has now been created");
    console.log("Number of users: " + users.length);
    console.log("First User: " + users[0]);
    console.log("New Handbook created");
  },
};

module.exports = Pdfs;

"use strict";
const Submission = require("../models/submission");
const AdminSubmission = require("../models/adminSubmission");
const imageDataURI = require("image-data-uri");
const { jsPDF } = require("jspdf");
//Select the desired page dimensions from the options below. All pdf coordinates are relative (not absolute),
//and therefore adapt to the pages dimensions.
const pageDimensions = [338.582, 190.5];
//const pageDimensions = [297, 210];
//const pageDimensions = [210, 148.5];
//const pageDimensions = [148.5, 105];

const Pdfs = {
  //This was one of many, many tools that I used to try to make http requests to the server while running the 'createHandbook' function.
  //This was to keep Heroku from timing out after 30 seconds, as this is non-configurable, and the 'createHandbook' function is far longer than 30 seconds.
  refresh: async function (request, h) {
    const testFolder = "./public/handbooks/";
    const fs = require("fs");
    fs.readdir(testFolder, (err, files) => {
      files.forEach((file) => {
        //console.log("The following files have been created: " + file);
      });
    });
  },

  createFullUserPdf: async function (request) {
    //If this function is being accessed directly from the submission-admin screen (i.e. if it is being accessed to create one specific user pdf)
    //It will use the http request with the submission._id contained in the URL parameter.
    //Otherwise, if it is being accessed from the 'createHandbook' function, it will not pass a http request,
    //but it will pass the submission details directly from the submission object. Therefore, this allows for both eventualities.
    if ((await request.params) === undefined) {
      var submission = await Submission.findById(request).lean();
    } else {
      //This boolean is in place so that the return value can be configured based on whether or not this function is called directly or indirectly.
      var creatingFullUserPdf = true;
      var submission = await Submission.findById(request.params._id).lean();
    }
    console.log("Creating User pdf for " + submission.firstName + " " + submission.lastName + "...");

    const adminSubmissions = await AdminSubmission.find();
    const adminSubmission = await adminSubmissions[0];
    const doc = new jsPDF({ orientation: "landscape", compress: true, format: pageDimensions });
    if (adminSubmission && adminSubmission.studentBackgroundImage !== undefined) {
      var studentBackgroundImgData = await imageDataURI.encodeFromURL(adminSubmission.studentBackgroundImage);
    }
    const personalPhotoImgData = await imageDataURI.encodeFromURL(submission.personalPhoto);
    const projectImageImgData = await imageDataURI.encodeFromURL(submission.projectImage);
    const youtubeImgData = await imageDataURI.encodeFromFile("public/images/youtube.png");
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
    console.log(
      "Project: " +
        submission.projectTitle +
        ", has been created for " +
        submission.firstName +
        " " +
        submission.lastName
    );
    //If this is not being accessed directly, it cannot be returned as a variable, because there would already be a doc variable in the
    // calling method. Therefore it needs to be sent to the cache from where it can be accessed for the remainder of the calling method
    if (creatingFullUserPdf) {
      return doc;
    } else {
      return "./public/handbooks/" + submission.firstName + submission.lastName + ".pdf";
    }
  },

  createNdaUserPdf: async function (request) {
    //If this function is being accessed directly from the submission-admin screen (i.e. if it is being accessed to create one specific user pdf)
    //It will use the http request with the submission._id contained in the URL parameter.
    //Otherwise, if it is being accessed from the 'createHandbook' function, it will not pass a http request,
    //but it will pass the submission details directly from the submission object. Therefore, this allows for both eventualities.
    if ((await request.params) === undefined) {
      var submission = await Submission.findById(request).lean();
    } else {
      //This boolean is in place so that the return value can be configured based on whether or not this function is called directly or indirectly.
      var creatingNdaUserPdf = true;
      var submission = await Submission.findById(request.params._id).lean();
    }
    console.log("Creating User pdf for " + submission.firstName + " " + submission.lastName + "...");
    const adminSubmissions = await AdminSubmission.find();
    const adminSubmission = await adminSubmissions[0];
    const doc = new jsPDF({ orientation: "landscape", compress: true, format: pageDimensions });
    if (adminSubmission && adminSubmission.studentBackgroundImage !== undefined) {
      var studentBackgroundImgData = await imageDataURI.encodeFromURL(adminSubmission.studentBackgroundImage);
    }
    const personalPhotoImgData = await imageDataURI.encodeFromURL(submission.personalPhoto);
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
    console.log(
      "Project: " +
        submission.projectTitle +
        ", has been created for " +
        submission.firstName +
        " " +
        submission.lastName
    );
    //If this is not being accessed directly, it cannot be returned as a variable, because there would already be a doc variable in the
    //calling method. Therefore it needs to be sent to the cache from where it can be accessed for the remainder of the calling method
    if (creatingNdaUserPdf) {
      return doc;
    } else {
      return "./public/handbooks/" + submission.firstName + submission.lastName + ".pdf";
    }
  },

  createAdminPdf: async function (request) {
    console.log("Creating Admin pdf...");
    //If this function is being accessed directly from the handbook-form screen (i.e. if it is being accessed to create the admin pdf only, and not as part of the handbook)
    //It will use the http request with the submission._id contained in the URL parameter.
    //Otherwise, if it is being accessed from the 'createHandbook' function, it will not pass a http request,
    //but it will pass the adminSubmission details directly from the adminSubmission object. Therefore, this allows for both eventualities.
    if ((await request.params) === undefined) {
      //This boolean is in place so that the return value can be configured based on whether or not this function is called directly or indirectly.
      var creatingHandbookPdf = true;
    }
    const submissions = await Submission.find().lean();
    //Because an array of project types would contain each instance of that project type, it is necessary ot create
    //an array of unique project types, i.e. just one instance of each project type.
    //In this way, all projectType specific submission can be grouped together in the same page.
    //Otherwise the pdf would have an entire page to introduce each and every user submission.
    const projectTypes = await submissions.map((a) => a.projectType);
    const projectTypesUnique = [...new Set(projectTypes)];
    console.log("Array of Project Types: " + projectTypesUnique);
    //In cases where the user has not yet selected a project Type, an null value is stored in the project type array.
    //This must be removed, otherwise there is a blank page created for the pdf to represent that 'project type'.
    const indexOfEmpty = projectTypesUnique.indexOf("");
    if (indexOfEmpty > -1) {
      projectTypesUnique.splice(indexOfEmpty, 1);
    }
    console.log("Updated Array of Project Types: " + projectTypesUnique);
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

          //If list reaches the end of the page, in order to prevent spill over, it is moved to the next column in the page
          if (pageDimensions[0] / 7 + countColumn1 * 8 > endOfPage) {
            countColumn2++;
            doc.setTextColor("black");
            if (submissions[j].nda) {
              doc.text(
                submissions[j].firstName + " " + submissions[j].lastName,
                pageDimensions[0] / 1.9,
                pageDimensions[0] / 4 + countColumn2 * 8,
                {
                  maxWidth: pageDimensions[0] / 2.1,
                }
              );
            } else {
              doc.text(
                submissions[j].firstName + " " + submissions[j].lastName + " - " + submissions[j].projectTitle,
                pageDimensions[0] / 1.9,
                pageDimensions[0] / 4 + countColumn2 * 8,
                {
                  maxWidth: pageDimensions[0] / 2.1,
                }
              );
            }
          } else {
            countColumn1++;
            doc.setTextColor("black");
            if (submissions[j].nda) {
              doc.text(
                submissions[j].firstName + " " + submissions[j].lastName,
                pageDimensions[0] / 40,
                pageDimensions[0] / 7 + countColumn1 * 8,
                {
                  maxWidth: pageDimensions[0] / 2.1,
                }
              );
            } else {
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
        }
        j++;

        //Add a new page if the list is spilling off the existing page
        if (pageDimensions[0] / 4 + countColumn2 * 8 > endOfPage) {
          doc.addPage();
          console.log(
            "New Page has been added, due to long list of projects - adminPdf now contains " +
              doc.internal.getNumberOfPages() +
              " pages."
          );
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
    console.log("New AdminPdf created with " + doc.internal.getNumberOfPages() + " pages.");
    //If this is not being accessed directly, it cannot be returned as a variable, because there would already be a doc variable in the
    //calling method. Therefore it needs to be sent to the cache from where it can be accessed for the remainder of the calling method
    if (creatingHandbookPdf) {
      return "./public/handbooks/" + adminSubmission.handbookTitle + ".pdf";
    } else {
      return doc;
    }
  },
};

module.exports = Pdfs;

"use strict";
const User = require("../models/user");
const Submission = require("../models/submission");
const AdminSubmission = require("../models/adminSubmission");
const imageDataURI = require("image-data-uri");
const ImageStore = require("../utils/image-store");
const { jsPDF } = require("jspdf");
//const Deadline = require("../controllers/accounts");
const Joi = require("@hapi/joi");
const sanitizeHtml = require("sanitize-html");
const PDFMerger = require("pdf-merger-js");
//const pageDimensions = [338.582, 190.5];
const pageDimensions = [297, 210];

const Pdfs = {
  createPdfUser: {
    auth: false,
    handler: async function (request, h) {
      const user = await User.findById(request.params._id).lean();
      //const submission = await Submission.findByUserId(user).lean();
      const submission = await Submission.findById(request.params._id).lean();
      const adminSubmissions = await AdminSubmission.find();
      const adminSubmission = await adminSubmissions[0];
      if (!submission.nda) {
        try {
          //const backgroundImgData = await imageDataURI.encodeFromFile("public/images/background.png");

          //const doc = new jsPDF("landscape");
          const doc = new jsPDF({ orientation: "landscape", compress: true, format: pageDimensions });
          //const user = await User.findById(request.params._id).lean();
          //const submission = await Submission.findByUserId(user).lean();
          if (adminSubmission && adminSubmission.studentBackgroundImage !== undefined) {
            var studentBackgroundImgData = await imageDataURI.encodeFromURL(adminSubmission.studentBackgroundImage);
          }
          const personalPhotoImgData = await imageDataURI.encodeFromURL(submission.personalPhoto);
          const projectImageImgData = await imageDataURI.encodeFromURL(submission.projectImage);
          const youtubeImgData = await imageDataURI.encodeFromFile("public/images/youtube.png");
          console.log(
            submission.firstName +
              " " +
              submission.lastName +
              " has created the following pdf: " +
              submission.projectTitle
          );
          //doc.text(submission.projectUrl, 5, 207); //a very awkward work around for validation of the URL requirement
          //doc.text(submission.videoUrl, 276, 202); //a very awkward work around for validation of the URL requirement
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
          ); //originally w:30, h:40
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
          //doc.text(submission.projectTitle, 70, 20);
          doc.text(submission.projectTitle, pageDimensions[0] / 5, pageDimensions[0] / 20);
          doc.setFont(undefined, "normal");
          //doc.text(submission.descriptiveTitle, pageDimensions[0] / 5, pageDimensions[1] / 6.5, {
          doc.text(submission.descriptiveTitle, pageDimensions[0] / 5, pageDimensions[0] / 12, {
            maxWidth: pageDimensions[0] / 1.3,
          });
          doc.setFontSize(20);
          //doc.text(submission.firstName + " " + submission.lastName, pageDimensions[0] / 5, pageDimensions[1] / 3.2);
          doc.text(submission.firstName + " " + submission.lastName, pageDimensions[0] / 5, pageDimensions[0] / 5.7);
          doc.setFontSize(15);
          doc.text(submission.summary, pageDimensions[0] / 1.85, pageDimensions[0] / 4.8, {
            maxWidth: pageDimensions[0] / 2.23,
          });
          doc.setTextColor(0, 102, 204);
          //doc.textWithLink("Project Landing Page", pageDimensions[0] / 50, pageDimensions[0] / 1.83, {
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
          return h.view("submission-admin", {
            title: "User's Submission",
            user: user,
            submission: submission,
          });
        } catch (err) {
          const user = await User.findById(request.params._id).lean();
          //const submission = await Submission.findByUserId(user).lean();
          // const submission = await Submission.findById(request.params._id).lean();
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
          //const backgroundImgData = await imageDataURI.encodeFromFile("public/images/background.png");
          //const doc = new jsPDF("landscape");
          const doc = new jsPDF({ orientation: "landscape", compress: true, format: pageDimensions });
          //const user = await User.findById(request.params._id).lean();
          //const submission = await Submission.findByUserId(user).lean();
          if (adminSubmission && adminSubmission.studentBackgroundImage !== undefined) {
            var studentBackgroundImgData = await imageDataURI.encodeFromURL(adminSubmission.studentBackgroundImage);
          }
          const personalPhotoImgData = await imageDataURI.encodeFromURL(submission.personalPhoto);
          console.log(
            submission.firstName +
              " " +
              submission.lastName +
              " has created the following pdf: " +
              submission.projectTitle
          );
          if (adminSubmission && adminSubmission.studentBackgroundImage !== undefined) {
            doc.addImage(studentBackgroundImgData, "PNG", 0, 0, pageDimensions[0], pageDimensions[1]);
          }
          //doc.addImage(backgroundImgData, "PNG", 0, 0, 300, 210);
          doc.addImage(
            personalPhotoImgData,
            pageDimensions[0] / 50,
            pageDimensions[0] / 50,
            pageDimensions[0] / 6,
            pageDimensions[0] / 6
          ); //originally w:30, h:40
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
          return h.view("submission-admin", {
            title: "User's Submission",
            user: user,
            submission: submission,
          });
        } catch (err) {
          const user = await User.findById(request.params._id).lean();
          //const submission = await Submission.findByUserId(user).lean();
          const submission = await Submission.findById(request.params._id).lean();
          console.log("Error creating pdf");
          return h.view("submission-admin", {
            title: "Submission Error",
            user: user,
            submission: submission,
            //errors: [{ message: "Personal Picture required" }],
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
        //const deadline = await Deadline.deadline();
        const userId = await request.params._id;
        const user = await User.findById(userId).lean();
        const submissionId = await request.params._id;
        const submission = await Submission.findById(submissionId).lean();
        //const submission = await Submission.findByUserId(user).lean();
        console.log(
          submission.firstName + " has navigated/been redirected to " + submission.projectTitle + " report page"
        );
        return h.view("submission-admin", {
          title: submission.firstName + "'s Submission",
          submission: submission,
          user: user,
          today: today,
          //deadline: deadline,
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
        presentationTime: Joi.string().allow(""),
        submissionIncomplete: Joi.boolean,
      },
      options: {
        abortEarly: false,
      },
      failAction: async function (request, h, error) {
        const userId = await request.request.params._id;
        const user = await User.findById(userId);
        //const submission = await Submission.findByUserId(user).lean();
        const submission = await Submission.findById(request.params._id).lean();
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
        const userId = await request.params._id;
        const user = await User.findById(userId).lean();

        if (submissionEdit.projectType !== "") {
          submission.projectType = sanitizeHtml(submissionEdit.projectType);
        }

        if (submissionEdit.videoUrl !== "") {
          submission.videoUrl = sanitizeHtml(submissionEdit.videoUrl);
        }

        if (submissionEdit.presentationTime !== "") {
          submission.presentationTime = sanitizeHtml(submissionEdit.presentationTime);
        }

        submission.submissionIncomplete = submissionEdit.submissionIncomplete;
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
        return h.view("submission-admin", {
          //return h.redirect("/submission-admin", {
          title: "Video URL Error",
          user: user,
          submission: await Submission.findById(submissionId).lean(),
        });
        //return h.redirect("/submission-admin");
      } catch (err) {
        const userId = await request.params._id;
        const user = await User.findById(userId).lean();
        const submissionId = await request.params._id;
        const submission = await Submission.findById(submissionId);
        console.log("Error updating Submission, so there is");
        return h.view("submission-admin", {
          //return h.redirect("/submission-admin", {
          title: "Video URL Error",
          errors: [{ message: err.message }],
          user: user,
          submission: submission,
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

  showHandbookForm: {
    auth: false,
    handler: async function (request, h) {
      try {
        const users = await User.find().lean();
        const submissions = await Submission.find().lean();
        console.log("User has navigated to the Admin Submission Page");
        const adminSubmissions = await AdminSubmission.find().lean();
        var adminSubmission = null;
        if (adminSubmissions.length === 0) {
          var adminSubmission = new AdminSubmission();
        } else {
          var adminSubmission = await adminSubmissions[0];
        }
        return h.view("handbook-form", {
          title: "Other Project Selection",
          adminSubmission: adminSubmission,
          users: users,
          submissions: submissions,
        });
      } catch (err) {
        console.log("Error loading Showcase page");
        return h.view("admin", { errors: [{ message: err.message }] });
      }
    },
  },

  ////////////////////////////////////////////////////////////////////////////

  createPdfAdmin: {
    auth: false,
    handler: async function (request, h) {
      const user = await User.findById(request.params._id).lean();
      //const adminSubmission = await Submission.findByUserId(user).lean();

      const users = await User.find().lean();
      const submissions = await Submission.find().lean();
      const projectTypes = await submissions.map((a) => a.projectType);
      const projectTypesUnique = [...new Set(projectTypes)];
      console.log("User is attempting to create admin handbook");
      const adminSubmissions = await AdminSubmission.find().lean();
      const adminSubmission = await adminSubmissions[0];

      try {
        //const backgroundImgData = await imageDataURI.encodeFromFile("public/images/background.png");
        //const doc = new jsPDF("landscape");
        const doc = new jsPDF({ orientation: "landscape", compress: true, format: pageDimensions });
        //const user = await User.findById(request.params._id).lean();
        //const adminSubmission = await Submission.findByUserId(user).lean();
        const backgroundImgData = await imageDataURI.encodeFromURL(adminSubmission.backgroundImage);
        const courseImgData = await imageDataURI.encodeFromURL(adminSubmission.courseImage);
        doc.addImage(backgroundImgData, "PNG", 0, 0, pageDimensions[0], pageDimensions[1]);
        doc.setFontSize(30);
        doc.text(adminSubmission.courseTitle, pageDimensions[0] / 40, pageDimensions[0] / 20, {
          maxWidth: pageDimensions[0] / 2,
        });
        doc.setFont(undefined, "normal");
        doc.setFontSize(50);
        doc.setFont(undefined, "bold");
        doc.text(adminSubmission.handbookTitle, pageDimensions[0] / 1.8, pageDimensions[0] / 15, {
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
        doc.setFontSize(20);
        doc.setFont(undefined, "normal");
        //doc.text(adminSubmission.deadline, 70, 60);

        ///////////////////////////////////////////////////////////////////////////
        let i = 0;

        //loops through all unique projectTypes so as to create one page for each type
        var count = 0;
        while (i < projectTypesUnique.length) {
          let j = 0;
          doc.text(projectTypesUnique[i], pageDimensions[0] / 40, pageDimensions[0] / 8 + count * 7);
          while (j < submissions.length) {
            if (
              !submissions[j].submissionIncomplete &&
              submissions[j].projectType &&
              submissions[j].projectType === projectTypesUnique[i]
            ) {
              count++;
              doc.text(
                submissions[j].firstName + " " + submissions[j].lastName + " - " + submissions[j].projectTitle,
                pageDimensions[0] / 40,
                pageDimensions[0] / 8 + count * 7,
                {
                  maxWidth: pageDimensions[0] / 2,
                }
              );
            }
            j++;
          }
          count++;
          i++;
        }

        //////////////////////////////////////////////////////////////////////////

        doc.addPage();
        doc.setTextColor(0, 102, 204);
        doc.textWithLink(adminSubmission.courseUrl, 5, 207, { url: adminSubmission.courseUrl });
        doc.setFontSize(20);
        doc.text(adminSubmission.courseTitleLong, 70, 20);
        doc.save("./public/handbooks/" + adminSubmission.handbookTitle + ".pdf");
        console.log("New Handbook created");
        return h.view("handbook-form", {
          title: "User's Submission",
          user: user,
          adminSubmission: adminSubmission,
        });
      } catch (err) {
        const adminSubmissions = await AdminSubmission.find().lean();
        const adminSubmission = await adminSubmissions[0];
        console.log("Error creating admin pdf");
        return h.view("handbook-form", {
          title: "Admin pdf Creation Error",
          user: user,
          adminSubmission: adminSubmission,
          errors: [{ message: err.message }],
        });
      }
    },
  },

  /////////////////////////////////////////////////////////////////////////

  createHandBook: {
    auth: false,
    handler: async function (request, h) {
      try {
        const users = await User.find().lean();
        const submissions = await Submission.find().lean();
        const projectTypes = await submissions.map((a) => a.projectType);
        const projectTypesUnique = [...new Set(projectTypes)];
        console.log(projectTypesUnique);
        const merger = new PDFMerger();

        merger.add("./public/handbooks/Project Showcase 2022.pdf", [1]);
        let i = 0;

        //loops through all unique projectTypes so as to create one page for each type
        while (i < projectTypesUnique.length) {
          const doc = new jsPDF({ orientation: "landscape", compress: true, format: pageDimensions });
          let j = 0;

          doc.text(projectTypesUnique[i], 70, 20);
          //loops through all submissions, and adds the user name of which ever ones belong to the projectType to that page
          while (j < submissions.length) {
            if (!submissions[j].submissionIncomplete && submissions[j].projectType === projectTypesUnique[i]) {
              doc.text(submissions[j].firstName, 70, 50 + j * 10);
              doc.text(submissions[j].presentationTime, 60, 50 + j * 10);
              //merger.add("./public/handbooks/" + submissions[j].firstName + submissions[j].lastName + ".pdf");
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

        merger.add("./public/handbooks/Project Showcase 2022.pdf", [2]);
        await merger.save("./public/handbooks/handbook.pdf");
        console.log("Handbook has now been created");
        console.log("Number of handbooks: " + users.length);
        console.log("First User: " + users[0]);
        console.log("New Handbook created");
        return h.view("admin", { title: "Admin", users: users, submissions: submissions });
      } catch (err) {
        const users = await User.find().lean();
        const submissions = await Submission.find().lean();
        console.log("Error creating handbook");
        return h.view("admin", {
          title: "Admin",
          users: users,
          submissions: submissions,
          errors: [{ message: err.message }],
        });
      }
    },
  },

  /*deadline: async function () {
    const deadline = await Math.floor(new Date("2022.04.10").getTime() / 1000);
    return deadline;
  },*/

  /////////////////////////////////////////////////////////////////////////////////////////

  adminSubmit: {
    //auth: false,
    validate: {
      payload: {
        courseTitle: Joi.string().allow("").min(4),
        handbookTitle: Joi.string().allow(""),
        courseImage: Joi.any().allow(""),
        backgroundImage: Joi.any().allow(""),
        studentBackgroundImage: Joi.any().allow(""),
        courseTitleLong: Joi.string().allow(""),
        courseUrl: Joi.string().allow(""),
        deadline: Joi.string().allow(""),
      },
      options: {
        abortEarly: false,
      },
      failAction: async function (request, h, error) {
        const userId = await request.auth.credentials.id;
        const user = await User.findById(userId);
        //const submission = await Submission.findByUserId(user).lean();
        const submission = await Submission.findById(request.params._id).lean();
        console.log("User has entered unacceptable data for admin submission");
        return h
          .view("handbook-form", {
            title: "Submission Error",
            errors: error.details,
            //submission: submission,
          })
          .takeover()
          .code(400);
      },
    },

    handler: async function (request, h) {
      try {
        const userId = await request.auth.credentials.id;
        const user = await User.findById(userId);
        const adminSubmissionEdit = request.payload;
        //const adminSubmission = await AdminSubmission.findByUserId(user);
        //let AdminSubmission();
        //if adminSubmission = undefined
        const adminSubmissions = await AdminSubmission.find();
        var adminSubmission = null;

        if (adminSubmissions.length === 0) {
          var adminSubmission = new AdminSubmission();
          console.log("A new handbook has been created: " + adminSubmission);
        } else {
          var adminSubmission = await adminSubmissions[0];
          console.log("Existing handbook will be edited: " + adminSubmission.handbookTitle);
        }

        if (adminSubmissionEdit.courseTitle !== "") {
          adminSubmission.courseTitle = sanitizeHtml(adminSubmissionEdit.courseTitle);
        }
        if (adminSubmissionEdit.handbookTitle !== "") {
          adminSubmission.handbookTitle = sanitizeHtml(adminSubmissionEdit.handbookTitle);
        }

        if (adminSubmissionEdit.courseImage.length !== undefined) {
          //Extracting the public_id from the previously submitted image url,
          //so that I can delete the previously submitted image and not clog up cloudinary with excessive images
          if (adminSubmission.courseImage !== undefined) {
            const courseImageFileName = await adminSubmission.courseImage.substr(
              adminSubmission.courseImage.lastIndexOf("/") + 1
            );
            const courseImagePublic_id = await courseImageFileName.substr(0, courseImageFileName.indexOf("."));
            await ImageStore.deleteImage(courseImagePublic_id);
          }
          const courseImageResult = await ImageStore.uploadImage(adminSubmissionEdit.courseImage); //consider re-ordering images to maintain consistency
          const courseImageUrl = await courseImageResult.url;
          adminSubmission.courseImage = await courseImageUrl;
        }

        if (adminSubmissionEdit.backgroundImage.length !== undefined) {
          //Extracting the public_id from the previously submitted image url,
          //so that I can delete the previously submitted image and not clog up cloudinary with excessive images
          if (adminSubmission.backgroundImage !== undefined) {
            const backgroundImageFileName = await adminSubmission.backgroundImage.substr(
              adminSubmission.backgroundImage.lastIndexOf("/") + 1
            );
            const backgroundImagePublic_id = await backgroundImageFileName.substr(
              0,
              backgroundImageFileName.indexOf(".")
            );
            await ImageStore.deleteImage(backgroundImagePublic_id);
          }
          const backgroundImageResult = await ImageStore.uploadImage(adminSubmissionEdit.backgroundImage); //consider re-ordering images to maintain consistency
          const backgroundImageUrl = await backgroundImageResult.url;
          adminSubmission.backgroundImage = await backgroundImageUrl;
        }

        if (adminSubmissionEdit.studentBackgroundImage.length !== undefined) {
          //Extracting the public_id from the previously submitted image url,
          //so that I can delete the previously submitted image and not clog up cloudinary with excessive images
          if (adminSubmission.studentBackgroundImage !== undefined) {
            const studentBackgroundImageFileName = await adminSubmission.studentBackgroundImage.substr(
              adminSubmission.studentBackgroundImage.lastIndexOf("/") + 1
            );
            const studentBackgroundImagePublic_id = await studentBackgroundImageFileName.substr(
              0,
              studentBackgroundImageFileName.indexOf(".")
            );
            await ImageStore.deleteImage(studentBackgroundImagePublic_id);
          }
          const studentBackgroundImageResult = await ImageStore.uploadImage(adminSubmissionEdit.studentBackgroundImage); //consider re-ordering images to maintain consistency
          const studentBackgroundImageUrl = await studentBackgroundImageResult.url;
          adminSubmission.studentBackgroundImage = await studentBackgroundImageUrl;
        }

        if (adminSubmissionEdit.courseTitleLong !== "") {
          adminSubmission.courseTitleLong = sanitizeHtml(adminSubmissionEdit.courseTitleLong);
        }
        if (adminSubmissionEdit.courseUrl !== "") {
          adminSubmission.courseUrl = sanitizeHtml(adminSubmissionEdit.courseUrl);
        }

        if (adminSubmissionEdit.deadline !== "") {
          //var deadlineFormat = sanitizeHtml(adminSubmissionEdit.deadline);
          //adminSubmission.deadline = await Math.floor(new Date(deadlineFormat).getTime() / 1000);
          adminSubmission.deadline = sanitizeHtml(adminSubmissionEdit.deadline);
        }

        /*if (submissionEdit.videoUrl !== "") {
          submission.videoUrl = sanitizeHtml(submissionEdit.videoUrl);
        }*/

        /*if (submissionEdit.projectType === "Other") {
          submission.projectTypeOther = true;
          console.log("Other: " + submission.projectTypeOther);
          submission.projectType = sanitizeHtml(submissionEdit.projectType);
          await submission.save();
          console.log("If Project Type is 'Other', please specify");
          return h.redirect("/submission-form", {
            title: "Specify Project Type",
            submission: submission,
          });
        }*/

        console.log("New AdminSubmission: " + adminSubmission.handbookTitle);
        await adminSubmission.save();
        console.log("User has submitted admin pages");
        return h.redirect("/handbook-form", { adminSubmission: adminSubmission });
      } catch (err) {
        console.log("Error submitting admin pages");
        return h.view("admin", {
          title: "Submission Error",
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

  /////////////////////////////////////////////////////////////////////////////////////////
};

module.exports = Pdfs;

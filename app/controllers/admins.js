"use strict";
const User = require("../models/user");
const Submission = require("../models/submission");
const AdminSubmission = require("../models/adminSubmission");
const imageDataURI = require("image-data-uri");
const ImageStore = require("../utils/image-store");
const { jsPDF } = require("jspdf");
const Joi = require("@hapi/joi");
const sanitizeHtml = require("sanitize-html");
const PDFMerger = require("pdf-merger-js");
const pageDimensions = [338.582, 190.5];
const Pdfs = require("../utils/pdfs");
//const pageDimensions = [297, 210];
//const pageDimensions = [210, 148.5];
//const pageDimensions = [148.5, 105];

const Admins = {
  createPdfUser: {
    auth: false,
    handler: async function (request, h) {
      const user = await User.findById(request.params._id).lean();
      const submission = await Submission.findById(request.params._id).lean();
      const adminSubmissions = await AdminSubmission.find();
      const adminSubmission = await adminSubmissions[0];
      if (!submission.nda) {
        try {
          console.log("testRequest: " + request + " " + request.params._id + " " + request.params.firstName);
          await Pdfs.createFullUserPdf(request);

          return h.view("submission-admin", {
            title: "User's Submission",
            user: user,
            submission: submission,
          });
        } catch (err) {
          const user = await User.findById(request.params._id).lean();
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
          await Pdfs.createNdaUserPdf(request);

          return h.view("submission-admin", {
            title: "User's Submission",
            user: user,
            submission: submission,
          });
        } catch (err) {
          const user = await User.findById(request.params._id).lean();
          const submission = await Submission.findById(request.params._id).lean();
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
        const userId = await request.params._id;
        const user = await User.findById(userId).lean();
        const submissionId = await request.params._id;
        const submission = await Submission.findById(submissionId).lean();
        console.log(
          submission.firstName + " has navigated/been redirected to " + submission.projectTitle + " report page"
        );
        return h.view("submission-admin", {
          title: submission.firstName + "'s Submission",
          submission: submission,
          user: user,
          today: today,
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

        if (submission.nda) {
          submission.projectTitle = await "NDA";
        } else if (submissionEdit.projectType !== "") {
          submission.projectType = sanitizeHtml(submissionEdit.projectType);
        }

        if (submissionEdit.videoUrl !== "") {
          submission.videoUrl = sanitizeHtml(submissionEdit.videoUrl);
        }

        if (submissionEdit.presentationTime !== "") {
          submission.presentationTime = sanitizeHtml(submissionEdit.presentationTime);
        }

        submission.submissionIncomplete = submissionEdit.submissionIncomplete;

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
          title: "Video URL Error",
          user: user,
          submission: await Submission.findById(submissionId).lean(),
        });
      } catch (err) {
        const userId = await request.params._id;
        const user = await User.findById(userId).lean();
        const submissionId = await request.params._id;
        const submission = await Submission.findById(submissionId);
        console.log("Error updating Submission, so there is");
        return h.view("submission-admin", {
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

  createPdfAdmin: {
    auth: false,
    handler: async function (request, h) {
      const user = await User.findById(request.params._id).lean();
      const submissions = await Submission.find().lean();
      const projectTypes = await submissions.map((a) => a.projectType);
      const projectTypesUnique = [...new Set(projectTypes)];
      console.log("User is attempting to create admin handbook");
      const adminSubmissions = await AdminSubmission.find().lean();
      const adminSubmission = await adminSubmissions[0];

      try {
        await Pdfs.createAdminPdf(request);

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
        const adminSubmissions = await AdminSubmission.find().lean();
        const adminSubmission = await adminSubmissions[0];
        const backgroundImgData = await imageDataURI.encodeFromURL(adminSubmission.backgroundImage);
        const endOfPage = pageDimensions[1] / 1.25;

        const fs = require("fs");
        const pdf = require("pdf-parse");
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

        ///////////////////////////////////////////////////////////////////////////////////////////////////////////////

        let adminPdf = await Pdfs.createAdminPdf(adminSubmission);
        await merger.add(await adminPdf, arrayPages.slice(0, -1));
        ///////////////////////////////////////////////////////////////////////////////////////////////////////////////

        //await merger.add("./public/handbooks/Project Showcase 2022.pdf", arrayPages.slice(0, -1));
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
              //merger.add("./public/handbooks/" + submissions[k].firstName + submissions[k].lastName + ".pdf");
              if (submissions[k].nda) {
                let userPdf = await Pdfs.createNdaUserPdf(submissions[k]._id);
                merger.add(await userPdf);
              } else {
                let userPdf = await Pdfs.createFullUserPdf(submissions[k]._id);
                merger.add(await userPdf);
              }
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

  adminSubmit: {
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
        adminImage1: Joi.any().allow(""),
        adminImage2: Joi.any().allow(""),
        adminImage3: Joi.any().allow(""),
      },
      options: {
        abortEarly: false,
      },
      failAction: async function (request, h, error) {
        console.log("User has entered unacceptable data for admin submission");
        return h
          .view("handbook-form", {
            title: "Submission Error",
            errors: error.details,
          })
          .takeover()
          .code(400);
      },
    },

    handler: async function (request, h) {
      try {
        const adminSubmissionEdit = request.payload;
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
          adminSubmission.deadline = sanitizeHtml(adminSubmissionEdit.deadline);
        }

        if (adminSubmissionEdit.adminImage1.length !== undefined) {
          //Extracting the public_id from the previously submitted image url,
          //so that I can delete the previously submitted image and not clog up cloudinary with excessive images
          if (adminSubmission.adminImage1 !== undefined) {
            const adminImage1FileName = await adminSubmission.adminImage1.substr(
              adminSubmission.adminImage1.lastIndexOf("/") + 1
            );
            const adminImage1Public_id = await adminImage1FileName.substr(0, adminImage1FileName.indexOf("."));
            await ImageStore.deleteImage(adminImage1Public_id);
          }
          const adminImage1Result = await ImageStore.uploadImage(adminSubmissionEdit.adminImage1); //consider re-ordering images to maintain consistency
          const adminImage1Url = await adminImage1Result.url;
          adminSubmission.adminImage1 = await adminImage1Url;
        }

        if (adminSubmissionEdit.adminImage2.length !== undefined) {
          //Extracting the public_id from the previously submitted image url,
          //so that I can delete the previously submitted image and not clog up cloudinary with excessive images
          if (adminSubmission.adminImage2 !== undefined) {
            const adminImage2FileName = await adminSubmission.adminImage2.substr(
              adminSubmission.adminImage2.lastIndexOf("/") + 1
            );
            const adminImage2Public_id = await adminImage2FileName.substr(0, adminImage2FileName.indexOf("."));
            await ImageStore.deleteImage(adminImage2Public_id);
          }
          const adminImage2Result = await ImageStore.uploadImage(adminSubmissionEdit.adminImage2); //consider re-ordering images to maintain consistency
          const adminImage2Url = await adminImage2Result.url;
          adminSubmission.adminImage2 = await adminImage2Url;
        }

        if (adminSubmissionEdit.adminImage3.length !== undefined) {
          //Extracting the public_id from the previously submitted image url,
          //so that I can delete the previously submitted image and not clog up cloudinary with excessive images
          if (adminSubmission.adminImage3 !== undefined) {
            const adminImage3FileName = await adminSubmission.adminImage3.substr(
              adminSubmission.adminImage3.lastIndexOf("/") + 1
            );
            const adminImage3Public_id = await adminImage3FileName.substr(0, adminImage3FileName.indexOf("."));
            await ImageStore.deleteImage(adminImage3Public_id);
          }
          const adminImage3Result = await ImageStore.uploadImage(adminSubmissionEdit.adminImage3); //consider re-ordering images to maintain consistency
          const adminImage3Url = await adminImage3Result.url;
          adminSubmission.adminImage3 = await adminImage3Url;
        }

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
};

module.exports = Admins;

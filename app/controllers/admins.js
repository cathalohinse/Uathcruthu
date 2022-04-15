"use strict";
const Submission = require("../models/submission");
const AdminSubmission = require("../models/adminSubmission");
const Admin = require("../models/admin");
const imageDataURI = require("image-data-uri");
const ImageStore = require("../utils/image-store");
const { jsPDF } = require("jspdf");
const Joi = require("@hapi/joi");
const sanitizeHtml = require("sanitize-html");
const PDFMerger = require("pdf-merger-js");
const Pdfs = require("../utils/pdfs");
//Select the desired page dimensions from the options below. All pdf coordinates are relative (not absolute),
//and therefore adapt to the pages dimensions.
const pageDimensions = [338.582, 190.5];
//const pageDimensions = [297, 210];
//const pageDimensions = [210, 148.5];
//const pageDimensions = [148.5, 105];

const Admins = {
  showSubmissionAdmin: {
    handler: async function (request, h) {
      try {
        const submissionId = await request.params._id;
        const submission = await Submission.findById(submissionId).lean();
        console.log(submission.projectTitle + " report page for " + submission.firstName);
        return h.view("submission-admin", {
          title: submission.firstName + " " + submission.lastName + "'s Submission",
          submission: submission,
        });
      } catch (err) {
        return h.view("login", { errors: [{ message: err.message }], title: "Submission Error" });
      }
    },
  },

  submitByAdmin: {
    validate: {
      payload: {
        projectType: Joi.string().allow(""),
        videoUrl: Joi.string().allow(""),
        presentationTime: Joi.string().allow(""),
      },
      options: {
        abortEarly: false,
      },
      failAction: async function (request, h, error) {
        const submission = await Submission.findById(request.params._id).lean();
        console.log("Admin has entered unacceptable data for submission");
        return h
          .view("submission-admin", {
            title: "Form Input Error",
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

        //Project types is only editable in this view if it was selected as 'Other'.
        //This is editable, because the subjective nature of entering text as opposed to selecting nominal data,
        //means that multiple distinct categories could be created that would essentially be the same thing (e.g. 'IOT' and 'Internet of Things'
        //so the administrator has the opportunity to group such instances together into the one category
        if (!submission.nda && submission.projectTypeOther && submissionEdit.projectType !== "") {
          submission.projectType = sanitizeHtml(submissionEdit.projectType);
        }

        //The administrator adds the video URL, because the video is made by the student after the handbook data has been submitted.
        if (submissionEdit.videoUrl !== "") {
          submission.videoUrl = sanitizeHtml(submissionEdit.videoUrl);
        }

        //This is where the administrator can schedule the presentations. Future releases of this app will incorporate a view especially for this.
        if (submissionEdit.presentationTime !== "") {
          submission.presentationTime = sanitizeHtml(submissionEdit.presentationTime);
        }
        /*submission.videoUrl = "";
        submission.presentationTime = "";*/

        //This determines if the submission has been completed or not.
        //If the submission has not been completed, it is not included in the 'Create PDF' function.
        //The whole app is far more functional if the user doesn't need to check the status of all students prior to handbook creation.
        //It also has to be taken into account that plenty of students will not ever complete their submission in time or will opt for deferrals etc.
        //An obvious alternative to having a boolean attribute that determines the status of the submission is to just have normal validation ('.required').
        //However, I opted to go for this approach, so as to allow the students to submit unfinished submissions that they could essentially save as 'drafts' and return to later.
        if (submission.nda) {
          if (!submission.personalPhoto || !submission.presentationTime) {
            console.log("Submission not complete");
            submission.submissionIncomplete = true;
          } else {
            console.log("Submission IS complete!");
            submission.submissionIncomplete = undefined;
          }
        } else if (
          !submission.projectTitle ||
          !submission.descriptiveTitle ||
          !submission.projectType ||
          !submission.personalPhoto ||
          !submission.projectImage ||
          !submission.summary ||
          !submission.projectUrl ||
          !submission.videoUrl ||
          !submission.presentationTime
        ) {
          console.log("Submission not complete");
          submission.submissionIncomplete = true;
        } else {
          console.log("Submission IS complete!");
          submission.submissionIncomplete = undefined;
        }

        if (submission.videoUrl) {
          console.log(
            "Admin has updated " +
              submission.firstName +
              " " +
              submission.lastName +
              "'s submission with the following Video URL:\n" +
              submission.videoUrl
          );
        } else {
          console.log("Admin has updated " + submission.firstName + " " + submission.lastName + "'s submission.");
        }

        await submission.save();
        return h.view("submission-admin", {
          title: submission.firstName + " " + submission.lastName + "'s Submission",
          submission: await Submission.findById(submissionId).lean(),
        });
      } catch (err) {
        const submissionId = await request.params._id;
        const submission = await Submission.findById(submissionId);
        console.log("Error updating Submission, so there is");
        return h.view("submission-admin", {
          title: "Submission Error",
          errors: [{ message: err.message }],
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

  createPdfUser: {
    handler: async function (request, h) {
      const submission = await Submission.findById(request.params._id).lean();

      //This prevents the userPDF creation from taking place if any of the user data that appears on their individual userPDF page is missing
      //Full User PDF:
      if (!submission.nda) {
        if (
          submission.projectTitle &&
          submission.descriptiveTitle &&
          submission.personalPhoto &&
          submission.projectImage &&
          submission.summary &&
          submission.projectUrl &&
          submission.videoUrl
        ) {
          try {
            await Pdfs.createFullUserPdf(request, h);
            return h.view("submission-admin", {
              title: submission.firstName + " " + submission.lastName + "'s Submission",
              submission: submission,
            });
          } catch (err) {
            console.log("Error creating pdf");
            return h.view("submission-admin", {
              title: "Submission Error",
              submission: submission,
              errors: [{ message: err.message }],
            });
          }
        } else {
          console.log("Some Submission Details are missing");
          return h.view("submission-admin", {
            title: "Submission Error",
            submission: submission,
            errors: [{ message: "Some Submission Details are missing" }],
          });
        }
      } else {
        //NDA User PDF:
        if (submission.personalPhoto) {
          try {
            await Pdfs.createNdaUserPdf(request);
            return h.view("submission-admin", {
              title: submission.firstName + " " + submission.lastName + "'s Submission",
              submission: submission,
            });
          } catch (err) {
            const submission = await Submission.findById(request.params._id).lean();
            console.log("Error creating pdf");
            return h.view("submission-admin", {
              title: "Submission Error",
              submission: submission,
              errors: [{ message: err.message }],
            });
          }
        } else {
          console.log("Some Submission Details are missing");
          return h.view("submission-admin", {
            title: "Submission Error",
            submission: submission,
            errors: [{ message: "Some Submission Details are missing" }],
          });
        }
      }
    },
  },

  showOther: {
    handler: async function (request, h) {
      try {
        const submissions = await Submission.find().lean();
        console.log("User has navigated to the 'Other' Project-Selection page");
        return h.view("other-form", { title: "Other Project Selection", submissions: submissions });
      } catch (err) {
        console.log("Error loading the 'Other' Project-Selection page");
        return h.view("admin", { errors: [{ message: err.message }], title: "Error - Other Project Selection" });
      }
    },
  },

  submitOther: {
    validate: {
      payload: {
        projectType: Joi.string().allow(""),
      },
      options: {
        abortEarly: false,
      },
      failAction: async function (request, h, error) {
        console.log("Admin has entered unacceptable data for submission");
        return h
          .redirect("/other-form", {
            title: "Form Input Error",
            errors: error.details,
            submissions: submissions,
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
        const submissions = await Submission.find().lean();

        if (submissionEdit.projectType !== "") {
          submission.projectType = sanitizeHtml(submissionEdit.projectType);
        }

        await submission.save();
        console.log(
          submission.firstName +
            " " +
            submission.lastName +
            "'s Project Type has been updated to: " +
            submission.projectType
        );
        return h.redirect("/other-form", {
          title: "Other Project Selection",
          submissions: submissions,
        });
      } catch (err) {
        const submissions = await Submission.find().lean();
        console.log("Error updating 'Other' Project Type");
        return h.redirect("/other-form", {
          title: "Submission Error",
          errors: [{ message: err.message }],
          submissions: submissions,
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

  showHandbookForm: {
    handler: async function (request, h) {
      try {
        console.log("User has navigated to the Admin pdf Submission Page");
        //In order to prevent multiple adminSubmissions from being created (thus clogging up the db, and potentially creating conflicting adminSubmissions),
        //an array is created from 'all' adminSubmissions in the db. If this array is found to be empty, an adminSubmission is created.
        //Otherwise, if there is any adminSubmission contained in that array (i.e. the one created when it was found to be empty),
        //it is selected and all consequent work refers to this specific adminSubmission.
        const adminSubmissions = await AdminSubmission.find().lean();
        const adminId = await request.auth.credentials.id;
        const admin = await Admin.findById(adminId);
        var adminSubmission = null;
        if (adminSubmissions.length === 0) {
          var adminSubmission = new AdminSubmission({
            submitter: admin,
          });
        } else {
          var adminSubmission = await adminSubmissions[0];
        }
        return h.view("handbook-form", {
          title: "Handbook Form",
          adminSubmission: adminSubmission,
        });
      } catch (err) {
        console.log("Error loading Admin pdf Submission page");
        return h.view("admin", { errors: [{ message: err.message }], adminSubmission: adminSubmission });
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
        const adminId = await request.auth.credentials.id;
        const admin = await Admin.findById(adminId);
        const adminSubmissionEdit = request.payload;
        const adminSubmissions = await AdminSubmission.find();
        var adminSubmission = null;

        //In order to prevent multiple adminSubmissions from being created (thus clogging up the db, and potentially creating conflicting adminSubmissions),
        //an array is created from 'all' adminSubmissions in the db. If this array is found to be empty, an adminSubmission is created.
        //Otherwise, if there is any adminSubmission contained in that array (i.e. the one created when it was found to be empty),
        //it is selected and all consequent work refers to this specific adminSubmission.
        if (adminSubmissions.length === 0) {
          var adminSubmission = new AdminSubmission({
            submitter: admin,
          });
          console.log("Creating new Admin pdf (" + adminSubmission + ")...");
        } else {
          var adminSubmission = await adminSubmissions[0];
          console.log("Editing existing Admin pdf (" + adminSubmission._id + ")...");
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
          const courseImageResult = await ImageStore.uploadImage(adminSubmissionEdit.courseImage);
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
          const backgroundImageResult = await ImageStore.uploadImage(adminSubmissionEdit.backgroundImage);
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
          const studentBackgroundImageResult = await ImageStore.uploadImage(adminSubmissionEdit.studentBackgroundImage);
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
          const adminImage1Result = await ImageStore.uploadImage(adminSubmissionEdit.adminImage1);
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
          const adminImage2Result = await ImageStore.uploadImage(adminSubmissionEdit.adminImage2);
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
          const adminImage3Result = await ImageStore.uploadImage(adminSubmissionEdit.adminImage3);
          const adminImage3Url = await adminImage3Result.url;
          adminSubmission.adminImage3 = await adminImage3Url;
        }

        await adminSubmission.save();
        console.log("New Admin Submission has been created - id: " + adminSubmission._id);
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

  createPdfAdmin: {
    handler: async function (request, h) {
      const adminSubmissions = await AdminSubmission.find().lean();
      const adminSubmission = await adminSubmissions[0];

      //This determines if the adminSubmission has been completed or not.
      //If the adminSubmission has not been completed, it is not included in the 'Create PDF' function.
      if (adminSubmission !== undefined) {
        if (
          adminSubmission.courseTitle &&
          adminSubmission.handbookTitle &&
          adminSubmission.courseImage &&
          adminSubmission.backgroundImage &&
          adminSubmission.studentBackgroundImage &&
          adminSubmission.courseTitleLong &&
          adminSubmission.courseUrl &&
          adminSubmission.deadline &&
          adminSubmission.adminImage1 &&
          adminSubmission.adminImage2 &&
          adminSubmission.adminImage3
        ) {
          try {
            await Pdfs.createAdminPdf(request);
            return h.view("handbook-form", {
              title: "Handbook Form",
              adminSubmission: adminSubmission,
            });
          } catch (err) {
            const adminSubmissions = await AdminSubmission.find().lean();
            const adminSubmission = await adminSubmissions[0];
            console.log("Error creating Admin pdf");
            return h.view("handbook-form", {
              title: "Admin pdf Creation Error",
              adminSubmission: adminSubmission,
              errors: [{ message: err.message }],
            });
          }
        } else {
          console.log("Some Submission Details are missing");
          return h.view("handbook-form", {
            title: "Admin pdf Creation Error",
            adminSubmission: adminSubmission,
            errors: [{ message: "Some Submission Details are missing" }],
          });
        }
      } else {
        console.log("Some Submission Details are missing");
        return h.view("handbook-form", {
          title: "Admin pdf Creation Error",
          adminSubmission: adminSubmission,
          errors: [{ message: "Admin Submission has not yet been made" }],
        });
      }
    },
  },

  createHandBook: {
    handler: async function (request, h) {
      const adminSubmissions = await AdminSubmission.find().lean();
      const adminSubmission = await adminSubmissions[0];
      //This determines if the adminSubmission has been completed or not.
      //If the adminSubmission has not been completed, the handbook creation will not take place.
      if (adminSubmission !== undefined) {
        if (
          adminSubmission.courseTitle &&
          adminSubmission.handbookTitle &&
          adminSubmission.courseImage &&
          adminSubmission.backgroundImage &&
          adminSubmission.studentBackgroundImage &&
          adminSubmission.courseTitleLong &&
          adminSubmission.courseUrl &&
          adminSubmission.deadline &&
          adminSubmission.adminImage1 &&
          adminSubmission.adminImage2 &&
          adminSubmission.adminImage3
        ) {
          try {
            const submissions = await Submission.find().lean();
            //Because an array of project types would contain each instance of that project type, it is necessary ot create
            //an array of unique project types, i.e. just one instance of each project type.
            //In this way, all projectType specific submission can be grouped together in the same page.
            //Otherwise the pdf would have an entire page to introduce each and every user submission.
            const projectTypes = await submissions.map((a) => a.projectType);
            const projectTypesUnique = [...new Set(projectTypes)];
            console.log("Array of Project Types: " + projectTypesUnique);
            //In cases where the user has not yet selected a project Type, an null value is stored in the project type array.
            // This must be removed, otherwise there is a blank page created for the pdf to represent that 'project type'.
            const indexOfEmpty = projectTypesUnique.indexOf("");
            if (indexOfEmpty > -1) {
              projectTypesUnique.splice(indexOfEmpty, 1);
            }
            console.log("Updated Array of Project Types: " + projectTypesUnique);
            console.log("Handbook will contain the following project types: " + projectTypesUnique);
            const merger = new PDFMerger();
            const adminSubmissions = await AdminSubmission.find().lean();
            const adminSubmission = await adminSubmissions[0];
            const backgroundImgData = await imageDataURI.encodeFromURL(adminSubmission.backgroundImage);
            const endOfPage = pageDimensions[1] / 1.25;
            const fs = require("fs");
            const pdf = require("pdf-parse");
            //In order to ensure that the pages of the admin pdf are distributed correctly throughout the handbook
            //(i.e., the last page is located at the end of the handbook, and all other pages are located at the beginning)
            //it is necessary to retrieve the number of pages contained in the file. To do this, first create an array of those pages
            //(using a while loop to work down through them), and then the desired pages can be accessed from that array when appropriate.
            let adminPdf = await Pdfs.createAdminPdf(adminSubmission);
            let dataBuffer = await fs.readFileSync(adminPdf);
            const numPages = await pdf(dataBuffer).then(function (data) {
              return data.numpages;
            });
            let arrayPages = [];
            let l = numPages;
            while (l > 0) {
              arrayPages.push(l);
              l--;
            }
            arrayPages.reverse();
            await merger.add(await adminPdf, arrayPages.slice(0, -1));

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
                  if (!submissions[j].nda) {
                    doc.text(
                      submissions[j].projectTitle + " - " + submissions[j].descriptiveTitle,
                      pageDimensions[0] / 40,
                      pageDimensions[0] / 15 + count * 8
                    );
                  }
                  count += 1.5;
                }

                //Add a new page if the list is spilling off the existing page
                if (pageDimensions[0] / 20 + count * 8 > endOfPage) {
                  doc.addPage();
                  //console.log("New Page has been added for all " + submissions[j].projectType + " projects");
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
                  if (submissions[k].nda) {
                    let userPdf = await Pdfs.createNdaUserPdf(submissions[k]._id);
                    merger.add(await userPdf);
                    Pdfs.refresh(request, h);
                  } else {
                    let userPdf = await Pdfs.createFullUserPdf(submissions[k]._id);
                    merger.add(await userPdf);
                    Pdfs.refresh(request, h);
                  }
                }
                k++;
              }
              i++;
            }
            merger.add(await adminPdf, arrayPages.slice(-1));
            await merger.save("./public/handbooks/handbook.pdf");
            console.log("Handbook has now been created");
            console.log("Number of users: " + submissions.length);
            return h.view("admin", { title: "Admin", submissions: submissions });
          } catch (err) {
            const submissions = await Submission.find().lean();
            console.log("Error creating handbook");
            return h.view("admin", {
              title: "Admin",
              submissions: submissions,
              errors: [{ message: err.message }],
            });
          }
        } else {
          const submissions = await Submission.find().lean();
          console.log("Some Admin-Submission Details are missing");
          return h.view("admin", {
            title: "Handbook Creation Error",
            submissions: submissions,
            errors: [{ message: "Some Admin-Submission Details are missing" }],
          });
        }
      } else {
        const submissions = await Submission.find().lean();
        console.log("The Admin-Submission has not yet been made");
        return h.view("admin", {
          title: "Handbook Creation Error",
          submissions: submissions,
          errors: [{ message: "The Admin-Submission has not been made" }],
        });
      }
    },
  },
};

module.exports = Admins;

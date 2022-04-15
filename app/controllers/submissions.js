"use strict";
const Submission = require("../models/submission");
const AdminSubmission = require("../models/adminSubmission");
const User = require("../models/user");
const ImageStore = require("../utils/image-store");
const Joi = require("@hapi/joi");
const sanitizeHtml = require("sanitize-html");

const Submissions = {
  home: {
    handler: function (request, h) {
      console.log("Welcome home");
      return h.view("home", { title: "Make a Submission" });
    },
  },

  showSubmission: {
    handler: async function (request, h) {
      const userId = await request.auth.credentials.id;
      const user = await User.findById(userId).lean();
      const submission = await Submission.findByUserId(user).lean();
      console.log(
        submission.firstName + " has navigated/been redirected to " + submission.projectTitle + " report page"
      );
      return h.view("submission-user", {
        title: submission.firstName + " " + submission.lastName + "'s Submission",
        submission: submission,
      });
    },
  },

  submit: {
    validate: {
      payload: {
        projectTitle: Joi.string().allow("").min(4),
        descriptiveTitle: Joi.string().allow(""),
        projectType: Joi.string().allow(""),
        personalPhoto: Joi.any().allow(""),
        projectImage: Joi.any().allow(""),
        summary: Joi.string()
          .allow("")
          .regex(/^\s*(\S+\s+|\S+$){0,100}$/i), //100 words max
        projectUrl: Joi.string().allow(""),
        nda: Joi.boolean(),
        projectTypeOther: Joi.boolean(),
        submissionIncomplete: Joi.boolean(),
      },
      options: {
        abortEarly: false,
      },
      failAction: async function (request, h, error) {
        const userId = await request.auth.credentials.id;
        const user = await User.findById(userId);
        const submission = await Submission.findByUserId(user).lean();
        console.log(user.firstName + " has entered unacceptable data for submission");
        return h
          .view("submission-form", {
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
        const userId = await request.auth.credentials.id;
        const user = await User.findById(userId);
        const submissionEdit = request.payload;
        const submission = await Submission.findByUserId(user);

        submission.nda = submissionEdit.nda;

        if (submissionEdit.projectTitle !== "") {
          submission.projectTitle = sanitizeHtml(submissionEdit.projectTitle);
        }
        if (submissionEdit.descriptiveTitle !== "") {
          submission.descriptiveTitle = sanitizeHtml(submissionEdit.descriptiveTitle);
        }
        if (submission.nda) {
          submission.projectType = await "NDA";
        } else if (submissionEdit.projectType !== "") {
          submission.projectType = await sanitizeHtml(submissionEdit.projectType);
        }

        if (submissionEdit.personalPhoto.length !== undefined) {
          //Extracting the public_id from the previously submitted image url,
          //so that I can delete the previously submitted image and not clog up cloudinary with excessive images
          if (submission.personalPhoto !== undefined) {
            const personalPhotoFileName = await submission.personalPhoto.substr(
              submission.personalPhoto.lastIndexOf("/") + 1
            );
            const personalPhotoPublic_id = await personalPhotoFileName.substr(0, personalPhotoFileName.indexOf("."));
            await ImageStore.deleteImage(personalPhotoPublic_id);
          }
          const personalPhotoResult = await ImageStore.uploadImage(submissionEdit.personalPhoto);
          const personalPhotoUrl = await personalPhotoResult.url;
          submission.personalPhoto = await personalPhotoUrl;
        }

        if (submissionEdit.projectImage.length !== undefined) {
          //Extracting the public_id from the previously submitted image url,
          // so that I can delete the previously submitted image and not clog up cloudinary with excessive images
          if (submission.projectImage !== undefined) {
            const projectImageFileName = await submission.projectImage.substr(
              submission.projectImage.lastIndexOf("/") + 1
            );
            const projectImagePublic_id = await projectImageFileName.substr(0, projectImageFileName.indexOf("."));
            await ImageStore.deleteImage(projectImagePublic_id);
          }
          const projectImageResult = await ImageStore.uploadImage(submissionEdit.projectImage);
          const projectImageUrl = projectImageResult.url;
          submission.projectImage = projectImageUrl;
        }

        if (submissionEdit.summary !== "") {
          submission.summary = sanitizeHtml(submissionEdit.summary);
        }
        if (submissionEdit.projectUrl !== "") {
          submission.projectUrl = sanitizeHtml(submissionEdit.projectUrl);
        }

        submission.projectTypeOther = submissionEdit.projectTypeOther;

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

        await submission.save();
        return h.redirect("/submission-user");
      } catch (err) {
        console.log("Error updating Submission");
        return h.view("submission-form", {
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

module.exports = Submissions;

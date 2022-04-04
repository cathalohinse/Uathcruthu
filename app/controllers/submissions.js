"use strict";
const Submission = require("../models/submission");
const AdminSubmission = require("../models/adminSubmission");
const User = require("../models/user");
const ImageStore = require("../utils/image-store");
const Joi = require("@hapi/joi");
const sanitizeHtml = require("sanitize-html");
//const Deadline = require("../controllers/accounts");

const Submissions = {
  home: {
    handler: function (request, h) {
      console.log("Welcome home");
      return h.view("home", { title: "Make a Submission" });
    },
  },

  showSubmission: {
    handler: async function (request, h) {
      const today = await Math.floor(new Date(Date.now()).getTime() / 1000);
      const adminSubmissions = await AdminSubmission.find().lean();
      const adminSubmission = await adminSubmissions[0];
      const userId = await request.auth.credentials.id;
      const user = await User.findById(userId).lean();
      const submission = await Submission.findByUserId(user).lean();
      console.log(user.firstName + " has navigated/been redirected to " + submission.projectTitle + " report page");
      return h.view("submission-user", {
        title: user.firstName + "'s Submission",
        submission: submission,
        user: user,
        today: today,
        //deadline: await Math.floor(new Date(adminSubmission.deadline).getTime() / 1000),
        deadline: adminSubmission.deadline,
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
        //videoUrl: Joi.string().allow(""),
        nda: Joi.boolean(),
        projectTypeOther: Joi.boolean(),
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

        if (submission.nda) {
          submission.projectTitle = await "NDA";
        } else if (submissionEdit.projectTitle !== "") {
          submission.projectTitle = sanitizeHtml(submissionEdit.projectTitle);
        }
        if (submissionEdit.descriptiveTitle !== "") {
          submission.descriptiveTitle = sanitizeHtml(submissionEdit.descriptiveTitle);
        }
        /*if (submissionEdit.projectType !== "") {
          submission.projectType = sanitizeHtml(submissionEdit.projectType);
        }*/

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
          const personalPhotoResult = await ImageStore.uploadImage(submissionEdit.personalPhoto); //consider re-ordering images to maintain consistency
          const personalPhotoUrl = await personalPhotoResult.url;
          submission.personalPhoto = await personalPhotoUrl;
        }

        if (submissionEdit.projectImage.length !== undefined) {
          //Extracting the public_id from the previously submitted image url, so that I can delete the previously submitted image and not clog up cloudinary with excessive images
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

        submission.projectTypeOther = submissionEdit.projectTypeOther;

        //console.log(user.firstName + " has created/updated the following Submission: " + submission);
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

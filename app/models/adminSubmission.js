"use strict";
const Mongoose = require("mongoose");
const Schema = Mongoose.Schema;
const adminSubmissionSchema = new Schema({
  courseTitle: String,
  handbookTitle: String,
  courseImage: String,
  backgroundImage: String,
  studentBackgroundImage: String,
  courseTitleLong: String,
  courseUrl: String,
  deadline: String,
  adminImage1: String,
  adminImage2: String,
  adminImage3: String,
  submitter: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
});

//My own custom built method:
adminSubmissionSchema.statics.findByUserId = function (submitter) {
  return this.findOne({ submitter: submitter });
};

module.exports = Mongoose.model("AdminSubmission", adminSubmissionSchema);

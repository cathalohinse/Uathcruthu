"use strict";
const Mongoose = require("mongoose");
const Schema = Mongoose.Schema;
const adminSubmissionSchema = new Schema({
  courseTitle: String,
  handbookTitle: String,
  backgroundImage: String,
  studentBackgroundImage: String,
  deadline: String,
  courseTitleLong: String,
  courseUrl: String,
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

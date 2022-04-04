"use strict";
const Mongoose = require("mongoose");
const Schema = Mongoose.Schema;
const submissionSchema = new Schema({
  firstName: String,
  lastName: String,
  projectTitle: String,
  descriptiveTitle: String,
  projectType: String,
  personalPhoto: String,
  projectImage: String,
  summary: String,
  projectUrl: String,
  videoUrl: String,
  submitter: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
  nda: Boolean,
  projectTypeOther: Boolean,
  presentationTime: String,
  submissionIncomplete: Boolean,
});

//My own custom built method:
submissionSchema.statics.findByUserId = function (submitter) {
  return this.findOne({ submitter: submitter });
};

module.exports = Mongoose.model("Submission", submissionSchema);

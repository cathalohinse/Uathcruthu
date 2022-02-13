"use strict";
const Mongoose = require("mongoose");
const Schema = Mongoose.Schema;
const submissionSchema = new Schema({
  name: String,
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
});

module.exports = Mongoose.model("Submission", submissionSchema);

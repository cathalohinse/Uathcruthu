"use strict";

const Submissions = {
  home: {
    auth: false,
    handler: function (request, h) {
      return h.view("home", { title: "Make a Submission" });
    },
  },
  report: {
    auth: false,
    handler: function (request, h) {
      return h.view("report", {
        title: "Submissions to Date",
        submissions: this.submissions,
      });
    },
  },
  submit: {
    auth: false,
    handler: function (request, h) {
      const data = request.payload;
      this.submissions.push(data);
      return h.redirect("/report");
    },
  },
};

module.exports = Submissions;

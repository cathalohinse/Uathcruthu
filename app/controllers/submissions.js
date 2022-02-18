"use strict";

const Submissions = {
  home: {
    //auth: false,
    handler: function (request, h) {
      return h.view("home", { title: "Make a Submission" });
    },
  },
  report: {
    //auth: false,
    handler: function (request, h) {
      return h.view("report", {
        title: "Submissions to Date",
        submissions: this.submissions,
      });
    },
  },
  /*submit: {
    auth: false,
    handler: function (request, h) {
      const data = request.payload;
      this.submissions.push(data);
      return h.redirect("/report");
    },
  },*/

  /*submit: {
    auth: false,
    handler: function (request, h) {
      let data = request.payload;
      data.submitter = this.currentUser;
      this.submissions.push(data);
      return h.redirect("/report");
    },
  },*/

  submit: {
    handler: function (request, h) {
      const data = request.payload;
      var submitterEmail = request.auth.credentials.id;
      data.submitter = this.users[submitterEmail];
      this.submissions.push(data);
      return h.redirect("/report");
    },
  },
};

module.exports = Submissions;

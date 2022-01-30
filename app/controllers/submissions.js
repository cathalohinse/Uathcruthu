const Submissions = {
  index: {
    handler: function (request, h) {
      return h.file("./app/views/main.html");
    },
  },

  submit: {
    handler: function (request, h) {
      return h.file("./app/views/submit.html");
    },
  },
};

module.exports = Submissions;

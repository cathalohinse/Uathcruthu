const Submissions = require("./app/controllers/submissions");

module.exports = [
  { method: "GET", path: "/", config: Submissions.submit },
  //{ method: "GET", path: "/", config: Submissions.index },
  //{ method: "GET", path: "/submit", config: Submissions.submit },
  {
    method: "GET",
    path: "/{param*}",
    handler: {
      directory: {
        path: "./public",
      },
    },
  },
];

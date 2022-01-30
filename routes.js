const Submissions = require("./app/controllers/submissions");

module.exports = [
  { method: "GET", path: "/", config: Submissions.index },
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

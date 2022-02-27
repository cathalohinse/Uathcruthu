"use strict";

const Hapi = require("@hapi/hapi");
const Inert = require("@hapi/inert");
const Vision = require("@hapi/vision");
const env = require("dotenv");
const dotenv = require("dotenv");
const Cookie = require("@hapi/cookie");
const Handlebars = require("handlebars");
require("./app/models/db");
const ImageStore = require("./app/utils/image-store");
const Joi = require("@hapi/joi");

env.config();

const server = Hapi.server({
  /*port: 3000,
  host: "localhost",*/
  port: process.env.PORT || 3000,
});

const credentials = {
  cloud_name: process.env.name,
  api_key: process.env.key,
  api_secret: process.env.secret,
};

const result = dotenv.config();

if (result.error) {
  console.log(result.error.message);
  process.exit(1);
}

/*server.bind({
  //users: {},
  users: [],
  submissions: [],
  //currentUser: {},
});*/

async function init() {
  await server.register(Vision);
  await server.register(Inert);
  await server.register(Cookie);
  await server.validator(require("@hapi/joi"));
  ImageStore.configure(credentials);

  /*server.views({
    engines: {
      hbs: Handlebars,
    },
    relativeTo: __dirname,
    path: "./app/views",
    isCached: false,
  });*/

  server.views({
    engines: {
      hbs: require("handlebars"),
    },
    relativeTo: __dirname,
    path: "./app/views",
    layoutPath: "./app/views/layouts",
    partialsPath: "./app/views/partials",
    layout: true,
    isCached: false,
  });

  server.auth.strategy("session", "cookie", {
    cookie: {
      name: process.env.cookie_name,
      password: process.env.cookie_password,
      isSecure: false,
    },
    redirectTo: "/",
  });

  server.auth.default("session");

  server.route(require("./routes"));
  await server.start();
  console.log(`Server running at: ${server.info.uri}`);
}

process.on("unhandledRejection", (err) => {
  console.log(err);
  process.exit(1);
});

init();

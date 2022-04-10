"use strict";

const env = require("dotenv");
env.config();

const Mongoose = require("mongoose");

Mongoose.connect(process.env.db);
const db = Mongoose.connection;

db.on("error", function (err) {
  console.log(`database connection error: ${err}`);
});

db.on("disconnected", function () {
  console.log("database disconnected");
});

db.once("open", function () {
  console.log(`database connected to ${this.name} on ${this.host}`);
});

async function seed() {
  var seeder = require("mais-mongoose-seeder")(Mongoose);
  const data = require("./seed-data.json");
  const Admin = require("./admin");
  const User = require("./user");
  //dropCollections intentionally set to False. In order to test the column and pages spillover in the pdf creation,
  //Large swathes of data were needed. There wasn't enough time to go populating large seed-data.json files with the
  //diverse submissions needed to test other features, so the existing submission created were required.
  const dbData = await seeder.seed(data, { dropDatabase: false, dropCollections: false });
  console.log(dbData);
}

/*db.once("open", function () {
  console.log(`database connected to ${this.name} on ${this.host}`);
  seed();
});*/

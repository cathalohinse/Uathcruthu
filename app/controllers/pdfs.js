//import { jsPDF } from "jspdf";
const { jsPDF } = require("jspdf"); // will automatically load the node version

const doc = new jsPDF();
//doc.text("Hello there boy!", 10, 10);
//doc.save("a4.pdf"); // will save the file in the current working directory

const Pdfs = {
  jsPdf: {
    auth: false,
    handler: function (request, h) {
      console.log("js.PDF");
      return h.view("js-pdf", { title: "jspdf" });
    },
  },

  createPdf: {
    auth: false,
    handler: function (request, h) {
      console.log("Created PDF");
      doc.text("Yo", 10, 10);
      doc.save("Great file.pdf");
      return h.view("report", { title: "jspdf" });
    },
  },
};

module.exports = Pdfs;

const express = require("express");

const app = express();

const pointRelais = require("./src/routes/pointRelais.route");
// const creaEtiquette = require("./src/routes/creaEttiquete.route");

require("dotenv").config();

require("./src/db/connect")();

app.use(express.urlencoded({ extended: true }));

app.use(express.json());

//
app.use("/api/point-relais", pointRelais);
// app.use("api/creaEtiquette", creaEtiquette);

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});

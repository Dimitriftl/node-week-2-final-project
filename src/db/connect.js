const mongoose = require("mongoose");

module.exports = async () => {
  const URL = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWD}@cluster0.mzvon6w.mongodb.net/mondial-relay`;
  try {
    await mongoose.connect(URL);
    console.log("connecter à Mongo");
  } catch (err) {
    console.log(err.message, "error couldn't connect to db");
  }
};

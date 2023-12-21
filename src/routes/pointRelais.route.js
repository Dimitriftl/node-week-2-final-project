const express = require("express");

const { getPos } = require("../controllers/pointRelais.controller");

const router = express.Router();

router.route("").post(getPos);

module.exports = router;

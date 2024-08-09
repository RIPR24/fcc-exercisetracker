const express = require("express");
const app = express();
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();

mongoose.connect(process.env.MDB_URI);

const exerciseSchema = new mongoose.Schema({
  user_id: { type: String, required: true },
  description: { type: String, required: true },
  duration: { type: Number, required: true },
  date: Date,
});

const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
});

const Users = mongoose.model("Users", userSchema);

const exercise = mongoose.model("exercise", exerciseSchema);

app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static("public"));
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

app
  .route("/api/users")
  .post(async (req, res, next) => {
    const user = new Users({ username: req.body.username });
    try {
      await user.save();
      console.log(user);
      res.json(user);
      next();
    } catch (error) {
      console.log(error);
    }
  })
  .get(async (req, res) => {
    const users = await Users.find({}).select("_id username");
    if (users) {
      res.json(users);
    } else {
      res.send("no users found");
    }
  });
app.post("/api/users/:_id/exercises", async (req, res) => {
  const { _id } = req.params;
  const { description, duration, date } = req.body;
  try {
    const user = await Users.findById(_id);
    if (!user) {
      return res.status(404).json({ error: "No User Found" });
    }

    const exer = new exercise({
      user_id: _id,
      description,
      duration,
      date: date ? new Date(date) : new Date(),
    });

    await exer.save();

    res.json({
      _id: user._id.toString(),
      username: user.username,
      date: exer.date.toDateString(),
      duration: exer.duration,
      description: exer.description,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
app.get("/api/users/:_id/logs", async (req, res) => {
  const id = req.params._id;
  const { from, to, limit } = req.query;
  const user = await Users.findById(id);
  let dat = {};
  if (from) dat["$gte"] = new Date(from);
  if (to) dat["$lte"] = new Date(to);
  let filter = { user_id: id };
  if (from || to) {
    filter.date = dat;
  }
  let logs = await exercise.find(filter).limit(+limit ?? 500);

  let upLogs = logs.map((el) => ({
    description: el.description,
    duration: el.duration,
    date: el.date.toDateString(),
  }));

  res.json({
    username: user.username,
    count: logs.length,
    _id: id,
    log: upLogs,
  });
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});

const express = require("express");
const cors = require("cors");
const path = require("path");
const ejs = require("ejs");

const zd = require("./zdarzeniaService");
const pj = require("./pojazdyService");
const uc = require("./uczestnicyService");

const isPkg = typeof process.pkg !== "undefined";
const baseDir = isPkg ? path.dirname(process.execPath) : __dirname;

const app = express();
app.use(cors());
app.use(express.json());

app.set("view engine", "ejs");
app.set("views", path.join(baseDir, "views"));      // szablony obok exe
app.use(express.static(path.join(baseDir, "public"))); // statyki obok exe

// ----- API -----
app.get("/zdarzenia", zd.getZdarzenia);
app.get("/zdarzenia/distinct/:column", zd.getDistinct);
app.get("/pojazdy", pj.getPojazdy);
app.get("/uczestnicy", uc.getUczestnicy);
app.get("/pojazdy/distinct/:col", (req, res) => {
    pj.getDistinctPojazdy(req, res);
});
app.get("/uczestnicy/distinct/:col", (req, res) => {
    uc.getDistinctUczestnicy(req, res);
});



// ----- FRONTEND -----
app.get("/", (req, res) => {
    res.redirect("/zdarzenia/view");
});

app.get("/zdarzenia/view", (req, res) => {
    res.render("zdarzeniaView");
});

app.get("/pojazdy/view", (req, res) => {
  res.render("pojazdyView");
});

app.get("/uczestnicy/view", (req, res) => {
  res.render("uczestnicyView");
});

app.listen(3000, () => console.log("Frontend + API działa na http://localhost:3000"));

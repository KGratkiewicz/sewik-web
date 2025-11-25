const express = require("express");
const cors = require("cors");
const path = require("path");

const zd = require("./zdarzeniaService");
const pj = require("./pojazdyService");
const uc = require("./uczestnicyService");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));

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

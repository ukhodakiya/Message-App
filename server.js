
const express = require("express");
const app = express();
const mongoose = require("mongoose");
var jwt = require('jsonwebtoken');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

const db_conn = "mongodb://localhost:27017/userdata";
mongoose.connect(db_conn, { useNewUrlParser: true })
    .then(() => {
        console.log("Database connected!!!");
    })
    .catch((ex) => {
        console.log(ex.message);
    });

const userSchema = mongoose.Schema({
    "username": String,
    "password": String,
    "firstname": String,
    "lastname": String,
    "phone": Number,
    "gender": String
});

const messageSchema = mongoose.Schema({
    "username": String,
    "messageTitle": String,
    "messageBody": String,
    "IsImportant": Boolean
});

const userModel = mongoose.model("users", userSchema);
const messageModel = mongoose.model("messages", messageSchema);

app.get("/", (req, res) => {
    res.sendFile(__dirname + "/index.html");
});

app.post("/IsUserAvailable", (req, res) => {
    userModel.find({ username: req.body.username, password: req.body.password })
        .then((data) => {
            if (data.length > 0) {
                const token = jwt.sign(data[0].username, "marlabs");
                res.json({
                    status: 200,
                    data: "available",
                    token: token
                });
            } else {
                res.status(200).send("not available");
            }

        })
        .catch((ex) => {
            res.status(403).send(ex.message);
        })
});

app.post("/createUser", async (req, res) => {
    try {
        const user_doc = userModel(req.body);
        const result = await user_doc.save();
        res.status(200).send(result);
    }
    catch (ex) {
        res.status(403).send(ex.message);
    }
});

// Middleware
app.use(function (req, res, next) {
    const mysavedtoken = req.headers.token;
    console.log("My token is");
    console.log(mysavedtoken);

    if (mysavedtoken == undefined) {
        console.log("token not found");
        res.redirect("/");  
        //res.sendFile(__dirname + "/public/views/login.html");      
    }
    else {
        jwt.verify(mysavedtoken, 'marlabs', (err, decoded) => {
            if (err) {
                res.send("invalid token");
            }
            else {
                req.decoded = decoded;
                next();
            }
        });
    }
});


app.get("/getmessages", (req, res) => {
    messageModel.find({ username: req.decoded })
        .then((data) => {
            res.status(200).send(data);
        })
        .catch((ex) => {
            res.status(403).send(ex.message);
        })
});

app.get("/binddropdown", (req, res) => {
    userModel.distinct('username')
        .then((data) => {
            res.status(200).send(data);
        })
        .catch((ex) => {
            res.status(403).send(ex.message);
        })
});

app.post("/getmessagedetail", (req, res) => {
    messageModel.find({ _id: req.body.messageid })
        .then((data) => {
            res.status(200).send(data);
        })
        .catch((ex) => {
            res.status(403).send(ex.message);
        })
});

app.post("/SendMessage", async (req, res) => {
    try {
        const msg_doc = messageModel(req.body);
        const result = await msg_doc.save();
        res.status(200).send("Message sent");
    }
    catch (ex) {
        res.status(403).send(ex.message);
    }
});

app.post("/Deletemsg", (req, res) => {

    messageModel.deleteOne({ _id: req.body.id }).then((data) => {
        res.status(200).send("user deleted");
    })
        .catch((ex) => {
            res.status(403).send(ex.message);
        })
});

app.post("/setUnsetMsgImp", (req, res) => {    
    messageModel.updateOne({ _id: req.body.messageid }, { $set: { IsImportant: req.body.isImpo } })
        .then((data) => {
            req.body.isImpo == true ? res.status(200).send("Message marked as an important.") : res.status(200).send("Message marked as not important.");
        })
        .catch((ex) => {
            res.status(403).send(ex.message);
        })
});


// for invalid routes providing default one
app.use((req, res) => {
    console.log("invalid url");
    res.redirect("/");
});

app.listen(3000, () => {
    console.log("server running @ localhost:3000");
});


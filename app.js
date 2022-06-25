require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const https = require('https');
const mongoose = require("mongoose");
const _ = require("lodash");
const ejs = require("ejs");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const { spawn } = require('child_process');
const { ifError } = require('assert');

const app = express();

app.use(express.static("background"));
app.set("view engine", "ejs");
app.use(express.urlencoded({
  extended: false
}));

app.use(session({
  secret: "our little secret.",
  resave: false,
  saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());

// connect with tha mongooseDB
mongoose.connect(process.env.DB_LINK, {
  useUnifiedTopology: true,
  // useNewUrlParser: true, 
  // useFindAndModify: false
}, err => {
  if(err) throw err;
  console.log('Connected to MongoDB!!!')
});
// mongoose.set("useCreateIndex", true);

const mentorSchema = { MentName: String, MentId: String };
const Mentor = mongoose.model("Mentor", mentorSchema);
const Mentee = mongoose.model("Mentee", mentorSchema);
const MenteeReq = mongoose.model("MenteeReq", mentorSchema);
const PendFeed = mongoose.model("PendFeed", mentorSchema);

const ansSchema = { answer: String, ansWriter: String };
const Answer = mongoose.model("Answer", ansSchema);
const NotSchema = { info: String };
const Notifi = mongoose.model("Notifi", NotSchema);

// added mongoose schema
const userInfoSchema = new mongoose.Schema({
  username: String, password: String, fName: String, lName: String, sName: String, sCourse: String,
  bDegree: String, bMajor: String, compName: String, compScore: Number, mDegree: String, mMajor: String,
  certification: String, date: Number, month: String, year: Number, city: String, state: String, zip: Number,
  futProfile: String, fReq1: String, fReq2: String, fReq3: String, futFellow: String, futCerti: String,
  futDeg: String, futMajor: String, futComp: String, futExam: String, futTrend: String, courseRecA: String,
  courseRecB: String, courseRecC: String, courseRecD: String, courseRecE: String, courseCertA: String,
  courseCertB: String, courseCertC: String, courseCertD: String, courseCertE: String,compRecA: String, 
  compRecB: String, compRecC: String, compRecD: String, compRecE: String, Ment: [mentorSchema],
  Menti: [mentorSchema], MentiReq: [mentorSchema], Noti: [NotSchema], Pend: [mentorSchema], rating: Number, rateCount: Number,
  quesCount: Number, ansCount: Number, menteeCount: Number, score: Number
});

userInfoSchema.plugin(passportLocalMongoose);

const User = mongoose.model("User", userInfoSchema);

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

const certSchema = { certNam: String, certDes: String, certReq: String };
const courseSchema = { degTyp: String, degNam: String, degElg: String, degMjr: String, degTrm: String, degDes: String };
const profileSchema = { name: String, req1: String, req2: String, req3: String };
const examSchema = { exNam: String, exElg: String, exPro: String };
const compSchema = { name: String, cover: String, for: String };
const scholSchema = { name: String, cover: String, for: String };
const trendSchema = { name: String, cover: String, for: String };
const Certification = mongoose.model("Certification", certSchema);
const Competition = mongoose.model("Competition", compSchema);
const Course = mongoose.model("Course", courseSchema);
const Exam = mongoose.model("Exam", examSchema);
const Fprofile = mongoose.model("Fprofile", profileSchema);
const Scholarship = mongoose.model("Scholarship", scholSchema);
const Trend = mongoose.model("Trend", trendSchema);

// const ans1 = new Answer({ answer: "this is the test answer" });
const quesSchema = { ques: String, quesWriter: String, ans: [ansSchema] };
const Question = mongoose.model("Question", quesSchema);
const messageSchema = { message: String, writer: String };
const Message = mongoose.model("Message", messageSchema);
const chatSchema = { userOneId: String, userTwoId: String, mess: [messageSchema] };
const Chat = mongoose.model("Chat", chatSchema);
const feedSchema = { feed: String, UserId: String };
const Feedback = mongoose.model("Feedback", feedSchema);


// notification: it will be a list where more lists can be added, entire list will be shown in the dropdown menu of the 
app.get("/", function (req, res) {
  res.render("signup",);
});

app.get("/home", function (req, res) {

  if (req.isAuthenticated()) {
    User.findById(req.user.id, function (err, foundUser) {

      res.render("home", {
        fName: foundUser.fName, lName: foundUser.lName, sName: foundUser.sName, sCourse: foundUser.sCourse, bDegree: foundUser.bDegree,
        bMajor: foundUser.bMajor, compName: foundUser.compName, compScore: foundUser.compScore, mDegree: foundUser.mDegree,
        mMajor: foundUser.mMajor, certification: foundUser.certification, date: foundUser.date, month: foundUser.month,
        year: foundUser.year, city: foundUser.city, state: foundUser.state, zip: foundUser.zip, futProfile: foundUser.futProfile,
        fReq1: foundUser.fReq1, fReq2: foundUser.fReq2, fReq3: foundUser.fReq3, futFellow: foundUser.futFellow, futCerti: foundUser.futCerti,
        futDeg: foundUser.futDeg, futMajor: foundUser.futMajor, futComp: foundUser.futComp, futExam: foundUser.futExam,
        futTrend: foundUser.futTrend, Mentors: foundUser.Ment, Mentlen: foundUser.Ment.length, Mentees: foundUser.Menti, Mentilen: foundUser.Menti.length,
        MenteeReqs: foundUser.MentiReq, Notifis: foundUser.Noti, NotifiLen: foundUser.Noti.length, PendFeeds: foundUser.Pend, UserId:foundUser._id 
      });
    })
  } else {
    res.redirect("/");
  }
});



app.get("/register", function (req, res) {
  res.render("register");
});

app.post("/register", function (req, res) {
  User.register({
    username: req.body.username
  }, req.body.password, function (err, user) {
    if (err) {
      console.log(err);
      res.redirect("/register");
    } else {
      passport.authenticate("local")(req, res, function () {
        res.redirect("/");
      })
    }
  })
});

app.post("/login", function (req, res) {
  const user = new User({ username: req.body.username, password: req.body.password });
  req.login(user, function (err) {
    if (err) {
      console.log(err);
    } else {
      passport.authenticate("local")(req, res, function () {
        if (req.user.fName) {
          res.redirect("home");
        } else {
          res.redirect("/profile");
        }
      })
    }
  })
});

app.get("/profile", function (req, res) {
  res.render("profile-page",);
});

app.post("/profile", function (req, res) {
  User.findById(req.user.id, function (err, foundUser) {
    if (err) {
      console.log(err);
    } else {
      foundUser.fName = req.body.ufname; foundUser.lName = req.body.ulname;
      foundUser.sName = req.body.usclname; foundUser.sCourse = req.body.usclcours;
      foundUser.bDegree = req.body.ubachdeg; foundUser.bMajor = req.body.ubachmaj;
      foundUser.compName = req.body.ucompex; foundUser.compScore = req.body.ucompsc;
      foundUser.mDegree = req.body.umasdeg; foundUser.mMajor = req.body.umasmaj;
      foundUser.certification = req.body.ucert; foundUser.date = req.body.udobd;
      foundUser.month = req.body.udobm; foundUser.year = req.body.udoby;
      foundUser.city = req.body.ucity; foundUser.state = req.body.ustat;
      foundUser.zip = req.body.uzip; foundUser.futProfile = req.body.futProfile;
      foundUser.fReq1 = req.body.fReq1; foundUser.fReq2 = req.body.fReq2;
      foundUser.fReq3 = req.body.fReq3; foundUser.futFellow = req.body.futFellow;
      foundUser.futCerti = req.body.futCerti; foundUser.futDeg = req.body.futDeg;
      foundUser.futMajor = req.body.futMajor; foundUser.futComp = req.body.futComp;
      foundUser.futExam = req.body.futExam; foundUser.futTrend = req.body.futTrend;
      foundUser.rating = 0; foundUser.rateCount = 0; foundUser.quesCount = 0; foundUser.ansCount = 0;
      foundUser.menteeCount = 0; foundUser.score = 0
      foundUser.save();

    };
    foundUser.save(function () {
      res.redirect("home");
    })
  })
});



var filteredComps = mongoose.model("filteredComps", compSchema);
app.post("/competitions", function (req, res) {
  User.findById(req.user.id,function(err,foundUser){
  filteredComps = [];
  if (req.body.srchInput) {
    const searchString = _.lowerCase([req.body.srchInput]);
    Competition.find({}, function (err, foundCerts) {
      if (!err) {
        foundCerts.forEach(function (foundCert) {
          if (_.lowerCase([foundCert.name]) === (searchString)) {
            filteredComps.push(foundCert);
          }
        });
        var AllSuggest = [];
        foundCerts.forEach(element => {
         AllSuggest.push(element.cover);
         AllSuggest.push(element.name);
             });
const CourseSuggest = AllSuggest.filter((x, i, a) => a.indexOf(x) == i);
        res.render("competitions", {CourseSuggest:CourseSuggest,certNames: filteredComps,Notifis: foundUser.Noti, NotifiLen: foundUser.Noti.length,
          compRecA :foundUser.compRecA, compRecB :foundUser.compRecB, compRecC :foundUser.compRecC, 
          compRecD :foundUser.compRecD, compRecE :foundUser.compRecE,futProfile: foundUser.futProfile
        });
      }
    });
  } else {
    Competition.find({}, function (err, foundCerts) {
      if (!err) {
        var AllSuggest = [];
         foundCerts.forEach(element => {
          AllSuggest.push(element.cover);
          AllSuggest.push(element.name);
              });
const CourseSuggest = AllSuggest.filter((x, i, a) => a.indexOf(x) == i);
        res.render("competitions", {CourseSuggest:CourseSuggest ,certNames: foundCerts,Notifis: foundUser.Noti, NotifiLen: foundUser.Noti.length
        ,compRecA :foundUser.compRecA, compRecB :foundUser.compRecB, compRecC :foundUser.compRecC, 
        compRecD :foundUser.compRecD, compRecE :foundUser.compRecE,futProfile: foundUser.futProfile});
      }
    });
  }
});
});

var filteredExams = mongoose.model("filteredExams", examSchema);
app.post("/compexams", function (req, res) {
  User.findById(req.user.id,function(err,foundUser){
  filteredExams = [];
  if (req.body.srchInput) {
    const searchString = _.lowerCase([req.body.srchInput]);
    Exam.find({}, function (err, foundCerts) {
      if (!err) {
        foundCerts.forEach(function (foundCert) {
          if (_.lowerCase([foundCert.exNam]) === (searchString)) {
            filteredExams.push(foundCert);
          }
        });
        var AllSuggest = [];
        foundCerts.forEach(element => {
         AllSuggest.push(element.exNam);
          });
const CourseSuggest = AllSuggest.filter((x, i, a) => a.indexOf(x) == i);
        res.render("compexams", {CourseSuggest:CourseSuggest,
          certNames: filteredExams,Notifis: foundUser.Noti, NotifiLen: foundUser.Noti.length,futProfile: foundUser.futProfile
        });
      }
    });
  }
  else {
    Exam.find({}, function (err, foundCerts) {
      if (!err) {
        var AllSuggest = [];
        foundCerts.forEach(element => {
         AllSuggest.push(element.exNam);
          });
const CourseSuggest = AllSuggest.filter((x, i, a) => a.indexOf(x) == i);
        res.render("compexams", {CourseSuggest:CourseSuggest,
          certNames: foundCerts,Notifis: foundUser.Noti, NotifiLen: foundUser.Noti.length,futProfile: foundUser.futProfile
        });
      }
    });
  }
});
});

var filteredCert = mongoose.model("filteredCert", certSchema);

app.post("/certifications", function (req, res) {
  User.findById(req.user.id, function (err, foundUser) {
    if (err) {
      console.log(err);
    } else {
      if (foundUser.futProfile) {
        filteredCert = [];
        if (req.body.srchInput) {
          const searchString = _.lowerCase([req.body.srchInput]);
          Certification.find({}, function (err, foundCerts) {
            if (!err) {
              foundCerts.forEach(function (foundCert) { if (_.lowerCase([foundCert.certNam]) === (searchString)) { filteredCert.push(foundCert); } });
             var AllSuggest = [];
         foundCerts.forEach(element => {
          AllSuggest.push(element.certNam);
              });
const CourseSuggest = AllSuggest.filter((x, i, a) => a.indexOf(x) == i);
              res.render("certifications", {CourseSuggest:CourseSuggest,certNames: filteredCert, courseCertA: foundUser.courseCertA, courseCertB: foundUser.courseCertB, courseCertC: foundUser.courseCertC, 
                courseCertD: foundUser.courseCertD, courseCertE: foundUser.courseCertE,Notifis: foundUser.Noti, NotifiLen: foundUser.Noti.length, futProfile: foundUser.futProfile
              });
            }
          });
        }
        else {
          Certification.find({}, function (err, foundCerts) {
            if (!err) {
              var AllSuggest = [];
         foundCerts.forEach(element => {
          AllSuggest.push(element.certNam);
              });
const CourseSuggest = AllSuggest.filter((x, i, a) => a.indexOf(x) == i);
            res.render("certifications", {CourseSuggest:CourseSuggest ,certNames: foundCerts, courseCertA: foundUser.courseCertA, courseCertB: foundUser.courseCertB, courseCertC: foundUser.courseCertC, 
                courseCertD: foundUser.courseCertD, courseCertE: foundUser.courseCertE,Notifis: foundUser.Noti, NotifiLen: foundUser.Noti.length,futProfile: foundUser.futProfile
              });
            }
          });
        }
      }
      else {
        filteredCert = [];
        if (req.body.srchInput) {
          const searchString = _.lowerCase([req.body.srchInput]);
          Certification.find({}, function (err, foundCerts) {
            if (!err) {
              foundCerts.forEach(function (foundCert) {
                if (_.lowerCase([foundCert.certNam]) === (searchString)) {
                  filteredCert.push(foundCert);
                }
              });
              var AllSuggest = [];
         foundCerts.forEach(element => {
          AllSuggest.push(element.certNam);
              });
const CourseSuggest = AllSuggest.filter((x, i, a) => a.indexOf(x) == i);
              res.render("certifications", {CourseSuggest:CourseSuggest, certNames: filteredCert ,futProfile: foundUser.futProfile});
            }
          });
        }
        else {
          Certification.find({}, function (err, foundCerts) { if (!err) {
            var AllSuggest = [];
            foundCerts.forEach(element => {
             AllSuggest.push(element.certNam);
                 });
   const CourseSuggest = AllSuggest.filter((x, i, a) => a.indexOf(x) == i);
             res.render("certifications", {CourseSuggest:CourseSuggest, certNames: foundCerts ,futProfile: foundUser.futProfile}); } });
        }
      }
    }
  });
});

var filteredCourse = mongoose.model("filteredCourse", courseSchema);

app.post("/courses", function (req, res) {
  User.findById(req.user.id, function (err, foundUser) {
    if (err) {
      console.log(err);
    } else {
      filteredCourse = [];
      if (req.body.srchInput) {
        const searchString = _.lowerCase([req.body.srchInput]);
        Course.find({}, function (err, foundCerts) {
          if (!err) {
            foundCerts.forEach(function (foundCert) {
              if (_.lowerCase([foundCert.degMjr]) === (searchString)) { filteredCourse.push(foundCert); }
            });
            var AllSuggest = [];
         foundCerts.forEach(element => {
          AllSuggest.push(element.degMjr);
              });
              const CourseSuggest = AllSuggest.filter((x, i, a) => a.indexOf(x) == i);
           res.render("courses", { CourseSuggest:CourseSuggest,certNames: filteredCourse,Notifis: foundUser.Noti, NotifiLen: foundUser.Noti.length,futProfile: foundUser.futProfile,certNames: foundCerts, courseRecA: foundUser.courseRecA,
            courseRecB: foundUser.courseRecB, courseRecC: foundUser.courseRecC, courseRecD: foundUser.courseRecD,
            courseRecE: foundUser.courseRecE });
          }
        });
      }
      else {
        Course.find({}, function (err, foundCerts) {
          if (!err) {
           var AllSuggest = [];
         foundCerts.forEach(element => {
          AllSuggest.push(element.degMjr);
              });
const CourseSuggest = AllSuggest.filter((x, i, a) => a.indexOf(x) == i);
            res.render("courses", {CourseSuggest:CourseSuggest,
              certNames: foundCerts, courseRecA: foundUser.courseRecA,
              courseRecB: foundUser.courseRecB, courseRecC: foundUser.courseRecC, courseRecD: foundUser.courseRecD,
              courseRecE: foundUser.courseRecE,Notifis: foundUser.Noti, NotifiLen: foundUser.Noti.length,futProfile: foundUser.futProfile
            });
          }
        });
      }
    }
  });
});


var filteredSchol = mongoose.model("filteredSchol", scholSchema);

app.post("/scholarship", function (req, res) {
  User.findById(req.user.id,function(err,foundUser){
  filteredSchol = [];
  if (req.body.srchInput) {
    const searchString = _.lowerCase([req.body.srchInput]);
    Scholarship.find({}, function (err, foundCerts) {
      if (!err) {
        foundCerts.forEach(function (foundCert) {
          if (_.lowerCase([foundCert.name]) === (searchString)) {
            filteredSchol.push(foundCert);
          }
        });
        res.render("scholarship", {
          certNames: filteredSchol,Notifis: foundUser.Noti, NotifiLen: foundUser.Noti.length,futProfile: foundUser.futProfile
        });
      }
    });
  }
  else {
    Scholarship.find({}, function (err, foundCerts) {
      if (!err) {
        res.render("scholarship", {
          certNames: foundCerts,Notifis: foundUser.Noti, NotifiLen: foundUser.Noti.length,futProfile: foundUser.futProfile
        });
      }
    });
  }
});
});


var filteredTrends = mongoose.model("filteredTrends", trendSchema);

app.post("/trends", function (req, res) {
 User.findById(req.user.id,function(err,foundUser){
 filteredTrends = [];
  if (req.body.srchInput) {
    const searchString = _.lowerCase([req.body.srchInput]);
    Trend.find({}, function (err, foundCerts) {
      if (!err) {
        foundCerts.forEach(function (foundCert) {
          if (_.lowerCase([foundCert.name]) === (searchString)) {
            filteredTrends.push(foundCert);
          }
        });
        res.render("trends", {
          certNames: filteredTrends,Notifis: foundUser.Noti, NotifiLen: foundUser.Noti.length
        });
      }
    });
  }
  else {
    Trend.find({}, function (err, foundCerts) {
      if (!err) {
        res.render("trends", {
          certNames: foundCerts,Notifis: foundUser.Noti, NotifiLen: foundUser.Noti.length
        });
      }
    });
  }
});
});

var filteredFuture = mongoose.model("filteredFuture", profileSchema);

app.post("/future", function (req, res) {
 User.findById(req.user.id,function(err,foundUser){
  filteredFuture = [];
  if (req.body.srchInput) {
    const searchString = _.lowerCase([req.body.srchInput]);
    Fprofile.find({}, function (err, foundCerts) {
      if (!err) {
        foundCerts.forEach(function (foundCert) {
          if (_.lowerCase([foundCert.name]) === (searchString)) {
            filteredFuture.push(foundCert);
          }
        });
        res.render("future", {
          certNames: filteredFuture,Notifis: foundUser.Noti, NotifiLen: foundUser.Noti.length
        });
      }
    });
  }
  else {
    Fprofile.find({}, function (err, foundCerts) {
      if (!err) {
        var AllSuggest = [];
        foundCerts.forEach(element => {
         AllSuggest.push(element.name);
             });
const CourseSuggest = AllSuggest.filter((x, i, a) => a.indexOf(x) == i);
        res.render("future", {CourseSuggest:CourseSuggest,
          certNames: foundCerts,Notifis: foundUser.Noti, NotifiLen: foundUser.Noti.length
        });
      }
    });
  }
});
});

// chat button from mentors will land them up here which should be visible at the home page
app.get("/feedback", function (req, res) {
 console.log(`from the get feedback: ${MentId} and ${MenteeId}`);
  res.render("feedback",{MentId:MentId,MenteeId:MenteeId});

});

app.post("/Secondaryfeedback",function(req,res){
var MentId = req.body.MentId;
var MenteeId = req.body.MenteeId;
console.log(` Secondary feedback: ${MentId} and ${MenteeId}`);
res.render("feedback",{MentId:MentId,MenteeId:MenteeId});
});

app.post("/feedback", function (req, res) {
  var MentId = req.body.MentId;
  var MenteeId = req.body.MenteeId;
  var rating = req.body.test;
   User.findById(MenteeId, function (err, foundMentee) {
      if (req.user.id == MentId) {
        foundMentee.rating += Number(rating);
        foundMentee.rateCount += 1;
        foundMentee.save();
        console.log(`here are the post rating: ${foundMentee.rating} and the ${foundMentee.rateCount}`);
        } 
User.findById(MentId,function(err,foundMent){
  console.log(`removing the Pend`);
for (let i = 0; i < foundMent.Pend.length; i++) {
  if(foundMent.Pend[i].MentId==MenteeId){
    User.findOneAndUpdate({ _id: foundMent._id }, { $pull: { Pend: { MentId: MenteeId } } }, function (err, foundList) {
      if (!err) {
        foundMent.save();
        console.log(`Removed from the pending list`);
        }
    });
  }
}
});
      res.redirect("home");
    });
});

app.post("/mentee", function (req, res) {
  // userRequested is the one who is logged in and mentor is the one I selected
  User.findById(req.body.mentorRequested, function (err, foundMenti) {
    User.findById(req.body.userRequested, function (err, foundUser) {
      if (!err) {
        // send a notification to the user's notification database when the request is submitted
        var reqNot = new Notifi({ info: `Request sent to mentor ${foundMenti.fName}` });
        var reqNotMent = new Notifi({ info: `Mentee request received ${foundUser.fName}` });
        foundUser.Noti.push(reqNot);
        foundMenti.Noti.push(reqNotMent);
        console.log(`from mentee: ${foundUser.Noti[0].info}`);
        console.log(`from mentee: ${foundMenti.Noti[0].info}`);
        var test = new MenteeReq({ MentName: foundUser.fName, MentId: req.body.userRequested });
        foundMenti.MentiReq.push(test);
        foundMenti.save();
        foundUser.save();
        res.redirect("home");
      }
    });
  });
});

app.post("/mentors", function (req, res) {
  User.findById(req.user.id, function (err, foundUser) {
    User.find({}, function (err, foundMentors) {
      console.log(`----------------------`);
      foundMentors.forEach(element => {
        // if they have a rating and a mentee count
        if (element.rating > 0 && element.rateCount > 0) {
          element.score = Math.round((element.rating / element.rateCount)) + element.Menti.length + element.Ment.length + element.ansCount + element.quesCount;
        } else {
          element.score = element.Menti.length + element.Ment.length + element.ansCount + element.quesCount;
        }
        element.save();
      });
      var SortedUsers = [];
      for (let i = 0; i < foundMentors.length; i++) {
        SortedUsers.push(foundMentors[i]);
      }
      SortedUsers.sort(function (a, b) {
        return b.score - a.score;
      });
      // right variable is local and left variable is for that page
      if (typeof SortedUsers[50] != 'undefined') {
        res.render("mentor", { foundMentors: foundMentors, currentUser: req.user.id, Notifis: foundUser.Noti, NotifiLen: foundUser.Noti.length, SortedUsers: SortedUsers.slice(0, 50) });
      } else {
        res.render("mentor", { foundMentors: foundMentors, currentUser: req.user.id, Notifis: foundUser.Noti, NotifiLen: foundUser.Noti.length, SortedUsers: SortedUsers });
      }
    })
  })
});


app.post("/futhome", function (req, res) {
  
  User.findById(req.user.id, function (err, foundUser) {
    if (err) {
      console.log(err);
    } else {
      var dataToSend;
      
      const python = spawn('python', ['recommend.py', req.body.fprofile]);
      
      python.stdout.on('data', function (data) {
        console.log(`here is the fut profile:${req.body.fprofile}`); 
        dataToSend = data.toString();
        foundUser.futProfile = req.body.fprofile;
        foundUser.fReq1 = req.body.freq1;
        foundUser.fReq2 = req.body.freq2;
        foundUser.fReq3 = req.body.freq3;
        console.log(`Courses ----1---------------------\n ${dataToSend.split("|")}`);
        console.log(`length of the ${(dataToSend.split("|")).length}`);
        if ((dataToSend.split("|")).length==5) {
          foundUser.courseRecA = dataToSend.split("|")[0];
          foundUser.courseRecB = dataToSend.split("|")[1];
          foundUser.courseRecC = dataToSend.split("|")[2];
          foundUser.courseRecD = dataToSend.split("|")[3];
          foundUser.courseRecE = dataToSend.split("|")[4]; 
        } else if((dataToSend.split("|")).length==4) {
          foundUser.courseRecA = dataToSend.split("|")[0];
          foundUser.courseRecB = dataToSend.split("|")[1];
          foundUser.courseRecC = dataToSend.split("|")[2];
          foundUser.courseRecD = dataToSend.split("|")[3];
          foundUser.courseRecE = 0;
        } else if((dataToSend.split("|")).length==3) {
          foundUser.courseRecA = dataToSend.split("|")[0];
          foundUser.courseRecB = dataToSend.split("|")[1];
          foundUser.courseRecC = dataToSend.split("|")[2]; 
          foundUser.courseRecD = 0;
          foundUser.courseRecE = 0;        
        } else if((dataToSend.split("|")).length==2){
          foundUser.courseRecA = dataToSend.split("|")[0];
          foundUser.courseRecB = dataToSend.split("|")[1];
          foundUser.courseRecC = 0; 
          foundUser.courseRecD = 0;
          foundUser.courseRecE = 0;
        } else if((dataToSend.split("|")).length==1){
          foundUser.courseRecA = dataToSend.split("|")[0];
          foundUser.courseRecB = 0;
          foundUser.courseRecC = 0; 
          foundUser.courseRecD = 0;
          foundUser.courseRecE = 0;
        }
        // foundUser.save();
      });
      

      var dataToSendCert;
      const pythonCert = spawn('python', ['recommendcert.py', req.body.fprofile]);
      pythonCert.stdout.on('data', function (data) {
        console.log(`Certifications -----2-----\n ${data}`);
        dataToSendCert = data.toString();
    if ((dataToSendCert.split("|")).length==5) {
    foundUser.courseCertA = dataToSendCert.split("|")[0];
    foundUser.courseCertB = dataToSendCert.split("|")[1];
    foundUser.courseCertC = dataToSendCert.split("|")[2];
    foundUser.courseCertD = dataToSendCert.split("|")[3];
    foundUser.courseCertE = dataToSendCert.split("|")[4]; 
  } else if((dataToSendCert.split("|")).length==4) {
    foundUser.courseCertA = dataToSendCert.split("|")[0];
    foundUser.courseCertB = dataToSendCert.split("|")[1];
    foundUser.courseCertC = dataToSendCert.split("|")[2];
    foundUser.courseCertD = dataToSendCert.split("|")[3];
    foundUser.courseCertE = 0;
  } else if((dataToSendCert.split("|")).length==3) {
    foundUser.courseCertA = dataToSendCert.split("|")[0];
    foundUser.courseCertB = dataToSendCert.split("|")[1];
    foundUser.courseCertC = dataToSendCert.split("|")[2]; 
    foundUser.courseCertD = 0;
    foundUser.courseCertE = 0;         
  } else if((dataToSendCert.split("|")).length==2){
    foundUser.courseCertA = dataToSendCert.split("|")[0];
    foundUser.courseCertB = dataToSendCert.split("|")[1];
    foundUser.courseCertC = 0; 
    foundUser.courseCertD = 0;
    foundUser.courseCertE = 0;
  } else if((dataToSendCert.split("|")).length==1){
    foundUser.courseCertA = dataToSendCert.split("|")[0];
    foundUser.courseCertB = 0;
    foundUser.courseCertC = 0; 
    foundUser.courseCertD = 0;
    foundUser.courseCertE = 0;
  }
 
      });
    
      var dataToSendComp;
      const pythonComp = spawn('python', ['recommendcomp.py', req.body.fprofile]);
      pythonComp.stdout.on('data', function (data) {
        console.log(`Competitions ----3----\n ${data}`);
        
        dataToSendComp = data.toString();
       
        if ((dataToSendComp.split("|")).length==5) {
          foundUser.compRecA = dataToSendComp.split("|")[0];
          foundUser.compRecB = dataToSendComp.split("|")[1];
          foundUser.compRecC = dataToSendComp.split("|")[2];
          foundUser.compRecD = dataToSendComp.split("|")[3];
          foundUser.compRecE = dataToSendComp.split("|")[4]; 
        } else if((dataToSendComp.split("|")).length==4) {
          foundUser.compRecA = dataToSendComp.split("|")[0];
          foundUser.compRecB = dataToSendComp.split("|")[1];
          foundUser.compRecC = dataToSendComp.split("|")[2];
          foundUser.compRecD = dataToSendComp.split("|")[3];
          foundUser.compRecE = 0;
        } else if((dataToSendComp.split("|")).length==3) {
          foundUser.compRecA = dataToSendComp.split("|")[0];
          foundUser.compRecB = dataToSendComp.split("|")[1];
          foundUser.compRecC = dataToSendComp.split("|")[2];  
          foundUser.compRecD = 0;
          foundUser.compRecE = 0;        
        } else if((dataToSendComp.split("|")).length==2){
          foundUser.compRecA = dataToSendComp.split("|")[0];
          foundUser.compRecB = dataToSendComp.split("|")[1];
          foundUser.compRecC = 0; 
          foundUser.compRecD = 0;
          foundUser.compRecE = 0;
        } else if((dataToSendComp.split("|")).length==1){
          foundUser.compRecA = dataToSendComp.split("|")[0];
          foundUser.compRecB = 0;
          foundUser.compRecC = 0; 
          foundUser.compRecD = 0;
          foundUser.compRecE = 0;
        }
       
        
                
        
      });
    // this is the part below which takes time.
      python.on('close', (code,signal) => {
      console.log(`child process close all stdio with code from Courses ${code} and signal is ${signal}`);
      foundUser.save(function () {
      
      res.redirect("home");
      });
        });
      
    //   pythonCert.on('close', (code) => {
    //     console.log(`child process close all stdio with code from Certificates ${code}`);
    //     // foundUser.save(function () {
    //     //   console.log(`second ${foundUser.futProfile}`);
    //     //   // res.redirect("home");
    //     // });
    //  });
      
        // pythonComp.on('close', (code) => {
        //   console.log(`child process close all stdio with code from Competitions ${code}`);
        //   //  foundUser.save(function () {
        //   //   console.log(`third ${foundUser.futProfile}`);
        //   //     // res.redirect("home");
        //   //  });
        // });

    }
  })
});

app.post("/felhome", function (req, res) {
  User.findById(req.user.id, function (err, foundUser) {
    if (err) {
      console.log(err);
    } else {
      foundUser.futFellow = req.body.fFellow;
      foundUser.save(function () { res.redirect("home"); })
    }
  })
});

app.post("/certhome", function (req, res) {
  User.findById(req.user.id, function (err, foundUser) {
    if (err) {
      console.log(err);
    } else {
      foundUser.futCerti = req.body.fCerti;
      foundUser.save(function () {
        res.redirect("home");
      })
    }
  })
});

app.post("/courhome", function (req, res) {
  User.findById(req.user.id, function (err, foundUser) {
    if (err) {
      console.log(err);
    } else {
      // foundUser.futDeg = req.body.ftDeg;
      foundUser.futMajor = req.body.ftMajor;
      foundUser.save(function () {
        res.redirect("home");
      })
    }
  })
});

app.post("/comphome", function (req, res) {
  User.findById(req.user.id, function (err, foundUser) {
    if (err) {
      console.log(err);
    } else {
      foundUser.futComp = req.body.fComp;
      foundUser.save(function () {
        res.redirect("home");
      })
    }
  })
});

app.post("/examhome", function (req, res) {
  User.findById(req.user.id, function (err, foundUser) {
    if (err) {
      console.log(err);
    } else {
      foundUser.futExam = req.body.fExam;
      foundUser.save(function () {
        res.redirect("home");
      })
    }
  })
});

app.post("/trendhome", function (req, res) {
  User.findById(req.user.id, function (err, foundUser) {
    if (err) {
      console.log(err);
    } else {
      foundUser.futTrend = req.body.fTrend;
      foundUser.save(function () {
        res.redirect("home");
      })
    }
  })
});

app.post("/menteeAdd", function (req, res) {
  User.findById(req.user.id, function (err, foundUser) {
    if (err) { console.log(err); }
    else {
      if (foundUser.MentiReq.length + 1 < 4) {
        console.log("---------------------");
        var newMentee = req.body.MentId.split(" ").join("")
        User.findById(newMentee, function (err, MentorFound) {
          if (err) { console.log(err); }
          else {
            var SameCount = 0;
            for (var i = 0; i < foundUser.MentiReq.length; i++) {
              if (foundUser.MentiReq[i].MentId == newMentee) {
                SameCount += 1;
                console.log(`Count: ${SameCount} match found, cannot be added`);
              }
            }
            if (SameCount == 1) {
              console.log(`Count: ${SameCount} match not found, mentee added`);
              var test = new Mentee({ MentName: MentorFound.fName, MentId: newMentee });
              foundUser.Menti.push(test);
              var adment = new Mentor({ MentName: foundUser.fName, MentId: foundUser._id });
              MentorFound.Ment.push(adment);
              var reqNot = new Notifi({ info: 'Mentor has approved the request' });
              MentorFound.Noti.push(reqNot);
              console.log(`Printing the noti from menteeAdd: ${MentorFound.Noti[0].info}`);
              foundUser.save();
              MentorFound.save();
              // send a notification to the mentee's notification database that you have been approved
            }
          }
        })
      }
      else {
        res.redirect("home");
      }
    }
    // remove request
    for (let i = 0; i < foundUser.MentiReq.length; i++) {
      var MentIdRemove = req.body.MentId.split(" ").join("")
      if (foundUser.MentiReq[i].MentId == MentIdRemove) {
        User.findOneAndUpdate({ _id: foundUser._id }, { $pull: { MentiReq: { MentId: MentIdRemove } } }, function (err, foundList) {
          if (!err) {
            console.log("deleted from mentee req list");
            res.redirect("home");
          }
        });
      }
    }
  });
})

app.post("/MentorChat", function (req, res) {
  var MentId = req.body.MentId.split(" ").join("");
  User.findById(req.user.id, function (err, foundUser) {
    if (err) {
      console.log(err);
    } else {
      for (let i = 0; i < foundUser.Ment.length; i++) {
        if (foundUser.Ment[i].MentId == MentId) {
          Chat.find({}, function (err, foundChat) {
            if (!err) {
              var ChatCount = 0;
              for (let y = 0; y < foundChat.length; y++) {
                if ((foundChat[y].userOneId == foundUser._id && foundChat[y].userTwoId == MentId) || (foundChat[y].userTwoId == foundUser._id && foundChat[y].userOneId == MentId)) {
                  var ChatMessage = foundChat[y].mess;
                  ChatCount += 1;
                } else { }
              }
              if (ChatCount == 1) {
                res.render("chat", { mentorReq: foundUser, mentorName: foundUser.Ment[i], ChatMessage: ChatMessage });
              } else {
                res.render("chat", { mentorReq: foundUser, mentorName: foundUser.Ment[i] });
              }
            } else { console.log(err); }
          })
        } else { };
      }
    }
  });
});

app.post("/MenteeChat", function (req, res) {
  var MentId = req.body.MentId.split(" ").join("");
  User.findById(req.user.id, function (err, foundUser) {
    if (err) {
      console.log(err);
    } else {
      for (let i = 0; i < foundUser.Menti.length; i++) {
        if (foundUser.Menti[i].MentId == MentId) {
          Chat.find({}, function (err, foundChat) {
            if (!err) {
              var ChatCount = 0;
              for (let y = 0; y < foundChat.length; y++) {
                if ((foundChat[y].userOneId == foundUser._id && foundChat[y].userTwoId == MentId) || (foundChat[y].userTwoId == foundUser._id && foundChat[y].userOneId == MentId)) {
                  var ChatMessage = foundChat[y].mess;
                  ChatCount += 1;
                } else { }
              }
              if (ChatCount == 1) {
                res.render("chat", { mentorReq: foundUser, mentorName: foundUser.Menti[i], ChatMessage: ChatMessage });
              } else {
                res.render("chat", { mentorReq: foundUser, mentorName: foundUser.Menti[i] });
              }
            } else { console.log(err); }
          })
        } else { };
      }
    }
  });
});

app.post("/MentorRemove", function (req, res) {
  var MentIdRemove = req.body.MentId.split(" ").join("");
  User.findById(req.user.id, function (err, foundUser) {
    if (err) {
      console.log(err);
    } else {
      for (let i = 0; i < foundUser.Ment.length; i++) {
        if (foundUser.Ment[i].MentId == MentIdRemove) {
          User.findOneAndUpdate({ _id: foundUser._id }, { $pull: { Ment: { MentId: MentIdRemove } } }, function (err, foundList) {
            if (!err) {
              console.log("deleted from other lists");
              User.findById(MentIdRemove, function (err, RemovedUser) {
                // push a notification that submit the feedback
                if (!err) {
                 for (let i = 0; i < RemovedUser.Menti.length; i++) {
                    if (RemovedUser.Menti[i].MentId == foundUser._id) {
                      User.findOneAndUpdate({ _id: RemovedUser._id }, { $pull: { Menti: { MentId: foundUser._id } } }, function (err, foundList) {
                        if (!err) {
                          console.log("deleted mentee (me) from the mentor's list");
                          var reqNotMentee = new Notifi({ info: 'Submit a feedback for your Mentor' });
                          RemovedUser.Noti.push(reqNotMentee);
                          var adment = new PendFeed({ MentName: foundUser.fName, MentId: foundUser._id });
                          RemovedUser.Pend.push(adment);
                          RemovedUser.save();
                          res.render("feedback", { MentId:foundUser._id, MenteeId:MentIdRemove });
                        }
                      });
                    }
                  }
                }
              });
            }
          });
        }
      }
    }
  });
});


app.post("/MenteeRemove", function (req, res) {
  var MentIdRemove = req.body.MentId.split(" ").join("");
  User.findById(req.user.id, function (err, foundUser) {
    if (err) {
      console.log(err);
    } else {
      for (let i = 0; i < foundUser.Menti.length; i++) {
        if (foundUser.Menti[i].MentId == MentIdRemove) {
          User.findOneAndUpdate({ _id: foundUser._id }, { $pull: { Menti: { MentId: MentIdRemove } } }, function (err, foundList) {
            if (!err) {
              console.log("deleted from other lists");
              // pull the mentee and remove the mentor (me) from there
              User.findById(MentIdRemove, function (err, foundMentee) {
                for (let i = 0; i < foundMentee.Ment.length; i++) {
                  if (foundMentee.Ment[i].MentId == foundUser._id) {
                    User.findOneAndUpdate({ _id: foundMentee._id }, { $pull: { Ment: { MentId: foundUser._id } } }, function (err, foundList) {
                      if (!err) {
                        console.log("deleted mentor (me) from the mentee's list");
                        var reqNot = new Notifi({ info: 'Submit feedback for your Mentor' });
                        foundMentee.Noti.push(reqNot);
                        var adment = new PendFeed({ MentName: foundUser.fName, MentId: foundUser._id });
                        foundMentee.Pend.push(adment);
                        foundMentee.save();
                        res.render("feedback", { MentId: foundUser._id, MenteeId: MentIdRemove });
                      }
                    });
                  }
                }
              })
            }
          });
        }
      }
      for (let i = 0; i < foundUser.MentiReq.length; i++) {
        if (foundUser.MentiReq[i].MentId == MentIdRemove) {
          User.findOneAndUpdate({ _id: foundUser._id }, { $pull: { MentiReq: { MentId: MentIdRemove } } }, function (err, foundList) {
            if (!err) {
              console.log("deleted from other lists");
              res.redirect("home");
            }
          });
        }
      }
    }
  });
});

app.post("/RemoveSelected", function(req,res){
  User.findById(req.user.id,function(err, foundUser){
  if(!err){
    if(req.body.RemoveSelected==1){
      foundUser.futComp=0;
      
      foundUser.save();
      res.redirect("home");
    }else if(req.body.RemoveSelected==2)  
    {foundUser.futExam=0;
      
      foundUser.save();
      res.redirect("home"); }
    else if(req.body.RemoveSelected==3)  
    {foundUser.futCerti=0;
      
      foundUser.save();
      res.redirect("home");}
    else if(req.body.RemoveSelected==4)  
    {foundUser.futMajor=0; 
    foundUser.save();
    res.redirect("home"); }
    else if(req.body.RemoveSelected==5)  
    {foundUser.futFellow=0;
    foundUser.save();
    res.redirect("home"); }
  
  }else{
    console.log(err);
  }
});
});


app.post("/MessageSent", function (req, res) {
  var MentId = req.body.mentorId.split(" ").join("");
  User.findById(req.user.id, function (err, foundUser) {
    if (err) {
      console.log(err);
    } else {
      for (let i = 0; i < foundUser.Ment.length; i++) {
        if (foundUser.Ment[i].MentId == MentId) {
          Chat.find({}, function (err, foundChat) {
            if (!err) {
              var MessCount = 0;
              var AllMess = "";
              foundChat.forEach(element => {
                if ((element.userOneId == req.body.currentUserId && element.userTwoId == req.body.mentorId) || (element.userTwoId == req.body.currentUserId && element.userOneId == req.body.mentorId)) {
                  var NewMess = new Message({ message: req.body.mess, writer: req.body.currentUserId });
                  element.mess.push(NewMess);
                  element.save();
                  AllMess = element.mess;
                  MessCount += 1;
                } else {
                }
              });
              if (MessCount == 1) {
                res.render("chat", { mentorReq: foundUser, mentorName: foundUser.Ment[i], ChatMessage: AllMess });
                console.log(`When present-------------: ${AllMess}`);
              } else {
                var mess = new Message({ message: req.body.mess, writer: req.body.currentUserId });
                var newChat = new Chat({ userOneId: req.body.currentUserId, userTwoId: req.body.mentorId, mess: mess });
                newChat.save();
                res.render("chat", { mentorReq: foundUser, mentorName: foundUser.Ment[i], ChatMessage: newChat.mess });
                console.log(`when not present---------${newChat.mess}`);
              }
            }
          })
        }
      }
      for (let i = 0; i < foundUser.Menti.length; i++) {
        if (foundUser.Menti[i].MentId == MentId) {
          Chat.find({}, function (err, foundChat) {
            if (!err) {
              var MessCount = 0;
              var AllMess = "";
              foundChat.forEach(element => {
                if ((element.userOneId == req.body.currentUserId && element.userTwoId == req.body.mentorId) || (element.userTwoId == req.body.currentUserId && element.userOneId == req.body.mentorId)) {
                  var NewMess = new Message({ message: req.body.mess, writer: req.body.currentUserId });
                  element.mess.push(NewMess);
                  element.save();
                  AllMess = element.mess;
                  MessCount += 1;
                } else {
                }
              });
              if (MessCount == 1) {
                res.render("chat", { mentorReq: foundUser, mentorName: foundUser.Menti[i], ChatMessage: AllMess });
                console.log(`When present-------------: ${AllMess}`);
              } else {
                var mess = new Message({ message: req.body.mess, writer: req.body.currentUserId });
                var newChat = new Chat({ userOneId: req.body.currentUserId, userTwoId: req.body.mentorId, mess: mess });
                newChat.save();
                res.render("chat", { mentorReq: foundUser, mentorName: foundUser.Menti[i], ChatMessage: newChat.mess });
                console.log(`when not present---------${newChat.mess}`);
              }
            }
          })
        }
      }
    }
  });
});



app.get("/post", function (req, res) {
  User.findById(req.user.id, function (err, foundUser) {
    if (err) {
      console.log(err);
    } else {
      Question.find({}, function (err, foundQues) {
        if (!err) {
          Answer.find({}, function (err, foundAns) {
            if (foundAns.length === 0) {
              Answer.insertMany(ans1, function (err) {
                if (!err) {
                  console.log("success");
                } else {
                  console.log("no success");
                }
              });
            } else {
              var CourseSuggest = [];
              foundQues.forEach(element => {
                CourseSuggest.push(element.ques);
              });
              res.render("post", {CourseSuggest:CourseSuggest,
                certNames: foundQues, certAns: foundAns, WriterId: foundUser._id
              });
            }
          })
        }
      });
    }
  })

});

app.post("/posts", function (req, res) {
  User.findById(req.user.id, function (err, foundUser) {
    const newQues = new Question({
      ques: req.body.quesbtn,
      quesWriter: req.body.WriterId
    });
    newQues.save();
    foundUser.quesCount += 1;
    res.redirect("post");
  });
});

app.post("/answer", function (req, res) {
  User.findById(req.user.id, function (err, foundUser) {
    const reply = new Answer({
      answer: req.body.ansbtn,
      ansWriter: req.body.ansWriterId
    });
    const questionId = req.body.questionId;
    Question.findOne({
      _id: questionId
    }, function (err, foundQ) {
      if (!err) {
        foundQ.ans.push(reply);
        foundQ.save();
        foundUser.ansCount += 1;
      }
    });
    res.redirect("post");
  });
});

app.post("/post", function (req, res) {
  res.redirect("post");
})

app.post("/complain", function (req, res) {
  console.log(req.body.feedback);
  var Userfeedback = new Feedback({ feed: req.body.feedback, UserId: req.user.id });
  Userfeedback.save();
});

app.get("/logout", function (req, res) {
  req.logout();
  res.redirect("/");
})

app.listen(process.env.PORT || 3000, function () {
  console.log("Server running at port 3000");
});

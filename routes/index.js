var express = require("express");
var router = express.Router();

var nodemailer = require("nodemailer");
var config = require("../config");
var transporter = nodemailer.createTransport(config.mailer);

/* GET home page. */
router.get("/", function(req, res, next) {
  var email;
  if (req.user) {
    email = req.user.email;
    var userTasks;
    User.findOne({ email: email }, function(err, user) {
      if (err) {
        next(err);
      }
      Task.find({
        $or: [{ owner: user._id }, { sharedTo: { $in: [user._id] } }]
      })
        .populate("owner")
        .exec(function(err, tasks) {
          if (err) {
            console.log(error);
            next(err);
          }
          userTasks = tasks;
          res.render("index", {
            userTasks: userTasks
          });
        });
    });
  } else {
    res.render("index");
  }
});

router.get("/about", function(req, res, next) {
  res.render("about", { title: "CodeCoWork - share your code easy!" });
});
router
  .route("/contact")
  .get(function(req, res, next) {
    res.render("contact", { title: "CodeCoWork - share your code easy!" });
  })
  .post(function(req, res, next) {
    req.checkBody("name", "Empty name").notEmpty();
    req.checkBody("email", "Invalid email").isEmail();
    req.checkBody("message", "Empty message").notEmpty();
    var errors = req.validationErrors();

    if (errors) {
      res.render("contact", {
        title: "CodeCoWork - share your code easy!",
        name: req.body.name,
        email: req.body.email,
        message: req.body.message,
        errorMessages: errors
      });
    } else {
      var mailOptions = {
        from: "Code4Share <no-reply@code4share.com>",
        to: "icestrength1@gmail.com",
        subject: "You got a new message from visitor 💋 😽",
        text: req.body.message
      };

      transporter.sendMail(mailOptions, function(error, info) {
        if (error) {
          return console.log(error);
        }
      });
      res.render("thank", { title: "CodeCoWork - share your code easy!" });
    }
  });

module.exports = router;

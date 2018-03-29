var express = require("express");
var fs = require("fs");
var router = express.Router();

router.post("/createTask", function(req, res, next) {
  var email = req.user.email;
  var title = req.body.title;
  User.findOne({ email: email })
    .then(userDoc => {
      if (!userDoc) {
        next();
      }
      var newTask = new Task({ title: title, owner: userDoc._id });
      newTask.save().then(taskDoc => {
        User.update({ email: email }, { $push: { tasks: taskDoc._id } }).then(
          user => {
            if (!user) {
              next();
            }
            res.redirect("/task/" + taskDoc._id);
          }
        );
      });
    })
    .catch(error => {
      res.status(error.status_code).send(error.message);
    });
});

router.get("/task/:id", isAuthenticated, function(req, res, next) {
  if (req.params.id && req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
    Task.findOne({ _id: req.params.id })
      .populate("owner")
      .populate("sharedTo")
      .exec()
      .then(data => {
        if (!data) {
          return next();
        }
        User.findOne({
          email: req.user.email,
          tasks: { $in: [data._id] }
        }).then(user => {
          if (!user) {
            return res.status(403).send("You have no access for this task");
          }
        });
        res.render("task", { content: data, roomId: data.id });
      })
      .catch(next);
  } else {
    return next();
  }
});

router.get("/remove/:id", isAuthenticated, function(req, res, next) {
  if (req.params.id && req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
    User.update(
      {},
      { $pull: { tasks: { $in: [req.params.id] } } },
      { multi: true }
    )
      .then(user => {
        if (!user) {
          next();
        }
        Task.findOneAndRemove({ _id: req.params.id }).then(task => {
          if (!task) {
            next();
          }
          return res.redirect("/");
        });
      })
      .catch(next);
  } else {
    return next();
  }
});

router.get("/download/:id", isAuthenticated, function(req, res, next) {
  if (req.params.id && req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
    Task.findById({ _id: req.params.id }).then(task => {
      if (!task) {
        next();
      }
      console.log(task);
      fs.writeFile(`${task._id}.js`, task.content, function(err) {
        if (err) {
          next(err);
        }
        res.download(`${task._id}.js`, `${task.title}.js`);
      });
    });
  } else {
    return next();
  }
});

router.post("/shareTask", function(req, res, next) {
  var email = req.body.email;
  var taskId = req.body.taskId;
  User.findOne({ email: email })
    .then(userDoc => {
      if (!userDoc) {
        return res.redirect("/");
      }
      Task.findOne({ _id: taskId }).then(taskDoc => {
        if (!taskDoc) {
          return res.redirect("/");
        }
        Task.findOneAndUpdate(
          {
            _id: taskId,
            sharedTo: { $nin: [userDoc._id] },
            owner: { $ne: userDoc._id }
          },
          { $push: { sharedTo: userDoc._id } },
          { new: true }
        ).then(task => {
          if (!task) {
            return res.redirect("/");
          }
          User.findOneAndUpdate(
            { email: userDoc.email, tasks: { $nin: [taskDoc._id] } },
            { $push: { tasks: taskDoc._id } },
            { new: true }
          ).then(user => {
            if (!user) {
              return res.redirect("/");
            }
            return res.redirect("/");
          });
        });
      });
    })
    .catch(error => {
      res.status(error.status_code).send(error.message);
    });
});

function isAuthenticated(req, res, next) {
  if (req.user) {
    return next();
  }
  res.redirect("/login");
}

module.exports = router;

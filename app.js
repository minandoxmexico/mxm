var express = require('express')
var path = require('path')
var logger = require('morgan')
var connect = require('camo').connect

var database
var uri = 'nedb://./db'
connect(uri).then(function(db) {
  database = db
})

var app = express()

app.use(logger('dev', {
    skip: function (req, res) { return res.statusCode < 400 }
  })
)
app.use(express.static(path.join(__dirname, 'public'),{extensions: ['html']}))

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found')
  err.status = 404
  next(err)
})

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development

  res.status(err.status || 500)
    res.json({
      status:  err.status || 500,
      message: err.message
    })

})

module.exports = app

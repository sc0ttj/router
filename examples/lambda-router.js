// Router usage: AWS Lambda

"use strict"
var router = require("@scottjarvis/router")

exports.handler = (event, context, callback) => {
  router(
    {
      "/home": params => {
        // do stuff
        // then finish
        callback(null, params)
      },

      "/user/:userId": params => {
        // do stuff..
        // then finish
        callback(null, params)
      }
    },
    // for Lambdas, you must pass in 'event', 'context' and 'callback'
    event,
    context,
    callback
  )
}

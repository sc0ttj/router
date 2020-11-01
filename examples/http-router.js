// Router usage: NodeJS-based web server
//
// BACKGROUND INFO:
//
//   NodeJS 'http' module provides:
//
//   res.write() : Writes a response to the client and can be called multiple times.
//   res.end()   : Ends the response process.
//
//   router() adds:
//
//   res.send()   : A convenience wrapper around res.write() and res.end(), called once (like express).
//   res.json()   : Like res.send() but always tries to return content-type of application/json.
//   res.jsonp()  : Returns the JSON wrapped in "callback()"
//   res.status() : Sets the header status code (200, 401, 404, etc)
//
// See http://zetcode.com/javascript/http/

var http = require("http")
var router = require("../dist/router.js")

// start the server on given port, then run cb()
http
  .createServer((req, res) => {
    //
    router(
      {
        "/": params => {
          console.log("top level /", params)
          // set header to "200, text/html", set content, end the response
          res.send("<p>/</p>")
        },

        "/home": params => {
          console.log("home!", params)
          // set header to "200, text/html", set content, end the response
          res.send("<p>HOMEPAGE</p>")
        },

        "/user/:userId": params => {
          // * router added req.params to the params received here
          // * router provides res.send() and res.status()
          // * res.status() : set the header status (optional)
          res.status(200)
          // * res.send() :
          //   - sets header status to 200 (if res.status not used)
          //   - sets appropriate content type:
          //     * text/html                 - if given a string
          //     * application/json          - if given an object, array or JSON (as below)
          //     * application/octet-stream  - if given a Buffer
          //   - sanitises the content:
          //     * auto pretty prints JSON output
          //   - ends the response
          res.send(params)
        },
        // any other route
        "*": params => {
          res.send("<h1>API Docs:</h1><p>Do /home or /user/1, /user/2, etc... That's it.</p>")
        }
      },
      // for servers, you must pass in 'res' and 'req' after the routes object
      req, res
    )
  })
  .listen("8181")

//
// -----------------------    Middleware examples   -------------------------
//

// OPTIONAL HTTP Router usage: Middleware
//
// The "middleware" is a function that receives res, req,
// and is executed on each route match
//
// Define some middleware as a function
var getRequestTime = function(req, res, next) {
  req.time = Date.now()
  console.log("middleware: added req.time: ", req.time)
  next()
}
// and just pass the middleware function to router.use()
router.use(getRequestTime)

//
// --------------   Configurable middleware examples   --------------------
//

// OPTIONAL HTTP Router usage: Configurable middleware
//
// wrap your middleware in a function that takes
// opts, and returns your middleware
function configurableMiddleware(opts) {
  // do middleware config stuff here

  // then return the "middleware" function
  return function theActualMiddleware(req, res, next) {
    params = { ...params, ...opts }
    console.log("middleware: added to params: ", params)
    next()
  }
}

// pass the configurable middleware function to router.use(), with your options
router.use(configurableMiddleware({ foo: "bar" }))

//
// --------------   More  middleware examples   --------------------
//

// you can also pass an array of middlewares
router.use([getRequestTime, configurableMiddleware({ foo: "bar" })])

// or enable middleware for a specific route pattern
router.use("/home", getRequestTime)

// or any array of middlewares to run on a specific route
router.use("/home", [getRequestTime, configurableMiddleware({ foo: "bar" })])

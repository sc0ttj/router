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
//   res.send()  : A convenience wrapper around res.write() and res.end(), called once (like express).
//
// See http://zetcode.com/javascript/http/

var http = require("http")
var router = require("../src/router.js")

// start the server on given port, then run cb()
http
  .createServer((req, res) => {
    //
    router(
      {
        "/home": params => {
          console.log("home!", params)
          // set header to "200, text/html", set content, end the response
          res.send("<p>some string</p>")
        },

        "/user/:userId": params => {
          // * router added req.params to the params received here
          // * router provides res.send() and res.status()
          // * res.status() : set the header status (optional)
          // * res.send() :
          //   - sets header status to 200 (if res.status not used)
          //   - sets appropriate content type:
          //     * text/html                 - if given a string
          //     * application/json          - if given an object, array or JSON (as below)
          //     * application/octet-stream  - if given a Buffer
          //   - sanitises the content:
          //     * auto pretty prints JSON output
          //   - ends the response
          res.status(200)
          res.send(params)
        }
      },
      // for servers, you must pass in 'res' and 'req' after the routes object
      res,
      req
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
var getRequestTime = function(res, req) {
  req.time = Date.now()
  console.log("middleware: added req.time: ", req.time)
}
// and just pass the middleware function to router.use()
router.use(getRequestTime)

//
// OPTIONAL HTTP Router usage: Configurable middleware
//
// wrap your middleware in a function that takes
// opts, and returns your middleware
function configurableMiddleware(opts) {
  // do middleware config stuff here

  // then return the "middleware" function
  return function theActualMiddleware(res, req) {
    params = { ...params, ...opts }
    console.log("middleware: added to params: ", params)
  }
}

// pass the middleware function to router.use(), with your options
router.use(configurableMiddleware({ foo: "bar" }))

//
// -------------  @Todo Ad-hoc routing  examples   --------------
//

// OPTIONAL HTTP Router usage: Ad-hoc routing
//
// - like `journey`, `director` or `express`.
// - pass a path as a string to route.get()
// - the data from the path is available to the given function, in `params`
//router.get("/foo/1", someFunc) // NOT READY!

// where..
var someFunc = params => {
  // params contains data from the path passed to router.get(),
  // returns some HTML, JSON, etc
}

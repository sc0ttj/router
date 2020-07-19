/* Vanilla JS router
 *
 * An isomorphic router - works client-side (browser), or server-side (NodeJS)
 *
 * It resolves URL paths like '/profile/1' to route patterns such as '/profile/:id',
 * and generates a params object that is passed to each route.
 *
 * Features:
 *
 * - Easy setup, zero dependencies
 *
 * - Works client-side, in browsers:
 *   - as a router for single page applications (SPAs)
 *
 * - Works server-side, in Node:
 *   - as a router for an HTTP server (express-like API, also supports "middleware")
 *   - as a router for a command-line tool (accepts first arg as the URL/path)
 *
 *
 * Basic usage:
 *
 *   router({
 *
 *     '/profile':               (params) => { ... },
 *
 *     '/profile/:id':           (params) => { ... },
 *
 *     '/profile/:id/user/:uId': (params) => { ... },
 *
 *   });
 *
 */

function router(routes, req, res, cb) {
  var noop = function() {}

  var urlPath

  var isBrowser =
    typeof window !== "undefined" && typeof window.document !== "undefined"

  var isNode =
    typeof process !== "undefined" &&
    process.versions !== null &&
    process.versions.node !== null

  var isNodeServer =
    isNode && typeof req !== "undefined" && typeof res !== "undefined"

  var isLambda = !!(
    (process.env.LAMBDA_TASK_ROOT && process.env.AWS_EXECUTION_ENV) ||
    false
  )

  if (isBrowser) {
    // Get current URL path  - everything after the domain name
    urlPath = window.location.href.toString().split(window.location.host)[1]
  } else if (isNodeServer) {
    // get the URL requested in the HTTP request
    if (typeof req != "undefined" && req.url) urlPath = "#" + req.url
  } else if (isNode && !isNodeServer) {
    // get the URL from the first argument passed to this script
    if (process && process.argv) urlPath = "#" + process.argv[2]
  } else if (isLambda) {
    // grab the lambda params (event, context, callback) from the router params
    var event = req
    var context = res
    var callback = cb
    // get the URL requested in the HTTP request
    if (typeof event !== "undefined" && event.path) urlPath = "#" + event.path
  }

  var routeFromUrl = urlPath.split("#")[1]
  var matchedRoute = false

  // Parse URLs (Browser) ...adapted from https://vanillajstoolkit.com/helpers/router/
  var getParamsFromUrlPath = function(url) {
    var params = {}
    var parser
    var query
    if (isBrowser) {
      parser = document.createElement("a")
      parser.href = url
      query = parser.search.substring(1)
    }
    if (isNodeServer) {
      parser = {}
      parser.href = req.url
      query = parser.href.substring(1)
    }
    var vars = query + "&".replace("&&", "&").split("&")

    for (var i = 0; i < vars.length; i++) {
      var pair = vars[i].split("=")
      if (pair[1] == undefined) continue
      params[pair[0]] = decodeURIComponent(pair[1])
    }
    return params
  }

  // generate object of params from a location hash, like "#/profile/1"
  var getHashParams = function(url) {
    var hashParams = {}
    var hashString = url.split("#")[1]
    if (hashString) {
      hashString.split("&").map(pair => {
        var key = pair.split("=")[0]
        var val = pair.split("=")[1]
        hashParams[key] = decodeURIComponent(val)
      })
    }
    return hashParams || {}
  }

  // Parse CLI args (Node as local program)
  var getArgs = function() {
    if (typeof process === "undefined") return {}

    var args = {}
    process.argv.slice(2, process.argv.length).forEach(function(arg) {
      // long arg
      if (arg.slice(0, 2) === "--") {
        var longArg = arg.split("=")
        var longArgFlag = longArg[0].slice(2, longArg[0].length)
        var longArgValue = longArg.length > 1 ? longArg[1] : true
        args[longArgFlag] = longArgValue
      }
      // flags
      else if (arg[0] === "-") {
        var flags = arg.slice(1, arg.length).split("")
        flags.forEach(function(flag) {
          args[flag] = true
        })
      }
    })
    return args || {}
  }

  // Converts "/page/:id/user/:id" to a regex, returns the regex
  // (from Backbone.js, via https://gist.github.com/gcpantazis/5631831)
  var routeToRegExp = function(routePattern) {
    var optionalParam = /\((.*?)\)/g,
      namedParam = /(\(\?)?:\w+/g,
      splatParam = /\*\w+/g,
      escapeRegExp = /[\-{}\[\]+?.,\\\^$|#\s]/g

    var route = routePattern
      .replace(escapeRegExp, "\\$&")
      .replace(optionalParam, "(?:$1)?")
      .replace(namedParam, function(match, optional) {
        return optional ? match : "([^/]+)"
      })
      .replace(splatParam, "(.*?)")

    return new RegExp("^" + route + "$")
    //return new RegExp('^' + route);
  }

  // Checks if the given URL path matches the given route pattern,
  // using regex produced by routeToRegExp
  var urlPathMatchesRoutePattern = function(path, routePattern) {
    return !!path.match(routeToRegExp(routePattern))
  }

  // Maps the keys from the route pattern to values from url,
  // and returns the created object (called "params")
  var routeToParams = function(routePattern, url) {
    // get an array of the params in the route pattern [ ":id", ":tabId", ... ]
    var routeParams = routePattern
      .split("/")
      .filter(i => i.replace(":", "") !== i)

    // get an array the parameters from hashed part of the URL (/profile/1/tab/3)
    var urlParamsArr = url
      .split("#")[1]
      .split("/")
      .slice(1)

    // map the keys from the route pattern to the values from the URL
    params = {}
    routeParams.map((key, i) => {
      params[key.replace(":", "")] = urlParamsArr[i + i + 1]
    })
    return params
  }

  // converts "#/profile/1" to "/profile/:id"
  router.getRoutePatternFromUrlPath = function(url) {
    var pattern
    var urlPath =
      url ||
      req.url ||
      window.location.href.toString().split(window.location.host)[1]
    var routeFromUrl = urlPath.split("#")[1]
    Object.keys(routes).forEach(routePattern => {
      if (!urlPathMatchesRoutePattern(routeFromUrl, routePattern)) return
      pattern = routePattern
    })
    return pattern
  }

  // takes a URL (hash path), loads the correct route,
  // passing in the resolved parameters
  router.href = function(path) {
    // if we're parsing URLs (browser):
    var url = path.replace("#", "") || "/home"

    // get routePattern from URL
    var routePattern = router.getRoutePatternFromUrlPath("#" + url)

    // Combine all our params:
    // - hash params override query strings
    // - query strings override http requests
    // - http requests override cli arguments
    // - cli arguments override default settings, defined in script
    var params = {
      ...getArgs(),
      ...getParamsFromUrlPath(urlPath),
      ...routeToParams(routePattern, "#" + url)
    }

    // load the function for this route, passing in all params
    routes[routePattern](params)
    location.hash = "#" + url
  }

  // on router init, load the correct route,
  // matched against the current URL path (or req.path, event.path, etc)
  Object.keys(routes).forEach(routePattern => {
    if (!urlPathMatchesRoutePattern(routeFromUrl, routePattern)) return
    if (matchedRoute) return

    matchedRoute = true

    // Combine all our params:
    // - hash params override query strings
    // - query strings override http requests
    // - http requests override cli arguments
    // - cli arguments override default settings, defined in script
    var params = {
      ...getArgs(),
      ...getParamsFromUrlPath(urlPath),
      ...routeToParams(routePattern, urlPath)
    }

    if (isNodeServer) {
      // Use middleware (funcs that run on each request):
      // wrap each middleware in a func that knows what 'next' is
      // and passes it into the middleware to be run, at run-time.
      // More info:
      // - https://www.digitalocean.com/community/tutorials/nodejs-creating-your-own-express-middleware
      var wrappedMiddleware = []
      router.middleware.forEach(function(fn, i) {
        var next = wrappedMiddleware[i + 1] || noop
        var wrappedFn = function() {
          return fn(req, res, next)
        }
        wrappedMiddleware.push(wrappedFn)
      })

      // Get all of req.body before we do our routing:
      var chunks = []
      var bytesReceived
      // Add the body data to "chunks", each time we receive it.
      // More info:
      // - https://nodejs.org/en/docs/guides/anatomy-of-an-http-transaction/
      // - https://stackoverflow.com/questions/28718887/node-js-http-request-how-to-detect-response-body-encoding
      req
        .on("data", function(chunk) {
          chunks.push(chunk)
          bytesReceived += chunk.length
        })
        .on("end", function() {
          // add error logs
          res.on("error", function(err) {
            console.error(err)
          })

          // Lets setup express.js compatible response helper functions. Do it
          // before we call our middleware, for better express.js support
          res.status = function(status) {
            res.statusCode = status
            return res
          }

          // res.send() - an express-like method that simplifies HTTP responses.
          // It is just a wrapper around res.status(), res.writeHead(),
          // res.write() and res.end().
          res.send = function(content) {
            //   - set appropriate header status to 200 (if res.status not used)
            //   - set appropriate content type:
            //     * text/html                 - if given a string
            //     * application/json          - if given an object, array or JSON
            //     * application/octet-stream  - if given a Buffer
            var contentType = "text/html"
            var c = typeof content
            if (c === "object" || c === "array" || c === "number") {
              contentType = "application/json"
              res.setHeader("Content-Length", c.length)
              //   * auto pretty prints JSON output
              content = JSON.stringify(content, null, 2)
            } else if (c === "buffer") {
              contentType = "application/octet-stream"
              res.setHeader("Content-Length", Buffer.byteLength(c))
            }
            // write the header
            res.writeHead(res.statusCode, { "Content-Type": contentType })
            // the content to return
            res.write(content)
            // end the response
            res.end()
            // make res chainable
            return res
          }

          // add a mock res.json(),
          // for (slightly) better express middleware compatibility
          res.json = res.send

          // jsonp - returns user content wrapped in a callback
          res.jsonp = function(content) {
            res.writeHead(res.statusCode, {
              "Content-Type": "text/javascript"
            })

            // replace chars not allowed in JavaScript that are in JSON
            content = content
              .replace(/\u2028/g, "\\u2028")
              .replace(/\u2029/g, "\\u2029")

            // the /**/ is a specific security mitigation for "Rosetta Flash JSONP abuse"
            // the typeof check is just to reduce client error noise
            content =
              "/**/ typeof " +
              callback +
              " === 'function' && " +
              callback +
              "(" +
              content +
              ");"

            res.write(content)
            res.end()
            return res
          }

          // done adding express methods... lets set a default status code
          res.statusCode = 200

          // now call the first middleware. It will call 2nd one, etc
          // it will have access to the parsed req.body, and res.send() etc
          // ...we call it before we modify any req/res properties
          wrappedMiddleware[0]

          // on "end" we have finished receiving the body
          // so lets get the whole body
          var b = Buffer.concat(chunks).toString()

          // if body parser already ran, there will be a req._body property, so
          // if res._body exists, don't override re-parse req.body
          if (!req._body) req.body = b

          // if the user did not use body-parser style middleware, we can
          // do some basic parsing for them anyway:
          //  - put the body chunks into one string
          //  - convert it into a JS object if possible
          //  - add the newly concatenated & parsed body to req.body
          if (!req._body && req.method !== "GET" && req.method !== "HEAD") {
            var ct = req.contentType
            // turn the body into a JS object, if possible
            if (ct === "application/x-www-form-urlencoded") {
              // query string like stuff. Example: from html form (POST)
              req.body = getParamsFromUrlPath(b) || req.body
            } else if (ct === "application/json") {
              // JSON or object. Example, JS object posted via ajax
              req.body = JSON.parse(b) || req.body
            }
            // else if (ct === "application/octet-stream") {} // file upload (an actual file sent our way)
            // else if (ct === "multipart/form-data") {       // file upload (HTML input type=file)
            //   See
            //     - https://gist.github.com/dcollien/76d17f69afe748afad7ff3a15ff9a08a
            //     - https://www.npmjs.com/package/parse-multipart
            //}
            // else if (ct === "text/plain") {}               // plain text (rare)
          }

          // add the processed body to the params object
          if (typeof req.body === "object") {
            params = {
              ...params,
              ...req.body
            }
          }
        })
    }

    if (
      isLambda &&
      typeof event.path !== "undefined" &&
      typeof event.headers !== "undefined"
    ) {
      // NOTE: for parsing multipart form data (file uploads), see npm module
      // https://github.com/francismeynard/lambda-multipart-parser

      // @TODO: Authentication: The event object will have authorization
      // attributes in the path `event.requestContext.authorizer.claims`.
      // This object will have an attribute under the name `cognito:groups`.
      // This will either be an array or a value matching the groups or
      // the group the person would belong to. This value can be used
      // to implement our authorization.

      var ct = event.headers["content-type"] || event.headers["Content-Type"]
      // get all the relevant stuff (from event object) into the
      // "params" object... include everything required for a
      // valid lambda response object
      params = {
        ...params,
        method: event.httpMethod,
        contentType: ct,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Credentials": true,
          "Content-Type": "application/json"
        },
        statusCode: 200,
        isBase64Encoded: false,
        body: event.body,
        ...JSON.parse(event.body)
      }
    }

    // for current route: load the function for this route, passing in all params
    return routes[routePattern](params)
  })

  // on page load/init: load the function for this route, passing in all params
  return routes[routePattern](params)
}

router.middleware = []

// lets user register functions as middleware
router.use = function(fn) {
  if (Array.isArray(fn)) {
    fn.forEach(function(f) {
      router.middleware.push(f)
    })
  } else if (typeof fn === "function") {
    router.middleware.push(fn)
  }
  return router
}

// ------------------------------------------------------------------------

module.exports = router

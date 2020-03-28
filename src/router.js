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

function router(routes, res, req) {
  var urlPath

  var isBrowser =
    typeof window !== "undefined" && typeof window.document !== "undefined"

  var isNode =
    typeof process !== "undefined" &&
    process.versions !== null &&
    process.versions.node !== null

  var isNodeServer =
    isNode && typeof req !== "undefined" && typeof res !== "undefined"

  if (isNodeServer) {
    // get the URL requested in the HTTP request
    if (typeof req != "undefined" && req.url) urlPath = "#" + req.url
  }

  if (isNode && !isNodeServer) {
    // get the URL from the first argument passed to this script
    if (process && process.argv) urlPath = "#" + process.argv[2]
  }

  if (isBrowser) {
    // Get current URL path  - everything after the domain name
    urlPath = window.location.href.toString().split(window.location.host)[1]
  }

  var routeFromUrl = urlPath.split("#")[1]
  var matchedRoute = false

  // Parse URLs (Browser) ...adapted from https://vanillajstoolkit.com/helpers/router/
  var getParams = function(url) {
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
      parser.href = req.url || request.url
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
  var urlMatchesRoute = function(path, routePattern) {
    return !!path.match(routeToRegExp(routePattern))
  }

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
  router.getRoutePatternFromUrl = function(url) {
    var pattern
    var urlPath =
      url ||
      res.url ||
      window.location.href.toString().split(window.location.host)[1]
    var routeFromUrl = urlPath.split("#")[1]
    Object.keys(routes).forEach(routePattern => {
      if (!urlMatchesRoute(routeFromUrl, routePattern)) return
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
    var routePattern = router.getRoutePatternFromUrl("#" + url)

    // Combine all our params:
    // - hash params override query strings
    // - query strings override http requests
    // - http requests override cli arguments
    // - cli arguments override default settings, defined in script
    var params = {
      ...getArgs(),
      ...getParams(urlPath),
      ...routeToParams(routePattern, "#" + url)
    }

    // load the function for this route, passing in all params
    routes[routePattern](params)
    location.hash = "#" + url
  }

  // on router init, load the correct route,
  // matched against the current URL path
  Object.keys(routes).forEach(routePattern => {
    if (!urlMatchesRoute(routeFromUrl, routePattern)) return
    if (matchedRoute) return

    matchedRoute = true

    // Combine all our params:
    // - hash params override query strings
    // - query strings override http requests
    // - http requests override cli arguments
    // - cli arguments override default settings, defined in script
    var params = {
      ...getArgs(),
      ...getParams(urlPath),
      ...routeToParams(routePattern, urlPath)
    }

    // if Node server (processing HTTP requests - res, req),
    // create a new method to be used inside the routes,
    // based on express - res.send()

    if (isNodeServer) {
      // load "middleware" - just functions that execute with each request
      var opts = {}
      router.middleware.forEach(func => func(res, req, params, opts))

      // set a default status code
      res.statusCode = 200

      res.status = function(status) {
        res.statusCode = status
      }

      // res.send() - an express-like method that simplifies HTTP requests.
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
        if (c === "object" || c === "array") {
          contentType = "application/json"
          //   * auto pretty prints JSON output
          content = JSON.stringify(content, null, 2)
        } else if (c === "buffer") {
          contentType = "application/octet-stream"
        }

        // add params to res
        res.params = res.params ? { ...res.params, ...params } : params

        // write the header
        res.writeHead(res.statusCode, { "Content-Type": contentType })

        // the content to return
        res.write(content)

        // end the response
        res.end()
      }
    }

    // load the function for this route, passing in all params
    routes[routePattern](params)

    if (isNodeServer) res.end()
  })
}

router.middleware = []

// lets user register functions as middleware
router.use = function(fn) {
  router.middleware.push(fn)
}

// ------------------------------------------------------------------------

module.exports = router

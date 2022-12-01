<p align="center">
  <img align="center" src="https://i.imgur.com/5FdEzDA.png" alt="Router logo" />
  <h1 align="center">
    <b>router</b>
  </h1>
    <p align="center"><i>A simple isomorphic router</i><p>
</p>

[![npm version](https://badge.fury.io/js/%40scottjarvis%2Frouter.svg)](https://badge.fury.io/js/%40scottjarvis%2Frouter) [![Node version](https://badgen.net/npm/node/@scottjarvis/router)](http://nodejs.org/download/) [![Build Status](https://travis-ci.org/sc0ttj/router.svg?branch=master)](https://travis-ci.org/sc0ttj/router) [![bundle size](https://badgen.net/bundlephobia/minzip/@scottjarvis/router?color=green&label=gzipped)](https://badgen.net/bundlephobia/minzip/@scottjarvis/router) [![Downloads](https://badgen.net/npm/dt/@scottjarvis/router)](https://badgen.net/npm/dt/@scottjarvis/router)

> Routing is the process of determining what code to run when a URL is requested.

**router** is a JS router, which works client-side (browser), or server-side (NodeJS).

**router** resolves URL paths like **/profile/1** to route patterns such as **/profile/:id**, and generates a params object that is passed to each route.

**router** also provides some basic web server features if routing HTTP requests - parses `req.body` into params, uses expressjs-like API, supports middleware.

## Features

- Easy setup, zero dependencies
- Only 2kb minified and gzipped
- Simple syntax and usage
- Works **client-side**, in browsers:
  - as a router for single page applications (SPAs)
- Works **server-side**, in Node:
  - as a router for an HTTP server (express.js like API, also supports "middleware")
  - as a router in an AWS Lambda (routing of the `event` data passed into Lambda)
- Works **in the terminal** as an args parser for command-line programs

## Basic syntax example

> IMPORTANT! You _must_ use the name `router`, and not something else.


```js

  router({

    '/home':                  (params) => { ... },

    '/profile/:id':           (params) => { ... },

    '/profile/:id/user/:uid': (params) => { ... },

  });

```

The supported route pattern types are:

* static (`/users`)
* named parameters (`/users/:id`)
* nested parameters (`/users/:id/books/:title`)
* optional parameters (`/posts(/:slug)`)
* any match / wildcards (`/users/*`)

## Installation

### In browsers:

```html
<script src="https://unpkg.com/@scottjarvis/router"></script>
<script>
  // use router here
</script>
```

### In NodeJS:

```
npm i @scottjarvis/router
```

Then add it to your project:

```js
router = require('@scottjarvis/router');

// use router here

```

## Usage in browsers: as a client-side router

For routing frontend JS stuff like "single page applications", you'll need to trigger the router when the URL changes, or a link is clicked.

**router** is designed to be used with `window.location.hash` and `hashchange`.

Here' an example of how to bind the router to URL changes in the browser:

```js

  // 1. capture link clicks for links such as  <a href="#/profile/1">some text</a>

  window.addEventListener(
    "click",
    function handleLink(e) {
      if (!e.target.matches("a")) return
      if (!e.target.href.matches(/^#/)) return
      e.preventDefault()
      location.hash = e.target.hash
    },
    false
  )

  // 2. monitor changes to window.location.hash, and run the router when it changes

  window.addEventListener(
    "hashchange",
    function(e) {
      router.href(window.location.hash)
    },
    false
  )
```

See the full example in [examples/client-side-router.html](examples/client-side-router.html)


## Usage in NodeJS: as a HTTP web server

You _could_ simply use `router` inside a standard NodeJS `http` server, with it's provided methods `res.writeHead()`, `res.write()` and `res.end()` (see this nice guide to the [NodeJS `http` module](http://zetcode.com/javascript/http/)).

However, `router` provides some simple wrappers around these methods, just like [express.js](https://expressjs.com/en/api.html#res.send).

Here's an example of routing HTTP requests in your NodeJS based web server:

```js
var http = require("http")
var router = require("router")

http.createServer((req, res) => {

  router(
    {
      "/home": params => {
        console.log("home!", params)
        // set header status to "200",
        // set content-type to "text/html",
        // set content, end response
        res.send("<p>some string</p>")
      },
      "/user/:userId": params => {
        console.log("serving JSON!", params)
        // set header to "200" manually
        // set content-type to "application/json",
        // set content (prettified JSON)
        // end response
        res.status(200)
        res.send(params)
      },
      // any other route
      "*": params => {
        res.send("<h1>API Docs:</h1>")
      }
    },
    // for servers, you must pass in 'req' and 'res', after the routes object above
    req, res
  )

})

```

There is a `res.status()` method, which sets `res.statusCode` for you.

There is a `res.send()` method, which makes life easier for you:

- sets appropriate header status to 200 (if `res.status()` not used)
- sets appropriate content type:
  * `text/html`                 - if given a string
  * `application/json`          - if given an object, array or JSON
  * `application/octet-stream`  - if given a Buffer
- pretty prints JSON output
- calls `res.end()` for you

The `res.json()` method is similar to above, but sends the Content-Type `application/json`.

The `res.jsonp()` is similar to `res.json()`, but sends the Content-Type `text/javascript` and wraps your JSON in a callback, like so:

```js
callback({ some: \"data\" })
```

### Using HTTP "middleware"

If running an HTTP server (or Lambda, see below), `router` supports "middleware", in a similar way to express.js.

Some [express middleware](https://expressjs.com/en/resources/middleware.html) may work with `router`, though this has not been tested.

Creating middleware for `router` is very simple - define a function that takes `(req, res, next)` as parameters:

```js
var getRequestTime = function(req, res, next) {
  req.time = Date.now()
  console.log("middleware: added req.time: ", req.time)
  next()
}
```

And do `router.use(someFunc)` to enable it:

```js
// pass the middleware function to router.use()
router.use(getRequestTime)
```

Or enable middleware for specific routes:

```js
router.use("/home", getRequestTime)
```

You can also pass an array of middlewares:

```js
router.use([func1, func2, func3])
```

Or any array of middlewares to run on a specific route:

```js
router.use('/home', [func1, func2, func3])
```

See the full example in [examples/http-router.js](examples/http-router.js)

### About HTTP request `body` parsing:

In NodeJS HTTP servers, the [HTTP request "body" is received in "chunks"](https://nodejs.org/en/docs/guides/anatomy-of-an-http-transaction/) - you must normally [combine & parse these chunks](https://stackoverflow.com/questions/28718887/node-js-http-request-how-to-detect-response-body-encoding) in order to get access to the whole `req.body` data.

So to make life easier, `router` does this basic parsing of the HTTP request `body` for you, so that it's readily available in the `params` passed to your routes:

1. The `req.body` chunks received are combined into a string, available as `req.body` in your routes.
2. If `req.body` is a URL-encoded or JSON-encoded string, `router` will convert it to a JS object, and also add its _properties_ to `params`. For example, the original `req.body` may be `?user=bob&id=1` - this will be parsed for you and available as `params.user` and `params.id`.

Therefore, when inside your routes, there's often no need to parse `req.body` yourself - unless handling gzipped data or file uploads (multi-part form data or octect-streams). In this case, you should use middleware like [`body-parser`](https://expressjs.com/resources/middleware/body-parser.html).

If you're running a GET-based restful API, you probably don't need to worry about `req.body`, it's usually only for POST data and file uploads.

## Usage in AWS Lambda: as router for your API

Here's an example of using `router` in an AWS Lambda:

```js
'use strict';
var router = require("@scottjarvis/router")

exports.handler = (event, context, callback) => {
  router(
    {
      "/ping": params => {
        // do stuff here
        callback(null, params)
      },

      "/user/:userId": params => {
        // do stuff here
        var resp = { ... }
        callback(null, resp)
      }
    },
    // for Lambdas, you must pass in 'event', 'context' and 'callback'
    event,
    context,
    callback
  )
}

```

In Lambdas, `router` works out which route to run from the `event.path` property (not from any HTTP `req` objects).

To make life easier inside your routes:

1. If `event.body` is URL-encoded or JSON-encoded, it'll be parsed into a JavaScript object.
2. If `event.body` was parsed into a JavaScript object, its properties will be added into `params`.
3. The `params` object should have everything needed for a valid response object, so it can be passed straight to `callback()` (or returned, if running in an `async` Lambda).

### Using Lambda "middleware"

There is currently very basic middleware support for Lambdas:

- Lambda middleware functions take `(event, next)` as parameters
- so you should read or modify `event`, instead of `req` and `res`
- it should otherwise be similar to using HTTP middleware :)

Here's how to define some Lambda middleware:

```js
var getRequestTime = function(event, next) {
  event.time = Date.now()
  console.log("middleware: added event.time: ", event.time)
  next()
}
```

And just pass the middleware function to `router.use()`:

```js
router.use(getRequestTime)
```

If you need a more advanced Lambda router, see [middy](https://github.com/middyjs/middy).

See the full example in [examples/lambda-router.js](examples/lambda-router.js).

## Usage in NodeJS: as a CLI args parser

If you building a NodeJS program, you might want an easy way to parse the command line arguments it receives.

If so, `router` can help - it auto maps command-line arguments to the `params` object received by your routes:

```
node some_script.js --foo=bar --verbose --dir=/home
```

will be matched in `some_script.js` by using something like:


```js
var router = require("../src/router.js")

router({

  // 'params' will contain all command-line arguments
  // that were passed to this script

  "*": params => {
    console.log(params) // { foo: "bar", verbose: true, dir: "/home" }
  }

})

```

See the full example in [examples/cli-router.js](examples/cli-router.js).

## Making changes to `router`

Look in `src/router.js`, make any changes you like.

Rebuild the bundles in `dist/` using this command: `npm run build`

## Related projects:

### Alternative routers

- [director](https://github.com/flatiron/director) - a fairly small, isomorphic URL router for JavaScript
- [hasher](https://github.com/narirou/hasher) - Tiny hashchange router inspired by express.js & page.js
- [routie](https://github.com/jgallen23/routie) - a tiny javascript hash router
- [trouter](https://github.com/lukeed/trouter/) - a fast, small-but-mighty, familiar router
- [RouterRouter](https://github.com/jgarber623/RouterRouter) - a tiny JS router, extracted from Backbone's Router
- [gcpantazis/router.js](https://gist.github.com/gcpantazis/5631831) - a very simple router based on BackboneJS Router

### Alternative HTTP servers

- [expressJS](https://expressjs.com/en/) - the most widely used JavaScript server, with routing "middleware"
- [polka](https://github.com/lukeed/polka) - minimal, performant expressjs alternative (uses trouter)
- [aws-lambda-router](https://github.com/spring-media/aws-lambda-router) - nice, simple AWS router, good feature set
- [middy](https://github.com/middyjs/middy) - a popular but complex router for AWS Lambda, uses a middleware-style API

## Acknowledgements

- [Zetcode: javascript/http](http://zetcode.com/javascript/http/)
- [@pyaesonekhant1234: differences-between-res-write-res-end-and-res-send](https://medium.com/@pyaesonekhant1234/differences-between-res-write-res-end-and-res-send-in-node-js-7c29e8e50654)
- [Okta.com: Build and understand express middleware through examples](https://developer.okta.com/blog/2018/09/13/build-and-understand-express-middleware-through-examples)
- [Towards Data Science: Building your own router for AWS Lambda](https://towardsdatascience.com/serverless-building-your-own-router-c2ca3071b2ec)
- [vkhazin/aws-lambda-http-router](https://github.com/vkhazin/aws-lambda-http-router)

## Further improvements

## See [Issues](https://github.com/sc0ttj/router/issues)

Some intended future improvements are at https://github.com/sc0ttj/router/issues

### "express-compat" middleware

A middleware that adds the same properties and methods to `req` and `res` as express.js.

This should improve compatibility with other express.js middleware that is loaded after.

### Basic auth middleware

See

- https://github.com/jshttp/basic-auth
- https://github.com/arkerone/api-key-auth

### JSWT auth middleware

See https://github.com/auth0/node-jsonwebtoken

### Error handling middleware

See https://github.com/expressjs/api-error-handler



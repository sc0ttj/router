<p align="center">
  <img align="center" src="https://i.imgur.com/5FdEzDA.png" alt="Router logo" />
  <h1 align="center">
    <b>router</b>
  </h1>
    <p align="center"><i>A simple isomorphic router</i><p>
</p>

[![npm version](https://badge.fury.io/js/%40scottjarvis%2Frouter.svg)](https://badge.fury.io/js/%40scottjarvis%2Frouter) [![Dependency Status](https://david-dm.org/sc0ttj/router.svg)](https://david-dm.org/sc0ttj/router) [![devDependencies Status](https://david-dm.org/sc0ttj/router/dev-status.svg)](https://david-dm.org/sc0ttj/router?type=dev) [![Node version](https://badgen.net/npm/node/@scottjarvis/router)](http://nodejs.org/download/) [![Build Status](https://travis-ci.org/sc0ttj/router.svg?branch=master)](https://travis-ci.org/sc0ttj/router) [![bundle size](https://badgen.net/bundlephobia/minzip/@scottjarvis/router?color=green&label=gzipped)](https://badgen.net/bundlephobia/minzip/@scottjarvis/router) [![Downloads](https://badgen.net/npm/dt/@scottjarvis/router)](https://badgen.net/npm/dt/@scottjarvis/router)

> Routing is the process of determining what code to run when a URL is requested.

**router** is a JS router, which works client-side (browser), or server-side (NodeJS).

**router** resolves URL paths like **/profile/1** to route patterns such as **/profile/:id**, and generates a params object that is passed to each route.

**router** also provides some basic web server features if routing HTTP requests - parses `req.body` into params, uses expressjs-like API, supports middleware.

## Features

- Easy setup, zero dependencies
- Only 1kb minified and gzipped
- Simple syntax and usage
- Works **client-side**, in browsers:
  - as a router for single page applications (SPAs)
- Works **server-side**, in Node:
  - as a router for an HTTP server (express.js like API, also supports "middleware")
  - as a router in an AWS Lambda (routing of the `event` data passed into Lambda)
  - as a router for a command-line tool (accepts first arg as the URL/path)

## Basic syntax example

> IMPORTANT! You _must_ use the name `router`, and not something else.


```js

  router({

    '/home':                  (params) => { ... }, 

    '/profile/:id':           (params) => { ... },

    '/profile/:id/user/:uId': (params) => { ... },

  });

```

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

You _could_ simply put `router` inside a standard NodeJS HTTP server and use `res.writeHead()`, `res.write()` and `res.end()` as normal (see this nice guide to the [NodeJS `http` module](http://zetcode.com/javascript/http/)).

However, `router` provides some simple wrappers around these methods, just like express.js.

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
        res.status(200)
        // set content-type to "application/json",
        // set content (prettified JSON) 
        // end response
        res.send(params)
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

The `res.json()` method is similar to above, but always sends the Content-Type `application/json`.

The `res.jsonp()` is similar to `res.json()`, except that it will wrap your JSON in a callback, like so:

```js
res.body = "callback({ some: \"data\" })"
```

### Using "middleware"

If running an HTTP server, **router** supports "middleware", in a similar way to express.js. 

Creating middleware is very simple - define a function that takes `(req, res, next)` as parameters:

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

// or pass an array of middlewares
router.use([func1, func2, func3])
```

See the full example in [examples/http-router.js](examples/http-router.js)

### About HTTP request `body` parsing:

In NodeJS HTTP servers, the [HTTP request body data is received in "chunks"](https://nodejs.org/en/docs/guides/anatomy-of-an-http-transaction/) - you must [manually combine & parse these chunks](https://stackoverflow.com/questions/28718887/node-js-http-request-how-to-detect-response-body-encoding) in order to get access to the whole `req.body` data.

So, to make life easier, `router` does basic parsing of the HTTP request `body` for you, so that it's readily available in the `params` passed to your routes:

1. The `req.body` chunks received are combined into a single string before being passed to your routes.
2. The whole `req.body` string is added to `params` as `params.body`.
3. If `req.body` is a URL-encoded or JSON-encoded string, `router` will convert it to a JS object, and also add its properties to `params`.

Therefore, in your routes, there's often no need to parse `req.body` yourself - unless handling gzipped data or file uploads (multipart form data or octet-streams).

If you do need to handle gzipping, multi-part form data or binary file uploads, use middleware like `body-parser` or `co-body`.

If you're using `router` in a GET-based restful API, you prob don't need to worry about `req.body`, it's usually only for POST data and file uploads.

## Usage in NodeJS: as a CLI args parser

If you building a NodeJS program, you might want an easy way to parse the command line arguments it receives.

If so, `router` can help - it auto maps command-line arguments to the `params` object received by your routes:

```
node some_script.js /profile/99 --foo=bar
```

will be matched in `some_script.js` by using something like:


```js
var router = require("../src/router.js")

router({

  // 'params' will contain all command-line arguments
  // that were passed to this script

  "/profile/:id": params => {
    console.log(params) // { id: 99, foo: "bar" }
  }
})

```

See the full example in [examples/cli-router.js](examples/cli-router.js).

## Making changes to `router`

Look in `src/router.js`, make any changes you like.

Rebuild the bundles in `dist/` using this command: `npm run build`

## Related projects:

- [director](https://github.com/flatiron/director) - a fairly small, isomorphic URL router for JavaScript
- [hasher](https://github.com/narirou/hasher) - Tiny hashchange router inspired by express.js & page.js 
- [routie](https://github.com/jgallen23/routie) - a tiny javascript hash router
- [trouter](https://github.com/lukeed/trouter/) - a fast, small-but-mighty, familiar router
- [RouterRouter](https://github.com/jgarber623/RouterRouter) - a tiny JS router, extracted from Backbone's Router
- [gcpantazis/router.js](https://gist.github.com/gcpantazis/5631831) - a very simple router based on BackboneJS Router
- [expressJS](https://expressjs.com/en/) - the most widely used JavaScript server, with routing "middleware"
- [middy](https://github.com/middyjs/middy) - a popular router for AWS Lambda, uses a middleware-style API

## Acknowledgements

- [Zetcode: javascript/http](http://zetcode.com/javascript/http/)
- [@pyaesonekhant1234: differences-between-res-write-res-end-and-res-send](https://medium.com/@pyaesonekhant1234/differences-between-res-write-res-end-and-res-send-in-node-js-7c29e8e50654)

## Further improvements:

### Make `router` work in Lambdas

See here: 

- [Towards Data Science: Building your own router for AWS Lambda](https://towardsdatascience.com/serverless-building-your-own-router-c2ca3071b2ec)
- [vkhazin/aws-lambda-http-router](https://github.com/vkhazin/aws-lambda-http-router)

### Add basic expressjs middleware support

- fix order of `req`, `res`
- implement `next()`
- improve body handling (see below)
- create `express-compat` middleware (see below)

### Improved `req.body` handling

- wait for all body data chunks to arrive
- combine the chunks into a single string

After middleware has run:

- if body URL or JSON encoded, convert to JS object
- add parsed body to `req.body`, so user doesn't have to parse it themselves
- add parsed body properties to `params`

See https://nodejs.org/en/docs/guides/anatomy-of-an-http-transaction/

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



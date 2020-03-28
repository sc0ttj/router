<p align="center">
  <img align="center" src="https://i.imgur.com/5FdEzDA.png" alt="Router logo" />
  <h1 align="center">
    <b>router</b>
  </h1>
    <p align="center"><i>A simple isomorphic router</i><p>
</p>

<!--
[![npm version](https://badge.fury.io/js/%40scottjarvis%2Frouter.svg)](https://badge.fury.io/js/%40scottjarvis%2Frouter) [![Dependency Status](https://david-dm.org/sc0ttj/router.svg)](https://david-dm.org/sc0ttj/router) [![devDependencies Status](https://david-dm.org/sc0ttj/router/dev-status.svg)](https://david-dm.org/sc0ttj/router?type=dev) [![Node version](https://badgen.net/npm/node/@scottjarvis/router)](http://nodejs.org/download/) [![Build Status](https://travis-ci.org/sc0ttj/router.svg?branch=master)](https://travis-ci.org/sc0ttj/router) [![npm version](https://badgen.net/bundlephobia/minzip/@scottjarvis/router?color=green&label=gzipped)](https://badgen.net/bundlephobia/minzip/@scottjarvis/router) [![npm version](https://badgen.net/npm/dt/@scottjarvis/router)](https://badgen.net/npm/dt/@scottjarvis/router)
-->

> Routing is the process of determining what code to run when a URL is requested.

**router** is a JS router, which works client-side (browser), or server-side (NodeJS).

**router** resolves URL paths like **/profile/1** to route patterns such as **/profile/:id**, and generates a params object that is passed to each route.

## Features

- Easy setup, zero dependencies
- Only 1kb minified and gzipped
- Simple syntax and usage
- Works **client-side**, in browsers:
  - as a router for single page applications (SPAs)
- Works **server-side**, in Node:
  - as a router for an HTTP server (express.js like API, also supports "middleware")
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

You _could_ simply put **router** inside a standard NodeJS HTTP server and use `res.write()` and `res.end()` as normal. 

However, **router** provides a simple wrapper around these methods, called `res.send()` (just like express.js).

The `res.send()` method makes life easier for you:

- sets appropriate header status to 200 (if `res.status()` not used)
- sets appropriate content type:
  * text/html                 - if given a string
  * application/json          - if given an object, array or JSON
  * application/octet-stream  - if given a Buffer
- pretty prints JSON output 
- calls `res.end()` for you 

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
    // for servers, you must pass in 'res' and 'req', after the routes object above
    res, req
  )

})

```

### Using middleware

If running an HTTP server, **router** supports "middleware", in a similar way to express.js. 

Using middleware is very simple - define a function that takes `(res, req)` as parameters:

```js
var getRequestTime = function(res, req) {
  req.time = Date.now()
  console.log("middleware: added req.time: ", req.time)
}
```

And use `router.use(someFunc)` to enable it:

```js
// pass the middleware function to router.use()
router.use(getRequestTime)
```

See the full example in [examples/http-router.js](examples/http-router.js)

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
    console.log(params)
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
- [expressJS](https://expressjs.com/en/) - the most widley used JavaScript router

## Acknowledgements

- [Zetcode: javascript/http](http://zetcode.com/javascript/http/)
- [@pyaesonekhant1234: differences-between-res-write-res-end-and-res-send](https://medium.com/@pyaesonekhant1234/differences-between-res-write-res-end-and-res-send-in-node-js-7c29e8e50654)


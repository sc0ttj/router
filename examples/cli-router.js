// Router usage: Node as a local command-line tool

// simply define routes in the main script of your command-line tool
// and pass them in as the first option:
//
// Example usage:
//
//  node examples/cli-router.js /profile/1 --foo=bar
//
// Example File "myprogram.js":

var router = require("../dist/router.js")

if (typeof process !== "undefined" && process.argv) {
  // make sure we're running in Node

  router({
    // 'params' will contain all command-line arguments
    // that were passed to this script
    "*": params => {
      console.log(params)
    }
  })
}

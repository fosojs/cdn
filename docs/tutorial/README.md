# How to develop a package?

Before publishing a package to an npm registry, you have to develop and test it locally.
In order to do so, you have to run the foso-cdn server locally.


## Using the CLI

To start a foso-cdn locally, you can use the foso-cdn CLI.

To install the `foso-cdn`, run:

```
npm install -g foso-cdn
```

Once you have it, just go to the root directory of the package that you want to develop and run `fcdn serve`.

This command will run a foso-cdn server locally and function as usually but when the package that you are developing will be requested,
it will return the resources from your local files system instead of from the npm registry.


## Using the API

If you have a `gulp` task that bundles your resources, you can put the initialization of the cdn server there.

``` js
const CdnServer = require('foso-cdn').Server;

gulp.task('develop', function(cb) {
  // ...
  let server = new Server({
    src: './'
  });
  server.start().then(cb);
});
```


## TodoMVC

See `foso-cdn` in action on the [TodoMVC project][todomvc].


[todomvc]: https://github.com/fosojs/todomvc

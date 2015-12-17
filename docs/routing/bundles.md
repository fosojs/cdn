# Bundles

Any npm package can be loaded through the `/bundle/{bundleRoute}` endpoint.
The `bundleRoute` should end either with `.js` or `.css` and should contain a list
of one or more `packageRoutes`. For example, `/bundle/foo,bar,baz.js` will return a JavaScript file that is a
concatenation of the latest versions of `foo`, `bar`, `baz`.


## Loading specific versions

Sometimes it might be necessary to load a specific version of a package. In order to do so, it is
possible to specify the version of the package after a `@` character. For example,
`/bundle/foo@4.2.13,bar@3,baz.js` will return the `4.2.13`'s version of `foo`,
the latest version of the `3`rd major version of `bar` and the latest version of
`baz`.


## Loading specific files

By default, the main file of the package is loaded (the path to the main file is stored in the `"main"` field for js and in the `"style"` field for css, in the `package.json` file). However, it is possible to
load any file of a package by specifying the path to it. E.g., to load the `collection/pluck.js`
file of the [lodash][1] package, this URL can be used: [/bundle/lodash@3.10.1(collection/pluck).js][2].
It is also possible to load several files from a package: [/bundle/lodash@3.10.1(array/fill+collection/pluck).js][3].


## Minifying

It is possible to minify the resources by adding `.min` to the end of their path. For instance:

* the non-minified bootstrap css file: [/bundle/bootstrap@3.3.6.css](http://cdn.foso.me/bundle/bootstrap@3.3.6.css)
* the minified bootstrap css file: [/bundle/bootstrap@3.3.6.min.css](http://cdn.foso.me/bundle/bootstrap@3.3.6.min.css)

[1]: https://www.npmjs.com/package/lodash
[2]: http://cdn.foso.me/bundle/lodash@3.10.1(collection/pluck).js
[3]: http://cdn.foso.me/bundle/lodash@3.10.1(array/fill+collection/pluck).js

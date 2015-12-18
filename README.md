<!--email_off-->
# foso-cdn

A webservice that dishes out files from npm packages.

Inspired by [npm-cdn](https://github.com/zeke/npm-cdn),
[wzrd.in](https://github.com/jfhbrook/wzrd.in),
[brcdn.org](https://github.com/ForbesLindesay/brcdn.org) and
[jsdelivr](http://www.jsdelivr.com/).


## Installation

```
$ git clone https://github.com/fosojs/cdn.git && cd ./cdn
$ npm install
$ node app
```


## Usage

To access a file inside a published npm package, use the following pattern:

```
http://cdn.foso.me/raw/{packageName}@{packageVersion}/{filePath}
```

Examples:

* [/raw/dat@6.8.6/img/dat-website.png](http://cdn.foso.me/raw/dat@6.8.6/img/dat-website.png)
* [/raw/express@4.10.4/package.json](http://cdn.foso.me/raw/express@4.10.4/package.json)
* [/raw/zeke.sikelianos.com@1.0.0/assets/images/hands.png](http://cdn.foso.me/raw/zeke.sikelianos.com@1.0.0/assets/images/hands.png)


## Indexes

When a package is downloaded, index files are generated in HTML and JSON format.

* [/raw/browserify@8.1.1](http://cdn.foso.me/raw/browserify@8.1.1) renders an HTML page with links to all the files in the package.


## Accessing packages

Any npm package can be loaded through the `/bundle/{bundleRoute}` endpoint.
The `bundleRoute` should end either with `.js` or `.css` and should contain a list
of one or more `packageRoutes`. For example, `/bundle/foo,bar,baz.js` will return a JavaScript file that is a
concatenation of the latest versions of `foo`, `bar`, `baz`.


### Loading specific versions

Sometimes it might be necessary to load a specific version of a package. In order to do so, it is
possible to specify the version of the package after a `@` character. For example,
`/bundle/foo@4.2.13,bar@3,baz.js` will return the `4.2.13`'s version of `foo`,
the latest version of the `3`rd major version of `bar` and the latest version of
`baz`.


### Loading specific files

By default, the main file of the package is loaded (the path to the main file is stored in the `"main"` field for js and in the `"style"` field for css, in the `package.json` file). However, it is possible to
load any file of a package by specifying the path to it. E.g., to load the `collection/pluck.js`
file of the [lodash](https://www.npmjs.com/package/lodash) package, this URL can be used: [/bundle/lodash@3.10.1(collection/pluck).js](http://cdn.foso.me/bundle/lodash@3.10.1(collection/pluck).js).
It is also possible to load several files from a package: [/bundle/lodash@3.10.1(array/fill+collection/pluck).js](http://cdn.foso.me/bundle/lodash@3.10.1(array/fill+collection/pluck).js).


### Minifying

It is possible to minify the resources by adding `.min` to the end of their path. For instance:

* the non-minified bootstrap css file: [/bundle/bootstrap@3.3.6.css](http://cdn.foso.me/bundle/bootstrap@3.3.6.css)
* the minified bootstrap css file: [/bundle/bootstrap@3.3.6.min.css](http://cdn.foso.me/bundle/bootstrap@3.3.6.min.css)


## License

The MIT License (MIT)
<!--/email_off-->

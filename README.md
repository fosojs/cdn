# ung-server

A webservice that dishes out files from npm packages.

Inspired by [npm-cdn](https://github.com/zeke/npm-cdn), [wzrd.in](https://github.com/jfhbrook/wzrd.in) and [brcdn.org](https://github.com/ForbesLindesay/brcdn.org).


## Installation

```
$ git clone https://github.com/ungjs/ung-server.git && cd ./ung-server
$ npm install
$ node app
```


## Usage

To access a file inside a published npm package, use the following pattern:

```
http://cdn.foso.me/{packageName}@{packageVersion}/{filePath}
```

Examples:

* [/raw/dat@6.8.6/img/dat-website.png](http://cdn.foso.me/raw/dat@6.8.6/img/dat-website.png)
* [/raw/express@4.10.4/package.json](http://cdn.foso.me/raw/express@4.10.4/package.json)
* [/raw/zeke.sikelianos.com@1.0.0/assets/images/hands.png](http://cdn.foso.me/raw/zeke.sikelianos.com@1.0.0/assets/images/hands.png)


## Indexes

When a package is downloaded, index files are generated in HTML and JSON format.

* [/raw/browserify@8.1.1](http://cdn.foso.me/raw/browserify@8.1.1) renders an HTML page with links to all the files in the package.


## Pushing packages to the registry

For pushing packages to the registry, the [ung-cli][] can be used.


## Accessing the packages

All the packages can be loaded through the `/bundle/{bundleRoute}` endpoint.
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

By default, the `index.js` file of the package is loaded. However, it is possible to
load any file of a package by specifying the path to it. E.g., to load the `collection/pluck.js`
file of the [lodash](https://www.npmjs.com/package/lodash) package, this URL can be used: [/bundle/lodash@3.10.1!collection/pluck.js](http://cdn.foso.me/bundle/lodash@3.10.1!collection/pluck.js).
It is also possible to load several files from a package: [/bundle/lodash@3.10.1!array/fill;collection/pluck.js](http://cdn.foso.me/bundle/lodash@3.10.1!array/fill;collection/pluck.js).


### Using references

Sometimes there might be a need to have a static address that can hide dynamic
content behind it. Why? Because even though ung bundles are flexible,
links on HTML pages are immutable. Even though it is possible to get a completely different
bundle by changing the versions of the packages, it is hard to update the
link on the HTML page without updating the server. That's when references come handy.

References are named sets of packages. They have immutable names but the resources that
they are loading can be changed.

A reference can be loaded by putting the `@` character before it's name. For example:
`/bundle/@main.js`.

References can be created, changed with the [ung-cli][].


## License

The MIT License (MIT)


[ung-cli]: https://github.com/ungjs/ung

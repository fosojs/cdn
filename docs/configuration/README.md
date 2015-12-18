<!--email_off-->
# Configuration

You can configure the way a package is served by **foso-cdn** by changing its
`package.json`.


## cdn.maxAge

You can override the default **max-age** of your package's resources by setting the `maxAge` field in your `package.json`:

``` js
"cdn": {
  "maxAge": {
    "**/*.js": "1w", // all the js files will be cached in the user's browser for 1 week
    "**/*.css": "1w",
    "**/*.png": "1d"
  }
}
```


## cdn.files

The files array determines which files are served by the cdn. By default all the files are served.

``` js
"cdn": {
  "files": [
    "dist/**/*.js" // all the js files in the dist folder
  ]
}
```


## cdn.basePath

The root path location that will be used to resolve all relative paths when accessing files in bundles or separately.

``` js
"cdn": {
  "basePath": "dist"
}
```


## Disallow the package from being served

You might want to disallow some private npm modules from being served through foso-cdn. It's easy to do so by simply assigning `false` to the `cdn` option:

``` js
"cdn": false
```
<!--/email_off-->

# gulp-versioning
A plugin for gulp that will help you track versions over production.

### How To Use it?
Basically, after your final version of your .js file was made with gulp (concatenating all, or minifying it), you can pipe this plugin that will add a Object under the `window` object of the browser.

To use it, simply put `.pipe(version())` on your gulp task.
This will make a `window.version` object like:
```
{
  latestTag: "v1.0",
  latestCommit: {
    "hash":"ec4f4dbb06654bb5ce6abdfff92ad0cd455484af",
    "date":"2016-08-24 23:24:24 -0300",
    "message":"added promise handler on the first test",
    "author_name":"Nahuel Alejandro Veron",
    "author_email":"test@sample.com"
  }
}
```

You also can use it with another files, is useful if you have multiple components (ie. in separated bower/npm packages), in this case, you can set a tag as parameter that will result in a object inside `window.version`.

You can set a tag on the gulp setting:

`.pipe(version('myAwesomePackage'))`

And it will result in something like:

```
{
  myAwesomePackage: {
    latestTag: "v1.0",
    latestCommit: {
      "hash":"ec4f4dbb06654bb5ce6abdfff92ad0cd455484af",
      "date":"2016-08-24 23:24:24 -0300",
      "message":"added promise handler on the first test",
      "author_name":"Nahuel Alejandro Veron",
      "author_email":"test@sample.com"
    }
  }
}
```

This is mainly to mantain multiples packages, and also is the recommended way to work with this plugin, **Beware that, if some packages uses the versioning without tag it probably overwrite the already configured versions on the `window.version` object.**

If you are not using tags, it will set an undefined as default, but if isn't able to get the repository, it will throw a error.

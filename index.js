'use strict';
var through = require('through2');
var gutil = require('gulp-util');
var applySourceMap = require('vinyl-sourcemaps-apply');
var BufferStreams = require('bufferstreams');
var simpleGit = require('simple-git')();

function getLatestTag() {
  return new Promise(function(resolve, reject) {
    simpleGit.tags(function(err, tags) {
      if (err) {
        reject(err);
      }
      else resolve(tags.latest);
    });
  });
}

function getLatestCommit() {
  return new Promise(function(resolve, reject) {
    simpleGit.log(function(err, logs) {
      if (err) {
        reject(err);
      }
      else resolve(logs.latest);
    });
  });
}

function appendVersion(file, input, tag) {
  return new Promise(function(resolve, reject) {
    var res = input.toString();
    if (tag) {
      getLatestTag().then(function(latestTag) {
        getLatestCommit().then(function(latestCommit) {
          // TODO: Inject JAvascript on the browser with thag
          var commit = JSON.stringify(latestCommit);
          res = res + `
          (function() {
            if(!window.version) {
              window.version = {};
            }
            window.version["${tag}"] = {
              latestTag: "${latestTag}",
              latestCommit: ${commit}
            }
          })()`;

          if (file.sourceMap) {
            var sourceMap = JSON.parse(res.map);
            sourceMap.file = file.relative;
            applySourceMap(file, sourceMap);
          }

          resolve(new Buffer(res));
        }, reject);
      }, reject);
    }
    else {
      getLatestTag().then(function(latestTag) {
        getLatestCommit().then(function(latestCommit) {
          // TODO: Inject JAvascript on the browser with thag
          var commit = JSON.parse(latestCommit);
          res = res + `
          (function() {
            window.version = {
              latestTag: "${latestTag}",
              latestCommit: ${commit}
            }
          })()`;

          if (file.sourceMap) {
            var sourceMap = JSON.parse(res.map);
            sourceMap.file = file.relative;
            applySourceMap(file, sourceMap);
          }

          resolve(new Buffer(res));
        }, reject);
      }, reject);
    }
  });
}

module.exports = function (tag) {
  return through.obj(function (file, enc, done) {
    // When null just pass through.
    if (file.isNull()) {
      return done(new gutil.PluginError('gulp-versioning', 'No File, Stream or Buffer to Fetch'));
    }

    // Buffer input.
    if (file.isBuffer()) {
      appendVersion(file, file.contents, tag).then(function(buffer) {
        file.contents = buffer;
        done(null, file);
      }, function(e) {
        return done(new gutil.PluginError('gulp-versioning', e));
      });
    }
    // Dealing with stream input.
    else {
      file.contents = file.contents.pipe(new BufferStreams(function(err, buf, cb) {
        if (err) return cb(new gutil.PluginError('gulp-versioning', err));
        appendVersion(file, buf, tag).then(function(buffer) {
          cb(null, buffer);
          done(null, file);
        }, function(e) {
          cb(e);
        });
      }));
    }
  });
};

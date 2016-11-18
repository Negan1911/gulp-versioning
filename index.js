'use strict';
const through = require('through2');
const gutil = require('gulp-util');
const applySourceMap = require('vinyl-sourcemaps-apply');
const BufferStreams = require('bufferstreams');
const simpleGit = require('simple-git')();
const spawn = require('child_process').spawn;

function getLatestTag() {
  return new Promise(function(resolve, reject) {
    // Crappy API to Spawn proccess, node should update it  ¯\_(ツ)_/¯
    let data = '';
    const git = spawn('git', ['describe', '--abbrev=0', '--tags']);

    git.stdout.on('data', (chunk) => {
      data += chunk;
    });

    git.on('close', (code) => {
      if (code == 0) resolve(data.trim());
      else reject(data);
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
  return new Promise((resolve, reject) => {
    let res = input.toString();
    if (tag) {
      getLatestTag().then((latestTag) => {
        getLatestCommit().then((latestCommit) => {
          // TODO: Inject JAvascript on the browser with thag
          let commit = JSON.stringify(latestCommit);
          res = res + `
          (function() {
            if(!window.version) {
              window.version = {};
            }
            window.version["${tag}"] = {
              latestTag: " ${latestTag} ",
              latestCommit: ${commit}
            }
          })()`;

          if (file.sourceMap) {
            let sourceMap = JSON.parse(res.map);
            sourceMap.file = file.relative;
            applySourceMap(file, sourceMap);
          }

          resolve(new Buffer(res));
        }, reject);
      }, reject);
    }
    else {
      getLatestTag().then((latestTag) => {
        getLatestCommit().then((latestCommit) => {
          // TODO: Inject JAvascript on the browser with thag
          let commit = JSON.parse(latestCommit);
          res = res + `
          (function() {
            window.version = {
              latestTag: "${latestTag}",
              latestCommit: ${commit}
            }
          })()`;

          if (file.sourceMap) {
            let sourceMap = JSON.parse(res.map);
            sourceMap.file = file.relative;
            applySourceMap(file, sourceMap);
          }

          resolve(new Buffer(res));
        }, reject);
      }, reject);
    }
  });
}

module.exports = (tag) => {
  return through.obj((file, enc, done) => {
    // When null just pass through.
    if (file.isNull()) {
      return done(new gutil.PluginError('gulp-versioning', 'No File, Stream or Buffer to Fetch'));
    }

    // Buffer input.
    if (file.isBuffer()) {
      appendVersion(file, file.contents, tag).then(function(buffer) {
        file.contents = buffer;
        done(null, file);
      }, e => done(new gutil.PluginError('gulp-versioning', e)));
    }
    // Dealing with stream input.
    else {
      file.contents = file.contents.pipe(new BufferStreams((err, buf, cb) => {
        if (err) return cb(new gutil.PluginError('gulp-versioning', err));
        appendVersion(file, buf, tag).then((buffer) => {
          cb(null, buffer);
          done(null, file);
        }, e => cb(e));
      }));
    }
  });
};

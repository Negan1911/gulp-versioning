'use strict';
var through = require('through2');
var gutil = require('gulp-util');
var applySourceMap = require('vinyl-sourcemaps-apply');
var BufferStreams = require('bufferstreams');

function runCommand(cmd, args, cb) {
  var spawn = require('child_process').spawn;
  var child = spawn(cmd, args);
  var resp = '';

  child.stdout.on('data', function(buffer) {
    resp += buffer.toString();
  });

  child.stdout.on('end', function() {
    cb(resp);
  });
}

function appendVersion(file, input, tag) {
  var res = input.toString();
  if (tag) {
    // TODO: Inject JAvascript on the browser with thag
    //res = res + '(function() { window.version[' + tag + '] =  })()'
  }
  else {
    // TODO: Inject Javascript on the browser without the tag
  }


  if (file.sourceMap) {
    var sourceMap = JSON.parse(res.map);
    sourceMap.file = file.relative;
    applySourceMap(file, sourceMap);
  }

  return new Buffer(res.src);
}

module.exports = function (tag) {
  return through.obj(function (file, enc, done) {
    // When null just pass through.
    if (file.isNull()) {
      this.push(file);
      return done();
    }

    // Buffer input.
    if (file.isBuffer()) {
      try {
        file.contents = appendVersion(file, file.contents, tag);
      } catch (e) {
        this.emit('error', e);
        return done();
      }
    // Dealing with stream input.
    } else {
      file.contents = file.contents.pipe(new BufferStreams(function(err, buf, cb) {
        if (err) return cb(new gutil.PluginError('gulp-versioning', err));
        try {
          var transformed = appendVersion(file, buf, tag);
        } catch (e) {
          return cb(e);
        }
        cb(null, transformed);
      }));
    }

    this.push(file);
    done();
  });
};

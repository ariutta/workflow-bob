var config = require('../config.json');
var fs = require('fs');
var git = require('gulp-git');
var gitStreaming = require('../util/git-streaming.js');
var gulp = require(__dirname + '/../../gulp');
var highland = require('highland');
var metadataFilePaths = config.metadataFilePaths;
var mkdirp = require('mkdirp');
var path = require('path');

gulp.task('sync-tag-version', function syncTagVersion(callback) {
  var package = JSON.parse(fs.readFileSync(path.join(
        __dirname, '..', '..', 'package.json')));
  var version = package.version;

  mkdirp.sync(path.join(__dirname, '..', '..', 'dist'));
  mkdirp.sync(path.join(__dirname, '..', '..', 'docs'));

  gitStreaming.readTags
  .reduce(false, function checkTagExists(accumulator, tag) {
    if (accumulator || (tag === version)) {
      return true;
    }

    return false;
  })
  .each(function(tagExists) {
    if (tagExists) {
      return callback();
    }

    gulp.src(['./dist/*',
              './docs/*',
              'README.md']
              .concat(metadataFilePaths)
    )
    .pipe(highland.pipeline())
    /* TODO why doesn't the commit below finish after the tag?
     * We're using the commit-after-build gulp task in
     * build.js instead for now.
    .through(git.add())
    .through(gitStreaming.commit(
        'Built and bumped version to ' + version + '.'))
    //*/
    .through(gitStreaming.createTag(version,
            'Version ' + version))
    .last()
    .errors(function(err, push) {
      throw err;
    })
    .each(function() {
      return callback();
    });
  });
});

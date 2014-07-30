// Include gulp
var gulp = require('gulp');

// Include Our Plugins
var jshint = require('gulp-jshint');

// Lint Task
gulp.task('lint', function() {
    return gulp.src('app/*/*.js')
        .pipe(jshint())
        .pipe(jshint.reporter('default'));
});

// Default Task
gulp.task('default', ['lint']);
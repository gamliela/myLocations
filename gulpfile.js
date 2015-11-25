var gulp = require('gulp'),
    uglify = require('gulp-uglify');

gulp.task('default', function() {
    // place code for your default task here
});

gulp.task('minify', function () {
    gulp.src('myLocations.js')
        .pipe(uglify())
        .pipe(gulp.dest('build'))
});

gulp.task('watch', function () {
    gulp.watch('myLocations.html', function (event) {
        console.log('Event type: ' + event.type); // added, changed, or deleted
        console.log('Event path: ' + event.path); // The path of the modified file
    });
});
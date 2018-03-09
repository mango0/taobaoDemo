var gulp = require('gulp');
var sass = require('gulp-sass');
var browserSync = require('browser-sync');
var useref = require('gulp-useref');
var uglify = require('gulp-uglify');
var gulpIf = require('gulp-if');
var imagemin = require('gulp-imagemin');
var cache = require('gulp-cache');
var del = require('del');
var runSequence = require('run-sequence');
var autoprefixer = require('autoprefixer');

// Basic Gulp task syntax
gulp.task('hello', function() {
    console.log('Hello K!');
})

// Development Tasks
// -----------------

// Start browserSync server
gulp.task('browserSync', function() {
    browserSync({
        server: {
            baseDir: 'src'
        }
    })
})

gulp.task('sass', function() {
    return gulp.src('src/scss/**/*.scss') // Gets all files ending with .scss in src/scss and children dirs
        .pipe(sass({outputStyle: 'compressed'}).on('error', sass.logError)) // Passes it through a gulp-sass, log errors to console
        .pipe(gulp.dest('src/css')) // Outputs it in the css folder
        .pipe(browserSync.reload({ // Reloading with Browser Sync
            stream: true
        }));
})

gulp.task('autoprefixer', function() {
    gulp.src('src/scss/**/*.css')
        .pipe(autoprefixer({
            browsers: ['last 2 versions', 'Android >= 4.0'],
            casecade: true,
            remove: true
        }))
        .piep(gulpdest('dist/css'))
})

// Watchers
gulp.task('watch', function() {
    gulp.watch('src/scss/**/*.scss', ['sass']);
    gulp.watch('src/*.html', browserSync.reload);
    gulp.watch('src/js/**/*.js', browserSync.reload);
})

// Optimization Tasks
// ------------------

// Optimizing CSS and JavaScript
gulp.task('useref', function() {

    return gulp.src('src/*.html')
        .pipe(useref())
        .pipe(gulpIf('*.js', uglify()))
        .pipe(gulp.dest('dist'));
});

// Optimizing Images
gulp.task('images', function() {
    return gulp.src('src/images/**/*.+(png|jpg|jpeg|gif|svg)')
    // Caching images that ran through imagemin
        .pipe(cache(imagemin({
            interlaced: true,
        })))
        .pipe(gulp.dest('dist/images'))
});

// Copying fonts
gulp.task('fonts', function() {
    return gulp.src('src/fonts/**/*')
        .pipe(gulp.dest('dist/fonts'))
})

// Cleaning
gulp.task('clean', function() {
    return del.sync('dist').then(function(cb) {
        return cache.clearAll(cb);
    });
})

gulp.task('clean:dist', function() {
    return del.sync(['dist/**/*', '!dist/images', '!dist/images/**/*']);
});

// Build Sequences
// ---------------

gulp.task('default', function(callback) {
    runSequence(['sass', 'browserSync'], 'watch',
        callback
    )
})

gulp.task('build', function(callback) {
    runSequence(
        'clean:dist',
        'sass',
        ['useref', 'images', 'fonts', 'autoprefixer'],
        callback
    )
})
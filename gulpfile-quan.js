var gulp            = require('gulp'),  // 引入gulp
    // 引入组件
    sass            = require('gulp-sass'),
    notify          = require('gulp-notify'),               // 显示报错信息和报错后不终止当前gulp任务，在控制台加入文字描述
    autoprefixer    = require('gulp-autoprefixer'),         // 根据设置浏览器版本自动处理浏览器前缀
    sourcemaps      = require('gulp-sourcemaps'),           // 文件压缩后不利于查看调试，安装后，出错时可直接显示原始代码，而不是转换后代码
    cleanCSS        = require('gulp-clean-css'),            // 压缩CSS文件，减少文件大小，并给引用url添加版本号避免缓存
    rename          = require('gulp-rename'),               // 修改文件名称(index.css → index.min.css)
    clean           = require('del'),                       // 删除文件
    useref          = require('gulp-useref'),               // 对html中的js,css引用进行合并等操作
    gulpif          = require('gulp-if'),                   // 为功能执行添加条件判断
    uglify          = require('gulp-uglify'),               // 压缩js文件，减小文件大小
    imagemin        = require('gulp-imagemin'),             // 压缩图片文件(png,jpg,gif,svg)
    pngquant        = require('imagemin-pngquant'),
    cache           = require('gulp-cache'),
    browsersync     = require('browser-sync').create(),     // 实时刷新浏览器
    rev             = require('gulp-rev'),                  // 对文件名加MD5前缀
    revCollector    = require('gulp-rev-collector');        // 路径替换

var projectproxy = 'local.dev';

// 编译sass
/* gulp.task(name,[deps],fn)
task定义一个gulp任务
name: (必填) String 指定任务的名称
deps: (可选) StringArray 该任务依赖的任务(被依赖的任务需要返回当前任务的事件流)
fn: (必填) Function 该任务调用的插件操作
 */
gulp.task('sass', ['sass:clean'], function () {  // 执行完sass:clean任务后再执行sass任务
    return gulp.src('./src/scss/**/*.scss')  // 该任务针对的文件(指定需要处理的源文件的路径)
        .pipe(sass({  // 该任务调用的模板(输出方式：压缩；；另有嵌套输出方式nested、展开输出方式expanded、紧凑输出方式compact)
            outputStyle: 'compressed'
        }))
        .on('error', console.error.bind(console))
        .pipe(autoprefixer({  // 调用的autoprefixer模板
            browsers: ['last 2 versions','Android >= 4.0'],  // last 2 versions 主流浏览器的最新两个版本
            cascade: false,  // 是否美化属性值，默认true 如下：
            //-webkit-transform: rotate(45deg);
            //        transform: rotate(45deg);
            remove: true  // 是否去掉不必要的前缀，默认true
        }))
        .pipe(sourcemaps.init())  // 初始化
        .pipe(cleanCSS({  // 命令与命令之间的衔接用pipe
            level: 2
        }))
        .pipe(rename({suffix: '.min'}))
        .pipe(sourcemaps.write('./maps'))  // 生成sourcemap文件，路径为./maps
        // .pipe(lineec())
        .pipe(rev())  // 文件名加MD5后缀
        .pipe(gulp.dest('./dist/css'))  // 将会在dist/css下生成
        .pipe(rev.manifest()) // 生成一个rev-manifest.json
        .pipe(gulp.dest('./src/rev/css'))  // 将rev-manifest.json 保存到rev目录下
        .pipe(browsersync.reload({ stream:true }))  // 编译后的css将注入到浏览器里实现更新
        .pipe(notify({title: 'SASS Task', message: 'SASS compiled!', timeout: 2, onLast: true}));
});
// build文件是每一次build都会产生的，为防止上一次build的文件和这次的都存在，最好删除上一次的
gulp.task('sass:clean', function() {
    return clean([  // 只有热孺人之后，其他依赖了clean的任务，才能保证执行顺序，否则可能del还没删完，下一个依赖了clean的任务就开始了
        './dist/css/**/*.css'
    ]);
});

gulp.task('images', ['images:clean'], function() {
    return gulp.src('./src/images/**/*')
        .pipe(cache(imagemin({
            progressive: true,  // Boolean 默认false 无损压缩jpg图片
            optimizationLevel: 5, // Number 默认3 取值范围：0-7(优化等级)
            interlaced: true,  // Boolean 默认false 隔行扫描gif进行渲染
            svgoPlugins: [{removeViewBox: false}],  // 不移除svg的viewbox属性
            use: [pngquant()]
        })))
        .pipe(gulp.dest('./dist/images'))
        .pipe(notify({title: 'Images Task', message: 'Images compressed!', timeout: 2, onLast: true}));
});
gulp.task('images:clean', function() {
    return clean([
        './dist/images/**/*'
    ]);
});
gulp.task('images:watch', ['images'], function(done) {
    browsersync.reload();
    done();
});

gulp.task('js', ['js:clean'], function() {
    return gulp.src('./src/js/*.js')
        .pipe(rename({suffix: '.min'}))
        .pipe(gulpif('*.js', uglify()))
        // .pipe(gulpif('*.js', uglify({  // 压缩所有js文件
        //     mangle: {  // Boolean 默认true 是否修改变量名
        //         // toplevel: true,   // 有一定调用风险(跨文件的变量调用)
        //         // 如果为false默认值混淆比包内的内部变量；
        //     }
        // })))
        .pipe(rev())
        .pipe(gulp.dest('./dist/js'))
        .pipe(rev.manifest())
        .pipe(gulp.dest('./src/rev/js'))
        .pipe(browsersync.reload({ stream:true }))
        .pipe(notify({title: 'JS Task', message: 'JS compiled!', timeout: 2, onLast: true}));
});
gulp.task('js:clean', function() {
    return clean([
        './dist/js/*.js'
    ]) ;
});

gulp.task('html', ['html:clean'], function() {
    return gulp.src('./src/*.html')
        .pipe(useref())
        .pipe(gulpif('*.css', cleanCSS({
            level: 2
        })))
        .pipe(gulpif('*.js', uglify()))
        .pipe(gulp.dest('./dist'))
        // .pipe(browsersync.reload({ stream:true }))
        .pipe(notify({title: 'HTML Task', message: 'HTML compiled!', timeout: 2, onLast: true}));
});
gulp.task('html:clean', function() {
    return clean([
        './dist/*.html'
    ]);
});
gulp.task('html:watch', ['html'], function(done) {
    browsersync.reload();
    done();
});

gulp.task('rev', function() {
    gulp.src(['./src/rev//**/*.json', './src/index.html'])  // 读取 rev-manifest.json 文件以及需要进行css名替换的文件
        .pipe(revCollector({
            replaceReved: true
        }))  //执行文件内css名的替换
        .pipe(gulp.dest('./dist'))  // 替换后的文件输出的目录
});

// 代理服务器 + 监听 sass/html/images文件
/*
项目中需要把服务器跑起来，所以需要用到代理服务proxy
 */
gulp.task('browsersync', ['sass', 'html', 'images', 'js'], function() {
    browsersync.init({  // 启动Browsersync服务
        server: './dist'
        // proxy: projectproxy,  // 原本访问地址是哪里，proxy指向哪里，browser-sync会生成一个新的带自动刷新的地址
        // notify: false,  // 不显示在浏览器中的任何通知
        // open: false  // 停止自动打开浏览器
    });
});

/*  gulp.watch(glob,[opts],tasks) / gulp.watch(glob,[opts,cb])
watch方法用于监听文件变化，文件一修改就会执行指定的任务
glob: (必填) String / StringArray 需要处理的源文件匹配符路径
opts: (可选) Object
tasks: (必填) StringArray 需要执行的任务的名称数组
cb(event): (可选) Function 每个文件变化执行的回调函数
 */
gulp.task('watch', ['browsersync'], function() {
    gulp.watch('./src/scss/**/*.scss', ['sass']);
    gulp.watch('./src/*.html', ['html:watch']);
    gulp.watch('./src/js/*.js', ['js'])
    gulp.watch('./src/images/**/*', ['images:watch']);
});

gulp.task('default', ['browsersync', 'sass', 'html', 'images','js', 'watch','rev']);
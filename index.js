var koa = require('koa')
    ,config = require('./config.js')
    ,parse = require('co-busboy')
    ,path = require('path')
    ,fs = require('fs')
    ,logger = require('./logger.js')
    ,error = require('koa-error')
    ,koaLogger = require('koa-bunyan')
    ,router  = require('koa-router')()
    ,mkdirp = require('mkdirp')
    ,utils = require('./utils.js')
    ,slow = require('koa-slow');

router.post('/upload', function *(next) {
    var parts = parse(this), part, paths = [], username = "", orgCode = "";
    while ((part = yield parts)) {
        if (part.length) {
            switch (part[0]) {
                case 'username':
                    username = part[1];
                    break;
                case 'orgCode':
                    orgCode = part[1];
                    break;
                default:
                    break;
            }
        } else {
            // part is stream
            let dirPath = path.join(config.get('assetDir'), orgCode, username);
            yield utils.assertDir(dirPath);
            let stream = fs.createWriteStream(path.join(dirPath, part.filename));
            logger.info('uploading %s', stream.path);
            part.pipe(stream);
            paths.push(stream.path);
        }
    }
    this.body = {
        paths: paths,
    };
    yield next;
});

if (require.main === module) {
    try {
        fs.statSync(config.get('assetDir'));
    } catch (e) {
        if (e.code === 'ENOENT') {
            mkdirp.sync(config.get('assetDir'));
        } else {
            throw e;
        }
    } 
    try {
        fs.statSync(config.get('logDir'));
    } catch (e) {
        if (e.code === 'ENOENT') {
            mkdirp.sync(config.get('logDir'));
        } else {
            throw e;
        }
    } 
    var app = koa();
    if (config.get('env') == 'development') {
        app.use(slow({
            delay: config.get('slow')
        }));
    }
    app.use(koaLogger(logger, {
        // which level you want to use for logging?
        // default is info
        level: 'info',
        // this is optional. Here you can provide request time in ms,
        // and all requests longer than specified time will have level 'warn'
        timeLimit: 100
    }))
    .use(router.routes())
    .listen(config.get('port'));
}


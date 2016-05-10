var koa = require('koa');
var config = require('./config.js');
var parse = require('co-busboy');
var path = require('path');
var fs = require('fs');
var logger = require('./logger.js');
var error = require('koa-error');
var koaLogger = require('koa-bunyan');
var router  = require('koa-router')();
var mkdirp = require('mkdirp');
var utils = require('./utils.js');

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
    koa()
    .use(koaLogger(logger, {
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


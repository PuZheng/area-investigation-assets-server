var convict = require('convict');

var conf = convict({
    env: {
        doc: "The applicaton environment.",
        format: ["production", "development", "test"],
        default: "development",
        env: "NODE_ENV"
    },
    port: {
        doc: 'listening port',
        format: 'port',
        default: 8080,
        env: 'PORT'
    },
    assetDir: {
        doc: 'asset directory',
        format: String,
        default: 'assets',
        env: 'ASSET_DIR'
    }
});

// Load environment dependent configuration
var env = conf.get('env');
env != 'development' && conf.loadFile('./config/' + env + '.json');

// Perform validation
conf.validate({strict: true});

module.exports = conf;
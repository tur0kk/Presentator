// default: development
// process.env.NODE_ENV = 'production';

// port
exports.title = "Presentator";

// port
exports.port = 3000;

exports.useRedisStore = true;
// redis server
exports.redis = {
    host: 'localhost',
    port: 6379
}

exports.fileDir = "public/file_dir"
exports.tmpDir = "public/tmp_dir"
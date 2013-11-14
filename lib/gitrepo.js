var fs = require("fs");
var path = require('path');
var q = require('q');
var exec = require('child_process').exec;

module.exports = function(options) {
    return new GitRepo(options);
}

function GitRepo(options) {
    this.defaultBranch = options.defaultBranch || "master";
    this.dirname = options.dirname;
    this.cloneUrl = options.cloneUrl;
}

GitRepo.prototype.clone = function clone() {
    var deferred = q.defer();
    exec("git clone " + this.cloneUrl + " " + this.dirname, function(err, stdout, stderr) {
        err ? deferred.reject(err) : deferred.resolve(stdout);
    });
    return deferred.promise;
}

GitRepo.prototype.pull = function pull() {
    var deferred = q.defer();
    exec("git pull " + this.cloneUrl + " " + this.defaultBranch, { cwd: this.dirname }, function(err, stdout, stderr) {
        err ? deferred.reject(err) : deferred.resolve(stdout);
    });
    return deferred.promise;
}

module.exports.isRepo = isRepo;
function isRepo(dirname) {
    var deferred = q.defer();
    var p = path.join(dirname, ".git");
    fs.exists(p, function(exists) {
        deferred.resolve(exists);
    });
    return deferred.promise;
}
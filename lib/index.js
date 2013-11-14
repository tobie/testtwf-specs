var fs = require("fs");
var path = require('path');
var q = require('q');
var Batch = require('batch');
var specref = require("./specref");
var gitrepo = require("./gitrepo");

var DIR_NAME = 'repo';
var REPO_URL = 'https://github.com/w3c/web-platform-tests.git'

function fileExists(path) {
    var deferred = q.defer();
    fs.exists(path, function(exists) {
        deferred.resolve(exists);
    });
    return deferred.promise;
}

function update() {
    return q.nfcall(fs.readdir, DIR_NAME).then(function(dirs) {
        return specref.get(dirs).then(function(refs) {
            var output = {}
            for (var k in refs) {
                (refs[k].deliveredBy || []).forEach(function(i) {
                    output[i] = true
                });
            }
            console.log(output)
            var deferred = q.defer();
            var batch = new Batch;
            batch.concurrency(8);
            refs.forEach(function(ref) {
                batch.push(function(done) {
                    var p = path.join(DIR_NAME, ref.shortname, 'manifest.json');
                    fileExists(p).then(function(exists) {
                        if (exists) {
                            fs.readFile(p, 'utf8', function(err, json) {
                                if (err) {
                                    done(err);
                                } else {
                                    try {
                                        json = JSON.parse(json);
                                        merge(ref, json, "test");
                                        done(null, ref);
                                    } catch (err) {
                                        done(err, ref);
                                    }
                                }
                            });
                        } else {
                            // TODO report specs missing manifest file.
                            done(null, ref);
                        }
                    });
                });
            });

            batch.on('progress', function(e){
               console.log(e.start.getTime())
            });

            batch.end(function(err) {
                err ? deferred.reject(err) : deferred.resolve(refs);
            });
            
            return deferred.promise;
        });
    });
}

function merge(dest, src, prefix) {
    Object.keys(src).forEach(function(k) {
        var destK = k
        if (prefix) {
            destK = prefix + k[0].toUpperCase() + k.slice(1);
        }
        dest[destK] = src[k];
    });
    return dest;
}

var repo = gitrepo({ dirname: DIR_NAME, cloneUrl: REPO_URL });

gitrepo.isRepo(DIR_NAME).then(function(exists) {
    if (exists) {
        repo.pull().then(update).then(console.log).catch(console.log).done();
    } else {
        repo.clone().then(update).then(console.log).catch(console.log).done();
    }
})
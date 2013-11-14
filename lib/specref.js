var q = require('q');
var request = require("request");

var API_URL = 'http://specref.jit.su/bibrefs?refs=';

exports.get = get;
function get(dirs) {
    var deferred = q.defer();
    request.get(API_URL + dirs.join(","), function(err, resp, json) {
        if (err) {
            deferred.reject(err);
        } else {
            try {
                json = JSON.parse(json);
            } catch (err) {
                deferred.reject(err);
            }
            json = prepareResults(dirs, json).filter(function(x) { return x; });
            deferred.resolve(json);
        }
    });
    return deferred.promise;
}

function prepareResults(dirs, refs) {
    return dirs.map(function(dir) {
        var ref = refs[dir];
        if (!ref) { return null; }
        while (ref.aliasOf) {
            ref = refs[ref.aliasOf];
        }
        ref.shortname = dir;
        return ref;
    });
}
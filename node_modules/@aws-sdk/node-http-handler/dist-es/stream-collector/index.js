import { Collector } from "./collector";
export var streamCollector = function (stream) {
    return new Promise(function (resolve, reject) {
        var collector = new Collector();
        stream.pipe(collector);
        stream.on("error", function (err) {
            collector.end();
            reject(err);
        });
        collector.on("error", reject);
        collector.on("finish", function () {
            var bytes = new Uint8Array(Buffer.concat(this.bufferedBytes));
            resolve(bytes);
        });
    });
};

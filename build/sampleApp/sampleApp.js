var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
const fs = require('fs');
const path = require('path');
const url = require('url');
const { promisify } = require('util');
const { DashieServer, ContextProvider, mw } = require("../main");
const configs = {
    dbhost: process.env.DB_HOST,
    dbuser: process.env.DB_USER,
    dbpass: process.env.DB_PASS,
    redishost: process.env.REDIS_HOST
};
let server = new DashieServer(); //instantiate server
let dbHandler = new ContextProvider("db"); //instantiate db connector
let redisHandler = new ContextProvider("redis"); //instantiate redis connector
class sampleApp {
    constructor() { }
    static async getStatic(env, req, res) {
        const fileName = req["urlParams"]["filename"];
        try {
            fs.createReadStream(path.join(__dirname, "static", "js", fileName)).pipe(res);
        }
        catch (err) {
            res.statusCode = 404;
            res.write("File not found");
            res.end();
        }
    }
    static async getTimeSeries(env, req, res) {
        const parsedQuery = url.parse(req.url, true).query;
        const count = parsedQuery["count"];
        let toSend = [];
        for (let i = 0; i < count; i++) {
            toSend.push({
                id: i,
                timestamp: new Date(Date.now() + (i * 5 * 60 * 1000)).toISOString(),
                x: i * i / Math.PI
            });
        }
        res.write(JSON.stringify(toSend));
        res.end();
    }
    static async getTimeSeries3(env, req, res) {
        const parsedQuery = url.parse(req.url, true).query;
        const count = parsedQuery["count"];
        let toSend = [];
        for (let i = 0; i < count; i++) {
            toSend.push({
                id: i,
                timestamp: new Date(Date.now() + (i * 5 * 60 * 1000)).toISOString(),
                x: i * i / Math.PI
            });
        }
        res.write(JSON.stringify(toSend));
        res.end();
    }
    static async getTimeSeries2(env, req, res) {
        const parsedQuery = url.parse(req.url, true).query;
        const count = parsedQuery["count"];
        const immediatePromise = promisify(setImmediate);
        //This is a CPU intensive process. Write in batches of 50000 to prevent blocking the main thread.
        const writeBatch = function (current, target) {
            const limit = Math.min(target - current, 50000);
            if (current !== 0) {
                res.write(',');
            }
            let toWrite = [];
            for (let i = 0; i < limit; i++) {
                let curr = i + current;
                toWrite.push(JSON.stringify({
                    id: curr,
                    timestamp: new Date(Date.now() + (curr * 5 * 60 * 1000)).toISOString(),
                    x: curr * curr / Math.PI
                }));
            }
            res.write(toWrite.join(','));
            return immediatePromise(current + limit);
        };
        let written = 0;
        res.write('[');
        while (written < count) {
            written = await writeBatch(written, count);
        }
        res.write(']');
        res.end();
    }
}
__decorate([
    server.addRoute("GET", "/js/:filename")
], sampleApp, "getStatic", null);
__decorate([
    server.addRoute("GET", "/time_series")
], sampleApp, "getTimeSeries", null);
__decorate([
    server.addRoute("GET", "/middleware_test1"),
    mw((req, res) => { res.write("hello"); res.end(); })
], sampleApp, "getTimeSeries3", null);
__decorate([
    server.addRoute("GET", "/time_series2")
], sampleApp, "getTimeSeries2", null);
new sampleApp();
let port = 9001;
server.listen(port);
console.log("Now listening on port " + port);

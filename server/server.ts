const http        = require('http');
const querystring = require('querystring');

class DashieServer{
    private httpServer = null;
    public myRoutes = {};

    constructor(){
        this.httpServer = http.createServer(async (req, res)=>{
            const matchedHandler = this.findHandler(req.method, req.url);
            if(matchedHandler!= null) {
                const matchedFunction = matchedHandler.func;
                if(matchedHandler.regexes.indices.length){
                    //try to unpack the indices
                    let urlMatches = req.url.match(matchedHandler.regexes.regex).slice(1);
                    req["urlParams"] = {};
                    urlMatches.forEach((el, i)=>{
                        req["urlParams"][matchedHandler.regexes.indices[i]] = urlMatches[i];
                    })
                }
                if(req.method==="POST"){
                    try{
                        req.body = await this.getPostBody(req);
                    }catch(e){
                        if(e.type === "post_too_long"){
                            res.writeHead(413, {'Content-Type': 'text/plain'});
                            res.end();
                            req.connection.destroy();
                            return;
                        }
                        throw e;
                    }
                }
                try {
                    return matchedFunction({}, req, res);
                }catch(e){
                    console.log("An unhandled error occurred. ");
                    console.log(e);
                    res.statusCode = 500;
                    res.write("Internal Server Error");
                    res.end();
                }
            }else{
                console.log(req.url);
                res.statusCode = 404;
                res.write("Not Found");
                res.end();
            }
        });
    }

    public registerRoute(verb: string, route: string, func: Function): void{
        const matchRegex:RegExp  = new RegExp("^"+route.replace(/:[a-zA-Z][a-zA-Z0-9\.]*/g, "[a-zA-Z][a-zA-Z0-9\\.]*")+"(?:[?].*)?$");
        const replaceRegex:RegExp = new RegExp("^"+route.replace(/:[a-zA-Z][a-zA-Z0-9\.]*/g, "([a-zA-Z][a-zA-Z0-9\\.]*)")+"(?:[?].*)?$");
        const matchIndices:string[] = (route.match(/:[a-zA-Z][a-zA-Z0-9\.]*/g)||[]).map((el)=>el.slice(1));
        const entry = {verb, route, matchRegex, regexes:{regex: replaceRegex, indices: matchIndices}, func};
        console.info("Registed route "+ verb+ " "+route);
        if(!this.myRoutes[verb]){
            this.myRoutes[verb] = {
                re: new RegExp("("+matchRegex.source+")"),
                count: 1,
                entries: [entry]
            }
        }else{
            this.myRoutes[verb].regex = new RegExp(this.myRoutes[verb].regex.source+"|("+matchRegex.source+")");
            this.myRoutes[verb].count++;
            this.myRoutes[verb].entries.push(entry);
        }
    }

    private findHandler(verb: string, route: string){
        if(this.myRoutes[verb]) {
            const res = this.myRoutes[verb].regex.exec(route);
            if (res != null) {
                for (let i = 1; i <= this.myRoutes[verb].count; i++) {
                    if (res[i] !== undefined) {
                        return this.myRoutes[verb].entries[i - 1];
                    }
                }
            }
        }
        return null;
    }

    private getPostBody (request):Promise<any>{
        return new Promise((resolve, reject)=>{
            let queryData = "";
            if(request.method == 'POST') {
                request.on('data', function(data) {
                    queryData += data;
                    if(queryData.length > 1e6) {
                        queryData = "";
                        reject({type: "post_too_long"});
                    }
                });
                request.on('end', function() {
                    switch(request.headers['content-type']){
                        case 'application/json':
                            resolve(JSON.parse(queryData));
                            break;
                        case 'multipart/form-data':
                        default:
                            resolve(querystring.parse(queryData))
                    }
                });
            } else {
                reject({type: "not_a_post_request"});
            }
        })
    };

    public addRoute(verb: string, route: string){
        return (target: any, key: string, descriptor: TypedPropertyDescriptor<any>):void =>{
            this.registerRoute(verb, route, descriptor.value);
        }
    }

    public listen(port: number): void{
        this.httpServer.listen(port);
    }
}
export {DashieServer};

const http        = require('http');
const querystring = require('querystring');

class MyServer{
    private httpServer = null;
    public myRoutes = [];

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
        console.info("Registed route "+ verb+ " "+route);
        const matchRegex:RegExp  = new RegExp("^"+route.replace(/:[a-zA-Z][a-zA-Z0-9\.]*/g, "[a-zA-Z][a-zA-Z0-9\\.]*")+"(?:[?].*)?$");
        const replaceRegex:RegExp = new RegExp("^"+route.replace(/:[a-zA-Z][a-zA-Z0-9\.]*/g, "([a-zA-Z][a-zA-Z0-9\\.]*)")+"(?:[?].*)?$");
        const matchIndices:string[] = (route.match(/:[a-zA-Z][a-zA-Z0-9\.]*/g)||[]).map((el)=>el.slice(1));
        this.myRoutes.push({verb, route, matchRegex, regexes:{regex: replaceRegex, indices: matchIndices}, func});
    }

    private findHandler(verb: string, route: string){
        const matchedHandler = this.myRoutes.find((handler)=>handler.verb === verb && handler.matchRegex.test(route));
        if(!matchedHandler){
            return null;
        }else{
            return matchedHandler;
        }
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
export {MyServer};

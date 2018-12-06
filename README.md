# Dashie
A very minimalistic but easy to use web framework for node.js.
 
What do we mean by minimalistic? People do tend to toss around that term lightly.

This web framework breaks with the standard fare of node.js packages that have node_modules directories so deep that they bend the fabric of spacetime itself.

Simply put, this framework aims to have as few dependencies on external modules as possible, keeping you, the developer, as close as possible to the action, but still staying easy enough to use that you don't need any arcane wizardry to get your app going.

After all, the more time your framework spends working on its own stuff, the less time it spends working on yours.

Dashie features decorators to create a Flask-like interface for your application. Decorators are used to routes on the server as well as to attach middleware routines only to the endpoints that require them such as loading database connections, gzipping, or pre-preparing your response headers.

After all, being minimalistic is no excuse for being difficult to use.


## Installation

Dashie requires node v7.0.0 or higher and async function support.

Dashie currently only functions through the use of TypeScript compilation steps, but we plan to remove that dependency the second decorators are officially added to the ECMA spec.

```
npm install dashie --save
```
## Hello World

```js
const {DashieServer} = require("dashie");
let server = new DashieServer();
class HelloWorldApp{
    @server.addRoute("GET", "/hello_world")
    static async helloWorld(env, req, res){
        res.write("Hello World!");
        res.end();
    }
}

new HelloWorldApp();
server.listen(1337);
```

## Features

### Dynamic Routing

Simplify your code with URL pattern matching.

```js
const {DashieServer} = require("dashie");
let server = new DashieServer();

class HelloSomeoneApp{
    @server.addRoute("GET", "/hello_:target")
    static async helloWorld(env, req, res){
        res.write(`Hello ${req.urlParams.target}!`);
        res.end();
    }
}

new HelloSomeoneApp();
server.listen(1337);
```

### Post Body Parsing

Post body sent to you in JSON or a multipart form? We've got the parsing covered.

```js
const {DashieServer} = require("dashie");
let server = new DashieServer();

class LoginApp{
    @server.addRoute("POST", "/login")
    static async helloWorld(env, req, res){
        const {username, password} = req.body;
        if(username === "Kevin" && password === "pizza"){
            res.write("Welcome back Kevin!");
            res.end();
        }else{
            res.write("Do I know you?");
            res.end();
        }
    }
}

new LoginApp();
server.listen(1337);
```

### Database Context Providing

#### Named Contexts

Grab things like database connections explicitly and only when you need them with the ContextProvider object.

```js
const {DashieServer, ContextProvider} = require("dashie");
const knex               = require('knex');
let server = new DashieServer();
let dbProvider = new ContextProvider("db");
dbProvider.registerDB(knex({
    client: 'mysql2',
    connection: {
        host : configs.dbhost,
        user : configs.dbuser,
        password : configs.dbpass,
        database : 'users'
    }
}), "knex_users");

class LoginApp{
    @server.addRoute("POST", "/login")
    @dbProvider.using("knex_users")
    static async helloWorld(env, req, res){
        const {username, password} = req.body;
        const {db} = env;
        const loginSuccessful = (await db("users").where({username, password}).count() > 0);
        if(loginSuccessful){
            res.write(`Welcome back ${username}!`);
            res.end();
        }else{
            res.write("Do I know you?");
            res.end();
        }
    }
}

new LoginApp();
server.listen(1337);
```

#### Default Contexts

Only have 1 connection and just don't feel like coming up with a name? Just leave it blank. We'll take care of it. 

```js
const {DashieServer, ContextProvider} = require("dashie");
const knex              = require('knex');
let server = new DashieServer();
let dbProvider = new ContextProvider("db");
dbProvider.registerDB(knex({
    client: 'mysql2',
    connection: {
        host : configs.dbhost,
        user : configs.dbuser,
        password : configs.dbpass,
        database : 'users'
    }
}));

class LoginApp{
    @server.addRoute("POST", "/login")
    @dbProvider.using()
    static async helloWorld(env, req, res){
        const {username, password} = req.body;
        const {db} = env;
        const loginSuccessful = (await db("users").where({username, password}).count() > 0);
        if(loginSuccessful){
            res.write(`Welcome back ${username}!`);
            res.end();
        }else{
            res.write("Do I know you?");
            res.end();
        }
    }
}

new LoginApp();
server.listen(1337);
```

## Performance

In preliminary performance tests, Dashie clocks in at 86.4% of Vanilla, compared to 81.1% for Koa and 56.1% for Express. Details about how the benchmark was conducted are posted [here](https://github.com/JohnKossa/dashie-bench).

![](https://github.com/JohnKossa/dashie/blob/master/framework%20throughput%20chart.png "Throughput Comparison")

## Roadmap

Dashie is a work in progress with much more to come. Here's a few things to look forward to:

1. ~~Benchmarks~~

~~What's the use of being so fast if nobody knows it? Dashie currently clocks in slower than vanilla node (obviously) but higher than Koa.js in terms of raw throughput. We'll be adding official benchmarks and posting the source for you to inspect for youself.~~

2. Even faster routing

~~Dashie does routing incredibly quickly, keeping up with the best in the business, but we have a few optimization tweaks that could nudge that speed even higher. After all, in web servers, speed is critical.~~

This is now done and in place. The change is a small percentage speed increase over the base, but we've cut the gap with a vanilla server by about 50%, which is significant enough in my book. The benchmarks haven't been updated to reflect this change yet, but that's coming.

3. Pre and Post processing middleware

We'll be adding a decorator method to allow conditional attaching of middleware to only the routes you want. Gzip compression can really boost some endpoints, but it's not really something you want running everywhere.

4. Static file routes

Sadly, serving files isn't just a single line for dashie at the moment. (It's closer to 8 with proper braces and line breaks.) This is definitely something worth doing, given how common a need this is.

5. Non-typescript route and context declarations

I've never been a huge fan of typescript. It's a less and less popular opinion to have nowadays, but I do love me some vanilla javascript. This task would be to add a way to add routes for those of us who would rather not add typescript into our projects. If the ECMA standards committee decides to add decorators to the ECMA standard, this will likely become a moot point. This would likely either take a form similar to Koa or Express's wrapper functions, or it could be implemented as a config-driven JSON object that is parsed on server start. We haven't decided yet, but it's not a decision that needs to be made now.

We're currently leaning towards authoring a swagger plugin library to leverage swagger's already potent config system with Dashie's speed.

~~6. Go reeeealy fast~~

~~The micro web sockets library (uws) appears to afford a significant performance increase over HTTP 1.1 and with pipelineing. The node networking community has discussed it at some length and decided that keep-alives with connection pooling should be just as good, but the numbers seem to point in uws's favor. This could push dashie's throughput to above that of vanilla node, but it would complicate the deployment quite a bit and seriously slow down HTTP 1.0 traffic. Choices, choices, choices.~~

Well, it was a nice thought, but it looks like uws's primary author has yanked the project from npm. Looks like he made the decision for me. The option does still exist to author a new base server using come C or Rust, but it's looking like this is off the table for the forseeable future.


# bottlebox
A very minimalistic but easy to use web framework for node.js.
 
What do we mean by minimalistic? People do tend to toss around that term lightly.

This web framework breaks with the standard fare of node.js packages that have node_modules directories so deep that they bend the fabric of spacetime itself.

Simply put, this framework aims to have as few dependencies on external modules as possible, keeping you, the developer, as close as possible to the action, but still staying easy enough to use that you don't need any arcane wizardry to get your app going.

After all, the more time your framework spends working on its own stuff, the less time it spends working on yours.

Bottlebox features decorators to create a Flask-like interface for your application. Decorators are used to routes on the server as well as to attach middleware routines only to the endpoints that require them such as loading database connections, gzipping, or pre-preparing your response headers.

After all, being minimalistic is no excuse for being difficult to use.


## Installation

Bottlebox requires node v7.0.0 or higher and async function support.

Bottlebox currently only functions through the use of TypeScript compilation steps, but we plan to remove that dependency the second decorators are officially added to the ECMA spec.

```
No installation available yet. Stay tuned for details!
```
## Hello World

```js
const {MyServer} = require("../server/server");
let server = new MyServer();
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

```js
const {MyServer} = require("../server/server");
let server = new MyServer();

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

```js
const {MyServer} = require("../server/server");
let server = new MyServer();

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

```js
const {MyServer}  = require("../server/server");
const {DBHandler} = require("./server/dbHandler");
const knex        = require('knex');
let server = new MyServer();
let dbProvider = new DBHandler();
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
    @dbProvider.withDb("knex_users")
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

```js
const {MyServer}  = require("../server/server");
const {DBHandler} = require("./server/dbHandler");
const knex        = require('knex');
let server = new MyServer();
let dbProvider = new DBHandler();
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
    @dbProvider.withDb()
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
# express-dynacl
express-dynacl is a simple ExpressJS dynamic access control list middleware, that allows to grant access to queries based on request details.

## Using express-dynacl

roles.js:
```js
module.exports = {
  "guest": {
    can: {
      "posts:list": true,
      "posts:edit": false
    }
  },

  "user": {
    can: {
      "posts:create": true,
      "posts:edit": (req,params) => Post.findOne({_id:params.post.id}).then(post => post.owner === req.user.id)
    },
    inherits: ["guest"]
  },

  "moderator":{
    can: {
      "posts:edit": true
    },
    inherits: ["user"]
  },

  "admin": {
    admin: true
  }
}
```

config.js:
```js

var acl = require("express-dynacl");

var Post = require("./models/post");

var roles = require("./roles.js");

var options = {

  roles: roles,
  
  userRoles: req => req.user ? req.user.roles : [], // get user roles
  
  // set some of the roles as default - each request will expect that user has these roles (default is none)
  defaultRole: "guest",
  
  logString: (event) => `DynACL ${event.permission ? "OK" : "XX"} (action: ${event.action}${event.role ? ", role: " + event.role : ""}${Object.keys(event.params) > 0 ? ", params: " + JSON.stringify(event.params) : ""})`,
  logConsole: true, // enable logging to console (default is false)
  
  authorized: (req,res,next) => next(), // middleware to use when authorized (default is send to next middleware)
  unauthorized: (req,res,next) => res.sendStatus(401) // middleware to use when unauthorized (default is to respond with 401
}


```

Use as middleware:

```js
var express = require('express');
var app = express();

var acl = require("express-dynacl");
var aclConfig = require("./config.js");

acl.config(aclConfig);

app.get("/posts", acl("posts:list"), (req,res) => {
	// list posts
});

app.post("/posts", acl("posts:create"), (req,res) => {
	// create post
});

app.put("/posts/1", acl("posts:edit"), (req,res) => {
	// edit post
});
```

Use inside request:
```js
var express = require('express');
var app = express();

var acl = require("express-dynacl");

app.put("/posts/:id", (req,res) => {
	if(acl.can("posts:edit", req, {post: {id: req.params.id}})) {
   // edit post
  }

});
```

## Inspect function

```node node_modules/express-dynacl inspect roles.js```

Running this will show a tree of actions split by colon with colored names of roles

## TODO
- logging to file

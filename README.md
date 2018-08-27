# express-dynacl
express-dynacl is a simple ExpressJS dynamic access control list middleware, that allows to grant access to queries based on request details.

## Using express-dynacl

```js

var acl = require("express-dynacl");

var Post = require("./models/post");

var options = {

  roles: {
  
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
  },
  
  userRoles: req => req.user ? req.user.roles : [], // get user roles
  
  // set some of the roles as default - each request will expect that user has these roles (default is none)
  defaultRole: "guest",
  
  logString: (event) => `DynACL ${event.permission ? "OK" : "XX"} (action: ${event.action}${event.role ? ", role: " + event.role : ""}${Object.keys(event.params) > 0 ? ", params: " + JSON.stringify(event.params) : ""})`,
  logConsole: true, // enable logging to console (default is false)
  
  authorized: (req,res,next) => next(), // middleware to use when authorized (default is send to next middleware)
  unauthorized: (req,res,next) => res.sendStatus(401) // middleware to use when unauthorized (default is to respond with 401
}

acl.config(options);
```

Use as middleware:

```js
var express = require('express');
var app = express();

var acl = require("express-dynacl");

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

## TODO
- logging to file

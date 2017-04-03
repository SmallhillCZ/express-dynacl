# express-dynacl
express-dynacl is a simple ExpressJS dynamic access control list middleware, that allows to grant access to queries based on request details.

## Using express-dynacl

Set up roles:

```js

var guest = {
  "nonalcoholic": {
    // you can use a boolean as in standard ACL roles, default is false
    "watch": true, 
    "drink": true
  },
  "beer": {
    "watch": true
  }
};

var guestWithId = {
  "beer": {
    // or you can use a function of request
    "drink": function(req){
      return isEligibleToDrink(req) // check if over 18/21/...
    }
  }
};

var barowner = {
  "*": true // give admin role
};

module.exports = {
  "guest": guest,
  "guestWithId": guestWithId,
  "barowner": barowner
}
```

Import and configure the middleware:

```js
var acl = require("express-dynacl");

// configure DynACL
var aclOptions = {

  // load roles (default is no roles)
	roles: {
		"guest": require("./roles").guest,
		"guestWithId": require(".roles").guestWithId,
		"barowner": require(".roles").barowner
	},
  
  // set some of the roles as default - each request will expect that user has these roles (default is none)
	defaultRoles: ["guest"],
  
  // enable logging to console (default is false)
	logConsole: true,
  
  // set the req.user property where roles are stored (default is req.user.roles)
  rolesProperty: "roles"
}

acl.config(aclOptions);
```

Use as middleware:

```js
var express = require('express');
var app = express();

var router = express.Router();
module.exports = router;

var acl = require("express-dynacl");

router.get("/pub/coke", acl("nonalcoholic","drink"), (req,res) => {
	// drink coke
});

router.get("/pub/beermenu", acl("alcoholic","watch"), (req,res) => {
	// watch beer menu
});

router.get("/pub/beer", acl("alcoholic","drink"), (req,res) => {
	// drink beer
});
```

## Setting user roles

User roles are assigned by a string array of role names located at ```req.user.roles``` or in other ```req.user``` property set in configuration.

## TODO
- logging to file

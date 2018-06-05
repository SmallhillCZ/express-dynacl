var dynacl = (function(){

  // initiate variable to store options
  var options = {};

  // default options to be overriden by dynacl.config
  const defaultOptions = {

    roles: {},

    userRoles: req => req.user ? req.user.roles : [],

    defaultRole: "guest",

    logString: (action,result,req) => "DynACL " + (result ? "OK" : "XX") + ": " + action + (req.user ? " (user: " + req.user._id + "; roles: " + (req.user.roles ? req.user.roles.join(",") : "") + ")" : " (" + options.defaultRole + ")"),
    logConsole: false,

    authorized: (req,res,next) => next(),
    unauthorized: (req,res,next) => res.status(401).send("Unauthorized (" + (req.user ? "logged, no authorization" : "not logged") + ")")

  }




  // function to get user roles and evaluate permissions
  async function checkCan(action,req,params){

    // get simple reference to acl roles
    var aclRoles = options.roles || {};

    // clear the user roles array
    var currentRoles = [];

    // throw an error on invalid user roles
    var userRoles = options.userRoles(req)

    // add default roles
    if(options.defaultRole) userRoles.push(options.defaultRole);

    // if strict roles property is set to true, then nonexistent roles will throw error
    if(options.strictRoles){
      if(userRoles.some(role => !aclRoles[role])) throw new Error("Invalid role: " + role);
    }

    // set user roles
    userRoles
      .filter(role => aclRoles[role]) // filter out invalid roles
      .forEach(role => currentRoles.push(aclRoles[role])); // assign roles to currentRoles array

    // go through all roles and check if some has permission, otherwise return false
    var role;
    while(!!(role = currentRoles.shift())){

      let result = await checkRoleCan(role,action,req,params);

      if(result) return true;

    }

    return false;
  }

  async function checkRoleCan(role,action,req,params){

    // in case we have admin role, we dont have to check anything
    if(role.admin) return true;

    // in case we have set permission for resource and action
    if(role.can[action]){
      let permission = role.can[action];
      // if permission is a function, then evaluate its return value, otherwise evaluate the permission,
      // both Promise and static value will be resolved
      let result = await Promise.resolve(typeof permission === 'function' ? permission(req,params) : permission);

      if(result) return true;
    }

    // in case the role inherits, we check the parent role
    if(role.inherits){

      let result = await checkRoleCan(options.roles[role.inherits],action,req,params);

      if(result) return true;
    }

    return false;
  }


  // middleware factory
  function dynacl(action){

    // return middleware function for ExpressJS
    return async function(req,res,next){

      // evaluate permission
      var result = await checkCan(action,req,{});

      // log access
      if(options.logConsole){
        let logString = options.logString(action,result,req);
        if(result) console.log(logString);
        else console.error(logString);
      }


      // if permission granted, send execution to the next middleware/route
      if(result) options.authorized(req,res,next);

      // if permission not granted, then end request with 401 Unauthorized
      else options.unauthorized(req,res,next)

    }
  }

  // function to configure DynACL
  dynacl.config = function(userOptions){

    // assign configurations
    options = Object.assign({},defaultOptions,userOptions);

  }

  // just check the permission without using as middleware
  dynacl.can = (action,req,params) => checkCan(action,req,params || {});

  return dynacl;
  
})();

module.exports = dynacl;
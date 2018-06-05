var dynacl = (function(){

  // initiate variable to store options
  var options = {};

  // default options to be overriden by dynacl.config
  const defaultOptions = {

    roles: {},

    userRoles: req => req.user ? req.user.roles || [] : [],

    defaultRole: "guest",

    logString: (action,permission,role,req) => "DynACL " + (permission ? "OK" : "XX") + " ( action: " + action + (role ? ", role: " + role : "") + " )",
    logConsole: false,

    authorized: (req,res,next) => next(),
    unauthorized: (req,res,next) => res.sendStatus(401)

  }

  // function to get user roles and evaluate permissions
  async function checkCan(action,req,params){

    // get user roles
    var userRoles = options.userRoles(req)

    // add default role
    if(options.defaultRole) userRoles.push(options.defaultRole);

    // default is no permission
    var permission = false;
    
    // go through all roles and check if some has permission
    var roleName;
    while(!!(roleName = userRoles.shift())){

      // wait for the result
      let result = await checkRoleCan(roleName,action,req,params);
      
      // if permitted, save and stop going through the roles
      if(result === true) {
        permission = true;
        break;
      }

    }

    // log permission check
    if(options.logConsole){
      let logString = options.logString(action,permission,roleName,req);
      if(permission) console.log(logString);
      else console.error(logString);
    }

    // return the permission
    return permission;
  }

  async function checkRoleCan(roleName,action,req,params){

    // get the role details
    let role = options.roles[roleName];
    
    // if role does not exists user can't
    if(!role) return false;
    
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
           
      for ( var i =0;i < role.inherits.length; i++){
        
        //check the inherited role
        let result = await checkRoleCan(options.roles[role.inherits[i]],action,req,params);
        
        // terminate and return true if approved
        if(result) return true;
      }

    }

    return false;
  }


  // middleware factory
  function dynacl(action){

    // return middleware function for ExpressJS
    return async function(req,res,next){

      // evaluate permission
      var result = await checkCan(action,req,{});

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
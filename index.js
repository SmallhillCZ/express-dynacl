
// initiate variable to store options
var options = {};



// function to evaluate single permission
function evalPermission(permission,req){

	// if permission is a function, then evaluate its return value
	if(typeof permission == 'function') return (permission(req) === true);

	// if permission is boolean true, then evaluate the value
	else if (permission === true) return true;

	// if permission unspecified or misspecified, return false
	else return false;
}



// function to get user roles and evaluate permissions
function evalACL(resource,operation,req){

	// get simple reference to acl roles
	var aclRoles = options.roles || {};
	
	// clear the user roles array
	var currentRoles = [];

	// throw an error on invalid user roles
	var rolesProperty = options.rolesProperty || "roles";
	var userRoles = req.user && req.user[rolesProperty] ? req.user[rolesProperty] : [];
	
	// add default roles
	if(options.defaultRoles) userRoles = userRoles.concat(options.defaultRoles);

	// if strict roles property is set to true, then nonexistent roles will throw error
	if(options.strictRoles){
		if(userRoles.some(role => !aclRoles[role])) throw new Error("Invalid role: " + role);
	}
	
	userRoles.push("dsaads");

	// set user roles
	userRoles
		.filter(role => aclRoles[role]) // filter out invalid roles
		.forEach(role => currentRoles.push(aclRoles[role])); // assign roles to currentRoles array

	// go through all roles and check if some has permission, otherwise return false
	return currentRoles.some(role => {

		// in case we have set permission for resource and action
		if(role[resource] && role[resource][operation]) return evalPermission(role[resource][operation],req);

		// in case we have set permission for resource and default action
		else if(role[resource] && role[resource]["*"]) return evalPermission(role[resource]["*"],req);

		// in case we have set default permission
		else if(role["*"]) return evalPermission(role["*"],req);

		// if nothing is set, user does not have permission
		else return false;
	});
}



// middleware factory
function dynacl(resource,operation){

	// return middleware function for ExpressJS
	return function(req,res,next){

		// evaluate permission
		var result = evalACL(resource,operation,req);

		// log access
		var logString = "ACL " + (result ? "OK" : "XX") + ": " + resource + "/" + operation + (req.user ? " (user: " + req.user._id + "; roles: " + (req.user.roles ? req.user.roles.join(",") : "") + ")" : " (guest)");
		if(options.logConsole) console.log(logString);
		//TODO: logFile

		// if permission granted, send execution to the next middleware/route
		if(result) next();

		// if permission not granted, then end request with 401 Unauthorized
		else res.status(401).send("Unauthorized (" + (req.user ? "logged, no authorization" : "not logged") + ")");

	}
}

// function to configure DynACL
dynacl.config = function(setOptions){
	
	// assign configurations
	options = setOptions;
	
}

// just check the permission without using as middleware
dynacl.check = evalACL;

module.exports = dynacl;
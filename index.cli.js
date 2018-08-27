var chalk = require("chalk");

var args = process.argv.slice(2);

switch(args[0]){

  case "inspect":
    return doInspect(args[1],args[2]);

  case "help":
    return showHelp();
    
  default:
    console.log("Unknown command: " + args[0]);
    return showHelp();
    
}

function showHelp(){
  console.log("Heeelp");
}

function doInspect(rolesFile,srcDir){
  
  var treeSeparator = ":";
  
  var roles = require(process.cwd() + "/" + rolesFile);
  
  var actions = {};
  
  
  function saveRole(roleName,role,inherited){
    
    if(role.can) Object.entries(role.can).forEach(action => saveAction(actions,action,roleName,inherited));
    
    if(role.inherits) Object.entries(role.inherits).forEach(inheritedRole => saveRole(roleName + "(" + inheritedRole[1] + ")",roles[inheritedRole[1]],true));
  }
  
  function saveAction(parent,action,roleName,inherited){
    var parts = action[0].split(treeSeparator);
    
    if(!parent[parts[0]]) parent[parts[0]] = {roles:{},children:{}};
              
    if(parts[1]){
      saveAction(parent[parts[0]].children,[parts.slice(1).join(treeSeparator),action[1]],roleName,inherited);
    }
    else{
      let actionValue = {can:action[1],inherited:inherited};
      
      if(parent[parts[0]].roles[roleName] && parent[parts[0]].roles[roleName].can === true) return;
      if(actionValue.can === true || parent[parts[0]].roles[roleName] === undefined) parent[parts[0]].roles[roleName] = actionValue;
    }
      
  }
  
  Object.entries(roles).forEach(role => saveRole(role[0],role[1],false))
  
  function writeAction(action,prepend){
    if(Object.keys(action[1].roles).length !== 0){
      console.log(prepend + action[0] + ": " + Object.entries(action[1].roles).map(role => {
        
        var roleName = role[1].inherited ? role[0] : chalk.bold(role[0]);
        
        if(role[1].can === true) return chalk.green(roleName)
        if(role[1].can === false) return chalk.red(roleName)
        return chalk.yellow(roleName);
      }).join(", "));
    }
    if(Object.keys(action[1].children).length !== 0){
      console.log(prepend + action[0]);
      Object.entries(action[1].children).forEach(action => {
        writeAction(action,prepend + "  ");
      });
    }
  }
  
  Object.entries(actions).forEach(action => {
    writeAction(action,"");
  });
}
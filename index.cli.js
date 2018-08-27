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
  
  function saveRole(parent,action,role){
    var parts = action[0].split(treeSeparator,2);
    
    if(!parent[parts[0]]) parent[parts[0]] = {roles:{},children:{}};
              
    if(parts[1]){
      saveRole(parent[parts[0]].children,[parts[1],action[1]],role);
    }
    else{
      parent[parts[0]].roles[role[0]] = action[1];
    }
      
  }
  
  Object.entries(roles).forEach(role => {
    if(role[1].can) Object.entries(role[1].can).forEach(action => {
      saveRole(actions,action,role);
    });
  });
  
  function writeAction(action,prepend){
    if(Object.keys(action[1].roles).length !== 0){
      console.log(prepend + action[0] + ": " + Object.entries(action[1].roles).map(role => {
        if(role[1] === true) return chalk.green(role[0])
        if(role[1] === false) return chalk.red(role[0])
        return chalk.yellow(role[0]);
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
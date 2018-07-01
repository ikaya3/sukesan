const fs = require('fs');

var env = {};
try{
  env = JSON.parse(fs.readFileSync('./env.json', "utf-8"));
}catch(e){
  console.log("fail to read \'env.json\', then use default file \'env.json.sample\'.");
  env = JSON.parse(fs.readFileSync('./env.json.sample', "utf-8"));
}

console.log("the environment is below:");
console.log(env);

module.exports = env;

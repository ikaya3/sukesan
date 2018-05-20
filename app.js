var express = require('express');
var app = express();
var mongodb = require('mongodb');

var fs = require('fs');
var urljoin = require('url-join');

const MongoClient = mongodb.MongoClient;

var pj = {};

var env = {};
try{
  env = JSON.parse(fs.readFileSync('./env.json', "utf-8"));
}catch(e){
  console.log("fail to read \'env.json\', then use default file \'env.json.sample\'.");
  env = JSON.parse(fs.readFileSync('./env.json.sample', "utf-8"));
}

console.log("the environment is below:");
console.log(env);

var db;

app.use('/', express.static('public'));

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.get('/api/get_pj', function(req, res, next){
  var records = [
    {
      id: 1,
      name: "Product1",
      price: 120
    },
    {
      id: 2,
      name: "Product2",
      price: 80
    },
    {
      id: 3,
      name: "Product3",
      price: 800
    }
  ];
  res.json(records);
});

var get_date_index = function(target, borders_of_date){
  for(var i=0; i<borders_of_date.length; i++) {
    if(target < borders_of_date[i]) {
      return i-1;
    }
  }

  return -1;
};

app.get('/api/mongo_test2', function(req, res, next){
  var borders_of_date = req.query.borders_of_date || [(new Date()).toJSON()];
  borders_of_date = borders_of_date.map((v) => new Date(v));

  var size = borders_of_date.length - 1;

  db.collection('detail', function(err, collection){
    collection.aggregate(
      [
        { "$match": { "$and": [ { date: { "$gte": borders_of_date[0] } }, { date: { "$lt": borders_of_date[borders_of_date.length-1] } } ] } },
        { "$group": { _id: "$pj_id"  } },
      ],
    ).toArray(function(err, active_pjs){

      active_pjs = active_pjs.map(function(pj){ return pj._id; });
      collection.mapReduce(
        function() { emit( { pj_id: this.pj_id, date_index: get_date_index(this.date, borders_of_date) }, { hour: this.hour } ); },
        function(key, values){
          var result = { hour: 0 };
          values.forEach(function(value){ result.hour += value.hour; });
          return result;
        },
        {
          scope: { get_date_index: get_date_index,
                   borders_of_date: borders_of_date },
          query: { pj_id: { "$in": active_pjs } },
          out  : { inline: 1 },
        },
        function(err, results){
          var reduced_results = results.reduce(function (reduced_results, result) {
            var element = reduced_results.find(function (p) {
              return p._id === result._id.pj_id;
            });
            if(!element){
              reduced_results.push({
                _id: result._id.pj_id,
                pj_name: pj[result._id.pj_id] || "NO NAME",
                out_of_range: 0,
                total: 0,
              });
              element = reduced_results[reduced_results.length-1];
	      for(var i=0; i<size; i++)
	      {
		element["range" + i] = 0;
	      }
            }
            if(result._id.date_index >= 0){
              element["range" + result._id.date_index] += result.value.hour;
            }else{
              element.out_of_range += result.value.hour;
            }
            element.total += result.value.hour;

            return reduced_results;
          }, []);

//          console.log(results);
//          console.log(reduced_results);

          res.json(reduced_results);
        }
      );
    });
  });
});

app.get('/api/mongo_test', function(req, res, next){
  db.collection('detail', function(err, collection){
    collection.aggregate(
      [
        { "$group": { _id: "$pj_id", price: { "$sum": "$hour" } } },
        { "$sort": { _id: 1 } },
      ],
    ).toArray(function(err, results){
      res.json(results);
    });
  });
});

MongoClient.connect(urljoin(env.mongodb_uri, env.db_name), function(err,client){
  db = client.db(env.db_name);

  // TODO : pj の管理はもう少し何とかしたい。
  db.collection('pj', function(err, collection){
    collection.find().forEach((document)=>{
      pj[document._id] = document.pj_name;
    });
  });
  var server = app.listen(env.webserver_port, function(){
    console.log(new Date());
  });
});

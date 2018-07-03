var express = require('express');
var app = express();
var mongodb = require('mongodb');

var urljoin = require('url-join');

const MongoClient = mongodb.MongoClient;

const env = require('./lib/env');

var pj = {};
var db;

app.use('/', express.static('public'));

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

var get_date_index = function(target, borders_of_date){
  for(var i=0; i<borders_of_date.length; i++) {
    if(target < borders_of_date[i]) {
      return i-1;
    }
  }

  return -1;
};

var reduce_hour = function(key, values){
  var result = { hour: 0 };
  values.forEach(function(value){ result.hour += value.hour; });
  return result;
};

var reduce_results = function(key, get_name, results, size_of_range){
  return results.reduce(function (reduced_results, result) {
    var element = reduced_results.find(function (p) {
      return p._id === result._id[key];
    });
    if(!element){
      reduced_results.push({
        _id: result._id[key],
        name: get_name(result),
        out_of_range: 0,
        total: 0,
      });
      element = reduced_results[reduced_results.length-1];
      for(var i=0; i<size_of_range; i++)
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
};


app.get('/api/mongo_test2', function(req, res, next){
  const borders_of_date = (req.query.borders_of_date || [(new Date()).toJSON()]).map((v) => new Date(v));

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
        reduce_hour,
        {
          scope: { get_date_index : get_date_index,
                   borders_of_date: borders_of_date,
                   reduce_hour    : reduce_hour},
          query: { pj_id: { "$in": active_pjs } },
          out  : { inline: 1 },
        },
        function(err, results){
          res.json(reduce_results(
            "pj_id",
            (result) => { return pj[result._id["pj_id"]] || "NO NAME"; },
            results,
            borders_of_date.length - 1));
        }
      );
    });
  });
});

app.get('/api/mongo_test3', function(req, res, next){
  const target_pj_id = req.query.pj_id;
  const borders_of_date = (req.query.borders_of_date || [(new Date()).toJSON()]).map((v) => new Date(v));

  db.collection('detail', function(err, collection){
    collection.mapReduce(
      function() { emit( { person_id: this.person_id, person_name: this.person_name, date_index: get_date_index(this.date, borders_of_date) }, { hour: this.hour } ); },
      reduce_hour,
      {
        scope: { get_date_index : get_date_index,
                 borders_of_date: borders_of_date,
                 reduce_hour    : reduce_hour},
        query: { pj_id: target_pj_id },
        out  : { inline: 1 },
      },
      function(err, results){
        res.json(reduce_results(
          "person_id",
          (result) => { return result._id["person_name"]; },
          results,
          borders_of_date.length - 1));
      }
    );
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

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

var get_condition = function(pjs, persons, field, borders_of_date, collection_detail){
  return new Promise(function(resolve, reject){
    const condtion_date = { "$and": [ { date: { "$gte": borders_of_date[0] } }, { date: { "$lt": borders_of_date[borders_of_date.length-1] } } ] };

    if(pjs){
      resolve({ pj_id: { "$in": pjs } });
    }

    if(persons){
      resolve({ "$and": [ { person_id: { "$in": persons } }, condtion_date ] });
    }

    collection_detail.aggregate(
      [
        { "$match": condtion_date },
        { "$group": { _id: "$" + field  } },
      ],
    ).toArray(function(err, active_records){
      if(err){
        reject(err);
      }
      resolve({
        [field]:{
          "$in": active_records.map(function(record){ return record._id; })}});
    });
  });
};

app.get('/api/mongo_test2', function(req, res, next){
  const key = req.query.key;
  const pjs     = (typeof(req.query.pjs    ) === 'string') ? [ req.query.pjs     ] : req.query.pjs;
  const persons = (typeof(req.query.persons) === 'string') ? [ req.query.persons ] : req.query.persons;
  const borders_of_date = (req.query.borders_of_date || [(new Date()).toJSON()]).map((v) => new Date(v));
  console.log("filter: pjs: " + pjs + ", persons: " + persons);

  const map_key = (key == "pj")
    ? function() { emit( { pj_id: this.pj_id, date_index: get_date_index(this.date, borders_of_date) }, { hour: this.hour } ); }
    : function() { emit( { person_id: this.person_id, person_name: this.person_name, date_index: get_date_index(this.date, borders_of_date) }, { hour: this.hour } ); }
  ;

  const field_name = {
   id  : (key == "pj") ? "pj_id" : "person_id",
   name: (key == "pj")
      ? (result) => { return pj[result._id["pj_id"]] || "NO NAME"; }
      : (result) => { return result._id["person_name"]; },
  };

  db.collection('detail', function(err, collection){
    get_condition(pjs, persons, field_name.id, borders_of_date, collection).then(function(condition){
      collection.mapReduce(
        map_key, reduce_hour,
        {
          scope: { get_date_index : get_date_index,
                   borders_of_date: borders_of_date,
                   map_key        : map_key,
                   reduce_hour    : reduce_hour},
          query: condition,
          out  : { inline: 1 },
        },
        function(err, results){
          res.json(reduce_results(
            field_name.id,
            field_name.name,
            results,
            borders_of_date.length - 1));
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

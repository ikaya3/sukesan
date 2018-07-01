const MongoClient = require('mongodb').MongoClient;
const urljoin = require('url-join');

const env = require('../lib/env');

const documents = [
  { "pj_id": "P20180101", "pj_name": "ぷろじぇテスト１", "person_id": "01234", "person_name": "some boy", "hour":  4, "date": new Date("2018-03-15") },
  { "pj_id": "P20180101", "pj_name": "ぷろじぇテスト１", "person_id": "01234", "person_name": "some boy", "hour": 15, "date": new Date("2018-04-29") },
  { "pj_id": "P20180101", "pj_name": "PJテスト１"      , "person_id": "01234", "person_name": "some boy", "hour":  4, "date": new Date("2018-04-14") },
  { "pj_id": "P20180101", "pj_name": "ぷろじぇテスト１", "person_id": "01234", "person_name": "some boy", "hour":  3, "date": new Date("2018-04-29") },
  { "pj_id": "P20180101", "pj_name": "ぷろじぇテスト１", "person_id": "Z9999", "person_name": "X-men"   , "hour":  7, "date": new Date("2018-04-29") },
  { "pj_id": "P20180101", "pj_name": "ぷろじぇテスト１", "person_id": "01234", "person_name": "some boy", "hour": 10, "date": new Date("2018-04-28") },
  { "pj_id": "P20180102", "pj_name": "プロプロテスト２", "person_id": "01234", "person_name": "some boy", "hour":  5, "date": new Date("2018-04-29") },
  { "pj_id": "P20170101", "pj_name": "oldテスト１"     , "person_id": "01234", "person_name": "some boy", "hour": 10, "date": new Date("2017-04-28") },
  { "pj_id": "P20180101", "pj_name": "ぷろじぇテスト１", "person_id": "01234", "person_name": "some boy", "hour":  6, "date": new Date("2018-02-20") },
  { "pj_id": "P20180101", "pj_name": "ぷろじぇテスト１", "person_id": "01238", "person_name": "jace"    , "hour": 11, "date": new Date("2018-03-01") },
  { "pj_id": "P20180101", "pj_name": "ぷろじぇテスト１", "person_id": "01234", "person_name": "some boy", "hour":  5, "date": new Date("2018-06-20") },
  { "pj_id": "P20180102", "pj_name": "プロプロテスト２", "person_id": "01234", "person_name": "some boy", "hour":  7, "date": new Date("2018-06-27") },
  { "pj_id": "P20180101", "pj_name": "ぷろじぇテスト１", "person_id": "01234", "person_name": "some boy", "hour":  8, "date": new Date("2018-07-01") },
  { "pj_id": "P20180101", "pj_name": "ぷろじぇテスト１", "person_id": "Z9999", "person_name": "X-men"   , "hour":  5, "date": new Date("2018-07-02") },
];

MongoClient.connect(urljoin(env.mongodb_uri, env.db_name), (err,client) => {
  db = client.db(env.db_name);

  db.collection('detail', (err, collection) => {
    collection.remove({},  (err, result) => {
      collection.insertMany(documents, (err, result) => {
        client.close();
      });
    });
  });
});

require('dotenv').config();

var mysql = require('mysql');


// Set DB connection options and connect to db
var db_connect_options = {
  host: 'localhost',
  user: 'root',
  password: process.env.DB_PW,
  database: 'kanji_app'
};

var db_connection = mysql.createConnection(db_connect_options);

var q = `
SELECT *
FROM kanji
LEFT JOIN reading
  ON reading.kanji_id = kanji.id
  `;

db_connection.query(q, function(err, results){
  if(err){
    console.log(err);
  } else {
    results.forEach(function(row){
      var literal = row.literal;
      var reading = row.reading;
      var type = row.reading_type;
      console.log (`${literal}: ${reading} (${type}) `);
    })
  }
})

db_connection.end();


// db_connection.query(q, function(err, results){
//   if(err){
//     console.log(err);
//   } else {
//     results.forEach(function(row){
//       q_results = results
//     })
//   }
// })
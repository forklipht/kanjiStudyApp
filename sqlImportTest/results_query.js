require('dotenv').config();

var mysql = require('mysql');


// Set DB connection options and connect to db
var db_connect_options = {
  host: 'localhost',
  user: 'root',
  password: process.env.DB_PW,
  database: 'kanji_app',
  charset: 'utf8mb4'
};

var db_connection = mysql.createConnection(db_connect_options);

var q = `
SELECT *
FROM kanji k
LEFT JOIN reading r
  ON k.id = r.kanji_id
WHERE k.literal = '生'
  `;

db_connection.query(q, function(err, results){
  if(err){
    console.log(err);
  } else {
    //console.log(results);
    results.forEach(function(row){
      console.log(row);
      // var literal = row.literal;
      // var stroke_count = row.stroke_count;
      // var freq = row.frequency;
      // var reading = row.reading;
      // var type = row.reading_type;
      // console.log (`${literal}: ${stroke_count}`);
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
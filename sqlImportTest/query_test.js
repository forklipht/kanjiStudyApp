require('dotenv').config();

var mysql = require('mysql');

var db_connect_options = {
  host: 'localhost',
  user: 'root',
  password: process.env.DB_PW,
  database: 'kanji_app'
}

var db_connection = mysql.createConnection(db_connect_options);

var q = 'select * from kanji';
db_connection.query(q, function(err, thing){
  if(err){
    console.log(err);
  } else {
    console.log('thing \n', thing);
  }
})

db_connection.end();
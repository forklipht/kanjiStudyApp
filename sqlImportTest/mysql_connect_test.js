require('dotenv').config();

var mysql = require('mysql');

var options = {
  host: 'localhost',
  user: 'root',
  password: process.env.DB_PW
}

var connection = mysql.createConnection(options);
var q = 'SHOW DATABASES;'
connection.query(q, function(err, thing){
  if(err){
    console.log(err);
  } else {
    console.log('thing \n', thing);
  }
})

connection.end();

//mysql -u tyler -p -e 'SHOW VARIABLES WHERE Variable_Name LIKE "%dir"'

//mysqld --datadir="C:/ProgramData/MySQL/MySQL Server 8.0/Data/"

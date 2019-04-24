require('dotenv').config();

var mysql = require('mysql');

// Establish connection to db
var db_connect_options = {
  host: 'localhost',
  user: 'root',
  password: process.env.DB_PW,
  database: 'kanji_app',
  charset: 'utf8mb4'
}
var db_connection = mysql.createConnection(db_connect_options, function (error) {
  if (error) {
    console.log(error);
  }
})

// Drop reading table promise
var drop_table_reading = function () {
  return new Promise(function (resolve, reject) {
    db_connection.query(`drop table reading;`, function (error) {
      // Not sure error check is necessary here, seems to throw an exception if there is no table
      if (!error) {
        console.log('Removed reading table.');
      } else {
        console.log('No reading table found.')
      }
    })
  })
}

// Drop meaning table promise
var drop_table_meaning = function () {
  return new Promise(function (resolve, reject) {
    db_connection.query(`drop table meaning;`, function (error) {
      // Not sure error check is necessary here, seems to throw an exception if there is no table
      if (!error) {
        console.log('Removed meaning table.');
      } else {
        console.log('No meaning table found.')
      }
    })
  })
}

// Drop kanji table promise
var drop_table_kanji = function () {
  return new Promise(function (resolve, reject) {
    db_connection.query(`drop table kanji;`, function (error) {
      // Not sure error check is necessary here, seems to throw an exception if there is no table
      if (!error) {
        console.log('Removed kanji table.');
      } else {
        console.log('No kanji table found.')
      }
    })
  })
}

// Create kanji table promise
var query_create_kanji_table = `
CREATE TABLE kanji (
  id INT PRIMARY KEY NOT NULL,
  literal VARCHAR(255) NOT NULL,
  stroke_count INT DEFAULT NULL,
  grade INT DEFAULT NULL,
  frequency INT DEFAULT NULL,
  jlpt INT DEFAULT NULL
);
`
var create_table_kanji = function () {
  return new Promise(function (resolve, reject) {
    db_connection.query(query_create_kanji_table, function (error) {
      if (error) {
        console.log(error);
      } else {
        console.log('Created kanji table.')
      }
    })
  })
}

// Create meaning table promise
var query_create_meaning_table = `
CREATE TABLE meaning (
  id INT AUTO_INCREMENT PRIMARY KEY NOT NULL,
  kanji_id INT NOT NULL,
  meaning VARCHAR(255) DEFAULT NULL,
  user_submitted BOOLEAN NOT NULL,
  FOREIGN KEY (kanji_id) REFERENCES kanji(id)
);
`
var create_table_meaning = function () {
  return new Promise(function (resolve, reject) {
    db_connection.query(query_create_meaning_table, function (error) {
      if (error) {
        console.log(error);
      } else {
        console.log('Created meaning table.')
      }
    })
  })
}

// Create reading table promise
var query_create_reading_table = `
CREATE TABLE reading (
  id INT AUTO_INCREMENT PRIMARY KEY NOT NULL,
  kanji_id INT NOT NULL,
  reading VARCHAR(100) DEFAULT NULL,
  reading_type VARCHAR(10) DEFAULT NULL,
  FOREIGN KEY (kanji_id) REFERENCES kanji(id)
);
`
var create_table_reading = function () {
  return new Promise(function (resolve, reject) {
    db_connection.query(query_create_reading_table, function (error) {
      if (error) {
        console.log(error);
      } else {
        console.log('Created reading table.')
      }
    })
  })
}

// Close connection
var end_db_connection = function () {
  db_connection.end(function () {
    console.log('Ended db connection.')
  })
}

// Promise chain
drop_table_reading()
  .then(drop_table_meaning())
  .then(drop_table_kanji())
  .then(create_table_kanji())
  .then(create_table_reading())
  .then(create_table_meaning())
  .then(end_db_connection())

require('dotenv').config();

var mysql = require('mysql');
var fs = require('fs');

var json_result = JSON.parse(fs.readFileSync('./kanjidic2_json.json', 'utf8'));

// // Set DB connection options and connect to db
// var db_connect_options = {
//   host: 'localhost',
//   user: 'root',
//   password: process.env.DB_PW,
//   database: 'kanji_app'
// }
// var db_connection = mysql.createConnection(db_connect_options);

// // Delete all present info
// var delete_meaning_q = `delete from meaning`;
// db_connection.query(delete_meaning_q, function (err, thing) {
//   if (err) {
//     console.log(err);
//   }
// });
// var delete_reading_q = `delete from reading`;
// db_connection.query(delete_reading_q, function (err, thing) {
//   if (err) {
//     console.log(err);
//   }
// });
// var delete_kanji_q = `delete from kanji`;
// db_connection.query(delete_kanji_q, function (err, thing) {
//   if (err) {
//     console.log(err);
//   }
// });

// Add kanji function

var get_kanji_data = function (kanji_row, index) {
  //  array to hold values to insert into DB
  var data_to_insert = [];

  // insert kanji id
  data_to_insert.push(index);

  // insert kanji itself
  data_to_insert.push(kanji_row.literal._text);

  // Insert grade
  try {
    var grade = parseInt(kanji_row.misc.grade._text);
    data_to_insert.push(grade);
  } catch (error) {
    var grade = 0;
    data_to_insert.push(grade);
  }

  // Insert stroke count
  if (kanji_row.misc.stroke_count) {
    var stroke_count = kanji_row.misc.stroke_count;
    // Some stroke counts are in arrays, the first entry is correct one
    // subsequent entries are common mistake counts
    if (stroke_count instanceof Array) {
      stroke_count = parseInt(stroke_count[0]._text);
    } else {
      stroke_count = parseInt(stroke_count._text);
    }
    data_to_insert.push(stroke_count);
  } else {
    // Handle rows with no stroke count
    data_to_insert.push(0);
  }


  // Insert frequency
  if (typeof (kanji_row.misc.freq._text) != 'undefined') {
    data_to_insert.push(parseInt(kanji_row.misc.freq._text))
  } else {
    data_to_insert.push(0);
  }

  // Insert JLPT
  if (kanji_row.misc.jlpt._text) {
    data_to_insert.push(parseInt(kanji_row.misc.jlpt._text));
  } else {
    data_to_insert.push(0);
  }

  console.log(data_to_insert);

}

// for (var i = 0; i < 20; i++) {
//   console.log(i);
//   var row = json_result.kanjidic2.character[i];
//   try {
//     get_kanji_data(row, i);
//   } catch (error) {
//     console.log(error);
//     break;
//   }
// };

for (var i = 0; i < 20; i++) {
  console.log(i);
  var row = json_result.kanjidic2.character[i];
  get_kanji_data(row, i);
};



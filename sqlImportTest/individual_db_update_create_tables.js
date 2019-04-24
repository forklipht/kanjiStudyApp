require('dotenv').config();

var mysql = require('mysql');
var fs = require('fs');

var json_result = JSON.parse(fs.readFileSync('./kanjidic2_json.json', 'utf8'));

// Set DB connection options and connect to db
var db_connect_options = {
  host: 'localhost',
  user: 'root',
  password: process.env.DB_PW,
  database: 'kanji_app'
}
var db_connection = mysql.createConnection(db_connect_options);

// Delete all present info
var delete_meaning_q = `delete from meaning`;
db_connection.query(delete_meaning_q, function (err, thing) {
  if (err) {
    console.log(err);
  }
});
var delete_reading_q = `delete from reading`;
db_connection.query(delete_reading_q, function (err, thing) {
  if (err) {
    console.log(err);
  }
});
var delete_kanji_q = `delete from kanji`;
db_connection.query(delete_kanji_q, function (err, thing) {
  if (err) {
    console.log(err);
  }
});

var error_check = 0;


//json_result.kanjidic2.character.length
// Loop over list of characters in JSON
for (i = 0; i < json_result.kanjidic2.character.length; i++) {
  // Show progress
  if (i > 13000) {
    console.log(`Now processing ${kanji} at entry ${i}`);
  }
  // Create array for kanji entries
  var kanji_entries = [];
  // Create array for meaning entries
  var meaning_entries = [];
  // Create array for reading entries
  var reading_entries = [];

  // Process kanji entry
  // Column order: id, character ('literal' on db), grade, stroke_count, frequency
  var kanji_row = [];

  // Set kanji id
  kanji_row.push(i);

  // Get character
  var kanji = json_result.kanjidic2.character[i].literal._text;
  kanji_row.push(kanji);

  // Get, validate grade
  var grade;
  try {
    grade = parseInt(json_result.kanjidic2.character[i].misc.grade._text);
  } catch (error) {
    grade = 0;
  }
  kanji_row.push(grade);

  // Get, validate stroke count
  var stroke_count = json_result.kanjidic2.character[i].misc.stroke_count;
  if (stroke_count instanceof Array) {
    stroke_count = parseInt(stroke_count[0]._text);
  } else {
    stroke_count = parseInt(stroke_count._text);
  }
  kanji_row.push(stroke_count);

  // Get, validate frequency
  var freq;
  try {
    freq = parseInt(json_result.kanjidic2.character[i].misc.freq._text);
  } catch (error) {
    freq = 0;
  }
  kanji_row.push(freq);

  // Get, validate JLPT
  var jlpt;
  try {
    jlpt = parseInt(json_result.kanjidic2.character[i].misc.jlpt._text);
  } catch (error) {
    jlpt = 0;
  }
  kanji_row.push(jlpt);

  // Add row to data insert array
  kanji_entries.push(kanji_row);

  // Insert kanji_entries into DB
  var kanji_q = `INSERT INTO kanji (id, literal, stroke_count, grade, frequency, jlpt) VALUES ?`;
  db_connection.query(kanji_q, [kanji_entries], function (err, thing) {
    if (err && error_check < 5) {
      console.log(err);
      error_check++;
    } else {
    }
  })



  // Process readings and meanings
  // Some kanji have neither reading or meaning, must check and handle
  if (json_result.kanjidic2.character[i].reading_meaning) {
    // Process readings for kanji
    try {
      // Check to make sure the kanji has a reading (apparently some don't?!)
      if (json_result.kanjidic2.character[i].reading_meaning.rmgroup.reading) {
        // handle kanji with multiple readings
        if (json_result.kanjidic2.character[i].reading_meaning.rmgroup.reading instanceof Array) {
          json_result.kanjidic2.character[i].reading_meaning.rmgroup.reading.forEach(function (reading) {
            // i is the value for the foreign key 'kanji_id' on the readings table
            var reading_row = [i];
            // Chinese, Korean, Vietnamese also in data but we want to exclude those
            if (reading._attributes.r_type == 'ja_on' || reading._attributes.r_type == 'ja_kun') {
              reading_row.push(reading._text);
              reading_row.push(reading._attributes.r_type);
              reading_entries.push(reading_row);

              // Insert reading_entries into DB
              var reading_q = `INSERT INTO reading ( kanji_id, reading, reading_type) VALUES ?`;
              db_connection.query(reading_q, [reading_entries], function (err, thing) {
                if (err) {
                  console.log(`error adding readings for ${kanji} at entry ${i}`)
                  console.log(err);
                } else {
                }
              })
            }
          })
        } else {
          // handle kanji with only one reading 
          var reading = json_result.kanjidic2.character[i].reading_meaning.rmgroup.reading;
          // i is the value for the foreign key 'kanji_id' on the readings table
          var reading_row = [i];
          // Chinese, Korean, Vietnamese also in data but we want to exclude those
          if (reading._attributes.r_type == 'ja_on' || reading._attributes.r_type == 'ja_kun') {
            reading_row.push(reading._text);
            reading_row.push(reading._attributes.r_type);
            reading_entries.push(reading_row);

            // Insert reading_entries into DB
            var reading_q = `INSERT INTO reading ( kanji_id, reading, reading_type) VALUES ?`;
            db_connection.query(reading_q, [reading_entries], function (err, thing) {
              if (err) {
                console.log(`error adding readings for ${kanji} at entry ${i}`)
                console.log(err);
              } else {
              }
            })
          }
        }
      } else {
        // Handle kanji with no readings
        console.log('No readings for', json_result.kanjidic2.character[i].literal._text);
      }
    } catch (error) {
      console.log('Error here:');
      console.log(json_result.kanjidic2.character[i]);
      console.log('\nthing causing error:');
      console.log(json_result.kanjidic2.character[i].reading_meaning.rmgroup.reading);

      throw error;
    }


    // Process meanings for kanji
    // If the kanji has more than one meaning, the meaning value is an array
    // If only one meaning, it's an object
    // Handle multiple meanings
    try {
      if (json_result.kanjidic2.character[i].reading_meaning.rmgroup.meaning instanceof Array) {
        json_result.kanjidic2.character[i].reading_meaning.rmgroup.meaning.forEach(function (meaning) {
          // We have this comparison because English meanings don't have _attributes and we only want English meanings
          if (typeof (meaning._attributes) == 'undefined') {
            // i is the value for the foreign key 'kanji_id' on the meanings table
            var meaning_row = [i];
            meaning_row.push(meaning._text);
            // The 0 here is to indicate that the meaning is not submitted by a user
            meaning_row.push(0);
            meaning_entries.push(meaning_row);

            // Insert meaning_entries into DB
            var meaning_q = `INSERT INTO meaning ( kanji_id, meaning, user_submitted) VALUES ?`;
            db_connection.query(meaning_q, [meaning_entries], function (err, thing) {
              if (err) {
                console.log(`error adding meanings for ${kanji} at entry ${i}`);
                console.log(err);
              } else {
              }
            })
          }
        })
      } else if (typeof (json_result.kanjidic2.character[i].reading_meaning.rmgroup.meaning) == 'object' && !(json_result.kanjidic2.character[i].reading_meaning.rmgroup.meaning instanceof Array)) {
        // Handle cases where there is only one meaning
        // i is the value for the foreign key 'kanji_id' on the meanings table
        var meaning_row = [i];
        meaning_row.push(json_result.kanjidic2.character[i].reading_meaning.rmgroup.meaning._text);
        // The 0 here is to indicate that the meaning is not submitted by a user
        meaning_row.push(0);
        meaning_entries.push(meaning_row);

        // Insert meaning_entries into DB
        var meaning_q = `INSERT INTO meaning ( kanji_id, meaning, user_submitted) VALUES ?`;
        db_connection.query(meaning_q, [meaning_entries], function (err, thing) {
          if (err) {
            console.log(`error adding meanings for ${kanji} at entry ${i}`);
            console.log(err);
          } else {
          }
        })
      } else {
        console.log('No meaning for ', json_result.kanjidic2.character[i].literal._text);
      }
    } catch (error) {
      console.log('Error here:');
      console.log(json_result.kanjidic2.character[i]);
      console.log('\nthing causing error:');
      console.log(json_result.kanjidic2.character[i].reading_meaning.rmgroup.meaning);

      throw error;
    }
  } else {
    console.log('No meaning or reading for ', json_result.kanjidic2.character[i].literal._text);
  }
}

db_connection.end(function (err) {
  if (err) {
    console.log(err);
  } else {
    console.log('closed db connection');
  }
});

/*
 *  Insert kanji data into db tables
 *
 */


// // Insert kanji_entries into DB
// var kanji_q = `INSERT INTO kanji (id, literal, stroke_count, grade, frequency, jlpt) VALUES ?`;
// db_connection.query(kanji_q, [kanji_entries], function (err, thing) {
//   if (err) {
//     //console.log(err);
//     console.log('error adding kanji');
//   } else {
//     console.log('Successfully added kanji.');
//   }
// })

// // Insert meaning_entries into DB
// var meaning_q = `INSERT INTO meaning ( kanji_id, meaning, user_submitted) VALUES ?`;
// db_connection.query(meaning_q, [meaning_entries], function (err, thing) {
//   if (err) {
//     //console.log(err);
//     console.log('err adding meanings');
//   } else {
//     console.log('Successfully added meanings.');
//   }
// })

// // Insert reading_entries into DB
// var reading_q = `INSERT INTO reading ( kanji_id, reading, reading_type) VALUES ?`;
// db_connection.query(reading_q, [reading_entries], function (err, thing) {
//   if (err) {
//     console.log("error occurred adding readings")
//     //console.log(err);
//   } else {
//     console.log('Successfully added readings.');
//   }
// })





/*
* Locations for data I want
* json_result.kanjidic2.character[i]
*
* Actual kanji: json_result.kanjidic2.character[i].literal._text
*
* Grade (requires validation): json_result.kanjidic2.character[i].misc.grade._text
*
* Stroke count (validation?): json_result.kanjidic2.character[i].misc.stroke_count._text
* -- Some characters have more than one stroke count. In these cases, the first one is the accepted count, and others are commonly mistaken counts
* Frequency (requires validation): json_result.kanjidic2.character[i].misc.freq._text
*
* JLPT (requires validation): json_result.kanjidic2.character[i].misc.jlpt._text
*
* Reading:
* json_result.kanjidic2.character[900].reading_meaning.rmgroup.reading
*  -- This returns a list of objects, each one a reading
*  -- The reading's type can be accessed at json_result.kanjidic2.character[900].reading_meaning.rmgroup.reading[i]._attributes.r_type
*  -- The reading itself can be accessed at json_result.kanjidic2.character[900].reading_meaning.rmgroup.reading[i]._text
*  -- Ex:
[ { _attributes: { r_type: 'pinyin' }, _text: 'gong4' },
{ _attributes: { r_type: 'korean_r' }, _text: 'gong' },
{ _attributes: { r_type: 'korean_h' }, _text: '공' },
{ _attributes: { r_type: 'vietnam' }, _text: 'Cống' },
{ _attributes: { r_type: 'ja_on' }, _text: 'コウ' },
{ _attributes: { r_type: 'ja_on' }, _text: 'ク' },
{ _attributes: { r_type: 'ja_kun' }, _text: 'みつ.ぐ' } ]
*
* Meaning:
* json_result.kanjidic2.character[900].reading_meaning.rmgroup.meaning
* -- This returns a list of objects, each one a meaning
* -- For english, the object just has a "_text" key with the value being the being the reading
* ---- This can be accessed at json_result.kanjidic2.character[900].reading_meaning.rmgroup.meaning[i]._text
* ---- Ex:
[ { _text: 'tribute' },
{ _text: 'support' },
{ _text: 'finance' },
{ _attributes: { m_lang: 'fr' }, _text: 'tribut' },
{ _attributes: { m_lang: 'fr' }, _text: 'contribution' },
{ _attributes: { m_lang: 'fr' }, _text: 'financer' },
{ _attributes: { m_lang: 'es' }, _text: 'tributo' },
{ _attributes: { m_lang: 'es' }, _text: 'finanzas' },
{ _attributes: { m_lang: 'es' }, _text: 'tributar' },
{ _attributes: { m_lang: 'es' }, _text: 'financiar' },
{ _attributes: { m_lang: 'pt' }, _text: 'tributo' },
{ _attributes: { m_lang: 'pt' }, _text: 'apoiar' },
{ _attributes: { m_lang: 'pt' }, _text: 'financiar' } ]
*
*
*
*/
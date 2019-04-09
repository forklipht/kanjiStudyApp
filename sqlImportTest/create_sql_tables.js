require('dotenv').config();

var mysql = require('mysql');
var fs = require('fs');

var json_result = JSON.parse(fs.readFileSync('./kanjidic2_json.json', 'utf8'));

// TODO
// Create array for kanji entries
var kanji_entries = [];
// Create array for meaning entries
var meaning_entries = [];
// Create array for reading entries
var reading_entries = [];

// Loop over list of characters in JSON
for (i = 0; i < 10; i++) {
  // Show progress
  if (i % 50 == 0) {
    console.log(`Processed ${i} characters.`);
  }

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

  // Process readings for kanji
  json_result.kanjidic2.character[i].reading_meaning.rmgroup.reading.forEach(function (reading) {
    // i is the value for the foreign key 'kanji_id' on the readings table
    var reading_row = [i];
    // Chinese, Korean, Vietnamese also in data but we want to exclude those
    if (reading._attributes.r_type == 'ja_on' || reading._attributes.r_type == 'ja_kun') {
      reading_row.push(reading._text);
      reading_row.push(reading._attributes.r_type);
      reading_entries.push(reading_row);
    }
  })

  // Process meanings for kanji
  // If the kanji has more than one meaning, the meaning value is an array
  // If only one meaning, it's an object
  // Handle multiple meanings
  if (json_result.kanjidic2.character[i].reading_meaning.rmgroup.meaning instanceof Array) {
    json_result.kanjidic2.character[i].reading_meaning.rmgroup.meaning.forEach(function (meaning) {
      // We have this comparison because English meanings don't have _attributes and we only want English meanings
      if (typeof (meaning._attributes) == 'undefined') {
        console.log('No attributes!');
        // i is the value for the foreign key 'kanji_id' on the meanings table
        var meaning_row = [i];
        meaning_row.push(meaning._text);
        // The 0 here is to indicate that the meaning is not submitted by a user
        meaning_row.push(0);
        meaning_entries.push(meaning_row);
      }
    })
  } else { // Handle cases where the is only one meaning
    // i is the value for the foreign key 'kanji_id' on the meanings table
    var meaning_row = [i];
    meaning_row.push(json_result.kanjidic2.character[i].reading_meaning.rmgroup.meaning._text);
    // The 0 here is to indicate that the meaning is not submitted by a user
    meaning_row.push(0);
    meaning_entries.push(meaning_row);
  }
}

/*
 *  Insert kanji data into db tables
 *
 */

// Set DB connection options and connect to db
var db_connect_options = {
  host: 'localhost',
  user: 'root',
  password: process.env.DB_PW,
  database: 'kanji_app'
}
var db_connection = mysql.createConnection(db_connect_options);

// Insert kanji_entries into DB
var kanji_q = `INSERT INTO kanji (id, literal, stroke_count, grade, frequency, jlpt) VALUES ?`;
db_connection.query(kanji_q, [kanji_entries], function (err, thing) {
  if (err) {
    console.log(err);
  } else {
    console.log('Successfully added kanji.');
    console.log(thing);
  }
})

// Insert meaning_entries into DB
var meaning_q = `INSERT INTO meaning ( kanji_id, meaning, user_submitted) VALUES ?`;
db_connection.query(meaning_q, [meaning_entries], function (err, thing) {
  if (err) {
    console.log(err);
  } else {
    console.log('Successfully added meanings.');
    console.log(thing);
  }
})

// Insert reading_entries into DB
var reading_q = `INSERT INTO reading ( kanji_id, reading, reading_type) VALUES ?`;
db_connection.query(reading_q, [reading_entries], function (err, thing) {
  if (err) {
    console.log(err);
  } else {
    console.log('Successfully added readings.');
    console.log(thing);
  }
})

db_connection.end();



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
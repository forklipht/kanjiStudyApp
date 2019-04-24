require('dotenv').config();

var mysql = require('mysql');
var fs = require('fs');


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

// Get raw kanji data
var kanji_data = JSON.parse(fs.readFileSync('./kanjidic2_json.json', 'utf8')).kanjidic2.character;

// Parse kanji data
var parse_kanji_data = function (this_kanji, id_number) {
  var data_to_insert = [];

  // Add kanji's ID for this database
  data_to_insert.push(id_number);

  // Add kanji character
  data_to_insert.push(this_kanji.literal._text);

  // Add stroke count
  if (this_kanji.misc.stroke_count instanceof Array) {
    // Some kanji have multiple stroke counts, 0 is the correct one, others are common mistakes
    data_to_insert.push(parseInt(this_kanji.misc.stroke_count[0]._text));
  } else {
    data_to_insert.push(parseInt(this_kanji.misc.stroke_count._text));
  }

  // Add grade
  if (this_kanji.misc.grade !== undefined) {
    data_to_insert.push(parseInt(this_kanji.misc.grade._text));
  } else {
    data_to_insert.push(0);
  }

  // Add frequency
  if (this_kanji.misc.freq !== undefined) {
    data_to_insert.push(parseInt(this_kanji.misc.freq._text));
  } else {
    data_to_insert.push(0);
  }

  // Add JLPT level
  if (this_kanji.misc.jlpt !== undefined) {
    data_to_insert.push(parseInt(this_kanji.misc.jlpt._text));
  } else {
    data_to_insert.push(0);
  }

  return data_to_insert;
}

// Parse reading data
var parse_kanji_reading_data = function (this_kanji, kanji_id_number) {
  var reading_entries = [];
  // Using try instead of if because the property needed is nested a few levels deep and doesn't
  // exist on some kanji which throws a TypeError
  try {
    // Handle kanji with multiple meanings
    if (this_kanji.reading_meaning.rmgroup.reading instanceof Array) {
      this_kanji.reading_meaning.rmgroup.reading.forEach(function (reading) {
        if (reading._attributes.r_type == 'ja_on' || reading._attributes.r_type == 'ja_kun') {
          // Create array for this reading, starting with the kanji id
          var reading_row = [kanji_id_number];
          reading_row.push(reading._text);
          reading_row.push(reading._attributes.r_type);
          reading_entries.push(reading_row);
        }
      })
    } else {
      // Handle kanji with only one meaning
      var reading = this_kanji.reading_meaning.rmgroup.reading;
      var reading_row = [kanji_id_number];
      reading_row.push(reading._text);
      reading_row.push(reading._attributes.r_type);
      reading_entries.push(reading_row);
    }
  } catch (error) {
    console.log('No readings for kanji at', kanji_id_number, this_kanji.literal._text);
  }
  return reading_entries;
}
// Parse meaning data
var parse_kanji_meaning_data = function (this_kanji, kanji_id_number) {
  var meaning_entries = [];
  // Using try instead of if because the property needed is nested a few levels deep and doesn't
  // exist on some kanji which throws a TypeError
  try {
    // Handle kanji with multiple meanings
    if (this_kanji.reading_meaning.rmgroup.meaning instanceof Array) {
      this_kanji.reading_meaning.rmgroup.meaning.forEach(function (meaning) {
        // We have this comparison because English meanings don't have _attributes and we only want English meanings
        if (typeof (meaning._attributes) == 'undefined') {
          var meaning_row = [kanji_id_number];
          meaning_row.push(meaning._text);
          // The 0 here is to indicate that the meaning is not submitted by a user
          meaning_row.push(0);
          meaning_entries.push(meaning_row);
        }
      })
    } else if (typeof (this_kanji.reading_meaning.rmgroup.meaning) == 'object' && !(this_kanji.reading_meaning.rmgroup.meaning instanceof Array)) {
      // Handle cases where there is only one meaning
      var meaning_row = [kanji_id_number];
      meaning_row.push(this_kanji.reading_meaning.rmgroup.meaning._text);
      // The 0 here is to indicate that the meaning is not submitted by a user
      meaning_row.push(0);
      meaning_entries.push(meaning_row);
    } else {
      console.log('No meaning for kanji at', kanji_id_number, this_kanji.literal._text);
    }
  } catch (error) {
    console.log('No meanings for kanji at', kanji_id_number, this_kanji.literal._text);
  }
  return meaning_entries;
}


// -----
// DB insert promise functions
// -----

// insert kanji data, takes a row of general kanji data
var insert_kanji = function (kanji_data_to_insert) {
  var kanji_insert_query = `INSERT INTO kanji (id, literal, stroke_count, grade, frequency, jlpt) VALUES ?`;
  db_connection.query(kanji_insert_query, [[kanji_data_to_insert]], function (error, inserted) {
    if (!error) {
      //console.log('Inserted kanji data at', kanji_data_to_insert[0]);
    } else {
      console.log('Error at', i);
      throw error;
    }
  })
}
// Insert kanji reading data, takes an array or array of arrays to insert
var insert_readings = function (reading_data_to_insert) {
  var reading_insert_query = `INSERT INTO reading ( kanji_id, reading, reading_type) VALUES ?`;
  db_connection.query(reading_insert_query, [reading_data_to_insert], function (error, inserted) {
    if (!error) {
      //console.log('Inserted reading data for', reading_data_to_insert);
    } else {
      console.log('Error at', i);
      console.log(reading_data_to_insert);
      throw error;
    }
  })
}
// Insert kanji meaning data, takes an array or array of arrays to insert
var insert_meanings = function (meaning_data_to_insert) {
  var meaning_insert_query = `INSERT INTO meaning ( kanji_id, meaning, user_submitted) VALUES ?`;
  db_connection.query(meaning_insert_query, [meaning_data_to_insert], function (error, inserted) {
    if (!error) {
      //console.log('Inserted reading data for', reading_data_to_insert);
    } else {
      console.log('Error inserting readnigs at', i);
      console.log(meaning_data_to_insert);
      throw error;
    }
  })
}








// Loop over raw data and insert into database
for (var i = 0; i < kanji_data.length; i++) {
  // Get this kanji's general data
  var individual_kanji_data = parse_kanji_data(kanji_data[i], i);
  // Get kanji's reading data, returned as array of arrays or empty array if no data
  var kanji_reading_data = parse_kanji_reading_data(kanji_data[i], i);
  // Get kanji's meaning data, returned as array of arrays or empty array if no data
  var kanji_meaning_data = parse_kanji_meaning_data(kanji_data[i], i);

  // Insert kanji
  insert_kanji(individual_kanji_data);
  // Validate and insert readings
  if (kanji_reading_data.length > 0) {
    insert_readings(kanji_reading_data);
  }
  // Validate and insert meanings
  if (kanji_meaning_data.length > 0) {
    insert_meanings(kanji_meaning_data);
  }

}


db_connection.end(function (error) {
  if (!error) {
    console.log("Ended db connection.");
  } else {
    console.log('Error ending db connection.');
    console.log(error);
  }
})
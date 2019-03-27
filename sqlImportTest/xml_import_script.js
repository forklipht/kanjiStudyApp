var xmljs = require('xml-js');
var fs = require('fs');

// var xml = fs.readFileSync('./kanjidic2_noIntro.xml', 'utf8');
// var json_result = xmljs.xml2js(xml, { compact: true, space: 4 });
var json_result = JSON.parse(fs.readFileSync('./kanjidic2_json.json', 'utf8'));


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
 * ---- This can be accessed at json_result.kanjidic2.character[900].reading_meaning.rmgroup.reading[i]._text
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

var char_list = json_result.kanjidic2.character;
var data_insert_list = [];

for (i = 0; i < 100; i++) {

  var kanji_row = [];

  if (i % 500 == 0) {
    console.log(`Processed ${i} characters.`);
  }

  // Get character
  var kanji = json_result.kanjidic2.character[i].literal._text;
  kanji_row.push(kanji);

  // Get grade if it exists
  var grade = '';
  try {
    grade = json_result.kanjidic2.character[i].misc.grade._text;
  } catch (error) {
    grade = 'N/A';
  }
  kanji_row.push('grade: ' + grade);

  // Get stroke count
  var stroke_count = json_result.kanjidic2.character[i].misc.stroke_count;
  if(stroke_count instanceof Array){
    stroke_count = stroke_count[0]._text;
  } else {
    stroke_count = stroke_count._text;
  }
  kanji_row.push('stroke count: ' + stroke_count);

  // Get frequency
  var freq;
  try {
    freq = json_result.kanjidic2.character[i].misc.freq._text;
  } catch (error) {
    freq = 'N/A';
  }
  kanji_row.push('freq: ' + freq);

  // Get JLPT
  var jlpt;
  try {
    jlpt = json_result.kanjidic2.character[i].misc.jlpt._text;
  } catch (error) {
    jlpt = 'N/A';
  }
  kanji_row.push('jlpt: ' + jlpt);

  // Add row to data insert array
  data_insert_list.push(kanji_row);

}

console.log(data_insert_list);
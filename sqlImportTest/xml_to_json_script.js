var xmljs = require('xml-js');
var fs = require('fs');

var xml = fs.readFileSync('./kanjidic2_noIntro.xml', 'utf8');
var json_result = xmljs.xml2json(xml, {compact: true, space: 4});
fs.writeFile('./kanjidic2_json.json', json_result, function(err){
  if(err){
    console.log(err);
  } else {
    console.log('Save successful.');
  }
})
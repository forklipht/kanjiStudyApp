LOAD XML INFILE 'C:/ProgramData/MySQL/MySQL Server 8.0/Uploads/kanjidic2.xml'
  INTO TABLE xml_test_dogs_01
  ROWS IDENTIFIED BY '<character>'
;

CREATE TABLE kanji (
  id INT PRIMARY KEY NOT NULL,
  literal VARCHAR(1),
  stroke_count INT,
  grade INT,
  jlpt INT
)

CREATE TABLE meaning (
  id INT PRIMARY KEY NOT NULL,
  kanji_id INT FOREIGN KEY NOT NULL,
  meaning VARCHAR(255) NOT NULL,
  user_submitted BOOLEAN NOT NULL,
  FOREIGN KEY (kanji_id) REFERENCES kanji(id)
)

CREATE TABLE reading (
  id INT PRIMARY KEY NOT NULL,
  kanji_id INT NOT NULL,
  reading VARCHAR(30) NOT NULL,
  reading_type VARCHAR(10) NOT NULL,
  FOREIGN KEY (kanji_id) REFERENCES kanji(id)
);
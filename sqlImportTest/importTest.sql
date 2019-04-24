LOAD XML INFILE 'C:/ProgramData/MySQL/MySQL Server 8.0/Uploads/kanjidic2.xml'
  INTO TABLE xml_test_dogs_01
  ROWS IDENTIFIED BY '<character>'
;

CREATE TABLE kanji (
  id INT PRIMARY KEY NOT NULL,
  literal VARCHAR(255) NOT NULL,
  stroke_count INT DEFAULT NULL,
  grade INT DEFAULT NULL,
  frequency INT DEFAULT NULL,
  jlpt INT DEFAULT NULL
);

CREATE TABLE meaning (
  id INT AUTO_INCREMENT PRIMARY KEY NOT NULL,
  kanji_id INT NOT NULL,
  meaning VARCHAR(255) DEFAULT NULL,
  user_submitted BOOLEAN NOT NULL,
  FOREIGN KEY (kanji_id) REFERENCES kanji(id)
);

CREATE TABLE reading (
  id INT AUTO_INCREMENT PRIMARY KEY NOT NULL,
  kanji_id INT NOT NULL,
  reading VARCHAR(30) DEFAULT NULL,
  reading_type VARCHAR(10) DEFAULT NULL,
  FOREIGN KEY (kanji_id) REFERENCES kanji(id)
);

drop table meaning; drop table reading; drop table kanji;

ALTER DATABASE kanji_app CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE kanji MODIFY literal VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL


SELECT character_set_name, collation_name
    FROM information_schema.columns
    WHERE table_schema = your_database_name
        AND table_name = your_table_name
        AND column_name = your_column_name;

SELECT *
FROM kanji k
LEFT JOIN meaning m
  ON k.id = m.kanji_id
LEFT JOIN reading r
  ON k.id = r.kanji_id;
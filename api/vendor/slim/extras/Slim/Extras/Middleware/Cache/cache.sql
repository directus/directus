CREATE TABLE `cache` (
    `key` CHAR(40) NOT NULL PRIMARY KEY,
    `content_type` VARCHAR(100) NOT NULL,
    `body` TEXT NOT NULL,
    `tstamp` INTEGER UNSIGNED NOT NULL
);

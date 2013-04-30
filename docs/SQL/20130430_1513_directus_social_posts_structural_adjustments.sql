alter table `directus_social_posts` add unique index(feed, foreign_id);
ALTER TABLE  `directus_social_posts` CHANGE  `foreign_id`  `foreign_id` BIGINT( 20 ) NOT NULL;
ALTER TABLE  `directus_social_posts` CHANGE  `published`  `datetime` DATETIME NOT NULL COMMENT  'The date/time this entry was published.';
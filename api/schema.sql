# ************************************************************
# Sequel Pro SQL dump
# Version 4541
#
# http://www.sequelpro.com/
# https://github.com/sequelpro/sequelpro
#
# Host: localhost (MySQL 5.6.35)
# Database: delete
# Generation Time: 2017-07-09 00:47:55 +0000
# ************************************************************


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;


# Dump of table directus_activity
# ------------------------------------------------------------

DROP TABLE IF EXISTS `directus_activity`;

CREATE TABLE `directus_activity` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `type` varchar(100) DEFAULT NULL,
  `action` varchar(100) NOT NULL,
  `identifier` varchar(100) DEFAULT NULL,
  `table_name` varchar(100) NOT NULL DEFAULT '',
  `row_id` int(11) unsigned DEFAULT '0',
  `user` int(11) unsigned NOT NULL DEFAULT '0',
  `data` text,
  `delta` text,
  `parent_id` int(11) unsigned DEFAULT NULL,
  `parent_table` varchar(100) DEFAULT NULL,
  `parent_changed` tinyint(1) NOT NULL DEFAULT '0' COMMENT 'Did the top-level record in the change set alter (scalar values/many-to-one relationships)? Or only the data within its related foreign collection records? (*toMany)',
  `datetime` datetime DEFAULT NULL,
  `logged_ip` varchar(45) DEFAULT NULL,
  `user_agent` varchar(256) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;



# Dump of table directus_bookmarks
# ------------------------------------------------------------

DROP TABLE IF EXISTS `directus_bookmarks`;

CREATE TABLE `directus_bookmarks` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `user` int(11) unsigned DEFAULT NULL,
  `title` varchar(255) DEFAULT NULL,
  `url` varchar(255) DEFAULT NULL,
  `section` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;



# Dump of table directus_columns
# ------------------------------------------------------------

DROP TABLE IF EXISTS `directus_columns`;

CREATE TABLE `directus_columns` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `table_name` varchar(64) NOT NULL DEFAULT '',
  `column_name` varchar(64) NOT NULL DEFAULT '',
  `data_type` varchar(64) DEFAULT NULL,
  `ui` varchar(64) DEFAULT NULL,
  `relationship_type` enum('MANYTOONE','MANYTOMANY','ONETOMANY') DEFAULT NULL,
  `related_table` varchar(64) DEFAULT NULL,
  `junction_table` varchar(64) DEFAULT NULL,
  `junction_key_left` varchar(64) DEFAULT NULL,
  `junction_key_right` varchar(64) DEFAULT NULL,
  `hidden_input` tinyint(1) NOT NULL DEFAULT '0',
  `required` tinyint(1) NOT NULL DEFAULT '0',
  `sort` int(11) DEFAULT NULL,
  `comment` varchar(1024) DEFAULT NULL,
  `options` text,
  PRIMARY KEY (`id`),
  UNIQUE KEY `table-column` (`table_name`,`column_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

LOCK TABLES `directus_columns` WRITE;
/*!40000 ALTER TABLE `directus_columns` DISABLE KEYS */;

INSERT INTO `directus_columns` (`id`, `table_name`, `column_name`, `data_type`, `ui`, `relationship_type`, `related_table`, `junction_table`, `junction_key_left`, `junction_key_right`, `hidden_input`, `required`, `sort`, `comment`, `options`)
VALUES
	(1,'directus_users','group','INT','many_to_one','MANYTOONE','directus_groups',NULL,NULL,'group_id',0,0,NULL,'',NULL),
	(2,'directus_users','avatar_file_id','INT','single_file','MANYTOONE','directus_files',NULL,NULL,'avatar_file_id',0,0,NULL,'',NULL),
	(3,'directus_groups','users','ALIAS','directus_users','ONETOMANY','directus_users',NULL,NULL,'group',0,0,NULL,NULL,NULL),
	(4,'directus_groups','permissions','ALIAS','directus_permissions','ONETOMANY','directus_privileges',NULL,NULL,'group_id',0,0,NULL,NULL,NULL);

/*!40000 ALTER TABLE `directus_columns` ENABLE KEYS */;
UNLOCK TABLES;


# Dump of table directus_files
# ------------------------------------------------------------

DROP TABLE IF EXISTS `directus_files`;

CREATE TABLE `directus_files` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `status` tinyint(1) DEFAULT '1',
  `name` varchar(255) DEFAULT NULL,
  `title` varchar(255) DEFAULT '',
  `location` varchar(200) DEFAULT NULL,
  `caption` text,
  `type` varchar(255) DEFAULT '',
  `charset` varchar(50) DEFAULT '',
  `tags` varchar(255) DEFAULT '',
  `width` int(11) unsigned DEFAULT '0',
  `height` int(11) unsigned DEFAULT '0',
  `size` int(11) unsigned DEFAULT '0',
  `embed_id` varchar(200) DEFAULT NULL,
  `user` int(11) unsigned NOT NULL,
  `date_uploaded` datetime DEFAULT NULL,
  `storage_adapter` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

LOCK TABLES `directus_files` WRITE;
/*!40000 ALTER TABLE `directus_files` DISABLE KEYS */;

INSERT INTO `directus_files` (`id`, `status`, `name`, `title`, `location`, `caption`, `type`, `charset`, `tags`, `width`, `height`, `size`, `embed_id`, `user`, `date_uploaded`, `storage_adapter`)
VALUES
	(1, 1, '00000000001.jpg', 'Mountain Range', 'Earth', 'A gorgeous view of this wooded mountain range', 'image/jpeg', 'binary', 'trees,rocks,nature,mountains,forest', 1800, 1200, 602058, NULL, 1, '2017-07-19 15:44:10', 'local');

/*!40000 ALTER TABLE `directus_files` ENABLE KEYS */;
UNLOCK TABLES;

# Dump of table directus_groups
# ------------------------------------------------------------

DROP TABLE IF EXISTS `directus_groups`;

CREATE TABLE `directus_groups` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(100) DEFAULT NULL,
  `description` varchar(500) DEFAULT NULL,
  `restrict_to_ip_whitelist` text,
  `nav_override` text,
  PRIMARY KEY (`id`),
  UNIQUE KEY `directus_users_name_unique` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

LOCK TABLES `directus_groups` WRITE;
/*!40000 ALTER TABLE `directus_groups` DISABLE KEYS */;

INSERT INTO `directus_groups` (`id`, `name`, `description`, `restrict_to_ip_whitelist`, `nav_override`)
VALUES
	(1,'Administrator','Admins have access to all managed data within the system by default',NULL,NULL),
	(2,'Public','This sets the data that is publicly available through the API without a token',NULL,NULL);

/*!40000 ALTER TABLE `directus_groups` ENABLE KEYS */;
UNLOCK TABLES;


# Dump of table directus_messages
# ------------------------------------------------------------

DROP TABLE IF EXISTS `directus_messages`;

CREATE TABLE `directus_messages` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `from` int(11) unsigned DEFAULT NULL,
  `subject` varchar(255) NOT NULL DEFAULT '',
  `message` text NOT NULL,
  `datetime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `attachment` varchar(512) DEFAULT NULL,
  `response_to` int(11) unsigned DEFAULT NULL,
  `comment_metadata` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;



# Dump of table directus_messages_recipients
# ------------------------------------------------------------

DROP TABLE IF EXISTS `directus_messages_recipients`;

CREATE TABLE `directus_messages_recipients` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `message_id` int(11) unsigned NOT NULL,
  `recipient` int(11) unsigned NOT NULL,
  `read` tinyint(1) NOT NULL,
  `group` int(11) unsigned DEFAULT NULL,
  `archived` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;



# Dump of table directus_preferences
# ------------------------------------------------------------

DROP TABLE IF EXISTS `directus_preferences`;

CREATE TABLE `directus_preferences` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `user` int(11) unsigned DEFAULT NULL,
  `table_name` varchar(64) DEFAULT NULL,
  `title` varchar(128) DEFAULT NULL,
  `columns_visible` varchar(300) DEFAULT NULL,
  `sort` varchar(64) DEFAULT 'id',
  `sort_order` varchar(5) DEFAULT 'ASC',
  `status` varchar(64) DEFAULT '3',
  `search_string` text,
  `list_view_options` text,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user` (`user`,`table_name`,`title`),
  UNIQUE KEY `pref_title_constraint` (`user`,`table_name`,`title`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;



# Dump of table directus_privileges
# ------------------------------------------------------------

DROP TABLE IF EXISTS `directus_privileges`;

CREATE TABLE `directus_privileges` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `table_name` varchar(255) NOT NULL DEFAULT '',
  `allow_view` tinyint(1) NOT NULL DEFAULT '0',
  `allow_add` tinyint(1) NOT NULL DEFAULT '0',
  `allow_edit` tinyint(1) NOT NULL DEFAULT '0',
  `allow_delete` tinyint(1) NOT NULL DEFAULT '0',
  `allow_alter` tinyint(1) NOT NULL DEFAULT '0',
  `group_id` int(11) unsigned NOT NULL,
  `read_field_blacklist` varchar(1000) DEFAULT NULL,
  `write_field_blacklist` varchar(1000) DEFAULT NULL,
  `nav_listed` tinyint(1) NOT NULL DEFAULT '1',
  `status_id` tinyint(1) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

LOCK TABLES `directus_privileges` WRITE;
/*!40000 ALTER TABLE `directus_privileges` DISABLE KEYS */;

INSERT INTO `directus_privileges` (`id`, `table_name`, `allow_view`, `allow_add`, `allow_edit`, `allow_delete`, `allow_alter`, `group_id`, `read_field_blacklist`, `write_field_blacklist`, `nav_listed`, `status_id`)
VALUES
	(1,'directus_activity',2,1,2,2,1,1,NULL,NULL,1,NULL),
	(2,'directus_columns',2,1,2,2,1,1,NULL,NULL,1,NULL),
	(3,'directus_groups',2,1,2,2,1,1,NULL,NULL,1,NULL),
	(4,'directus_files',2,1,2,2,1,1,NULL,NULL,1,NULL),
	(5,'directus_messages',2,1,2,2,1,1,NULL,NULL,1,NULL),
	(6,'directus_preferences',2,1,2,2,1,1,NULL,NULL,1,NULL),
	(7,'directus_privileges',2,1,2,2,1,1,NULL,NULL,1,NULL),
	(8,'directus_settings',2,1,2,2,1,1,NULL,NULL,1,NULL),
	(9,'directus_tables',2,1,2,2,1,1,NULL,NULL,1,NULL),
	(10,'directus_users',2,1,2,2,1,1,NULL,NULL,1,NULL),
	(11,'directus_messages_recipients',2,1,2,2,1,1,NULL,NULL,1,NULL),
	(12,'directus_bookmarks',2,1,2,2,1,1,NULL,NULL,1,NULL);

/*!40000 ALTER TABLE `directus_privileges` ENABLE KEYS */;
UNLOCK TABLES;


# Dump of table directus_schema_migrations
# ------------------------------------------------------------

DROP TABLE IF EXISTS `directus_schema_migrations`;

CREATE TABLE `directus_schema_migrations` (
  `version` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

LOCK TABLES `directus_schema_migrations` WRITE;
/*!40000 ALTER TABLE `directus_schema_migrations` DISABLE KEYS */;

INSERT INTO `directus_schema_migrations` (`version`)
VALUES
	('20150203221946'),
	('20150203235646'),
	('20150204002341'),
	('20150204003426'),
	('20150204015251'),
	('20150204021255'),
	('20150204022237'),
	('20150204023325'),
	('20150204024327'),
	('20150204031412'),
	('20150204041007'),
	('20150204042725');

/*!40000 ALTER TABLE `directus_schema_migrations` ENABLE KEYS */;
UNLOCK TABLES;


# Dump of table directus_settings
# ------------------------------------------------------------

DROP TABLE IF EXISTS `directus_settings`;

CREATE TABLE `directus_settings` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `collection` varchar(64) DEFAULT NULL,
  `name` varchar(64) DEFAULT NULL,
  `value` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `Unique Collection and Name` (`collection`,`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

LOCK TABLES `directus_settings` WRITE;
/*!40000 ALTER TABLE `directus_settings` DISABLE KEYS */;

INSERT INTO `directus_settings` (`id`, `collection`, `name`, `value`)
VALUES
	(1,'global','cms_user_auto_sign_out','60'),
	(2,'global','project_name','Directus'),
	(3,'global','project_url','http://directus.local'),
	(4,'global','rows_per_page','200'),
	(5,'files','thumbnail_quality','100'),
	(6,'files','thumbnail_size','200'),
	(7,'global','cms_thumbnail_url',''),
	(8,'files','file_naming','file_id'),
	(9,'files','thumbnail_crop_enabled','1'),
	(10,'files','youtube_api_key','');

/*!40000 ALTER TABLE `directus_settings` ENABLE KEYS */;
UNLOCK TABLES;


# Dump of table directus_tables
# ------------------------------------------------------------

DROP TABLE IF EXISTS `directus_tables`;

CREATE TABLE `directus_tables` (
  `table_name` varchar(64) NOT NULL DEFAULT '',
  `display_template` varchar(255) DEFAULT '',
  `preview_url` varchar(255) DEFAULT '',
  `hidden` tinyint(1) NOT NULL DEFAULT '0',
  `single` tinyint(1) NOT NULL DEFAULT '0',
  `default_status` tinyint(1) NOT NULL DEFAULT '1',
  `footer` tinyint(1) DEFAULT '0',
  `column_groupings` varchar(255) DEFAULT NULL,
  `primary_column` varchar(64) DEFAULT NULL,
  `sort_column` varchar(64) DEFAULT NULL,
  `status_column` varchar(64) DEFAULT NULL,
  `status_mapping` text,
  `user_create_column` varchar(64) DEFAULT NULL,
  `user_update_column` varchar(64) DEFAULT NULL,
  `date_create_column` varchar(64) DEFAULT NULL,
  `date_update_column` varchar(64) DEFAULT NULL,
  `filter_column_blacklist` text,
  PRIMARY KEY (`table_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

LOCK TABLES `directus_tables` WRITE;
/*!40000 ALTER TABLE `directus_tables` DISABLE KEYS */;

INSERT INTO `directus_tables` (`table_name`, `display_template`, `preview_url`, `hidden`, `single`, `default_status`, `footer`, `column_groupings`, `primary_column`, `sort_column`, `status_column`, `status_mapping`, `user_create_column`, `user_update_column`, `date_create_column`, `date_update_column`, `filter_column_blacklist`)
VALUES
	('directus_bookmarks','','',1,0,1,0,NULL,NULL,NULL,NULL,NULL,'user',NULL,NULL,NULL,NULL),
	('directus_files','','',1,0,1,0,NULL,NULL,NULL,NULL,NULL,'user',NULL,NULL,NULL,NULL),
	('directus_messages_recipients','','',1,0,1,0,NULL,NULL,NULL,NULL,NULL,'recipient',NULL,NULL,NULL,NULL),
	('directus_preferences','','',1,0,1,0,NULL,NULL,NULL,NULL,NULL,'user',NULL,NULL,NULL,NULL),
	('directus_users','','',1,0,1,0,NULL,NULL,NULL,NULL,NULL,'id',NULL,NULL,NULL,NULL);

/*!40000 ALTER TABLE `directus_tables` ENABLE KEYS */;
UNLOCK TABLES;


# Dump of table directus_users
# ------------------------------------------------------------

DROP TABLE IF EXISTS `directus_users`;

CREATE TABLE `directus_users` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `status` tinyint(1) DEFAULT '1',
  `first_name` varchar(50) DEFAULT '',
  `last_name` varchar(50) DEFAULT '',
  `email` varchar(128) NOT NULL DEFAULT '',
  `password` varchar(255) DEFAULT '',
  `salt` varchar(255) DEFAULT '',
  `token` varchar(128) DEFAULT NULL,
  `access_token` varchar(255) DEFAULT '',
  `reset_token` varchar(255) DEFAULT '',
  `reset_expiration` datetime DEFAULT NULL,
  `position` varchar(500) DEFAULT '',
  `email_messages` tinyint(1) DEFAULT '1',
  `last_login` datetime DEFAULT NULL,
  `last_access` datetime DEFAULT NULL,
  `last_page` varchar(255) DEFAULT '',
  `ip` varchar(50) DEFAULT '',
  `group` int(11) unsigned DEFAULT NULL,
  `avatar` varchar(500) DEFAULT NULL,
  `avatar_file_id` int(11) unsigned DEFAULT NULL,
  `location` varchar(255) DEFAULT NULL,
  `phone` varchar(255) DEFAULT NULL,
  `address` varchar(255) DEFAULT NULL,
  `city` varchar(255) DEFAULT NULL,
  `state` varchar(2) DEFAULT NULL,
  `country` char(2) DEFAULT NULL,
  `zip` varchar(10) DEFAULT NULL,
  `language` varchar(8) DEFAULT 'en',
  `timezone` varchar(32) DEFAULT 'America/New_York',
  `invite_token` varchar(255) DEFAULT NULL,
  `invite_date` datetime DEFAULT NULL,
  `invite_sender` int(11) unsigned DEFAULT NULL,
  `invite_accepted` tinyint(1) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `directus_users_email_unique` (`email`),
  UNIQUE KEY `directus_users_token_unique` (`token`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

LOCK TABLES `directus_users` WRITE;
/*!40000 ALTER TABLE `directus_users` DISABLE KEYS */;

INSERT INTO `directus_users` (`id`, `status`, `first_name`, `last_name`, `email`, `password`, `salt`, `token`, `access_token`, `reset_token`, `reset_expiration`, `position`, `email_messages`, `last_login`, `last_access`, `last_page`, `ip`, `group`, `avatar`, `avatar_file_id`, `location`, `phone`, `address`, `city`, `state`, `country`, `zip`, `language`, `timezone`, `invite_token`, `invite_date`, `invite_sender`, `invite_accepted`)
VALUES
	(1,1,'Admin','User','admin@admin.com','$2y$12$wzU2hwDsGfofO5swMxVY6exTRcC.IkB4gKNu4RKdnW40p4LTudQ96','36JjNIG3eGVoYDky','vpqBqeRX4CGw2OgDdZxv9H26Rw8mIo4Z','','',NULL,'',1,NULL,NULL,'','',1,'//www.gravatar.com/avatar/64e1b8d34f425d19e1ee2ea7236d3028?s=200&d=identicon&r=g',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'en','America/New_York',NULL,NULL,NULL,NULL);

/*!40000 ALTER TABLE `directus_users` ENABLE KEYS */;
UNLOCK TABLES;



/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;
/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;

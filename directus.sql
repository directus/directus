# ************************************************************
# Sequel Pro SQL dump
# Version 4004
#
# http://www.sequelpro.com/
# http://code.google.com/p/sequel-pro/
#
# Host: localhost (MySQL 5.5.25)
# Database: soulcycle
# Generation Time: 2013-03-06 00:30:44 +0000
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
  `id` int(10) NOT NULL AUTO_INCREMENT,
  `type` varchar(100) DEFAULT NULL,
  `action` varchar(100) NOT NULL,
  `identifier` varchar(100) DEFAULT NULL,
  `table_name` varchar(100) NOT NULL DEFAULT '',
  `row_id` int(10) DEFAULT NULL,
  `user` int(10) NOT NULL DEFAULT '0',
  `data` text,
  `parent_id` int(11) DEFAULT NULL,
  `datetime` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8 COMMENT='Contains history of revisions';



# Dump of table directus_columns
# ------------------------------------------------------------

DROP TABLE IF EXISTS `directus_columns`;

CREATE TABLE `directus_columns` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `table_name` varchar(64) NOT NULL DEFAULT '',
  `column_name` varchar(64) NOT NULL DEFAULT '',
  `data_type` varchar(64) DEFAULT NULL,
  `ui` varchar(64) DEFAULT NULL,
  `system` tinyint(1) NOT NULL DEFAULT '0',
  `master` tinyint(1) NOT NULL DEFAULT '0',
  `hidden_input` tinyint(1) NOT NULL DEFAULT '0',
  `hidden_list` tinyint(1) NOT NULL DEFAULT '0',
  `required` tinyint(1) NOT NULL DEFAULT '0',
  `table_related` varchar(64) DEFAULT NULL,
  `junction_table` varchar(64) DEFAULT NULL,
  `junction_key_left` varchar(64) DEFAULT NULL,
  `junction_key_right` varchar(64) DEFAULT NULL,
  `sort` int(11) DEFAULT NULL,
  `comment` varchar(1024) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `table-column` (`table_name`,`column_name`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;



# Dump of table directus_groups
# ------------------------------------------------------------

DROP TABLE IF EXISTS `directus_groups`;

CREATE TABLE `directus_groups` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(100) DEFAULT NULL,
  `description` varchar(500) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;



# Dump of table directus_media
# ------------------------------------------------------------

DROP TABLE IF EXISTS `directus_media`;

CREATE TABLE `directus_media` (
  `id` int(10) NOT NULL AUTO_INCREMENT,
  `active` tinyint(1) DEFAULT '1',
  `name` varchar(255) DEFAULT NULL,
  `title` varchar(255) DEFAULT '',
  `location` varchar(200) DEFAULT NULL,
  `type` varchar(50) DEFAULT '',
  `charset` varchar(50) DEFAULT '',
  `caption` text,
  `tags` varchar(255) DEFAULT '',
  `width` int(5) DEFAULT '0',
  `height` int(5) DEFAULT '0',
  `size` int(20) DEFAULT '0',
  `embed_id` varchar(200) DEFAULT NULL,
  `user` int(11) DEFAULT NULL,
  `date_uploaded` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8 COMMENT='Directus Media Storage';



# Dump of table directus_messages
# ------------------------------------------------------------

DROP TABLE IF EXISTS `directus_messages`;

CREATE TABLE `directus_messages` (
  `id` int(10) NOT NULL AUTO_INCREMENT,
  `active` tinyint(1) NOT NULL DEFAULT '1',
  `subject` varchar(255) NOT NULL DEFAULT '',
  `message` text NOT NULL,
  `datetime` datetime NOT NULL DEFAULT '0000-00-00 00:00:00',
  `reply` int(10) NOT NULL DEFAULT '0',
  `from` int(10) NOT NULL DEFAULT '0',
  `to` varchar(255) NOT NULL DEFAULT '',
  `viewed` varchar(255) NOT NULL DEFAULT ',',
  `archived` varchar(255) NOT NULL DEFAULT ',',
  `table` varchar(255) NOT NULL DEFAULT '',
  `row` varchar(255) NOT NULL DEFAULT '',
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;



# Dump of table directus_preferences
# ------------------------------------------------------------

DROP TABLE IF EXISTS `directus_preferences`;

CREATE TABLE `directus_preferences` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `user` int(11) DEFAULT NULL,
  `table_name` varchar(64) DEFAULT NULL,
  `columns_visible` varchar(300) DEFAULT NULL,
  `sort` varchar(64) DEFAULT 'id',
  `sort_order` varchar(5) DEFAULT 'asc',
  `active` varchar(5) DEFAULT '3',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;



# Dump of table directus_privileges
# ------------------------------------------------------------

DROP TABLE IF EXISTS `directus_privileges`;

CREATE TABLE `directus_privileges` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `group_id` int(11) DEFAULT NULL,
  `table_name` varchar(64) DEFAULT NULL,
  `type` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;



# Dump of table directus_settings
# ------------------------------------------------------------

DROP TABLE IF EXISTS `directus_settings`;

CREATE TABLE `directus_settings` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `collection` varchar(250) DEFAULT NULL,
  `name` varchar(250) DEFAULT NULL,
  `value` varchar(250) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name_collection` (`name`,`collection`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;



# Dump of table directus_tables
# ------------------------------------------------------------

DROP TABLE IF EXISTS `directus_tables`;

CREATE TABLE `directus_tables` (
  `table_name` varchar(64) NOT NULL DEFAULT '',
  `hidden` tinyint(1) NOT NULL DEFAULT '0',
  `single` tinyint(1) NOT NULL DEFAULT '0',
  `inactive_by_default` tinyint(1) NOT NULL DEFAULT '0',
  `is_junction_table` tinyint(1) NOT NULL DEFAULT '0',
  `footer` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`table_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;



# Dump of table directus_ui
# ------------------------------------------------------------

DROP TABLE IF EXISTS `directus_ui`;

CREATE TABLE `directus_ui` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `table_name` varchar(64) DEFAULT NULL,
  `column_name` varchar(64) DEFAULT NULL,
  `ui_name` varchar(200) DEFAULT NULL,
  `name` varchar(200) DEFAULT NULL,
  `value` text,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique` (`table_name`,`column_name`,`ui_name`,`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;



# Dump of table directus_users
# ------------------------------------------------------------

DROP TABLE IF EXISTS `directus_users`;

CREATE TABLE `directus_users` (
  `id` tinyint(10) NOT NULL AUTO_INCREMENT,
  `active` tinyint(1) DEFAULT '1',
  `first_name` varchar(50) DEFAULT '',
  `last_name` varchar(50) DEFAULT '',
  `email` varchar(255) DEFAULT '',
  `password` varchar(255) DEFAULT '',
  `token` varchar(255) DEFAULT '',
  `reset_token` varchar(255) DEFAULT '',
  `reset_expiration` datetime DEFAULT NULL,
  `description` text,
  `email_messages` tinyint(1) DEFAULT '1',
  `last_login` datetime DEFAULT '0000-00-00 00:00:00',
  `last_page` varchar(255) DEFAULT '',
  `ip` varchar(50) DEFAULT '',
  `group` int(11) DEFAULT NULL,
  `avatar` varchar(500) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;




/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;
/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;

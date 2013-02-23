# ************************************************************
# Sequel Pro SQL dump
# Version 4004
#
# http://www.sequelpro.com/
# http://code.google.com/p/sequel-pro/
#
# Host: localhost (MySQL 5.5.25)
# Database: directus
# Generation Time: 2013-02-23 00:33:57 +0000
# ************************************************************


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;


# Dump of table about
# ------------------------------------------------------------

DROP TABLE IF EXISTS `about`;

CREATE TABLE `about` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `active` tinyint(1) DEFAULT NULL,
  `title` varchar(255) NOT NULL DEFAULT '',
  `description` text NOT NULL,
  `banner_image` int(11) NOT NULL,
  `button_link` varchar(255) NOT NULL DEFAULT '' COMMENT 'ie: BOOKMARK CLASSES',
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

LOCK TABLES `about` WRITE;
/*!40000 ALTER TABLE `about` DISABLE KEYS */;

INSERT INTO `about` (`id`, `active`, `title`, `description`, `banner_image`, `button_link`)
VALUES
	(1,1,'i am active to','test test',0,'');

/*!40000 ALTER TABLE `about` ENABLE KEYS */;
UNLOCK TABLES;


# Dump of table bike_parts
# ------------------------------------------------------------

DROP TABLE IF EXISTS `bike_parts`;

CREATE TABLE `bike_parts` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `serial_number` varchar(255) NOT NULL,
  `price` double NOT NULL,
  `part_allocation` varchar(255) NOT NULL COMMENT 'This should probably be a field for each LOCATION with the QUANTITY of this part... and use a custom UI to move items between',
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;



# Dump of table bike_tickets
# ------------------------------------------------------------

DROP TABLE IF EXISTS `bike_tickets`;

CREATE TABLE `bike_tickets` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `bike_id` int(11) NOT NULL,
  `studio_id` int(11) NOT NULL,
  `position` int(11) NOT NULL,
  `complaint` varchar(255) NOT NULL,
  `comment` text NOT NULL,
  `date_created` date NOT NULL,
  `adjusted` tinyint(1) NOT NULL,
  `parts_used` varchar(255) NOT NULL COMMENT 'Custom UI that asks which location the part is from and reduces inventory.',
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

LOCK TABLES `bike_tickets` WRITE;
/*!40000 ALTER TABLE `bike_tickets` DISABLE KEYS */;

INSERT INTO `bike_tickets` (`id`, `bike_id`, `studio_id`, `position`, `complaint`, `comment`, `date_created`, `adjusted`, `parts_used`)
VALUES
	(1,0,0,0,'','','0000-00-00',0,'');

/*!40000 ALTER TABLE `bike_tickets` ENABLE KEYS */;
UNLOCK TABLES;


# Dump of table bikes
# ------------------------------------------------------------

DROP TABLE IF EXISTS `bikes`;

CREATE TABLE `bikes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `room_id` int(11) NOT NULL,
  `bike_number` int(11) NOT NULL,
  `position` varchar(10) NOT NULL COMMENT 'x,y',
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;



# Dump of table bookmarks
# ------------------------------------------------------------

DROP TABLE IF EXISTS `bookmarks`;

CREATE TABLE `bookmarks` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `class_id` int(11) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

LOCK TABLES `bookmarks` WRITE;
/*!40000 ALTER TABLE `bookmarks` DISABLE KEYS */;

INSERT INTO `bookmarks` (`id`, `user_id`, `class_id`)
VALUES
	(0,1,17);

/*!40000 ALTER TABLE `bookmarks` ENABLE KEYS */;
UNLOCK TABLES;


# Dump of table class_types
# ------------------------------------------------------------

DROP TABLE IF EXISTS `class_types`;

CREATE TABLE `class_types` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `active` tinyint(1) NOT NULL,
  `title` varchar(255) NOT NULL DEFAULT '',
  `description` text NOT NULL,
  `banner_image` int(11) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

LOCK TABLES `class_types` WRITE;
/*!40000 ALTER TABLE `class_types` DISABLE KEYS */;

INSERT INTO `class_types` (`id`, `active`, `title`, `description`, `banner_image`)
VALUES
	(1,2,'Classixx','',0);

/*!40000 ALTER TABLE `class_types` ENABLE KEYS */;
UNLOCK TABLES;


# Dump of table classes
# ------------------------------------------------------------

DROP TABLE IF EXISTS `classes`;

CREATE TABLE `classes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `room_id` int(11) NOT NULL,
  `instructor_id` int(11) NOT NULL,
  `class_type_id` int(11) NOT NULL,
  `datetime` datetime NOT NULL,
  `note` text NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

LOCK TABLES `classes` WRITE;
/*!40000 ALTER TABLE `classes` DISABLE KEYS */;

INSERT INTO `classes` (`id`, `room_id`, `instructor_id`, `class_type_id`, `datetime`, `note`)
VALUES
	(21,1,2,1,'0000-00-00 00:00:00','TEST'),
	(20,1,2,1,'0000-00-00 00:00:00','new class'),
	(19,1,2,1,'0000-00-00 00:00:00',''),
	(18,1,2,1,'0000-00-00 00:00:00',''),
	(17,3,2,1,'0000-00-00 00:00:00','TEST');

/*!40000 ALTER TABLE `classes` ENABLE KEYS */;
UNLOCK TABLES;


# Dump of table community
# ------------------------------------------------------------

DROP TABLE IF EXISTS `community`;

CREATE TABLE `community` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL DEFAULT '',
  `category` int(11) NOT NULL,
  `description` text NOT NULL,
  `media` varchar(255) NOT NULL,
  `datetime` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;



# Dump of table community_categories
# ------------------------------------------------------------

DROP TABLE IF EXISTS `community_categories`;

CREATE TABLE `community_categories` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL DEFAULT '',
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8 COMMENT='Test';

LOCK TABLES `community_categories` WRITE;
/*!40000 ALTER TABLE `community_categories` DISABLE KEYS */;

INSERT INTO `community_categories` (`id`, `title`)
VALUES
	(1,'Category 1'),
	(2,'Category 2');

/*!40000 ALTER TABLE `community_categories` ENABLE KEYS */;
UNLOCK TABLES;


# Dump of table community_comments
# ------------------------------------------------------------

DROP TABLE IF EXISTS `community_comments`;

CREATE TABLE `community_comments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `active` tinyint(1) NOT NULL,
  `user_id` int(11) NOT NULL,
  `comment` text NOT NULL,
  `datetime` datetime NOT NULL,
  `community_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;



# Dump of table demo_table
# ------------------------------------------------------------

DROP TABLE IF EXISTS `demo_table`;

CREATE TABLE `demo_table` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `title` varchar(100) DEFAULT NULL,
  `number` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

LOCK TABLES `demo_table` WRITE;
/*!40000 ALTER TABLE `demo_table` DISABLE KEYS */;

INSERT INTO `demo_table` (`id`, `title`, `number`)
VALUES
	(1,'Test2',0);

/*!40000 ALTER TABLE `demo_table` ENABLE KEYS */;
UNLOCK TABLES;


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

LOCK TABLES `directus_activity` WRITE;
/*!40000 ALTER TABLE `directus_activity` DISABLE KEYS */;

INSERT INTO `directus_activity` (`id`, `type`, `action`, `identifier`, `table_name`, `row_id`, `user`, `data`, `parent_id`, `datetime`)
VALUES
	(185,'ENTRY','UPDATE','tengu','users',1,1,'{\"id\":1,\"active\":1,\"first_name\":\"tengu\",\"last_name\":\"Sundstr\\u00c3\\u00b6m\",\"email\":\"olov@rngr.org\",\"gender\":\"\",\"password\":\"\",\"region\":1,\"phone_number\":\"\",\"address_1\":\"\",\"address_2\":\"\",\"city\":\"\",\"state\":\"\",\"zip\":0,\"billing_address_1\":\"\",\"billing_address_2\":\"\",\"billing_city\":\"\",\"billing_state\":\"\",\"billing_zip\":0,\"authorize_id\":0,\"joined\":\"Wed, 30 Nov -001 00:00:00 -0500\",\"last_login\":\"Wed, 30 Nov -001 00:00:00 -0500\",\"shoe_size\":0,\"bike_bar_height\":0,\"bike_seat_height\":0,\"service_water\":0,\"service_shoes\":0}',184,'2013-02-15 19:51:03'),
	(182,'ENTRY','ADD',NULL,'bookmarks',0,1,'{\"class_id\":17,\"user_id\":1}',180,'2013-02-15 19:50:48'),
	(183,'SETTINGS','UPDATE','unit_test','directus_settings',NULL,1,'{\"media_folder\":\"resources\",\"media_naming\":\"unique\",\"allowed_thumbnails\":\"test test test\",\"zxczxczxc\":\"zxczxc\",\"thumbnail_quality\":\"90\"}',NULL,'2013-02-15 19:51:03'),
	(184,'ENTRY','UPDATE','TEST','classes',17,1,'{\"id\":17,\"room_id\":\"3\",\"instructor_id\":\"2\",\"class_type_id\":\"1\",\"datetime\":\"Wed, 30 Nov -001 00:00:00 -0500\",\"note\":\"TEST\"}',NULL,'2013-02-15 19:51:03'),
	(180,'ENTRY','UPDATE','TEST','classes',17,1,'{\"id\":17,\"room_id\":\"3\",\"instructor_id\":\"2\",\"class_type_id\":\"1\",\"datetime\":\"Wed, 30 Nov -001 00:00:00 -0500\",\"note\":\"TEST\"}',NULL,'2013-02-15 19:50:48'),
	(181,'ENTRY','UPDATE','tengu','users',1,1,'{\"id\":1,\"active\":1,\"first_name\":\"tengu\",\"last_name\":\"Sundstr\\u00c3\\u00b6m\",\"email\":\"olov@rngr.org\",\"gender\":\"\",\"password\":\"\",\"region\":1,\"phone_number\":\"\",\"address_1\":\"\",\"address_2\":\"\",\"city\":\"\",\"state\":\"\",\"zip\":0,\"billing_address_1\":\"\",\"billing_address_2\":\"\",\"billing_city\":\"\",\"billing_state\":\"\",\"billing_zip\":0,\"authorize_id\":0,\"joined\":\"Wed, 30 Nov -001 00:00:00 -0500\",\"last_login\":\"Wed, 30 Nov -001 00:00:00 -0500\",\"shoe_size\":0,\"bike_bar_height\":0,\"bike_seat_height\":0,\"service_water\":0,\"service_shoes\":0}',180,'2013-02-15 19:50:48'),
	(178,'ENTRY','ADD',NULL,'bookmarks',0,1,'{\"class_id\":17,\"user_id\":1}',176,'2013-02-15 19:45:17'),
	(179,'SETTINGS','UPDATE','unit_test','directus_settings',NULL,1,'{\"media_folder\":\"resources\",\"media_naming\":\"unique\",\"allowed_thumbnails\":\"test test test\",\"zxczxczxc\":\"zxczxc\",\"thumbnail_quality\":\"90\"}',NULL,'2013-02-15 19:50:48'),
	(176,'ENTRY','UPDATE','TEST','classes',17,1,'{\"id\":17,\"room_id\":\"3\",\"instructor_id\":\"2\",\"class_type_id\":\"1\",\"datetime\":\"Wed, 30 Nov -001 00:00:00 -0500\",\"note\":\"TEST\"}',NULL,'2013-02-15 19:45:17'),
	(177,'ENTRY','UPDATE','tengu','users',1,1,'{\"id\":1,\"active\":1,\"first_name\":\"tengu\",\"last_name\":\"Sundstr\\u00c3\\u00b6m\",\"email\":\"olov@rngr.org\",\"gender\":\"\",\"password\":\"\",\"region\":1,\"phone_number\":\"\",\"address_1\":\"\",\"address_2\":\"\",\"city\":\"\",\"state\":\"\",\"zip\":0,\"billing_address_1\":\"\",\"billing_address_2\":\"\",\"billing_city\":\"\",\"billing_state\":\"\",\"billing_zip\":0,\"authorize_id\":0,\"joined\":\"Wed, 30 Nov -001 00:00:00 -0500\",\"last_login\":\"Wed, 30 Nov -001 00:00:00 -0500\",\"shoe_size\":0,\"bike_bar_height\":0,\"bike_seat_height\":0,\"service_water\":0,\"service_shoes\":0}',176,'2013-02-15 19:45:17'),
	(175,'SETTINGS','UPDATE','unit_test','directus_settings',NULL,1,'{\"media_folder\":\"resources\",\"media_naming\":\"unique\",\"allowed_thumbnails\":\"test test test\",\"zxczxczxc\":\"zxczxc\",\"thumbnail_quality\":\"90\"}',NULL,'2013-02-15 19:45:16'),
	(174,'ENTRY','ADD',NULL,'bookmarks',0,1,'{\"class_id\":17,\"user_id\":1}',172,'2013-02-15 19:44:02'),
	(172,'ENTRY','UPDATE','TEST','classes',17,1,'{\"id\":17,\"room_id\":\"3\",\"instructor_id\":\"2\",\"class_type_id\":\"1\",\"datetime\":\"Wed, 30 Nov -001 00:00:00 -0500\",\"note\":\"TEST\"}',NULL,'2013-02-15 19:44:02'),
	(173,'ENTRY','UPDATE','tengu','users',1,1,'{\"id\":1,\"active\":1,\"first_name\":\"tengu\",\"last_name\":\"Sundstr\\u00c3\\u00b6m\",\"email\":\"olov@rngr.org\",\"gender\":\"\",\"password\":\"\",\"region\":1,\"phone_number\":\"\",\"address_1\":\"\",\"address_2\":\"\",\"city\":\"\",\"state\":\"\",\"zip\":0,\"billing_address_1\":\"\",\"billing_address_2\":\"\",\"billing_city\":\"\",\"billing_state\":\"\",\"billing_zip\":0,\"authorize_id\":0,\"joined\":\"Wed, 30 Nov -001 00:00:00 -0500\",\"last_login\":\"Wed, 30 Nov -001 00:00:00 -0500\",\"shoe_size\":0,\"bike_bar_height\":0,\"bike_seat_height\":0,\"service_water\":0,\"service_shoes\":0}',172,'2013-02-15 19:44:02'),
	(170,'ENTRY','ADD',NULL,'bookmarks',0,1,'{\"class_id\":17,\"user_id\":1}',168,'2013-02-15 19:39:30'),
	(171,'SETTINGS','UPDATE','unit_test','directus_settings',NULL,1,'{\"media_folder\":\"resources\",\"media_naming\":\"unique\",\"allowed_thumbnails\":\"test test test\",\"zxczxczxc\":\"zxczxc\",\"thumbnail_quality\":\"90\"}',NULL,'2013-02-15 19:44:01'),
	(169,'ENTRY','UPDATE','tengu','users',1,1,'{\"id\":1,\"active\":1,\"first_name\":\"tengu\",\"last_name\":\"Sundstr\\u00c3\\u00b6m\",\"email\":\"olov@rngr.org\",\"gender\":\"\",\"password\":\"\",\"region\":1,\"phone_number\":\"\",\"address_1\":\"\",\"address_2\":\"\",\"city\":\"\",\"state\":\"\",\"zip\":0,\"billing_address_1\":\"\",\"billing_address_2\":\"\",\"billing_city\":\"\",\"billing_state\":\"\",\"billing_zip\":0,\"authorize_id\":0,\"joined\":\"Wed, 30 Nov -001 00:00:00 -0500\",\"last_login\":\"Wed, 30 Nov -001 00:00:00 -0500\",\"shoe_size\":0,\"bike_bar_height\":0,\"bike_seat_height\":0,\"service_water\":0,\"service_shoes\":0}',168,'2013-02-15 19:39:30'),
	(168,'ENTRY','UPDATE','TEST','classes',17,1,'{\"id\":17,\"room_id\":\"3\",\"instructor_id\":\"2\",\"class_type_id\":\"1\",\"datetime\":\"Wed, 30 Nov -001 00:00:00 -0500\",\"note\":\"TEST\"}',NULL,'2013-02-15 19:39:30'),
	(167,'SETTINGS','UPDATE','unit_test','directus_settings',NULL,1,'{\"media_folder\":\"resources\",\"media_naming\":\"unique\",\"allowed_thumbnails\":\"test test test\",\"zxczxczxc\":\"zxczxc\",\"thumbnail_quality\":\"90\"}',NULL,'2013-02-15 19:39:30'),
	(166,'SETTINGS','UPDATE','global','directus_settings',NULL,1,'{\"site_name\":\"soulcycle\",\"site_url\":\"http:\\/\\/www.rngr.org\",\"cms_color\":\"green\",\"cms_user_auto_sign_out\":\"10\"}',NULL,'2013-02-15 16:54:25'),
	(165,'SETTINGS','UPDATE','media','directus_settings',NULL,1,'{\"media_folder\":\"resources\",\"media_naming\":\"original\",\"allowed_thumbnails\":\"abc 123\",\"zxczxczxc\":\"zxczxc\",\"thumbnail_quality\":\"80\",\"site_name\":\"soulcycle\",\"site_url\":\"\",\"cms_color\":\"green\",\"cms_user_auto_sign_out\":\"\"}',NULL,'2013-02-15 16:51:29'),
	(161,'ENTRY','UPDATE','Classixx','class_types',1,1,'{\"id\":1,\"active\":\"2\",\"title\":\"Classixx\",\"description\":\"\",\"banner_image\":\"\"}',NULL,'2013-02-15 15:51:39'),
	(162,'UI','UPDATE','instructor_music,artist,textinput','directus_ui',0,1,'{\"readonly\":\"on\"}',NULL,'2013-02-15 16:28:47'),
	(163,'UI','UPDATE','instructor_music,track_name,textinput','directus_ui',0,1,'{\"readonly\":\"on\"}',NULL,'2013-02-15 16:28:54'),
	(164,'UI','UPDATE','instructor_music,album_art_url,textinput','directus_ui',0,1,'{\"readonly\":\"on\"}',NULL,'2013-02-15 16:28:57'),
	(160,'ENTRY','UPDATE','','classes',18,1,'{\"id\":18,\"room_id\":\"1\",\"instructor_id\":\"2\",\"class_type_id\":\"1\",\"datetime\":\"Wed, 30 Nov -001 00:00:00 -0500\",\"note\":\"\"}',NULL,'2013-02-15 15:20:44'),
	(159,'ENTRY','ADD','TEST','classes',21,1,'{\"room_id\":\"1\",\"instructor_id\":\"2\",\"class_type_id\":\"1\",\"datetime\":\"\",\"note\":\"TEST\"}',NULL,'2013-02-15 00:07:14'),
	(158,'ENTRY','UPDATE',NULL,'bookmarks',0,1,'{\"class_id\":17,\"user_id\":1,\"id\":\"0\"}',156,'2013-02-15 00:07:01'),
	(157,'ENTRY','UPDATE','tengu','users',1,1,'{\"id\":1,\"active\":1,\"email\":\"olov@rngr.org\",\"first_name\":\"tengu\",\"last_name\":\"Sundstr\\u00c3\\u00b6m\",\"gender\":\"\",\"password\":\"\",\"region\":1,\"phone_number\":\"\",\"address_1\":\"\",\"address_2\":\"\",\"city\":\"\",\"state\":\"\",\"zip\":0,\"billing_address_1\":\"\",\"billing_address_2\":\"\",\"billing_city\":\"\",\"billing_state\":\"\",\"billing_zip\":0,\"authorize_id\":0,\"joined\":\"0000-00-00 00:00:00\",\"last_login\":\"0000-00-00 00:00:00\",\"shoe_size\":0,\"bike_bar_height\":0,\"bike_seat_height\":0,\"service_water\":0,\"service_shoes\":0}',156,'2013-02-15 00:07:01'),
	(155,'ENTRY','UPDATE',NULL,'bookmarks',0,1,'{\"class_id\":17,\"user_id\":1,\"id\":\"0\"}',153,'2013-02-14 23:44:26'),
	(156,'ENTRY','UPDATE','TEST AGAIN','classes',17,1,'{\"id\":17,\"room_id\":\"3\",\"instructor_id\":\"2\",\"class_type_id\":\"1\",\"datetime\":\"Wed, 30 Nov -001 00:00:00 -0500\",\"note\":\"TEST AGAIN\"}',NULL,'2013-02-15 00:07:01'),
	(154,'ENTRY','UPDATE','tengu','users',1,1,'{\"id\":1,\"active\":1,\"email\":\"olov@rngr.org\",\"first_name\":\"tengu\",\"last_name\":\"Sundstr\\u00c3\\u00b6m\",\"gender\":\"\",\"password\":\"\",\"region\":1,\"phone_number\":\"\",\"address_1\":\"\",\"address_2\":\"\",\"city\":\"\",\"state\":\"\",\"zip\":0,\"billing_address_1\":\"\",\"billing_address_2\":\"\",\"billing_city\":\"\",\"billing_state\":\"\",\"billing_zip\":0,\"authorize_id\":0,\"joined\":\"0000-00-00 00:00:00\",\"last_login\":\"0000-00-00 00:00:00\",\"shoe_size\":0,\"bike_bar_height\":0,\"bike_seat_height\":0,\"service_water\":0,\"service_shoes\":0}',153,'2013-02-14 23:44:26'),
	(153,'ENTRY','UPDATE','TEST AGAIN','classes',17,1,'{\"id\":17,\"room_id\":\"3\",\"instructor_id\":\"2\",\"class_type_id\":\"1\",\"datetime\":\"Wed, 30 Nov -001 00:00:00 -0500\",\"note\":\"TEST AGAIN\"}',NULL,'2013-02-14 23:44:26'),
	(186,'ENTRY','ADD',NULL,'bookmarks',0,1,'{\"class_id\":17,\"user_id\":1}',184,'2013-02-15 19:51:03'),
	(187,'SETTINGS','UPDATE','unit_test','directus_settings',NULL,1,'{\"media_folder\":\"resources\",\"media_naming\":\"unique\",\"allowed_thumbnails\":\"test test test\",\"zxczxczxc\":\"zxczxc\",\"thumbnail_quality\":\"90\"}',NULL,'2013-02-15 19:52:59'),
	(188,'ENTRY','UPDATE','TEST','classes',17,1,'{\"id\":17,\"room_id\":\"3\",\"instructor_id\":\"2\",\"class_type_id\":\"1\",\"datetime\":\"Wed, 30 Nov -001 00:00:00 -0500\",\"note\":\"TEST\"}',NULL,'2013-02-15 19:52:59'),
	(189,'ENTRY','UPDATE','tengu','users',1,1,'{\"id\":1,\"active\":1,\"first_name\":\"tengu\",\"last_name\":\"Sundstr\\u00c3\\u00b6m\",\"email\":\"olov@rngr.org\",\"gender\":\"\",\"password\":\"\",\"region\":1,\"phone_number\":\"\",\"address_1\":\"\",\"address_2\":\"\",\"city\":\"\",\"state\":\"\",\"zip\":0,\"billing_address_1\":\"\",\"billing_address_2\":\"\",\"billing_city\":\"\",\"billing_state\":\"\",\"billing_zip\":0,\"authorize_id\":0,\"joined\":\"Wed, 30 Nov -001 00:00:00 -0500\",\"last_login\":\"Wed, 30 Nov -001 00:00:00 -0500\",\"shoe_size\":0,\"bike_bar_height\":0,\"bike_seat_height\":0,\"service_water\":0,\"service_shoes\":0}',188,'2013-02-15 19:52:59'),
	(190,'ENTRY','ADD',NULL,'bookmarks',0,1,'{\"class_id\":17,\"user_id\":1}',188,'2013-02-15 19:52:59'),
	(191,'SETTINGS','UPDATE','unit_test','directus_settings',NULL,1,'{\"media_folder\":\"resources\",\"media_naming\":\"unique\",\"allowed_thumbnails\":\"test test test\",\"zxczxczxc\":\"zxczxc\",\"thumbnail_quality\":\"90\"}',NULL,'2013-02-15 19:53:17'),
	(192,'ENTRY','UPDATE','TEST','classes',17,1,'{\"id\":17,\"room_id\":\"3\",\"instructor_id\":\"2\",\"class_type_id\":\"1\",\"datetime\":\"Wed, 30 Nov -001 00:00:00 -0500\",\"note\":\"TEST\"}',NULL,'2013-02-15 19:53:17'),
	(193,'ENTRY','UPDATE','tengu','users',1,1,'{\"id\":1,\"active\":1,\"first_name\":\"tengu\",\"last_name\":\"Sundstr\\u00c3\\u00b6m\",\"email\":\"olov@rngr.org\",\"gender\":\"\",\"password\":\"\",\"region\":1,\"phone_number\":\"\",\"address_1\":\"\",\"address_2\":\"\",\"city\":\"\",\"state\":\"\",\"zip\":0,\"billing_address_1\":\"\",\"billing_address_2\":\"\",\"billing_city\":\"\",\"billing_state\":\"\",\"billing_zip\":0,\"authorize_id\":0,\"joined\":\"Wed, 30 Nov -001 00:00:00 -0500\",\"last_login\":\"Wed, 30 Nov -001 00:00:00 -0500\",\"shoe_size\":0,\"bike_bar_height\":0,\"bike_seat_height\":0,\"service_water\":0,\"service_shoes\":0}',192,'2013-02-15 19:53:17'),
	(194,'ENTRY','ADD',NULL,'bookmarks',0,1,'{\"class_id\":17,\"user_id\":1}',192,'2013-02-15 19:53:17'),
	(195,'ENTRY','UPDATE','Olov','users',2,1,'{\"id\":2,\"active\":\"1\",\"first_name\":\"Olov\",\"last_name\":\"Sundstrom\",\"email\":\"olov@rngr.org\",\"gender\":\"M\",\"password\":\"\",\"region\":\"\",\"phone_number\":\"\",\"address_1\":\"\",\"address_2\":\"\",\"city\":\"\",\"state\":\"\",\"zip\":\"\",\"billing_address_1\":\"\",\"billing_address_2\":\"\",\"billing_city\":\"\",\"billing_state\":\"\",\"billing_zip\":\"\",\"authorize_id\":\"\",\"joined\":\"Wed, 30 Nov -001 00:00:00 -0500\",\"last_login\":\"Wed, 30 Nov -001 00:00:00 -0500\",\"shoe_size\":\"\",\"bike_bar_height\":\"\",\"bike_seat_height\":\"\",\"service_water\":0,\"service_shoes\":0}',NULL,'2013-02-15 19:58:06'),
	(196,'ENTRY','UPDATE','Coca Cola','products',1,1,'{\"id\":1,\"title\":\"Coca Cola\",\"category\":0,\"description\":\"\",\"sizes\":0,\"styles\":0,\"price\":2}',195,'2013-02-15 19:58:06'),
	(197,'ENTRY','ADD',NULL,'favorite_products',0,1,'{\"user_id\":2,\"product_id\":1}',195,'2013-02-15 19:58:06'),
	(198,'ENTRY','UPDATE','French Fries','products',2,1,'{\"id\":2,\"title\":\"French Fries\",\"category\":0,\"description\":\"\",\"sizes\":0,\"styles\":0,\"price\":2}',195,'2013-02-15 19:58:06'),
	(199,'ENTRY','ADD',NULL,'favorite_products',0,1,'{\"user_id\":2,\"product_id\":2}',195,'2013-02-15 19:58:06'),
	(200,'ENTRY','UPDATE','Hamburger','products',4,1,'{\"id\":4,\"title\":\"Hamburger\",\"category\":0,\"description\":\"\",\"sizes\":0,\"styles\":0,\"price\":0}',195,'2013-02-15 19:58:06'),
	(201,'ENTRY','ADD',NULL,'favorite_products',0,1,'{\"user_id\":2,\"product_id\":4}',195,'2013-02-15 19:58:06'),
	(202,'ENTRY','UPDATE','Icecream','products',6,1,'{\"id\":6,\"title\":\"Icecream\",\"category\":0,\"description\":\"\",\"sizes\":0,\"styles\":0,\"price\":0}',195,'2013-02-15 19:58:06'),
	(203,'ENTRY','ADD',NULL,'favorite_products',0,1,'{\"user_id\":2,\"product_id\":6}',195,'2013-02-15 19:58:06'),
	(204,'MEDIA','ADD','sans-soleil.jpeg','directus_media',28,1,'{\"date_uploaded\":\"2013-02-15 14:59:33\",\"size\":32026,\"name\":\"sans-soleil-3.jpeg\",\"title\":\"sans-soleil.jpeg\",\"type\":\"image\\/jpeg\",\"user\":\"1\",\"active\":1,\"width\":350,\"height\":245}',NULL,'2013-02-15 19:59:33'),
	(205,'MEDIA','ADD','','directus_media',29,1,'{\"title\":\"\",\"location\":\"\",\"caption\":\"\",\"tags\":\"\",\"name\":\"a593iSwvR5w.jpg\",\"type\":\"embed\\/youtube\",\"size\":20629,\"width\":480,\"height\":360,\"active\":1,\"embed_id\":\"a593iSwvR5w\",\"date_uploaded\":\"2013-02-15 15:00:18\"}',NULL,'2013-02-15 20:00:18'),
	(206,'SETTINGS','UPDATE','unit_test','directus_settings',NULL,1,'{\"media_folder\":\"resources\",\"media_naming\":\"unique\",\"allowed_thumbnails\":\"test test test\",\"zxczxczxc\":\"zxczxc\",\"thumbnail_quality\":\"90\"}',NULL,'2013-02-15 20:23:05'),
	(207,'ENTRY','UPDATE','TEST','classes',17,1,'{\"id\":17,\"room_id\":\"3\",\"instructor_id\":\"2\",\"class_type_id\":\"1\",\"datetime\":\"Wed, 30 Nov -001 00:00:00 -0500\",\"note\":\"TEST\"}',NULL,'2013-02-15 20:23:06'),
	(208,'ENTRY','UPDATE','tengu','users',1,1,'{\"id\":1,\"active\":1,\"first_name\":\"tengu\",\"last_name\":\"Sundstr\\u00c3\\u00b6m\",\"email\":\"olov@rngr.org\",\"gender\":\"\",\"password\":\"\",\"region\":1,\"phone_number\":\"\",\"address_1\":\"\",\"address_2\":\"\",\"city\":\"\",\"state\":\"\",\"zip\":0,\"billing_address_1\":\"\",\"billing_address_2\":\"\",\"billing_city\":\"\",\"billing_state\":\"\",\"billing_zip\":0,\"authorize_id\":0,\"joined\":\"Wed, 30 Nov -001 00:00:00 -0500\",\"last_login\":\"Wed, 30 Nov -001 00:00:00 -0500\",\"shoe_size\":0,\"bike_bar_height\":0,\"bike_seat_height\":0,\"service_water\":0,\"service_shoes\":0}',207,'2013-02-15 20:23:06'),
	(209,'ENTRY','ADD',NULL,'bookmarks',0,1,'{\"class_id\":17,\"user_id\":1}',207,'2013-02-15 20:23:06'),
	(210,'SETTINGS','UPDATE','unit_test','directus_settings',NULL,1,'{\"media_folder\":\"resources\",\"media_naming\":\"unique\",\"allowed_thumbnails\":\"test test test\",\"zxczxczxc\":\"zxczxc\",\"thumbnail_quality\":\"90\"}',NULL,'2013-02-15 20:23:22'),
	(211,'ENTRY','UPDATE','TEST','classes',17,1,'{\"id\":17,\"room_id\":\"3\",\"instructor_id\":\"2\",\"class_type_id\":\"1\",\"datetime\":\"Wed, 30 Nov -001 00:00:00 -0500\",\"note\":\"TEST\"}',NULL,'2013-02-15 20:23:22'),
	(212,'ENTRY','UPDATE','tengu','users',1,1,'{\"id\":1,\"active\":1,\"first_name\":\"tengu\",\"last_name\":\"Sundstr\\u00c3\\u00b6m\",\"email\":\"olov@rngr.org\",\"gender\":\"\",\"password\":\"\",\"region\":1,\"phone_number\":\"\",\"address_1\":\"\",\"address_2\":\"\",\"city\":\"\",\"state\":\"\",\"zip\":0,\"billing_address_1\":\"\",\"billing_address_2\":\"\",\"billing_city\":\"\",\"billing_state\":\"\",\"billing_zip\":0,\"authorize_id\":0,\"joined\":\"Wed, 30 Nov -001 00:00:00 -0500\",\"last_login\":\"Wed, 30 Nov -001 00:00:00 -0500\",\"shoe_size\":0,\"bike_bar_height\":0,\"bike_seat_height\":0,\"service_water\":0,\"service_shoes\":0}',211,'2013-02-15 20:23:22'),
	(213,'ENTRY','ADD',NULL,'bookmarks',0,1,'{\"class_id\":17,\"user_id\":1}',211,'2013-02-15 20:23:22'),
	(214,'SETTINGS','UPDATE','unit_test','directus_settings',NULL,1,'{\"media_folder\":\"resources\",\"media_naming\":\"unique\",\"allowed_thumbnails\":\"test test test\",\"zxczxczxc\":\"zxczxc\",\"thumbnail_quality\":\"90\"}',NULL,'2013-02-15 20:26:04'),
	(215,'ENTRY','UPDATE','TEST','classes',17,1,'{\"id\":17,\"room_id\":\"3\",\"instructor_id\":\"2\",\"class_type_id\":\"1\",\"datetime\":\"Wed, 30 Nov -001 00:00:00 -0500\",\"note\":\"TEST\"}',NULL,'2013-02-15 20:26:05'),
	(216,'ENTRY','UPDATE','tengu','users',1,1,'{\"id\":1,\"active\":1,\"first_name\":\"tengu\",\"last_name\":\"Sundstr\\u00c3\\u00b6m\",\"email\":\"olov@rngr.org\",\"gender\":\"\",\"password\":\"\",\"region\":1,\"phone_number\":\"\",\"address_1\":\"\",\"address_2\":\"\",\"city\":\"\",\"state\":\"\",\"zip\":0,\"billing_address_1\":\"\",\"billing_address_2\":\"\",\"billing_city\":\"\",\"billing_state\":\"\",\"billing_zip\":0,\"authorize_id\":0,\"joined\":\"Wed, 30 Nov -001 00:00:00 -0500\",\"last_login\":\"Wed, 30 Nov -001 00:00:00 -0500\",\"shoe_size\":0,\"bike_bar_height\":0,\"bike_seat_height\":0,\"service_water\":0,\"service_shoes\":0}',215,'2013-02-15 20:26:05'),
	(217,'ENTRY','ADD',NULL,'bookmarks',0,1,'{\"class_id\":17,\"user_id\":1}',215,'2013-02-15 20:26:05'),
	(218,'SETTINGS','UPDATE','unit_test','directus_settings',NULL,1,'{\"media_folder\":\"resources\",\"media_naming\":\"unique\",\"allowed_thumbnails\":\"test test test\",\"zxczxczxc\":\"zxczxc\",\"thumbnail_quality\":\"90\"}',NULL,'2013-02-15 20:28:48'),
	(219,'ENTRY','UPDATE','TEST','classes',17,1,'{\"id\":17,\"room_id\":\"3\",\"instructor_id\":\"2\",\"class_type_id\":\"1\",\"datetime\":\"Wed, 30 Nov -001 00:00:00 -0500\",\"note\":\"TEST\"}',NULL,'2013-02-15 20:28:48'),
	(220,'ENTRY','UPDATE','tengu','users',1,1,'{\"id\":1,\"active\":1,\"first_name\":\"tengu\",\"last_name\":\"Sundstr\\u00c3\\u00b6m\",\"email\":\"olov@rngr.org\",\"gender\":\"\",\"password\":\"\",\"region\":1,\"phone_number\":\"\",\"address_1\":\"\",\"address_2\":\"\",\"city\":\"\",\"state\":\"\",\"zip\":0,\"billing_address_1\":\"\",\"billing_address_2\":\"\",\"billing_city\":\"\",\"billing_state\":\"\",\"billing_zip\":0,\"authorize_id\":0,\"joined\":\"Wed, 30 Nov -001 00:00:00 -0500\",\"last_login\":\"Wed, 30 Nov -001 00:00:00 -0500\",\"shoe_size\":0,\"bike_bar_height\":0,\"bike_seat_height\":0,\"service_water\":0,\"service_shoes\":0}',219,'2013-02-15 20:28:49'),
	(221,'ENTRY','ADD',NULL,'bookmarks',0,1,'{\"class_id\":17,\"user_id\":1}',219,'2013-02-15 20:28:49'),
	(222,'SETTINGS','UPDATE','unit_test','directus_settings',NULL,1,'{\"media_folder\":\"resources\",\"media_naming\":\"unique\",\"allowed_thumbnails\":\"test test test\",\"zxczxczxc\":\"zxczxc\",\"thumbnail_quality\":\"90\"}',NULL,'2013-02-15 20:29:30'),
	(223,'ENTRY','UPDATE','TEST','classes',17,1,'{\"id\":17,\"room_id\":\"3\",\"instructor_id\":\"2\",\"class_type_id\":\"1\",\"datetime\":\"Wed, 30 Nov -001 00:00:00 -0500\",\"note\":\"TEST\"}',NULL,'2013-02-15 20:29:30'),
	(224,'ENTRY','UPDATE','tengu','users',1,1,'{\"id\":1,\"active\":1,\"first_name\":\"tengu\",\"last_name\":\"Sundstr\\u00c3\\u00b6m\",\"email\":\"olov@rngr.org\",\"gender\":\"\",\"password\":\"\",\"region\":1,\"phone_number\":\"\",\"address_1\":\"\",\"address_2\":\"\",\"city\":\"\",\"state\":\"\",\"zip\":0,\"billing_address_1\":\"\",\"billing_address_2\":\"\",\"billing_city\":\"\",\"billing_state\":\"\",\"billing_zip\":0,\"authorize_id\":0,\"joined\":\"Wed, 30 Nov -001 00:00:00 -0500\",\"last_login\":\"Wed, 30 Nov -001 00:00:00 -0500\",\"shoe_size\":0,\"bike_bar_height\":0,\"bike_seat_height\":0,\"service_water\":0,\"service_shoes\":0}',223,'2013-02-15 20:29:30'),
	(225,'ENTRY','ADD',NULL,'bookmarks',0,1,'{\"class_id\":17,\"user_id\":1}',223,'2013-02-15 20:29:30'),
	(226,'SETTINGS','UPDATE','unit_test','directus_settings',NULL,1,'{\"media_folder\":\"resources\",\"media_naming\":\"unique\",\"allowed_thumbnails\":\"test test test\",\"zxczxczxc\":\"zxczxc\",\"thumbnail_quality\":\"90\"}',NULL,'2013-02-15 20:29:37'),
	(227,'ENTRY','UPDATE','TEST','classes',17,1,'{\"id\":17,\"room_id\":\"3\",\"instructor_id\":\"2\",\"class_type_id\":\"1\",\"datetime\":\"Wed, 30 Nov -001 00:00:00 -0500\",\"note\":\"TEST\"}',NULL,'2013-02-15 20:29:38'),
	(228,'ENTRY','UPDATE','tengu','users',1,1,'{\"id\":1,\"active\":1,\"first_name\":\"tengu\",\"last_name\":\"Sundstr\\u00c3\\u00b6m\",\"email\":\"olov@rngr.org\",\"gender\":\"\",\"password\":\"\",\"region\":1,\"phone_number\":\"\",\"address_1\":\"\",\"address_2\":\"\",\"city\":\"\",\"state\":\"\",\"zip\":0,\"billing_address_1\":\"\",\"billing_address_2\":\"\",\"billing_city\":\"\",\"billing_state\":\"\",\"billing_zip\":0,\"authorize_id\":0,\"joined\":\"Wed, 30 Nov -001 00:00:00 -0500\",\"last_login\":\"Wed, 30 Nov -001 00:00:00 -0500\",\"shoe_size\":0,\"bike_bar_height\":0,\"bike_seat_height\":0,\"service_water\":0,\"service_shoes\":0}',227,'2013-02-15 20:29:38'),
	(229,'ENTRY','ADD',NULL,'bookmarks',0,1,'{\"class_id\":17,\"user_id\":1}',227,'2013-02-15 20:29:38'),
	(230,'SETTINGS','UPDATE','unit_test','directus_settings',NULL,1,'{\"media_folder\":\"resources\",\"media_naming\":\"unique\",\"allowed_thumbnails\":\"test test test\",\"zxczxczxc\":\"zxczxc\",\"thumbnail_quality\":\"90\"}',NULL,'2013-02-15 20:30:57'),
	(231,'ENTRY','UPDATE','TEST','classes',17,1,'{\"id\":17,\"room_id\":\"3\",\"instructor_id\":\"2\",\"class_type_id\":\"1\",\"datetime\":\"Wed, 30 Nov -001 00:00:00 -0500\",\"note\":\"TEST\"}',NULL,'2013-02-15 20:30:57'),
	(232,'ENTRY','UPDATE','tengu','users',1,1,'{\"id\":1,\"active\":1,\"first_name\":\"tengu\",\"last_name\":\"Sundstr\\u00c3\\u00b6m\",\"email\":\"olov@rngr.org\",\"gender\":\"\",\"password\":\"\",\"region\":1,\"phone_number\":\"\",\"address_1\":\"\",\"address_2\":\"\",\"city\":\"\",\"state\":\"\",\"zip\":0,\"billing_address_1\":\"\",\"billing_address_2\":\"\",\"billing_city\":\"\",\"billing_state\":\"\",\"billing_zip\":0,\"authorize_id\":0,\"joined\":\"Wed, 30 Nov -001 00:00:00 -0500\",\"last_login\":\"Wed, 30 Nov -001 00:00:00 -0500\",\"shoe_size\":0,\"bike_bar_height\":0,\"bike_seat_height\":0,\"service_water\":0,\"service_shoes\":0}',231,'2013-02-15 20:30:57'),
	(233,'ENTRY','ADD',NULL,'bookmarks',0,1,'{\"class_id\":17,\"user_id\":1}',231,'2013-02-15 20:30:57'),
	(234,'SETTINGS','UPDATE','unit_test','directus_settings',NULL,1,'{\"media_folder\":\"resources\",\"media_naming\":\"unique\",\"allowed_thumbnails\":\"test test test\",\"zxczxczxc\":\"zxczxc\",\"thumbnail_quality\":\"90\"}',NULL,'2013-02-15 20:31:23'),
	(235,'ENTRY','UPDATE','TEST','classes',17,1,'{\"id\":17,\"room_id\":\"3\",\"instructor_id\":\"2\",\"class_type_id\":\"1\",\"datetime\":\"Wed, 30 Nov -001 00:00:00 -0500\",\"note\":\"TEST\"}',NULL,'2013-02-15 20:31:23'),
	(236,'ENTRY','UPDATE','tengu','users',1,1,'{\"id\":1,\"active\":1,\"first_name\":\"tengu\",\"last_name\":\"Sundstr\\u00c3\\u00b6m\",\"email\":\"olov@rngr.org\",\"gender\":\"\",\"password\":\"\",\"region\":1,\"phone_number\":\"\",\"address_1\":\"\",\"address_2\":\"\",\"city\":\"\",\"state\":\"\",\"zip\":0,\"billing_address_1\":\"\",\"billing_address_2\":\"\",\"billing_city\":\"\",\"billing_state\":\"\",\"billing_zip\":0,\"authorize_id\":0,\"joined\":\"Wed, 30 Nov -001 00:00:00 -0500\",\"last_login\":\"Wed, 30 Nov -001 00:00:00 -0500\",\"shoe_size\":0,\"bike_bar_height\":0,\"bike_seat_height\":0,\"service_water\":0,\"service_shoes\":0}',235,'2013-02-15 20:31:23'),
	(237,'ENTRY','ADD',NULL,'bookmarks',0,1,'{\"class_id\":17,\"user_id\":1}',235,'2013-02-15 20:31:23'),
	(238,'SETTINGS','UPDATE','unit_test','directus_settings',NULL,1,'{\"media_folder\":\"resources\",\"media_naming\":\"unique\",\"allowed_thumbnails\":\"test test test\",\"zxczxczxc\":\"zxczxc\",\"thumbnail_quality\":\"90\"}',NULL,'2013-02-15 20:34:19'),
	(239,'ENTRY','UPDATE','TEST','classes',17,1,'{\"id\":17,\"room_id\":\"3\",\"instructor_id\":\"2\",\"class_type_id\":\"1\",\"datetime\":\"Wed, 30 Nov -001 00:00:00 -0500\",\"note\":\"TEST\"}',NULL,'2013-02-15 20:34:19'),
	(240,'ENTRY','UPDATE','tengu','users',1,1,'{\"id\":1,\"active\":1,\"first_name\":\"tengu\",\"last_name\":\"Sundstr\\u00c3\\u00b6m\",\"email\":\"olov@rngr.org\",\"gender\":\"\",\"password\":\"\",\"region\":1,\"phone_number\":\"\",\"address_1\":\"\",\"address_2\":\"\",\"city\":\"\",\"state\":\"\",\"zip\":0,\"billing_address_1\":\"\",\"billing_address_2\":\"\",\"billing_city\":\"\",\"billing_state\":\"\",\"billing_zip\":0,\"authorize_id\":0,\"joined\":\"Wed, 30 Nov -001 00:00:00 -0500\",\"last_login\":\"Wed, 30 Nov -001 00:00:00 -0500\",\"shoe_size\":0,\"bike_bar_height\":0,\"bike_seat_height\":0,\"service_water\":0,\"service_shoes\":0}',239,'2013-02-15 20:34:19'),
	(241,'ENTRY','ADD',NULL,'bookmarks',0,1,'{\"class_id\":17,\"user_id\":1}',239,'2013-02-15 20:34:19'),
	(242,'SETTINGS','UPDATE','unit_test','directus_settings',NULL,1,'{\"media_folder\":\"resources\",\"media_naming\":\"unique\",\"allowed_thumbnails\":\"test test test\",\"zxczxczxc\":\"zxczxc\",\"thumbnail_quality\":\"90\"}',NULL,'2013-02-15 20:34:40'),
	(243,'ENTRY','UPDATE','TEST','classes',17,1,'{\"id\":17,\"room_id\":\"3\",\"instructor_id\":\"2\",\"class_type_id\":\"1\",\"datetime\":\"Wed, 30 Nov -001 00:00:00 -0500\",\"note\":\"TEST\"}',NULL,'2013-02-15 20:34:40'),
	(244,'ENTRY','UPDATE','tengu','users',1,1,'{\"id\":1,\"active\":1,\"first_name\":\"tengu\",\"last_name\":\"Sundstr\\u00c3\\u00b6m\",\"email\":\"olov@rngr.org\",\"gender\":\"\",\"password\":\"\",\"region\":1,\"phone_number\":\"\",\"address_1\":\"\",\"address_2\":\"\",\"city\":\"\",\"state\":\"\",\"zip\":0,\"billing_address_1\":\"\",\"billing_address_2\":\"\",\"billing_city\":\"\",\"billing_state\":\"\",\"billing_zip\":0,\"authorize_id\":0,\"joined\":\"Wed, 30 Nov -001 00:00:00 -0500\",\"last_login\":\"Wed, 30 Nov -001 00:00:00 -0500\",\"shoe_size\":0,\"bike_bar_height\":0,\"bike_seat_height\":0,\"service_water\":0,\"service_shoes\":0}',243,'2013-02-15 20:34:40'),
	(245,'ENTRY','ADD',NULL,'bookmarks',0,1,'{\"class_id\":17,\"user_id\":1}',243,'2013-02-15 20:34:40'),
	(246,'SETTINGS','UPDATE','unit_test','directus_settings',NULL,1,'{\"media_folder\":\"resources\",\"media_naming\":\"unique\",\"allowed_thumbnails\":\"test test test\",\"zxczxczxc\":\"zxczxc\",\"thumbnail_quality\":\"90\"}',NULL,'2013-02-15 20:34:51'),
	(247,'ENTRY','UPDATE','TEST','classes',17,1,'{\"id\":17,\"room_id\":\"3\",\"instructor_id\":\"2\",\"class_type_id\":\"1\",\"datetime\":\"Wed, 30 Nov -001 00:00:00 -0500\",\"note\":\"TEST\"}',NULL,'2013-02-15 20:34:51'),
	(248,'ENTRY','UPDATE','tengu','users',1,1,'{\"id\":1,\"active\":1,\"first_name\":\"tengu\",\"last_name\":\"Sundstr\\u00c3\\u00b6m\",\"email\":\"olov@rngr.org\",\"gender\":\"\",\"password\":\"\",\"region\":1,\"phone_number\":\"\",\"address_1\":\"\",\"address_2\":\"\",\"city\":\"\",\"state\":\"\",\"zip\":0,\"billing_address_1\":\"\",\"billing_address_2\":\"\",\"billing_city\":\"\",\"billing_state\":\"\",\"billing_zip\":0,\"authorize_id\":0,\"joined\":\"Wed, 30 Nov -001 00:00:00 -0500\",\"last_login\":\"Wed, 30 Nov -001 00:00:00 -0500\",\"shoe_size\":0,\"bike_bar_height\":0,\"bike_seat_height\":0,\"service_water\":0,\"service_shoes\":0}',247,'2013-02-15 20:34:51'),
	(249,'ENTRY','ADD',NULL,'bookmarks',0,1,'{\"class_id\":17,\"user_id\":1}',247,'2013-02-15 20:34:51'),
	(250,'SETTINGS','UPDATE','unit_test','directus_settings',NULL,1,'{\"media_folder\":\"resources\",\"media_naming\":\"unique\",\"allowed_thumbnails\":\"test test test\",\"zxczxczxc\":\"zxczxc\",\"thumbnail_quality\":\"90\"}',NULL,'2013-02-15 20:41:39'),
	(251,'ENTRY','UPDATE','TEST','classes',17,1,'{\"id\":17,\"room_id\":\"3\",\"instructor_id\":\"2\",\"class_type_id\":\"1\",\"datetime\":\"Wed, 30 Nov -001 00:00:00 -0500\",\"note\":\"TEST\"}',NULL,'2013-02-15 20:41:40'),
	(252,'ENTRY','UPDATE','tengu','users',1,1,'{\"id\":1,\"active\":1,\"first_name\":\"tengu\",\"last_name\":\"Sundstr\\u00c3\\u00b6m\",\"email\":\"olov@rngr.org\",\"gender\":\"\",\"password\":\"\",\"region\":1,\"phone_number\":\"\",\"address_1\":\"\",\"address_2\":\"\",\"city\":\"\",\"state\":\"\",\"zip\":0,\"billing_address_1\":\"\",\"billing_address_2\":\"\",\"billing_city\":\"\",\"billing_state\":\"\",\"billing_zip\":0,\"authorize_id\":0,\"joined\":\"Wed, 30 Nov -001 00:00:00 -0500\",\"last_login\":\"Wed, 30 Nov -001 00:00:00 -0500\",\"shoe_size\":0,\"bike_bar_height\":0,\"bike_seat_height\":0,\"service_water\":0,\"service_shoes\":0}',251,'2013-02-15 20:41:40'),
	(253,'ENTRY','ADD',NULL,'bookmarks',0,1,'{\"class_id\":17,\"user_id\":1}',251,'2013-02-15 20:41:40'),
	(254,'SETTINGS','UPDATE','unit_test','directus_settings',NULL,1,'{\"media_folder\":\"resources\",\"media_naming\":\"unique\",\"allowed_thumbnails\":\"test test test\",\"zxczxczxc\":\"zxczxc\",\"thumbnail_quality\":\"90\"}',NULL,'2013-02-15 20:42:05'),
	(255,'ENTRY','UPDATE','TEST','classes',17,1,'{\"id\":17,\"room_id\":\"3\",\"instructor_id\":\"2\",\"class_type_id\":\"1\",\"datetime\":\"Wed, 30 Nov -001 00:00:00 -0500\",\"note\":\"TEST\"}',NULL,'2013-02-15 20:42:05'),
	(256,'ENTRY','UPDATE','tengu','users',1,1,'{\"id\":1,\"active\":1,\"first_name\":\"tengu\",\"last_name\":\"Sundstr\\u00c3\\u00b6m\",\"email\":\"olov@rngr.org\",\"gender\":\"\",\"password\":\"\",\"region\":1,\"phone_number\":\"\",\"address_1\":\"\",\"address_2\":\"\",\"city\":\"\",\"state\":\"\",\"zip\":0,\"billing_address_1\":\"\",\"billing_address_2\":\"\",\"billing_city\":\"\",\"billing_state\":\"\",\"billing_zip\":0,\"authorize_id\":0,\"joined\":\"Wed, 30 Nov -001 00:00:00 -0500\",\"last_login\":\"Wed, 30 Nov -001 00:00:00 -0500\",\"shoe_size\":0,\"bike_bar_height\":0,\"bike_seat_height\":0,\"service_water\":0,\"service_shoes\":0}',255,'2013-02-15 20:42:05'),
	(257,'ENTRY','ADD',NULL,'bookmarks',0,1,'{\"class_id\":17,\"user_id\":1}',255,'2013-02-15 20:42:05'),
	(258,'SETTINGS','UPDATE','unit_test','directus_settings',NULL,1,'{\"media_folder\":\"resources\",\"media_naming\":\"unique\",\"allowed_thumbnails\":\"test test test\",\"zxczxczxc\":\"zxczxc\",\"thumbnail_quality\":\"90\"}',NULL,'2013-02-15 20:43:02'),
	(259,'ENTRY','UPDATE','TEST','classes',17,1,'{\"id\":17,\"room_id\":\"3\",\"instructor_id\":\"2\",\"class_type_id\":\"1\",\"datetime\":\"Wed, 30 Nov -001 00:00:00 -0500\",\"note\":\"TEST\"}',NULL,'2013-02-15 20:43:03'),
	(260,'ENTRY','UPDATE','tengu','users',1,1,'{\"id\":1,\"active\":1,\"first_name\":\"tengu\",\"last_name\":\"Sundstr\\u00c3\\u00b6m\",\"email\":\"olov@rngr.org\",\"gender\":\"\",\"password\":\"\",\"region\":1,\"phone_number\":\"\",\"address_1\":\"\",\"address_2\":\"\",\"city\":\"\",\"state\":\"\",\"zip\":0,\"billing_address_1\":\"\",\"billing_address_2\":\"\",\"billing_city\":\"\",\"billing_state\":\"\",\"billing_zip\":0,\"authorize_id\":0,\"joined\":\"Wed, 30 Nov -001 00:00:00 -0500\",\"last_login\":\"Wed, 30 Nov -001 00:00:00 -0500\",\"shoe_size\":0,\"bike_bar_height\":0,\"bike_seat_height\":0,\"service_water\":0,\"service_shoes\":0}',259,'2013-02-15 20:43:03'),
	(261,'ENTRY','ADD',NULL,'bookmarks',0,1,'{\"class_id\":17,\"user_id\":1}',259,'2013-02-15 20:43:03'),
	(262,'SETTINGS','UPDATE','unit_test','directus_settings',NULL,1,'{\"media_folder\":\"resources\",\"media_naming\":\"unique\",\"allowed_thumbnails\":\"test test test\",\"zxczxczxc\":\"zxczxc\",\"thumbnail_quality\":\"90\"}',NULL,'2013-02-15 20:43:32'),
	(263,'ENTRY','UPDATE','TEST','classes',17,1,'{\"id\":17,\"room_id\":\"3\",\"instructor_id\":\"2\",\"class_type_id\":\"1\",\"datetime\":\"Wed, 30 Nov -001 00:00:00 -0500\",\"note\":\"TEST\"}',NULL,'2013-02-15 20:43:32'),
	(264,'ENTRY','UPDATE','tengu','users',1,1,'{\"id\":1,\"active\":1,\"first_name\":\"tengu\",\"last_name\":\"Sundstr\\u00c3\\u00b6m\",\"email\":\"olov@rngr.org\",\"gender\":\"\",\"password\":\"\",\"region\":1,\"phone_number\":\"\",\"address_1\":\"\",\"address_2\":\"\",\"city\":\"\",\"state\":\"\",\"zip\":0,\"billing_address_1\":\"\",\"billing_address_2\":\"\",\"billing_city\":\"\",\"billing_state\":\"\",\"billing_zip\":0,\"authorize_id\":0,\"joined\":\"Wed, 30 Nov -001 00:00:00 -0500\",\"last_login\":\"Wed, 30 Nov -001 00:00:00 -0500\",\"shoe_size\":0,\"bike_bar_height\":0,\"bike_seat_height\":0,\"service_water\":0,\"service_shoes\":0}',263,'2013-02-15 20:43:32'),
	(265,'ENTRY','ADD',NULL,'bookmarks',0,1,'{\"class_id\":17,\"user_id\":1}',263,'2013-02-15 20:43:32'),
	(266,'SETTINGS','UPDATE','unit_test','directus_settings',NULL,1,'{\"media_folder\":\"resources\",\"media_naming\":\"unique\",\"allowed_thumbnails\":\"test test test\",\"zxczxczxc\":\"zxczxc\",\"thumbnail_quality\":\"90\"}',NULL,'2013-02-15 20:45:04'),
	(267,'ENTRY','UPDATE','TEST','classes',17,1,'{\"id\":17,\"room_id\":\"3\",\"instructor_id\":\"2\",\"class_type_id\":\"1\",\"datetime\":\"Wed, 30 Nov -001 00:00:00 -0500\",\"note\":\"TEST\"}',NULL,'2013-02-15 20:45:04'),
	(268,'ENTRY','UPDATE','tengu','users',1,1,'{\"id\":1,\"active\":1,\"first_name\":\"tengu\",\"last_name\":\"Sundstr\\u00c3\\u00b6m\",\"email\":\"olov@rngr.org\",\"gender\":\"\",\"password\":\"\",\"region\":1,\"phone_number\":\"\",\"address_1\":\"\",\"address_2\":\"\",\"city\":\"\",\"state\":\"\",\"zip\":0,\"billing_address_1\":\"\",\"billing_address_2\":\"\",\"billing_city\":\"\",\"billing_state\":\"\",\"billing_zip\":0,\"authorize_id\":0,\"joined\":\"Wed, 30 Nov -001 00:00:00 -0500\",\"last_login\":\"Wed, 30 Nov -001 00:00:00 -0500\",\"shoe_size\":0,\"bike_bar_height\":0,\"bike_seat_height\":0,\"service_water\":0,\"service_shoes\":0}',267,'2013-02-15 20:45:04'),
	(269,'ENTRY','ADD',NULL,'bookmarks',0,1,'{\"class_id\":17,\"user_id\":1}',267,'2013-02-15 20:45:04'),
	(270,'SETTINGS','UPDATE','unit_test','directus_settings',NULL,1,'{\"media_folder\":\"resources\",\"media_naming\":\"unique\",\"allowed_thumbnails\":\"test test test\",\"zxczxczxc\":\"zxczxc\",\"thumbnail_quality\":\"90\"}',NULL,'2013-02-15 20:47:36'),
	(271,'ENTRY','UPDATE','TEST','classes',17,1,'{\"id\":17,\"room_id\":\"3\",\"instructor_id\":\"2\",\"class_type_id\":\"1\",\"datetime\":\"Wed, 30 Nov -001 00:00:00 -0500\",\"note\":\"TEST\"}',NULL,'2013-02-15 20:47:36'),
	(272,'ENTRY','UPDATE','tengu','users',1,1,'{\"id\":1,\"active\":1,\"first_name\":\"tengu\",\"last_name\":\"Sundstr\\u00c3\\u00b6m\",\"email\":\"olov@rngr.org\",\"gender\":\"\",\"password\":\"\",\"region\":1,\"phone_number\":\"\",\"address_1\":\"\",\"address_2\":\"\",\"city\":\"\",\"state\":\"\",\"zip\":0,\"billing_address_1\":\"\",\"billing_address_2\":\"\",\"billing_city\":\"\",\"billing_state\":\"\",\"billing_zip\":0,\"authorize_id\":0,\"joined\":\"Wed, 30 Nov -001 00:00:00 -0500\",\"last_login\":\"Wed, 30 Nov -001 00:00:00 -0500\",\"shoe_size\":0,\"bike_bar_height\":0,\"bike_seat_height\":0,\"service_water\":0,\"service_shoes\":0}',271,'2013-02-15 20:47:36'),
	(273,'ENTRY','ADD',NULL,'bookmarks',0,1,'{\"class_id\":17,\"user_id\":1}',271,'2013-02-15 20:47:36'),
	(274,'SETTINGS','UPDATE','unit_test','directus_settings',NULL,1,'{\"media_folder\":\"resources\",\"media_naming\":\"unique\",\"allowed_thumbnails\":\"test test test\",\"zxczxczxc\":\"zxczxc\",\"thumbnail_quality\":\"90\"}',NULL,'2013-02-15 20:49:16'),
	(275,'ENTRY','UPDATE','TEST','classes',17,1,'{\"id\":17,\"room_id\":\"3\",\"instructor_id\":\"2\",\"class_type_id\":\"1\",\"datetime\":\"Wed, 30 Nov -001 00:00:00 -0500\",\"note\":\"TEST\"}',NULL,'2013-02-15 20:49:16'),
	(276,'ENTRY','UPDATE','tengu','users',1,1,'{\"id\":1,\"active\":1,\"first_name\":\"tengu\",\"last_name\":\"Sundstr\\u00c3\\u00b6m\",\"email\":\"olov@rngr.org\",\"gender\":\"\",\"password\":\"\",\"region\":1,\"phone_number\":\"\",\"address_1\":\"\",\"address_2\":\"\",\"city\":\"\",\"state\":\"\",\"zip\":0,\"billing_address_1\":\"\",\"billing_address_2\":\"\",\"billing_city\":\"\",\"billing_state\":\"\",\"billing_zip\":0,\"authorize_id\":0,\"joined\":\"Wed, 30 Nov -001 00:00:00 -0500\",\"last_login\":\"Wed, 30 Nov -001 00:00:00 -0500\",\"shoe_size\":0,\"bike_bar_height\":0,\"bike_seat_height\":0,\"service_water\":0,\"service_shoes\":0}',275,'2013-02-15 20:49:16'),
	(277,'ENTRY','ADD',NULL,'bookmarks',0,1,'{\"class_id\":17,\"user_id\":1}',275,'2013-02-15 20:49:16'),
	(278,'ENTRY','UPDATE','TEST','classes',17,1,'{\"id\":17,\"room_id\":\"3\",\"instructor_id\":\"2\",\"class_type_id\":\"1\",\"datetime\":\"Wed, 30 Nov -001 00:00:00 -0500\",\"note\":\"TEST\"}',NULL,'2013-02-15 23:12:35'),
	(279,'ENTRY','UPDATE','tengu','users',1,1,'{\"id\":1,\"active\":1,\"email\":\"olov@rngr.org\",\"first_name\":\"tengu\",\"last_name\":\"Sundstr\\u00c3\\u00b6m\",\"gender\":\"\",\"password\":\"\",\"region\":1,\"phone_number\":\"\",\"address_1\":\"\",\"address_2\":\"\",\"city\":\"\",\"state\":\"\",\"zip\":0,\"billing_address_1\":\"\",\"billing_address_2\":\"\",\"billing_city\":\"\",\"billing_state\":\"\",\"billing_zip\":0,\"authorize_id\":0,\"joined\":\"0000-00-00 00:00:00\",\"last_login\":\"0000-00-00 00:00:00\",\"shoe_size\":0,\"bike_bar_height\":0,\"bike_seat_height\":0,\"service_water\":0,\"service_shoes\":0}',278,'2013-02-15 23:12:35'),
	(280,'ENTRY','UPDATE',NULL,'bookmarks',0,1,'{\"class_id\":17,\"user_id\":1,\"id\":\"0\"}',278,'2013-02-15 23:12:35'),
	(281,'MEDIA','ADD','DM.Tie_grande.jpg','directus_media',30,1,'{\"date_uploaded\":\"2013-02-15 18:13:14\",\"size\":123963,\"name\":\"DM.Tie_grande-1.jpg\",\"title\":\"DM.Tie_grande.jpg\",\"type\":\"image\\/jpeg\",\"user\":\"1\",\"active\":1,\"width\":600,\"height\":600}',NULL,'2013-02-15 23:13:14'),
	(282,'MEDIA','ADD','american-bobtail-cat-facts.jpeg','directus_media',31,1,'{\"date_uploaded\":\"2013-02-15 23:14:02\",\"size\":27038,\"name\":\"american-bobtail-cat-facts.jpeg\",\"title\":\"american-bobtail-cat-facts.jpeg\",\"type\":\"image\\/jpeg\",\"user\":\"1\",\"active\":1,\"width\":450,\"height\":350}',NULL,'2013-02-15 23:14:02'),
	(283,'ENTRY','UPDATE','Tacos','products',3,1,'{\"id\":3,\"title\":\"Tacos\",\"category\":\"\",\"description\":\"\",\"sizes\":\"\",\"styles\":\"\",\"price\":\"10\"}',NULL,'2013-02-21 19:06:17'),
	(284,'ENTRY','UPDATE','Hamburger','products',4,1,'{\"id\":4,\"title\":\"Hamburger\",\"category\":\"\",\"description\":\"\",\"sizes\":\"\",\"styles\":\"\",\"price\":\"7\"}',NULL,'2013-02-21 19:06:25'),
	(285,'ENTRY','UPDATE','Starburst','products',5,1,'{\"id\":5,\"title\":\"Starburst\",\"category\":\"\",\"description\":\"\",\"sizes\":\"\",\"styles\":\"\",\"price\":\"14\"}',NULL,'2013-02-21 19:06:31'),
	(286,'ENTRY','UPDATE','Icecream','products',6,1,'{\"id\":6,\"title\":\"Icecream\",\"category\":\"\",\"description\":\"\",\"sizes\":\"\",\"styles\":\"\",\"price\":\"6\"}',NULL,'2013-02-21 19:06:38'),
	(287,'ENTRY','UPDATE','Coca Cola','products',1,1,'{\"id\":1,\"title\":\"Coca Cola\",\"category\":\"\",\"description\":\"American beverage\",\"sizes\":\"\",\"styles\":\"\",\"price\":\"2\"}',NULL,'2013-02-21 19:26:12'),
	(288,'ENTRY','UPDATE','French Fries','products',2,1,'{\"id\":2,\"title\":\"French Fries\",\"category\":\"\",\"description\":\"German sandwich\",\"sizes\":\"\",\"styles\":\"\",\"price\":\"2\"}',NULL,'2013-02-21 19:26:36'),
	(289,'ENTRY','UPDATE','Taco','products',3,1,'{\"id\":3,\"title\":\"Taco\",\"category\":\"\",\"description\":\"Mexican sandwich\",\"sizes\":\"\",\"styles\":\"\",\"price\":\"10\"}',NULL,'2013-02-21 19:26:59'),
	(290,'ENTRY','UPDATE','Hamburger','products',2,1,'{\"id\":2,\"title\":\"Hamburger\",\"category\":\"\",\"description\":\"German sandwich\",\"sizes\":\"\",\"styles\":\"\",\"price\":\"2\"}',NULL,'2013-02-21 19:27:11'),
	(291,'ENTRY','UPDATE','French fries','products',4,1,'{\"id\":4,\"title\":\"French fries\",\"category\":\"\",\"description\":\"Belgian potatoes\",\"sizes\":\"\",\"styles\":\"\",\"price\":\"7\"}',NULL,'2013-02-21 19:28:40'),
	(292,'ENTRY','UPDATE','Starburst','products',5,1,'{\"id\":5,\"title\":\"Starburst\",\"category\":\"\",\"description\":\"Cuboid-shaped, fruit-flavoured soft candy\",\"sizes\":\"\",\"styles\":\"\",\"price\":\"14\"}',NULL,'2013-02-21 19:29:34'),
	(293,'ENTRY','UPDATE','Ice cream','products',6,1,'{\"id\":6,\"title\":\"Ice cream\",\"category\":\"\",\"description\":\"Frozen dessert\",\"sizes\":\"\",\"styles\":\"\",\"price\":\"6\"}',NULL,'2013-02-21 19:30:05'),
	(294,'ENTRY','UPDATE','tengu','users',1,1,'{\"id\":1,\"active\":\"1\",\"first_name\":\"tengu\",\"last_name\":\"Sundstrom\",\"email\":\"olov@rngr.org\",\"gender\":\"\",\"password\":\"\",\"region\":\"1\",\"phone_number\":\"\",\"address_1\":\"\",\"address_2\":\"\",\"city\":\"\",\"state\":\"\",\"zip\":\"\",\"billing_address_1\":\"\",\"billing_address_2\":\"\",\"billing_city\":\"\",\"billing_state\":\"\",\"billing_zip\":\"\",\"authorize_id\":\"\",\"joined\":\"Wed, 30 Nov -001 00:00:00 -0500\",\"last_login\":\"Wed, 30 Nov -001 00:00:00 -0500\",\"shoe_size\":\"\",\"bike_bar_height\":\"\",\"bike_seat_height\":\"\",\"service_water\":0,\"service_shoes\":0}',NULL,'2013-02-21 22:39:08'),
	(295,'ENTRY','UPDATE','TEST','classes',17,1,'{\"id\":17,\"room_id\":3,\"instructor_id\":2,\"class_type_id\":1,\"datetime\":\"0000-00-00 00:00:00\",\"note\":\"TEST\"}',294,'2013-02-21 22:39:08'),
	(296,'ENTRY','UPDATE',NULL,'bookmarks',0,1,'{\"user_id\":1,\"class_id\":17,\"id\":\"0\"}',294,'2013-02-21 22:39:08'),
	(297,'ENTRY','UPDATE','Olov','instructors',1,1,'{\"id\":1,\"active\":1,\"first_name\":\"Olov\",\"last_name\":\"Sundstrom\",\"nickname\":\"Olov\",\"image\":0,\"password\":\"\",\"email\":\"\",\"phone\":0,\"address_1\":\"\",\"address_2\":\"\",\"city\":\"\",\"state\":\"\",\"zip\":0,\"bio\":\"\",\"facebook\":\"\",\"twitter\":\"\",\"tumblr\":\"\"}',294,'2013-02-21 22:39:08'),
	(298,'ENTRY','UPDATE',NULL,'favorite_instructors',1,1,'{\"user_id\":1,\"instructor_id\":1,\"id\":\"1\"}',294,'2013-02-21 22:39:08'),
	(299,'ENTRY','UPDATE','tengu','users',1,1,'{\"id\":1,\"active\":\"1\",\"first_name\":\"tengu\",\"last_name\":\"Sundstrom\",\"email\":\"tengu@rngr.org\",\"gender\":\"\",\"password\":\"\",\"region\":\"1\",\"phone_number\":\"\",\"address_1\":\"\",\"address_2\":\"\",\"city\":\"\",\"state\":\"\",\"zip\":\"\",\"billing_address_1\":\"\",\"billing_address_2\":\"\",\"billing_city\":\"\",\"billing_state\":\"\",\"billing_zip\":\"\",\"authorize_id\":\"\",\"joined\":\"Wed, 30 Nov -001 00:00:00 -0500\",\"last_login\":\"Wed, 30 Nov -001 00:00:00 -0500\",\"shoe_size\":\"\",\"bike_bar_height\":\"\",\"bike_seat_height\":\"\",\"service_water\":0,\"service_shoes\":0}',NULL,'2013-02-21 22:39:28'),
	(300,'ENTRY','UPDATE','TEST','classes',17,1,'{\"id\":17,\"room_id\":3,\"instructor_id\":2,\"class_type_id\":1,\"datetime\":\"0000-00-00 00:00:00\",\"note\":\"TEST\"}',299,'2013-02-21 22:39:28'),
	(301,'ENTRY','UPDATE',NULL,'bookmarks',0,1,'{\"user_id\":1,\"class_id\":17,\"id\":\"0\"}',299,'2013-02-21 22:39:28'),
	(302,'ENTRY','UPDATE','Olov','instructors',1,1,'{\"id\":1,\"active\":1,\"first_name\":\"Olov\",\"last_name\":\"Sundstrom\",\"nickname\":\"Olov\",\"image\":0,\"password\":\"\",\"email\":\"\",\"phone\":0,\"address_1\":\"\",\"address_2\":\"\",\"city\":\"\",\"state\":\"\",\"zip\":0,\"bio\":\"\",\"facebook\":\"\",\"twitter\":\"\",\"tumblr\":\"\"}',299,'2013-02-21 22:39:28'),
	(303,'ENTRY','UPDATE',NULL,'favorite_instructors',1,1,'{\"user_id\":1,\"instructor_id\":1,\"id\":\"1\"}',299,'2013-02-21 22:39:28'),
	(304,'ENTRY','UPDATE','tengu','users',1,1,'{\"id\":1,\"active\":\"1\",\"first_name\":\"tengu\",\"last_name\":\"Sundstrom\",\"email\":\"tengu@rngr.org\",\"gender\":\"\",\"password\":\"\",\"region\":\"1\",\"phone_number\":\"\",\"address_1\":\"\",\"address_2\":\"\",\"city\":\"\",\"state\":\"\",\"zip\":\"\",\"billing_address_1\":\"\",\"billing_address_2\":\"\",\"billing_city\":\"\",\"billing_state\":\"\",\"billing_zip\":\"\",\"authorize_id\":\"\",\"joined\":\"Wed, 30 Nov -001 00:00:00 -0500\",\"last_login\":\"Wed, 30 Nov -001 00:00:00 -0500\",\"shoe_size\":\"\",\"bike_bar_height\":\"\",\"bike_seat_height\":\"\",\"service_water\":0,\"service_shoes\":0}',NULL,'2013-02-21 22:40:11'),
	(305,'ENTRY','UPDATE','TEST','classes',17,1,'{\"id\":17,\"room_id\":3,\"instructor_id\":2,\"class_type_id\":1,\"datetime\":\"0000-00-00 00:00:00\",\"note\":\"TEST\"}',304,'2013-02-21 22:40:11'),
	(306,'ENTRY','UPDATE',NULL,'bookmarks',0,1,'{\"user_id\":1,\"class_id\":17,\"id\":\"0\"}',304,'2013-02-21 22:40:11'),
	(307,'ENTRY','UPDATE','Olov','instructors',1,1,'{\"id\":1,\"active\":1,\"first_name\":\"Olov\",\"last_name\":\"Sundstrom\",\"nickname\":\"Olov\",\"image\":0,\"password\":\"\",\"email\":\"\",\"phone\":0,\"address_1\":\"\",\"address_2\":\"\",\"city\":\"\",\"state\":\"\",\"zip\":0,\"bio\":\"\",\"facebook\":\"\",\"twitter\":\"\",\"tumblr\":\"\"}',304,'2013-02-21 22:40:11'),
	(308,'ENTRY','UPDATE',NULL,'favorite_instructors',1,1,'{\"user_id\":1,\"instructor_id\":1,\"id\":\"1\"}',304,'2013-02-21 22:40:11'),
	(309,'ENTRY','UPDATE','Max','instructors',3,1,'{\"id\":3,\"active\":1,\"first_name\":\"Max\",\"last_name\":\"Glantzman\",\"nickname\":\"Max\",\"image\":0,\"password\":\"\",\"email\":\"\",\"phone\":0,\"address_1\":\"\",\"address_2\":\"\",\"city\":\"\",\"state\":\"\",\"zip\":0,\"bio\":\"\",\"facebook\":\"\",\"twitter\":\"\",\"tumblr\":\"\"}',304,'2013-02-21 22:40:11'),
	(310,'ENTRY','ADD',NULL,'favorite_instructors',0,1,'{\"user_id\":1,\"instructor_id\":3}',304,'2013-02-21 22:40:11'),
	(311,'ENTRY','UPDATE','Coca Cola','products',1,1,'{\"id\":1,\"title\":\"Coca Cola\",\"category\":0,\"description\":\"American beverage\",\"sizes\":0,\"styles\":0,\"price\":2}',304,'2013-02-21 22:40:11'),
	(312,'ENTRY','ADD',NULL,'favorite_products',0,1,'{\"user_id\":1,\"product_id\":1}',304,'2013-02-21 22:40:11'),
	(313,'ENTRY','UPDATE','Union Square','studios',1,1,'{\"id\":1,\"title\":\"Union Square\",\"address\":\"\",\"city\":\"\",\"state\":\"\",\"zip\":0,\"country\":\"\",\"phone_number\":0,\"email\":\"\",\"banner_image\":0,\"slideshow_images\":\"\",\"amenities\":\"\"}',304,'2013-02-21 22:40:12'),
	(314,'ENTRY','ADD',NULL,'favorite_studios',0,1,'{\"user_id\":1,\"studio_id\":1}',304,'2013-02-21 22:40:12'),
	(315,'UI','UPDATE','users,favourite_instructors,manytomany','directus_ui',0,1,'{\"visible_columns\":\"first_name\"}',NULL,'2013-02-21 23:31:30'),
	(316,'UI','UPDATE','users,classes,manytomany','directus_ui',0,1,'{\"visible_columns\":\"note\"}',NULL,'2013-02-21 23:45:20'),
	(317,'UI','UPDATE','users,favourite_products,manytomany','directus_ui',0,1,'{\"visible_columns\":\"title\"}',NULL,'2013-02-21 23:45:36'),
	(318,'UI','UPDATE','users,favourite_studios,manytomany','directus_ui',0,1,'{\"visible_columns\":\"title\"}',NULL,'2013-02-21 23:45:50'),
	(319,'ENTRY','UPDATE','Coca Cola','products',1,1,'{\"id\":1,\"title\":\"Coca Cola\",\"category\":\"\",\"description\":\"American beverage\",\"sizes\":\"\",\"styles\":\"\",\"price\":\"2\"}',NULL,'2013-02-21 23:59:31'),
	(320,'ENTRY','UPDATE','Pepsi Cola','products',1,1,'{\"id\":1,\"title\":\"Pepsi Cola\",\"category\":\"\",\"description\":\"American beverage\",\"sizes\":\"\",\"styles\":\"\",\"price\":\"2\"}',NULL,'2013-02-22 00:00:04'),
	(321,'ENTRY','UPDATE','Coca Cola','products',1,1,'{\"id\":1,\"title\":\"Coca Cola\",\"category\":\"\",\"description\":\"American beverage\",\"sizes\":\"\",\"styles\":\"\",\"price\":\"2\"}',NULL,'2013-02-22 00:00:15'),
	(322,'ENTRY','UPDATE','i am active to','about',1,1,'{\"id\":1,\"active\":1,\"title\":\"i am active to\",\"description\":\"test test\",\"banner_image\":\"\",\"button_link\":\"\"}',NULL,'2013-02-22 16:49:03'),
	(323,'ENTRY','UPDATE','i am active to','about',1,1,'{\"id\":1,\"active\":1,\"title\":\"i am active to\",\"description\":\"test test\",\"banner_image\":\"\",\"button_link\":\"\"}',NULL,'2013-02-22 16:49:19'),
	(324,'ENTRY','UPDATE','i am active to','about',1,1,'{\"id\":1,\"active\":1,\"title\":\"i am active to\",\"description\":\"test test\",\"banner_image\":\"\",\"button_link\":\"\"}',NULL,'2013-02-22 16:56:22'),
	(325,'ENTRY','UPDATE','i am active to','about',1,1,'{\"id\":1,\"active\":1,\"title\":\"i am active to\",\"description\":\"test test\",\"banner_image\":\"\",\"button_link\":\"\"}',NULL,'2013-02-22 19:04:39'),
	(326,'SETTINGS','UPDATE','global','directus_settings',NULL,1,'{\"site_name\":\"SoulCycle\",\"site_url\":\"http:\\/\\/www.rngr.org\",\"cms_color\":\"green\",\"cms_user_auto_sign_out\":\"10\"}',NULL,'2013-02-22 19:20:03'),
	(327,'ENTRY','ADD','Hot Sauce','products',7,1,'{\"title\":\"Hot Sauce\",\"category\":\"\",\"description\":\"Spicy!\",\"sizes\":\"\",\"styles\":\"\",\"price\":\"3\"}',NULL,'2013-02-22 19:29:23'),
	(328,'ENTRY','UPDATE','Hot Sauce','products',7,1,'{\"title\":\"Hot Sauce\",\"category\":\"\",\"description\":\"Spicy!\",\"sizes\":\"\",\"styles\":\"\",\"price\":\"3\",\"id\":7}',NULL,'2013-02-22 19:29:30'),
	(329,'ENTRY','ADD','Water','products',8,1,'{\"title\":\"Water\",\"category\":\"\",\"description\":\"Healthy\",\"sizes\":\"\",\"styles\":\"\",\"price\":\"5\"}',NULL,'2013-02-22 19:31:07'),
	(330,'ENTRY','ADD','','products',9,1,'{\"title\":\"\",\"category\":\"\",\"description\":\"\",\"sizes\":\"\",\"styles\":\"\",\"price\":\"\"}',NULL,'2013-02-22 19:31:14'),
	(331,'ENTRY','UPDATE','','products',9,1,'{\"title\":\"\",\"category\":\"\",\"description\":\"\",\"sizes\":\"\",\"styles\":\"\",\"price\":\"\",\"id\":9}',NULL,'2013-02-22 19:31:16'),
	(332,'ENTRY','UPDATE','','products',9,1,'{\"title\":\"\",\"category\":\"\",\"description\":\"\",\"sizes\":\"\",\"styles\":\"\",\"price\":\"\",\"id\":9}',NULL,'2013-02-22 19:31:17'),
	(333,'ENTRY','UPDATE','Juice','products',9,1,'{\"title\":\"Juice\",\"category\":\"\",\"description\":\"Tasty\",\"sizes\":\"\",\"styles\":\"\",\"price\":\"7\",\"id\":9}',NULL,'2013-02-22 19:31:26'),
	(334,'ENTRY','UPDATE','Juice','products',9,1,'{\"title\":\"Juice\",\"category\":\"\",\"description\":\"Tasty\",\"sizes\":\"\",\"styles\":\"\",\"price\":\"7\",\"id\":9}',NULL,'2013-02-22 19:31:38'),
	(335,'ENTRY','ADD','Coffee','products',10,1,'{\"title\":\"Coffee\",\"category\":\"\",\"description\":\"Energy\",\"sizes\":\"\",\"styles\":\"\",\"price\":\"9\"}',NULL,'2013-02-22 19:39:59'),
	(336,'ENTRY','ADD','Carrots','products',11,1,'{\"title\":\"Carrots\",\"category\":\"\",\"description\":\"Orange\",\"sizes\":\"\",\"styles\":\"\",\"price\":\"1\"}',NULL,'2013-02-22 19:40:34'),
	(337,'ENTRY','ADD','Beer','products',12,1,'{\"title\":\"Beer\",\"category\":\"\",\"description\":\"Drunky\",\"sizes\":\"\",\"styles\":\"\",\"price\":\"6\"}',NULL,'2013-02-22 19:43:08'),
	(338,'ENTRY','ADD','','bike_tickets',1,1,'{\"bike_id\":\"\",\"studio_id\":\"\",\"position\":\"\",\"complaint\":\"\",\"comment\":\"\",\"date_created\":\"\",\"parts_used\":\"\"}',NULL,'2013-02-22 19:50:08'),
	(339,'ENTRY','UPDATE','','bike_tickets',1,1,'{\"id\":1,\"bike_id\":\"\",\"studio_id\":\"\",\"position\":\"\",\"complaint\":\"\",\"comment\":\"\",\"date_created\":\"Wed, 30 Nov -001 00:00:00 -0500\",\"adjusted\":0,\"parts_used\":\"\"}',NULL,'2013-02-22 19:53:10'),
	(340,'ENTRY','UPDATE','','bike_tickets',1,1,'{\"id\":1,\"bike_id\":\"\",\"studio_id\":\"\",\"position\":\"\",\"complaint\":\"\",\"comment\":\"\",\"date_created\":\"Wed, 30 Nov -001 00:00:00 -0500\",\"adjusted\":0,\"parts_used\":\"\"}',NULL,'2013-02-22 19:53:27'),
	(341,'ENTRY','UPDATE','','bike_tickets',1,1,'{\"id\":1,\"bike_id\":\"\",\"studio_id\":\"\",\"position\":\"\",\"complaint\":\"\",\"comment\":\"\",\"date_created\":\"Wed, 30 Nov -001 00:00:00 -0500\",\"adjusted\":0,\"parts_used\":\"\"}',NULL,'2013-02-22 19:53:29'),
	(342,'ENTRY','ADD','Bugs','products',13,1,'{\"title\":\"Bugs\",\"category\":\"\",\"description\":\"Gross\",\"sizes\":\"\",\"styles\":\"\",\"price\":\"8\"}',NULL,'2013-02-22 19:53:50'),
	(343,'ENTRY','UPDATE','Brian','users',4,1,'{\"id\":4,\"active\":\"1\",\"first_name\":\"Brian\",\"last_name\":\"Eno\",\"email\":\"brian@eno.com\",\"gender\":\"\",\"password\":\"\",\"region\":\"\",\"phone_number\":\"\",\"address_1\":\"\",\"address_2\":\"\",\"city\":\"\",\"state\":\"\",\"zip\":\"\",\"billing_address_1\":\"\",\"billing_address_2\":\"\",\"billing_city\":\"\",\"billing_state\":\"\",\"billing_zip\":\"\",\"authorize_id\":\"\",\"joined\":\"Wed, 30 Nov -001 00:00:00 -0500\",\"last_login\":\"Wed, 30 Nov -001 00:00:00 -0500\",\"shoe_size\":\"\",\"bike_bar_height\":\"\",\"bike_seat_height\":\"\",\"service_water\":0,\"service_shoes\":0}',NULL,'2013-02-22 19:54:14'),
	(344,'ENTRY','ADD','Brian','users',7,1,'{\"active\":\"1\",\"first_name\":\"Brian\",\"last_name\":\"Eno\",\"email\":\"brian@eno.com\",\"gender\":\"\",\"password\":\"\",\"region\":\"\",\"phone_number\":\"\",\"address_1\":\"\",\"address_2\":\"\",\"city\":\"\",\"state\":\"\",\"zip\":\"\",\"billing_address_1\":\"\",\"billing_address_2\":\"\",\"billing_city\":\"\",\"billing_state\":\"\",\"billing_zip\":\"\",\"authorize_id\":\"\",\"joined\":\"Wed, 30 Nov -001 00:00:00 -0500\",\"last_login\":\"Wed, 30 Nov -001 00:00:00 -0500\",\"shoe_size\":\"\",\"bike_bar_height\":\"\",\"bike_seat_height\":\"\",\"service_water\":0,\"service_shoes\":0}',NULL,'2013-02-22 19:54:24'),
	(345,'ENTRY','UPDATE','Brian','users',7,1,'{\"id\":7,\"active\":\"1\",\"first_name\":\"Brian\",\"last_name\":\"Eno\",\"email\":\"brian@eno.com\",\"gender\":\"\",\"password\":\"\",\"region\":\"\",\"phone_number\":\"\",\"address_1\":\"\",\"address_2\":\"\",\"city\":\"\",\"state\":\"\",\"zip\":\"\",\"billing_address_1\":\"\",\"billing_address_2\":\"\",\"billing_city\":\"\",\"billing_state\":\"\",\"billing_zip\":\"\",\"authorize_id\":\"\",\"joined\":\"Wed, 30 Nov -001 00:00:00 -0500\",\"last_login\":\"Wed, 30 Nov -001 00:00:00 -0500\",\"shoe_size\":\"\",\"bike_bar_height\":\"\",\"bike_seat_height\":\"\",\"service_water\":0,\"service_shoes\":0}',NULL,'2013-02-22 19:54:32'),
	(346,'ENTRY','ADD','Horse','products',14,1,'{\"title\":\"Horse\",\"category\":\"\",\"description\":\"Neh\",\"sizes\":\"\",\"styles\":\"\",\"price\":\"1000\"}',NULL,'2013-02-22 19:54:53'),
	(347,'ENTRY','UPDATE','Brian','users',7,1,'{\"id\":7,\"active\":\"1\",\"first_name\":\"Brian\",\"last_name\":\"Eno\",\"email\":\"brian@eno.com\",\"gender\":\"\",\"password\":\"\",\"region\":\"\",\"phone_number\":\"\",\"address_1\":\"\",\"address_2\":\"\",\"city\":\"\",\"state\":\"\",\"zip\":\"\",\"billing_address_1\":\"\",\"billing_address_2\":\"\",\"billing_city\":\"\",\"billing_state\":\"\",\"billing_zip\":\"\",\"authorize_id\":\"\",\"joined\":\"Wed, 30 Nov -001 00:00:00 -0500\",\"last_login\":\"Wed, 30 Nov -001 00:00:00 -0500\",\"shoe_size\":\"\",\"bike_bar_height\":\"\",\"bike_seat_height\":\"\",\"service_water\":0,\"service_shoes\":0}',NULL,'2013-02-22 19:55:34'),
	(348,'ENTRY','ADD','Us','users',8,1,'{\"first_name\":\"Us\",\"last_name\":\"Er\",\"email\":\"\",\"gender\":\"\",\"password\":\"\",\"region\":\"\",\"phone_number\":\"\",\"address_1\":\"\",\"address_2\":\"\",\"city\":\"\",\"state\":\"\",\"zip\":\"\",\"billing_address_1\":\"\",\"billing_address_2\":\"\",\"billing_city\":\"\",\"billing_state\":\"\",\"billing_zip\":\"\",\"authorize_id\":\"\",\"joined\":\"\",\"last_login\":\"\",\"shoe_size\":\"\",\"bike_bar_height\":\"\",\"bike_seat_height\":\"\",\"active\":\"2\"}',NULL,'2013-02-22 19:56:06'),
	(349,'ENTRY','ADD','Er','users',9,1,'{\"first_name\":\"Er\",\"last_name\":\"Us\",\"email\":\"\",\"gender\":\"\",\"password\":\"\",\"region\":\"\",\"phone_number\":\"\",\"address_1\":\"\",\"address_2\":\"\",\"city\":\"\",\"state\":\"\",\"zip\":\"\",\"billing_address_1\":\"\",\"billing_address_2\":\"\",\"billing_city\":\"\",\"billing_state\":\"\",\"billing_zip\":\"\",\"authorize_id\":\"\",\"joined\":\"\",\"last_login\":\"\",\"shoe_size\":\"\",\"bike_bar_height\":\"\",\"bike_seat_height\":\"\",\"active\":\"2\"}',NULL,'2013-02-22 19:56:58'),
	(350,'ENTRY','ADD','Aisling','users',10,1,'{\"first_name\":\"Aisling\",\"last_name\":\"\",\"email\":\"\",\"gender\":\"\",\"password\":\"\",\"region\":\"\",\"phone_number\":\"\",\"address_1\":\"\",\"address_2\":\"\",\"city\":\"\",\"state\":\"\",\"zip\":\"\",\"billing_address_1\":\"\",\"billing_address_2\":\"\",\"billing_city\":\"\",\"billing_state\":\"\",\"billing_zip\":\"\",\"authorize_id\":\"\",\"joined\":\"\",\"last_login\":\"\",\"shoe_size\":\"\",\"bike_bar_height\":\"\",\"bike_seat_height\":\"\",\"active\":\"2\"}',NULL,'2013-02-22 20:06:09'),
	(351,'ENTRY','ADD','tttt','users',11,1,'{\"first_name\":\"tttt\",\"last_name\":\"ssss\",\"email\":\"\",\"gender\":\"\",\"password\":\"\",\"region\":\"\",\"phone_number\":\"\",\"address_1\":\"\",\"address_2\":\"\",\"city\":\"\",\"state\":\"\",\"zip\":\"\",\"billing_address_1\":\"\",\"billing_address_2\":\"\",\"billing_city\":\"\",\"billing_state\":\"\",\"billing_zip\":\"\",\"authorize_id\":\"\",\"joined\":\"\",\"last_login\":\"\",\"shoe_size\":\"\",\"bike_bar_height\":\"\",\"bike_seat_height\":\"\",\"active\":\"2\"}',NULL,'2013-02-22 20:12:34'),
	(352,'ENTRY','ADD','ccc','users',12,1,'{\"first_name\":\"ccc\",\"last_name\":\"ccc\",\"email\":\"\",\"gender\":\"\",\"password\":\"\",\"region\":\"\",\"phone_number\":\"\",\"address_1\":\"\",\"address_2\":\"\",\"city\":\"\",\"state\":\"\",\"zip\":\"\",\"billing_address_1\":\"\",\"billing_address_2\":\"\",\"billing_city\":\"\",\"billing_state\":\"\",\"billing_zip\":\"\",\"authorize_id\":\"\",\"joined\":\"\",\"last_login\":\"\",\"shoe_size\":\"\",\"bike_bar_height\":\"\",\"bike_seat_height\":\"\",\"active\":\"2\"}',NULL,'2013-02-22 20:13:12'),
	(353,'ENTRY','ADD','david','users',13,1,'{\"first_name\":\"david\",\"last_name\":\"bowie\",\"email\":\"\",\"gender\":\"\",\"password\":\"\",\"region\":\"\",\"phone_number\":\"\",\"address_1\":\"\",\"address_2\":\"\",\"city\":\"\",\"state\":\"\",\"zip\":\"\",\"billing_address_1\":\"\",\"billing_address_2\":\"\",\"billing_city\":\"\",\"billing_state\":\"\",\"billing_zip\":\"\",\"authorize_id\":\"\",\"joined\":\"\",\"last_login\":\"\",\"shoe_size\":\"\",\"bike_bar_height\":\"\",\"bike_seat_height\":\"\",\"active\":\"2\"}',NULL,'2013-02-22 20:13:32'),
	(354,'ENTRY','ADD','Marc','users',14,1,'{\"first_name\":\"Marc\",\"last_name\":\"Bolan\",\"email\":\"\",\"gender\":\"\",\"password\":\"\",\"region\":\"\",\"phone_number\":\"\",\"address_1\":\"\",\"address_2\":\"\",\"city\":\"\",\"state\":\"\",\"zip\":\"\",\"billing_address_1\":\"\",\"billing_address_2\":\"\",\"billing_city\":\"\",\"billing_state\":\"\",\"billing_zip\":\"\",\"authorize_id\":\"\",\"joined\":\"\",\"last_login\":\"\",\"shoe_size\":\"\",\"bike_bar_height\":\"\",\"bike_seat_height\":\"\",\"active\":\"2\"}',NULL,'2013-02-22 20:14:16'),
	(355,'ENTRY','ADD','Marylin','users',15,1,'{\"first_name\":\"Marylin\",\"last_name\":\"Monroe\",\"email\":\"\",\"gender\":\"\",\"password\":\"\",\"region\":\"\",\"phone_number\":\"\",\"address_1\":\"\",\"address_2\":\"\",\"city\":\"\",\"state\":\"\",\"zip\":\"\",\"billing_address_1\":\"\",\"billing_address_2\":\"\",\"billing_city\":\"\",\"billing_state\":\"\",\"billing_zip\":\"\",\"authorize_id\":\"\",\"joined\":\"\",\"last_login\":\"\",\"shoe_size\":\"\",\"bike_bar_height\":\"\",\"bike_seat_height\":\"\",\"active\":\"2\"}',NULL,'2013-02-22 20:14:48'),
	(356,'ENTRY','ADD','Brian','users',16,1,'{\"first_name\":\"Brian\",\"last_name\":\"Wilson\",\"email\":\"\",\"gender\":\"\",\"password\":\"\",\"region\":\"\",\"phone_number\":\"\",\"address_1\":\"\",\"address_2\":\"\",\"city\":\"\",\"state\":\"\",\"zip\":\"\",\"billing_address_1\":\"\",\"billing_address_2\":\"\",\"billing_city\":\"\",\"billing_state\":\"\",\"billing_zip\":\"\",\"authorize_id\":\"\",\"joined\":\"\",\"last_login\":\"\",\"shoe_size\":\"\",\"bike_bar_height\":\"\",\"bike_seat_height\":\"\",\"active\":\"2\"}',NULL,'2013-02-22 20:15:37'),
	(357,'ENTRY','ADD','Lou','users',17,1,'{\"first_name\":\"Lou\",\"last_name\":\"Reed\",\"email\":\"\",\"gender\":\"\",\"password\":\"\",\"region\":\"\",\"phone_number\":\"\",\"address_1\":\"\",\"address_2\":\"\",\"city\":\"\",\"state\":\"\",\"zip\":\"\",\"billing_address_1\":\"\",\"billing_address_2\":\"\",\"billing_city\":\"\",\"billing_state\":\"\",\"billing_zip\":\"\",\"authorize_id\":\"\",\"joined\":\"\",\"last_login\":\"\",\"shoe_size\":\"\",\"bike_bar_height\":\"\",\"bike_seat_height\":\"\",\"active\":\"2\"}',NULL,'2013-02-22 20:16:16'),
	(358,'ENTRY','UPDATE','Pablo','users',8,1,'{\"id\":8,\"active\":\"2\",\"first_name\":\"Pablo\",\"last_name\":\"Picasso\",\"email\":\"\",\"gender\":\"\",\"password\":\"\",\"region\":\"\",\"phone_number\":\"\",\"address_1\":\"\",\"address_2\":\"\",\"city\":\"\",\"state\":\"\",\"zip\":\"\",\"billing_address_1\":\"\",\"billing_address_2\":\"\",\"billing_city\":\"\",\"billing_state\":\"\",\"billing_zip\":\"\",\"authorize_id\":\"\",\"joined\":\"Wed, 30 Nov -001 00:00:00 -0500\",\"last_login\":\"Wed, 30 Nov -001 00:00:00 -0500\",\"shoe_size\":\"\",\"bike_bar_height\":\"\",\"bike_seat_height\":\"\",\"service_water\":0,\"service_shoes\":0}',NULL,'2013-02-22 20:17:16'),
	(359,'ENTRY','UPDATE','Don','users',9,1,'{\"id\":9,\"active\":\"2\",\"first_name\":\"Don\",\"last_name\":\"Cherry\",\"email\":\"\",\"gender\":\"\",\"password\":\"\",\"region\":\"\",\"phone_number\":\"\",\"address_1\":\"\",\"address_2\":\"\",\"city\":\"\",\"state\":\"\",\"zip\":\"\",\"billing_address_1\":\"\",\"billing_address_2\":\"\",\"billing_city\":\"\",\"billing_state\":\"\",\"billing_zip\":\"\",\"authorize_id\":\"\",\"joined\":\"Wed, 30 Nov -001 00:00:00 -0500\",\"last_login\":\"Wed, 30 Nov -001 00:00:00 -0500\",\"shoe_size\":\"\",\"bike_bar_height\":\"\",\"bike_seat_height\":\"\",\"service_water\":0,\"service_shoes\":0}',NULL,'2013-02-22 20:17:40'),
	(360,'ENTRY','UPDATE','Aisling','users',10,1,'{\"id\":10,\"active\":\"2\",\"first_name\":\"Aisling\",\"last_name\":\"Hamrogue\",\"email\":\"\",\"gender\":\"\",\"password\":\"\",\"region\":\"\",\"phone_number\":\"\",\"address_1\":\"\",\"address_2\":\"\",\"city\":\"\",\"state\":\"\",\"zip\":\"\",\"billing_address_1\":\"\",\"billing_address_2\":\"\",\"billing_city\":\"\",\"billing_state\":\"\",\"billing_zip\":\"\",\"authorize_id\":\"\",\"joined\":\"Wed, 30 Nov -001 00:00:00 -0500\",\"last_login\":\"Wed, 30 Nov -001 00:00:00 -0500\",\"shoe_size\":\"\",\"bike_bar_height\":\"\",\"bike_seat_height\":\"\",\"service_water\":0,\"service_shoes\":0}',NULL,'2013-02-22 20:17:47'),
	(361,'ENTRY','UPDATE','Bill','users',11,1,'{\"id\":11,\"active\":\"2\",\"first_name\":\"Bill\",\"last_name\":\"Cosby\",\"email\":\"\",\"gender\":\"\",\"password\":\"\",\"region\":\"\",\"phone_number\":\"\",\"address_1\":\"\",\"address_2\":\"\",\"city\":\"\",\"state\":\"\",\"zip\":\"\",\"billing_address_1\":\"\",\"billing_address_2\":\"\",\"billing_city\":\"\",\"billing_state\":\"\",\"billing_zip\":\"\",\"authorize_id\":\"\",\"joined\":\"Wed, 30 Nov -001 00:00:00 -0500\",\"last_login\":\"Wed, 30 Nov -001 00:00:00 -0500\",\"shoe_size\":\"\",\"bike_bar_height\":\"\",\"bike_seat_height\":\"\",\"service_water\":0,\"service_shoes\":0}',NULL,'2013-02-22 20:17:58'),
	(362,'ENTRY','UPDATE','Richard','users',12,1,'{\"id\":12,\"active\":\"2\",\"first_name\":\"Richard\",\"last_name\":\"Stallman\",\"email\":\"\",\"gender\":\"\",\"password\":\"\",\"region\":\"\",\"phone_number\":\"\",\"address_1\":\"\",\"address_2\":\"\",\"city\":\"\",\"state\":\"\",\"zip\":\"\",\"billing_address_1\":\"\",\"billing_address_2\":\"\",\"billing_city\":\"\",\"billing_state\":\"\",\"billing_zip\":\"\",\"authorize_id\":\"\",\"joined\":\"Wed, 30 Nov -001 00:00:00 -0500\",\"last_login\":\"Wed, 30 Nov -001 00:00:00 -0500\",\"shoe_size\":\"\",\"bike_bar_height\":\"\",\"bike_seat_height\":\"\",\"service_water\":0,\"service_shoes\":0}',NULL,'2013-02-22 20:18:22'),
	(363,'ENTRY','UPDATE','David','users',13,1,'{\"id\":13,\"active\":\"2\",\"first_name\":\"David\",\"last_name\":\"Bowie\",\"email\":\"\",\"gender\":\"\",\"password\":\"\",\"region\":\"\",\"phone_number\":\"\",\"address_1\":\"\",\"address_2\":\"\",\"city\":\"\",\"state\":\"\",\"zip\":\"\",\"billing_address_1\":\"\",\"billing_address_2\":\"\",\"billing_city\":\"\",\"billing_state\":\"\",\"billing_zip\":\"\",\"authorize_id\":\"\",\"joined\":\"Wed, 30 Nov -001 00:00:00 -0500\",\"last_login\":\"Wed, 30 Nov -001 00:00:00 -0500\",\"shoe_size\":\"\",\"bike_bar_height\":\"\",\"bike_seat_height\":\"\",\"service_water\":0,\"service_shoes\":0}',NULL,'2013-02-22 20:18:32'),
	(364,'ENTRY','ADD','Ada','users',18,1,'{\"first_name\":\"Ada\",\"last_name\":\"Lovelace\",\"email\":\"\",\"gender\":\"\",\"password\":\"\",\"region\":\"\",\"phone_number\":\"\",\"address_1\":\"\",\"address_2\":\"\",\"city\":\"\",\"state\":\"\",\"zip\":\"\",\"billing_address_1\":\"\",\"billing_address_2\":\"\",\"billing_city\":\"\",\"billing_state\":\"\",\"billing_zip\":\"\",\"authorize_id\":\"\",\"joined\":\"\",\"last_login\":\"\",\"shoe_size\":\"\",\"bike_bar_height\":\"\",\"bike_seat_height\":\"\",\"active\":\"2\"}',NULL,'2013-02-22 20:24:20'),
	(365,'ENTRY','ADD','Phone','products',15,1,'{\"title\":\"Phone\",\"category\":\"\",\"description\":\"Communicate\",\"sizes\":\"\",\"styles\":\"\",\"price\":\"250\"}',NULL,'2013-02-22 20:25:20'),
	(366,'ENTRY','UPDATE','Coca Cola','products',1,1,'{\"id\":1,\"title\":\"Coca Cola\",\"category\":\"\",\"description\":\"American beverage\",\"sizes\":\"\",\"styles\":\"\",\"price\":\"2\"}',NULL,'2013-02-22 20:30:24'),
	(367,'ENTRY','UPDATE','Coca Cola2','products',1,1,'{\"id\":1,\"title\":\"Coca Cola2\",\"category\":\"\",\"description\":\"American beverage\",\"sizes\":\"\",\"styles\":\"\",\"price\":\"2\"}',NULL,'2013-02-22 20:30:28'),
	(368,'ENTRY','UPDATE','Coca Cola','products',1,1,'{\"id\":1,\"title\":\"Coca Cola\",\"category\":\"\",\"description\":\"American beverage\",\"sizes\":\"\",\"styles\":\"\",\"price\":\"2\"}',NULL,'2013-02-22 20:30:33'),
	(369,'ENTRY','UPDATE','Coca Cola','products',1,1,'{\"id\":1,\"title\":\"Coca Cola\",\"category\":\"\",\"description\":\"American beverage\",\"sizes\":\"\",\"styles\":\"\",\"price\":\"2\"}',NULL,'2013-02-22 20:30:52'),
	(370,'ENTRY','UPDATE','Coca Cola4','products',1,1,'{\"id\":1,\"title\":\"Coca Cola4\",\"category\":\"\",\"description\":\"American beverage\",\"sizes\":\"\",\"styles\":\"\",\"price\":\"2\"}',NULL,'2013-02-22 20:30:58'),
	(371,'ENTRY','UPDATE','Coca Cola4','products',1,1,'{\"id\":1,\"title\":\"Coca Cola4\",\"category\":\"\",\"description\":\"American beverage\",\"sizes\":\"\",\"styles\":\"\",\"price\":\"2\"}',NULL,'2013-02-22 21:06:48'),
	(372,'ENTRY','UPDATE','Coffee','products',10,1,'{\"id\":10,\"title\":\"Coffee\",\"category\":\"\",\"description\":\"Energy\",\"sizes\":\"\",\"styles\":\"\",\"price\":\"9\"}',NULL,'2013-02-22 21:07:19'),
	(373,'MEDIA','ADD','Screen Shot 2013-02-22 at 3.52.41 PM.png','directus_media',32,1,'{\"date_uploaded\":\"2013-02-22 22:27:20\",\"size\":20117,\"name\":\"Screen_Shot_2013-02-22_at_3.52.41_PM.png\",\"title\":\"Screen Shot 2013-02-22 at 3.52.41 PM.png\",\"type\":\"image\\/png\",\"user\":\"1\",\"active\":1,\"width\":631,\"height\":438}',NULL,'2013-02-22 22:27:20'),
	(374,'ENTRY','UPDATE','Coca Cola','products',1,1,'{\"id\":1,\"title\":\"Coca Cola\",\"category\":\"\",\"description\":\"American beverage\",\"sizes\":\"\",\"styles\":\"\",\"price\":\"2\"}',NULL,'2013-02-22 22:55:41'),
	(375,'MEDIA','ADD','','directus_media',33,1,'{\"title\":\"\",\"location\":\"\",\"caption\":\"\",\"tags\":\"\",\"name\":\"the-depths.gif\",\"type\":\"image\\/gif\",\"size\":24248,\"width\":790,\"height\":570,\"active\":1,\"date_uploaded\":\"2013-02-22 22:56:32\"}',NULL,'2013-02-22 22:56:32'),
	(376,'MEDIA','ADD','Screen Shot 2013-02-22 at 3.52.41 PM.png','directus_media',34,1,'{\"date_uploaded\":\"2013-02-22 23:05:39\",\"size\":20117,\"name\":\"Screen_Shot_2013-02-22_at_3.52.41_PM.png\",\"title\":\"Screen Shot 2013-02-22 at 3.52.41 PM.png\",\"type\":\"image\\/png\",\"user\":\"1\",\"active\":1,\"width\":631,\"height\":438}',NULL,'2013-02-22 23:05:39'),
	(377,'ENTRY','ADD','Test','demo_table',1,1,'{\"title\":\"Test\",\"number\":\"\"}',NULL,'2013-02-22 23:44:01'),
	(378,'ENTRY','UPDATE','Test2','demo_table',1,1,'{\"id\":1,\"title\":\"Test2\",\"number\":\"\"}',NULL,'2013-02-22 23:44:36');

/*!40000 ALTER TABLE `directus_activity` ENABLE KEYS */;
UNLOCK TABLES;


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

LOCK TABLES `directus_columns` WRITE;
/*!40000 ALTER TABLE `directus_columns` DISABLE KEYS */;

INSERT INTO `directus_columns` (`id`, `table_name`, `column_name`, `data_type`, `ui`, `system`, `master`, `hidden_input`, `hidden_list`, `required`, `table_related`, `junction_table`, `junction_key_left`, `junction_key_right`, `sort`, `comment`)
VALUES
	(6,'directus_media','charset',NULL,NULL,1,0,1,0,0,NULL,NULL,NULL,NULL,NULL,NULL),
	(7,'directus_media','width',NULL,NULL,0,0,1,0,0,NULL,NULL,NULL,NULL,NULL,NULL),
	(8,'directus_media','height',NULL,'',0,0,1,0,0,NULL,NULL,NULL,NULL,NULL,NULL),
	(39,'directus_media','name',NULL,NULL,0,0,1,0,0,NULL,NULL,NULL,NULL,NULL,NULL),
	(10,'directus_media','src',NULL,'',0,0,1,0,0,NULL,NULL,NULL,NULL,NULL,NULL),
	(12,'directus_users','name','alias','directus_user',0,0,1,0,0,NULL,NULL,NULL,NULL,NULL,NULL),
	(14,'directus_users','email',NULL,'email',0,0,0,0,0,NULL,NULL,NULL,NULL,NULL,NULL),
	(15,'directus_activity','activity','alias','directus_activity',0,0,0,0,0,NULL,NULL,NULL,NULL,NULL,NULL),
	(16,'directus_users','password',NULL,NULL,1,0,1,0,0,NULL,NULL,NULL,NULL,NULL,NULL),
	(17,'directus_users','token',NULL,NULL,1,0,1,0,0,NULL,NULL,NULL,NULL,NULL,NULL),
	(18,'directus_users','reset_token',NULL,NULL,1,0,1,0,0,NULL,NULL,NULL,NULL,NULL,NULL),
	(19,'directus_users','reset_expiration',NULL,NULL,1,0,1,0,0,NULL,NULL,NULL,NULL,NULL,NULL),
	(20,'directus_users','ip',NULL,NULL,1,0,1,0,0,NULL,NULL,NULL,NULL,NULL,NULL),
	(22,'directus_media','item','alias','directus_media',0,0,0,0,0,NULL,NULL,NULL,NULL,-1,NULL),
	(29,'directus_users','id',NULL,NULL,0,0,1,0,0,NULL,NULL,NULL,NULL,NULL,NULL),
	(30,'directus_users','active',NULL,NULL,0,0,1,0,0,NULL,NULL,NULL,NULL,NULL,NULL),
	(31,'directus_activity','user',NULL,'directus_user',0,0,0,0,0,NULL,NULL,NULL,NULL,NULL,NULL),
	(33,'directus_activity','change_made',NULL,'datetime',0,0,0,0,0,NULL,NULL,NULL,NULL,NULL,NULL),
	(36,'directus_users','activity','alias','directus_user_activity',0,0,1,0,0,NULL,NULL,NULL,NULL,NULL,NULL),
	(37,'directus_media','date',NULL,'datetime',0,0,0,0,0,NULL,NULL,NULL,NULL,NULL,NULL),
	(38,'directus_media','size','','directus_media_size',0,0,1,0,0,NULL,NULL,NULL,NULL,NULL,NULL),
	(40,'directus_media','type',NULL,NULL,0,0,1,0,0,NULL,NULL,NULL,NULL,NULL,NULL),
	(42,'directus_media','user',NULL,'directus_user',0,0,1,0,0,NULL,NULL,NULL,NULL,NULL,NULL),
	(43,'directus_media','date_uploaded',NULL,NULL,0,0,1,0,0,NULL,NULL,NULL,NULL,NULL,NULL),
	(275,'users','service_shoes',NULL,'checkbox',0,0,0,0,0,NULL,NULL,NULL,NULL,26,''),
	(274,'users','service_water',NULL,'checkbox',0,0,0,0,0,NULL,NULL,NULL,NULL,25,''),
	(273,'users','bike_seat_height',NULL,'numeric',0,0,0,0,0,NULL,NULL,NULL,NULL,24,''),
	(272,'users','bike_bar_height',NULL,'numeric',0,0,0,0,0,NULL,NULL,NULL,NULL,23,''),
	(271,'users','shoe_size',NULL,'numeric',0,0,0,0,0,NULL,NULL,NULL,NULL,22,''),
	(270,'users','last_login',NULL,'datetime',0,0,0,0,0,NULL,NULL,NULL,NULL,21,''),
	(269,'users','joined',NULL,'datetime',0,0,0,0,0,NULL,NULL,NULL,NULL,20,''),
	(268,'users','authorize_id',NULL,'numeric',0,0,0,0,0,NULL,NULL,NULL,NULL,19,''),
	(267,'users','billing_zip',NULL,'numeric',0,0,0,0,0,NULL,NULL,NULL,NULL,18,''),
	(266,'users','billing_state',NULL,'textinput',0,0,0,0,0,NULL,NULL,NULL,NULL,17,''),
	(265,'users','billing_city',NULL,'textinput',0,0,0,0,0,NULL,NULL,NULL,NULL,16,''),
	(264,'users','billing_address_2',NULL,'textinput',0,0,0,0,0,NULL,NULL,NULL,NULL,15,''),
	(263,'users','billing_address_1',NULL,'textinput',0,0,0,0,0,NULL,NULL,NULL,NULL,14,''),
	(262,'users','zip',NULL,'numeric',0,0,0,0,0,NULL,NULL,NULL,NULL,13,''),
	(261,'users','state',NULL,'textinput',0,0,0,0,0,NULL,NULL,NULL,NULL,12,''),
	(260,'users','city',NULL,'textinput',0,0,0,0,0,NULL,NULL,NULL,NULL,11,''),
	(259,'users','address_2',NULL,'textinput',0,0,0,0,0,NULL,NULL,NULL,NULL,10,''),
	(258,'users','address_1',NULL,'textinput',0,0,0,0,0,NULL,NULL,NULL,NULL,9,''),
	(257,'users','phone_number',NULL,'textinput',0,0,0,0,0,NULL,NULL,NULL,NULL,8,''),
	(256,'users','region',NULL,'numeric',0,0,0,0,0,NULL,NULL,NULL,NULL,7,''),
	(255,'users','password',NULL,'textinput',0,0,0,0,0,NULL,NULL,NULL,NULL,6,''),
	(254,'users','gender',NULL,'textinput',0,0,0,0,0,NULL,NULL,NULL,NULL,5,''),
	(253,'users','last_name',NULL,'textinput',0,0,0,0,0,NULL,NULL,NULL,NULL,3,''),
	(252,'users','first_name',NULL,'textinput',0,1,0,0,0,NULL,NULL,NULL,NULL,2,''),
	(248,'users','favourite_studios','manytomany','relational',0,0,0,1,0,'studios','favorite_studios','user_id','studio_id',30,''),
	(249,'users','id',NULL,'numeric',0,0,0,0,0,NULL,NULL,NULL,NULL,0,''),
	(250,'users','active',NULL,'checkbox',0,0,0,0,0,NULL,NULL,NULL,NULL,1,''),
	(251,'users','email',NULL,'textinput',0,0,0,0,0,NULL,NULL,NULL,NULL,4,''),
	(247,'users','favourite_products','manytomany','relational',0,0,0,1,0,'products','favorite_products','user_id','product_id',29,''),
	(238,'directus_media','tags','','tags',0,0,0,0,0,NULL,NULL,NULL,NULL,NULL,NULL),
	(239,'directus_media','embed_id',NULL,NULL,0,0,1,0,0,NULL,NULL,NULL,NULL,NULL,NULL),
	(246,'users','favourite_instructors','manytomany','relational',0,0,0,1,0,'instructors','favorite_instructors','user_id','instructor_id',28,''),
	(245,'users','classes','manytomany','relational',0,0,0,1,0,'classes','bookmarks','user_id','class_id',27,''),
	(276,'classes','id',NULL,'numeric',0,0,0,0,0,NULL,NULL,NULL,NULL,1,''),
	(277,'classes','room_id','','many_to_one',0,0,0,0,0,NULL,NULL,NULL,NULL,2,''),
	(278,'classes','instructor_id',NULL,'many_to_one',0,0,0,0,0,NULL,NULL,NULL,NULL,3,''),
	(279,'classes','class_type_id',NULL,'many_to_one',0,0,0,0,0,NULL,NULL,NULL,NULL,4,''),
	(280,'classes','datetime',NULL,'datetime',0,0,0,0,0,NULL,NULL,NULL,NULL,5,''),
	(281,'classes','note',NULL,'textarea',0,1,0,0,0,NULL,NULL,NULL,NULL,6,''),
	(283,'community','id',NULL,'numeric',0,0,0,0,0,NULL,NULL,NULL,NULL,1,''),
	(284,'community','title',NULL,'textinput',0,1,0,0,0,NULL,NULL,NULL,NULL,2,''),
	(285,'community','category',NULL,'many_to_one',0,0,0,0,0,NULL,NULL,NULL,NULL,3,''),
	(286,'community','description',NULL,'textarea',0,0,0,0,0,NULL,NULL,NULL,NULL,4,''),
	(287,'community','media',NULL,'textinput',0,0,0,0,0,NULL,NULL,NULL,NULL,5,''),
	(288,'community','datetime',NULL,'datetime',0,0,0,0,0,NULL,NULL,NULL,NULL,6,''),
	(289,'community_comments','id',NULL,'numeric',0,0,0,0,0,NULL,NULL,NULL,NULL,1,''),
	(290,'community_comments','active',NULL,'checkbox',0,0,0,0,0,NULL,NULL,NULL,NULL,2,''),
	(291,'community_comments','user_id',NULL,'many_to_one',0,0,0,0,0,NULL,NULL,NULL,NULL,3,''),
	(292,'community_comments','comment',NULL,'textarea',0,1,0,0,0,NULL,NULL,NULL,NULL,4,''),
	(293,'community_comments','datetime',NULL,'datetime',0,0,0,0,0,NULL,NULL,NULL,NULL,5,''),
	(294,'community','Comment','onetomany','relational',0,0,0,0,0,'community_comments',NULL,NULL,NULL,9999,''),
	(295,'waitlist','id',NULL,'numeric',0,0,0,0,0,NULL,NULL,NULL,NULL,1,''),
	(296,'waitlist','user_id',NULL,'many_to_one',0,1,0,0,0,NULL,NULL,NULL,NULL,2,''),
	(297,'waitlist','class_id',NULL,'numeric',0,0,0,0,0,NULL,NULL,NULL,NULL,3,''),
	(298,'waitlist','priority',NULL,'numeric',0,0,0,0,0,NULL,NULL,NULL,NULL,4,''),
	(299,'classes','users','manytomany','relational',0,0,0,0,0,'users','bookmarks','class_id','user_id',9999,''),
	(300,'classes','waitlist','onetomany','relational',0,0,0,0,0,'waitlist',NULL,NULL,'class_id',9999,''),
	(301,'rooms','bikes','onetomany','relational',0,0,0,0,0,'bikes',NULL,NULL,'room_id',9999,''),
	(302,'rooms','id',NULL,'numeric',0,0,0,0,0,NULL,NULL,NULL,NULL,1,''),
	(303,'rooms','title',NULL,'textinput',0,1,0,0,0,NULL,NULL,NULL,NULL,2,''),
	(304,'rooms','studio_id',NULL,'numeric',0,0,0,0,0,NULL,NULL,NULL,NULL,3,''),
	(305,'rooms','seats','onetomany','onetomany',0,0,0,0,0,'seats',NULL,NULL,'room_id',4,''),
	(306,'bikes','Tickets','onetomany','relational',0,0,0,0,0,'bike_tickets',NULL,NULL,NULL,9999,''),
	(307,'bikes','id',NULL,'numeric',0,0,0,0,0,NULL,NULL,NULL,NULL,1,''),
	(308,'bikes','room_id',NULL,'numeric',0,0,0,0,0,NULL,NULL,NULL,NULL,2,''),
	(309,'bikes','bike_number',NULL,'numeric',0,0,0,0,0,NULL,NULL,NULL,NULL,3,''),
	(310,'bikes','position',NULL,'textinput',0,0,0,0,0,NULL,NULL,NULL,NULL,4,'x,y'),
	(311,'bike_tickets','id',NULL,'numeric',0,0,0,0,0,NULL,NULL,NULL,NULL,1,''),
	(312,'bike_tickets','bike_id',NULL,'numeric',0,1,0,0,0,NULL,NULL,NULL,NULL,2,''),
	(313,'bike_tickets','studio_id',NULL,'numeric',0,0,0,0,0,NULL,NULL,NULL,NULL,3,''),
	(314,'bike_tickets','position',NULL,'numeric',0,0,0,0,0,NULL,NULL,NULL,NULL,4,''),
	(315,'bike_tickets','complaint',NULL,'textinput',0,1,0,0,0,NULL,NULL,NULL,NULL,5,''),
	(316,'bike_tickets','comment',NULL,'textarea',0,0,0,0,0,NULL,NULL,NULL,NULL,6,''),
	(317,'bike_tickets','date_created',NULL,'datetime',0,0,0,0,0,NULL,NULL,NULL,NULL,7,''),
	(318,'bike_tickets','adjusted',NULL,'checkbox',0,0,0,0,0,NULL,NULL,NULL,NULL,8,''),
	(319,'bike_tickets','parts_used',NULL,'textinput',0,0,0,0,0,NULL,NULL,NULL,NULL,9,'Custom UI that asks which location the part is from and reduces inventory.'),
	(320,'studios','id',NULL,'numeric',0,0,0,0,0,NULL,NULL,NULL,NULL,1,''),
	(321,'studios','title',NULL,'textinput',0,1,0,0,0,NULL,NULL,NULL,NULL,2,''),
	(322,'studios','region_id',NULL,'many_to_one',0,0,0,0,0,NULL,NULL,NULL,NULL,3,''),
	(323,'studios','address',NULL,'textinput',0,0,0,0,0,NULL,NULL,NULL,NULL,4,''),
	(324,'studios','city',NULL,'textinput',0,0,0,0,0,NULL,NULL,NULL,NULL,5,''),
	(325,'studios','state',NULL,'textinput',0,0,0,0,0,NULL,NULL,NULL,NULL,6,''),
	(326,'studios','zip',NULL,'numeric',0,0,0,0,0,NULL,NULL,NULL,NULL,7,''),
	(327,'studios','country',NULL,'textinput',0,0,0,0,0,NULL,NULL,NULL,NULL,8,''),
	(328,'studios','phone_number',NULL,'numeric',0,0,0,0,0,NULL,NULL,NULL,NULL,9,''),
	(329,'studios','email',NULL,'textinput',0,0,0,0,0,NULL,NULL,NULL,NULL,10,''),
	(330,'studios','banner_image',NULL,'numeric',0,0,0,0,0,NULL,NULL,NULL,NULL,11,''),
	(331,'studios','slideshow_images',NULL,'textinput',0,0,0,0,0,NULL,NULL,NULL,NULL,12,''),
	(332,'studios','amenities',NULL,'textinput',0,0,0,0,0,NULL,NULL,NULL,NULL,13,'parking, lockers, showers, changing rooms'),
	(333,'instructors','studios','manytomany','relational',0,0,0,0,0,'studios','instructor_studios',NULL,NULL,9999,''),
	(334,'instructors','music','onetomany','relational',0,0,0,0,0,'instructor_music',NULL,NULL,NULL,9999,''),
	(335,'instructors','classes','onetomany','relational',0,0,0,0,0,'classes',NULL,NULL,'instructor_id',9999,''),
	(336,'instructors','id',NULL,'numeric',0,0,0,0,0,NULL,NULL,NULL,NULL,1,''),
	(337,'instructors','active',NULL,'checkbox',0,0,0,0,0,NULL,NULL,NULL,NULL,2,''),
	(338,'instructors','first_name',NULL,'textinput',0,1,0,0,0,NULL,NULL,NULL,NULL,3,''),
	(339,'instructors','last_name',NULL,'textinput',0,0,0,0,0,NULL,NULL,NULL,NULL,4,''),
	(340,'instructors','nickname',NULL,'textinput',0,0,0,0,0,NULL,NULL,NULL,NULL,5,''),
	(341,'instructors','image',NULL,'numeric',0,0,0,0,0,NULL,NULL,NULL,NULL,6,''),
	(342,'instructors','password',NULL,'textinput',0,0,0,0,0,NULL,NULL,NULL,NULL,7,''),
	(343,'instructors','email',NULL,'textinput',0,0,0,0,0,NULL,NULL,NULL,NULL,8,''),
	(344,'instructors','phone',NULL,'numeric',0,0,0,0,0,NULL,NULL,NULL,NULL,9,''),
	(345,'instructors','address_1',NULL,'textinput',0,0,0,0,0,NULL,NULL,NULL,NULL,10,''),
	(346,'instructors','address_2',NULL,'textinput',0,0,0,0,0,NULL,NULL,NULL,NULL,11,''),
	(347,'instructors','city',NULL,'textinput',0,0,0,0,0,NULL,NULL,NULL,NULL,12,''),
	(348,'instructors','state',NULL,'textinput',0,0,0,0,0,NULL,NULL,NULL,NULL,13,''),
	(349,'instructors','zip',NULL,'numeric',0,0,0,0,0,NULL,NULL,NULL,NULL,14,''),
	(350,'instructors','bio',NULL,'textarea',0,0,0,0,0,NULL,NULL,NULL,NULL,15,'Needs <!--read more--> or two fields'),
	(351,'instructors','facebook',NULL,'textinput',0,0,0,0,0,NULL,NULL,NULL,NULL,16,''),
	(352,'instructors','twitter',NULL,'textinput',0,0,0,0,0,NULL,NULL,NULL,NULL,17,''),
	(353,'instructors','tumblr',NULL,'textinput',0,0,0,0,0,NULL,NULL,NULL,NULL,18,''),
	(354,'studios','Rooms','onetomany','relational',0,0,0,0,0,'rooms',NULL,NULL,'studio_id',9999,''),
	(355,'instructor_music','id',NULL,'numeric',0,0,0,0,0,NULL,NULL,NULL,NULL,0,''),
	(356,'instructor_music','instructor_id',NULL,'many_to_one',0,0,0,0,0,NULL,NULL,NULL,NULL,1,''),
	(357,'instructor_music','datetime',NULL,'datetime',0,0,1,0,0,NULL,NULL,NULL,NULL,6,''),
	(358,'instructor_music','track_id',NULL,'itunes_song_selector',0,0,0,0,0,NULL,NULL,NULL,NULL,2,'Custom UI: Prefills the other fields upon track selection'),
	(359,'instructor_music','artist',NULL,'textinput',0,0,0,0,0,NULL,NULL,NULL,NULL,3,'Read Only'),
	(360,'instructor_music','track',NULL,'textinput',0,0,0,0,0,NULL,NULL,NULL,NULL,6,''),
	(361,'instructor_music','album_art_url',NULL,'textinput',0,0,0,0,0,NULL,NULL,NULL,NULL,5,'Read Only'),
	(362,'instructor_music','track_name',NULL,'textinput',0,1,0,0,0,NULL,NULL,NULL,NULL,4,'Read Only'),
	(363,'community_comments','community_id',NULL,'numeric',0,0,0,0,0,NULL,NULL,NULL,NULL,6,''),
	(364,'demo_table','id',NULL,'numeric',0,0,0,0,0,NULL,NULL,NULL,NULL,1,''),
	(365,'demo_table','title',NULL,'textinput',0,1,0,0,0,NULL,NULL,NULL,NULL,2,''),
	(366,'demo_table','number',NULL,'numeric',0,0,0,0,0,NULL,NULL,NULL,NULL,3,''),
	(367,'about','id',NULL,'numeric',0,0,0,0,0,NULL,NULL,NULL,NULL,1,''),
	(368,'about','active',NULL,'checkbox',0,0,0,0,0,NULL,NULL,NULL,NULL,2,''),
	(369,'about','title',NULL,'textinput',0,1,0,0,0,NULL,NULL,NULL,NULL,3,''),
	(370,'about','description',NULL,'textarea',0,0,0,0,0,NULL,NULL,NULL,NULL,4,''),
	(371,'about','banner_image',NULL,'numeric',0,0,0,0,0,NULL,NULL,NULL,NULL,5,''),
	(372,'about','button_link',NULL,'textinput',0,0,0,0,0,NULL,NULL,NULL,NULL,6,'ie: BOOKMARK CLASSES'),
	(373,'bike_parts','id',NULL,'numeric',0,0,0,0,0,NULL,NULL,NULL,NULL,1,''),
	(374,'bike_parts','name',NULL,'textinput',0,1,0,0,0,NULL,NULL,NULL,NULL,2,''),
	(375,'bike_parts','serial_number',NULL,'textinput',0,0,0,0,0,NULL,NULL,NULL,NULL,3,''),
	(376,'bike_parts','price',NULL,'numeric',0,0,0,0,0,NULL,NULL,NULL,NULL,4,''),
	(377,'bike_parts','part_allocation',NULL,'textinput',0,0,0,0,0,NULL,NULL,NULL,NULL,5,'This should probably be a field for each LOCATION with the QUANTITY of this part... and use a custom UI to move items between'),
	(378,'class_types','id',NULL,'numeric',0,0,0,0,0,NULL,NULL,NULL,NULL,1,''),
	(379,'class_types','active',NULL,'checkbox',0,0,0,0,0,NULL,NULL,NULL,NULL,2,''),
	(380,'class_types','title',NULL,'textinput',0,1,0,0,0,NULL,NULL,NULL,NULL,3,''),
	(381,'class_types','description',NULL,'textarea',0,0,0,0,0,NULL,NULL,NULL,NULL,4,''),
	(382,'class_types','banner_image',NULL,'numeric',0,0,0,0,0,NULL,NULL,NULL,NULL,5,''),
	(383,'community_categories','id',NULL,'numeric',0,0,0,0,0,NULL,NULL,NULL,NULL,1,''),
	(384,'community_categories','title',NULL,'textinput',0,1,0,0,0,NULL,NULL,NULL,NULL,2,''),
	(385,'faq','id',NULL,'numeric',0,0,0,0,0,NULL,NULL,NULL,NULL,1,''),
	(386,'faq','active',NULL,'checkbox',0,0,0,0,0,NULL,NULL,NULL,NULL,2,''),
	(387,'faq','order',NULL,'numeric',0,0,0,0,0,NULL,NULL,NULL,NULL,3,''),
	(388,'faq','category',NULL,'textinput',0,1,0,0,0,NULL,NULL,NULL,NULL,4,''),
	(389,'faq','question',NULL,'textarea',0,0,0,0,0,NULL,NULL,NULL,NULL,5,''),
	(390,'faq','answer',NULL,'textarea',0,0,0,0,0,NULL,NULL,NULL,NULL,6,''),
	(391,'gift_cards','id',NULL,'numeric',0,0,0,0,0,NULL,NULL,NULL,NULL,1,''),
	(392,'gift_cards','code',NULL,'textinput',0,1,0,0,0,NULL,NULL,NULL,NULL,2,''),
	(393,'gift_cards','value',NULL,'numeric',0,0,0,0,0,NULL,NULL,NULL,NULL,3,''),
	(394,'gift_cards','balance',NULL,'numeric',0,0,0,0,0,NULL,NULL,NULL,NULL,4,''),
	(395,'gift_cards','date_created',NULL,'datetime',0,0,0,0,0,NULL,NULL,NULL,NULL,5,''),
	(396,'seats','id',NULL,'numeric',0,0,0,0,0,NULL,NULL,NULL,NULL,1,''),
	(397,'seats','seat_number',NULL,'itunes_song_selector',0,0,0,0,0,NULL,NULL,NULL,NULL,2,'# or i'),
	(398,'seats','position',NULL,'radiobuttons',0,0,0,0,0,NULL,NULL,NULL,NULL,3,'x,y'),
	(399,'seats','instructor',NULL,'numeric',0,1,0,0,0,NULL,NULL,NULL,NULL,4,''),
	(400,'seats','room_id',NULL,'numeric',0,0,0,0,0,NULL,NULL,NULL,NULL,5,''),
	(401,'reservations','id',NULL,'numeric',0,0,0,0,0,NULL,NULL,NULL,NULL,1,''),
	(402,'reservations','class_id',NULL,'numeric',0,1,0,0,0,NULL,NULL,NULL,NULL,2,''),
	(403,'reservations','user_id',NULL,'numeric',0,0,0,0,0,NULL,NULL,NULL,NULL,3,''),
	(404,'reservations','guest_name',NULL,'textinput',0,1,0,0,0,NULL,NULL,NULL,NULL,4,''),
	(405,'reservations','time_reserved',NULL,'datetime',0,0,0,0,0,NULL,NULL,NULL,NULL,5,''),
	(406,'regions','id',NULL,'numeric',0,0,0,0,0,NULL,NULL,NULL,NULL,1,''),
	(407,'regions','title',NULL,'textinput',0,1,0,0,0,NULL,NULL,NULL,NULL,2,''),
	(408,'products','id',NULL,'numeric',0,0,0,0,0,NULL,NULL,NULL,NULL,1,''),
	(409,'products','title',NULL,'textinput',0,1,0,0,0,NULL,NULL,NULL,NULL,2,''),
	(410,'products','category',NULL,'numeric',0,0,0,0,0,NULL,NULL,NULL,NULL,3,''),
	(411,'products','description',NULL,'textarea',0,0,0,0,0,NULL,NULL,NULL,NULL,4,''),
	(412,'products','sizes',NULL,'numeric',0,0,0,0,0,NULL,NULL,NULL,NULL,5,''),
	(413,'products','styles',NULL,'numeric',0,0,0,0,0,NULL,NULL,NULL,NULL,6,''),
	(414,'products','price',NULL,'numeric',0,0,0,0,0,NULL,NULL,NULL,NULL,7,''),
	(415,'product_styles','id',NULL,'numeric',0,0,0,0,0,NULL,NULL,NULL,NULL,1,''),
	(416,'product_styles','title',NULL,'textinput',0,1,0,0,0,NULL,NULL,NULL,NULL,2,''),
	(417,'product_sizes','id',NULL,'numeric',0,0,0,0,0,NULL,NULL,NULL,NULL,1,''),
	(418,'product_sizes','title',NULL,'textinput',0,1,0,0,0,NULL,NULL,NULL,NULL,2,''),
	(419,'product_features','id',NULL,'numeric',0,0,0,0,0,NULL,NULL,NULL,NULL,1,''),
	(420,'product_features','active',NULL,'checkbox',0,0,0,0,0,NULL,NULL,NULL,NULL,2,''),
	(421,'product_features','sort',NULL,'numeric',0,0,0,0,0,NULL,NULL,NULL,NULL,3,''),
	(422,'product_features','title',NULL,'textinput',0,1,0,0,0,NULL,NULL,NULL,NULL,4,''),
	(423,'product_features','product_id',NULL,'numeric',0,0,0,0,0,NULL,NULL,NULL,NULL,5,''),
	(424,'product_features','image',NULL,'numeric',0,0,0,0,0,NULL,NULL,NULL,NULL,6,''),
	(425,'product_categories','id',NULL,'numeric',0,0,0,0,0,NULL,NULL,NULL,NULL,1,''),
	(426,'product_categories','title',NULL,'textinput',0,1,0,0,0,NULL,NULL,NULL,NULL,2,''),
	(427,'product_brands','id',NULL,'numeric',0,0,0,0,0,NULL,NULL,NULL,NULL,1,''),
	(428,'product_brands','active',NULL,'checkbox',0,0,0,0,0,NULL,NULL,NULL,NULL,2,''),
	(429,'product_brands','title',NULL,'textinput',0,1,0,0,0,NULL,NULL,NULL,NULL,3,'');

/*!40000 ALTER TABLE `directus_columns` ENABLE KEYS */;
UNLOCK TABLES;


# Dump of table directus_groups
# ------------------------------------------------------------

DROP TABLE IF EXISTS `directus_groups`;

CREATE TABLE `directus_groups` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(100) DEFAULT NULL,
  `description` varchar(500) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

LOCK TABLES `directus_groups` WRITE;
/*!40000 ALTER TABLE `directus_groups` DISABLE KEYS */;

INSERT INTO `directus_groups` (`id`, `name`, `description`)
VALUES
	(0,'Administrator',NULL),
	(1,'Front Desk',NULL);

/*!40000 ALTER TABLE `directus_groups` ENABLE KEYS */;
UNLOCK TABLES;


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

LOCK TABLES `directus_media` WRITE;
/*!40000 ALTER TABLE `directus_media` DISABLE KEYS */;

INSERT INTO `directus_media` (`id`, `active`, `name`, `title`, `location`, `type`, `charset`, `caption`, `tags`, `width`, `height`, `size`, `embed_id`, `user`, `date_uploaded`)
VALUES
	(31,1,'american-bobtail-cat-facts.jpeg','american-bobtail-cat-facts.jpeg',NULL,'image/jpeg','',NULL,'',450,350,27038,NULL,1,'2013-02-15 23:14:02'),
	(26,1,'garfield-1.jpeg','garfield.jpeg',NULL,'image/jpeg',NULL,NULL,NULL,600,362,38665,NULL,1,'2013-02-05 18:14:57'),
	(25,1,'sans-soleil-2.jpeg','sans-soleil.jpeg',NULL,'image/jpeg',NULL,NULL,NULL,350,245,32026,NULL,1,'2013-02-05 14:49:51'),
	(24,1,'pkWWWKKA8jY.jpg','Pincess Mononoke','','embed/youtube',NULL,'','trailer',480,360,11303,'pkWWWKKA8jY',1,'2013-02-05 14:08:07'),
	(23,0,'logo.png','Backbone','','image/png','','','',50,50,5964,'',1,'0000-00-00 00:00:00'),
	(28,1,'sans-soleil-3.jpeg','sans-soleil.jpeg',NULL,'image/jpeg','',NULL,'',350,245,32026,NULL,1,'2013-02-15 14:59:33'),
	(29,1,'a593iSwvR5w.jpg','','','embed/youtube','','','',480,360,20629,'a593iSwvR5w',1,'2013-02-15 15:00:18'),
	(30,1,'DM.Tie_grande-1.jpg','DM.Tie_grande.jpg',NULL,'image/jpeg','',NULL,'',600,600,123963,NULL,1,'2013-02-15 18:13:14'),
	(34,1,'Screen_Shot_2013-02-22_at_3.52.41_PM.png','Screen Shot 2013-02-22 at 3.52.41 PM.png',NULL,'image/png','',NULL,'',631,438,20117,NULL,1,'2013-02-22 23:05:39');

/*!40000 ALTER TABLE `directus_media` ENABLE KEYS */;
UNLOCK TABLES;


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

LOCK TABLES `directus_messages` WRITE;
/*!40000 ALTER TABLE `directus_messages` DISABLE KEYS */;

INSERT INTO `directus_messages` (`id`, `active`, `subject`, `message`, `datetime`, `reply`, `from`, `to`, `viewed`, `archived`, `table`, `row`)
VALUES
	(105,1,'','Yup','2011-07-12 18:38:47',92,1,',4,',',1,4,',',','',''),
	(6,1,'PDO Test','Test','2011-04-29 20:01:35',0,1,',4,',',1,4,',',1,4,','',''),
	(3,1,'Message Test','Hey yo...','2011-04-15 17:38:38',0,4,',1,',',4,1,',',1,','',''),
	(57,1,'Directus front-end updated','It is now in your hands. I\'ve added a few things to basecamp that we still need to consider, discuss, and make.','2011-05-09 03:46:06',0,3,',1,',',3,1,',',','',''),
	(4,1,'Response Avatar Test','...','2011-04-15 18:34:12',0,1,',4,',',1,4,',',','',''),
	(5,1,'','You there?','2011-04-28 04:31:39',3,4,',1,',',4,1,',',','',''),
	(7,1,'','Are the emails working?','2011-04-29 20:06:03',6,4,',1,',',4,1,',',','',''),
	(8,1,'','Answer me!','2011-04-29 20:08:23',6,4,',1,',',4,1,',',','',''),
	(9,1,'','I love you ben!','2011-04-29 20:38:27',6,4,',1,',',4,1,',',','',''),
	(10,1,'','Hmmm...','2011-04-29 20:41:19',6,4,',1,',',4,1,',',','',''),
	(11,1,'','test','2011-04-29 20:42:14',6,4,',1,',',4,1,',',','',''),
	(12,1,'','another','2011-04-29 20:42:58',6,4,',1,',',4,1,',',','',''),
	(13,1,'','x','2011-04-29 20:50:16',6,4,',1,',',4,1,',',','',''),
	(14,1,'','y','2011-04-29 20:54:47',6,4,',1,',',4,1,',',','',''),
	(15,1,'','z','2011-04-29 21:04:09',6,4,',1,',',4,1,',',','',''),
	(16,1,'From Test','...','2011-04-29 21:06:50',0,1,',4,',',1,4,',',4,1,','',''),
	(17,1,'','I\'m here baby...','2011-04-29 23:15:10',6,1,',4,',',1,4,',',','',''),
	(18,1,'','Test 2','2011-04-29 23:18:31',16,1,',4,',',1,4,',',','',''),
	(92,1,'inbox test','Boom!','2011-07-06 20:25:50',0,4,',1,',',4,1,',',','',''),
	(93,1,'','Hello?','2011-07-06 20:57:29',92,4,',1,',',4,1,',',','',''),
	(94,1,'','Im here...','2011-07-06 21:01:50',92,1,',4,',',1,4,',',','',''),
	(90,1,'','This CMS rocks!','2011-06-26 23:57:24',79,1,'all',',1,17,4,3,',',','demo_table','1'),
	(91,1,'','rsetset','2011-07-06 04:49:12',75,1,'all',',1,4,3,23,',',','demo_table','2'),
	(88,1,'','No we didn\'t','2011-06-07 05:29:36',75,1,'all',',1,4,3,23,',',','demo_table','2'),
	(89,1,'','Test<br />\r\n<br />\r\ntest','2011-06-07 05:32:22',75,1,'all',',1,4,3,23,',',','demo_table','2'),
	(87,1,'','Hmm, didn\'t think about that...<br />\r\n<br />\r\ndid we?','2011-06-07 05:27:28',75,1,'all',',1,4,3,23,',',','demo_table','2'),
	(86,1,'','<a href=\"http://new.2x4.org/directus/edit.php?table=wall&item=2\">http://new.2x4.org/directus/edit.php?table=wall&item=2</a>','2011-06-07 05:08:54',75,1,'all',',1,4,3,23,',',','demo_table','2'),
	(84,1,'','<a href=\"#\">www.getdirectus.com</a> Hmm, guarded?','2011-06-07 05:07:08',75,1,'all',',1,4,3,23,',',','demo_table','2'),
	(85,1,'','<a href=\"http://new.2x4.org/directus/edit.php?table=wall&item=2\">Test http://new.2x4.org/directus/edit.php?table=wall&item=2</a> Guarded?','2011-06-07 05:08:21',75,1,'all',',1,4,3,23,',',','demo_table','2'),
	(81,1,'','and email addresses? benh@ynes.org','2011-06-07 04:53:23',75,1,'all',',1,4,3,23,',',','demo_table','2'),
	(82,1,'','getdirectus.com might work? or www.contactbenhaynes.com','2011-06-07 04:53:59',75,1,'all',',1,4,3,23,',',','demo_table','2'),
	(83,1,'','http://new.2x4.org/directus/edit.php?table=wall&item=2 has a problem?','2011-06-07 04:56:29',75,1,'all',',1,4,3,23,',',','demo_table','2'),
	(80,1,'','http://getdirectus.com/dev/messages.php should now be a link?','2011-06-07 04:50:34',75,1,'all',',1,4,3,23,',',','demo_table','2'),
	(76,1,'Alert test','sdf','2011-05-22 18:46:05',0,1,',4,',',1,4,',',','',''),
	(77,1,'','Yes, ma\'am!','2011-05-22 20:35:40',3,1,',4,',',1,4,',',','',''),
	(78,1,'','Hey, are you all finished?','2011-05-23 17:47:16',0,1,'all',',1,17,3,4,23,',',','demo_table','4'),
	(79,1,'','Testing IE6 functionality.','2011-05-24 17:59:16',73,1,'all',',1,17,3,4,',',','demo_table','1'),
	(73,1,'','heyo!','2011-05-14 16:55:38',0,1,'all',',1,3,4,17,',',','demo_table','1'),
	(74,1,'Create user','Yo. I tried to create a user for Aaron so he can take a look at Directus but it gave me an error. Possible use for Rutgers university!','2011-05-19 15:18:45',0,3,',1,',',3,1,',',','',''),
	(75,1,'','Leaving a message on this item.','2011-05-20 15:16:13',0,3,'all',',3,1,4,17,23,',',','demo_table','2'),
	(70,1,'','first?','2011-05-13 04:55:39',0,1,'all',',1,4,3,11,17,',',4,','blog','3'),
	(71,1,'','first??','2011-05-13 04:57:24',0,1,'all',',1,4,3,2,17,23,',',4,','blog','2'),
	(72,1,'','... and!?','2011-05-13 05:16:21',71,1,'all',',1,3,2,4,17,23,',',','blog','2'),
	(104,1,'Last Test','I promise...','2011-07-12 06:20:03',0,1,',3,',',1,3,',',','',''),
	(59,1,'Activity for media items','I forgot to mention the .activity.media class that I made for you! It\'s purple!','2011-05-09 19:54:38',0,3,',1,',',3,1,',',','',''),
	(60,1,'','Hey, I made the first message on the first blog item. Wahoo!','2011-05-09 19:54:38',0,1,'all',',3,1,4,17,',',4,','blog','1'),
	(61,1,'','Well I made the second!','2011-05-12 13:52:10',60,3,'all',',3,1,4,17,',',','blog','1'),
	(62,1,'','Will it work if it\'s made from Messages?','2011-05-12 20:54:11',60,3,'all',',3,1,4,17,',',','blog','1'),
	(63,1,'','Yuppers','2011-05-12 21:00:54',60,1,'all',',1,3,4,17,',',','blog','1'),
	(64,1,'','Don\'t believe you.','2011-05-12 22:21:14',60,3,'all',',3,4,1,17,',',','blog','1'),
	(65,1,'Example message','Good.','2011-05-13 04:00:16',0,1,'all',',1,4,3,17,',',4,','',''),
	(66,1,'test','test','2011-05-13 04:02:41',0,1,',4,',',1,4,',',4,','',''),
	(67,1,'','a big ol test!','2011-05-13 04:48:08',60,1,'all',',1,4,3,17,',',','blog','1'),
	(68,1,'','test','2011-05-13 04:53:26',60,1,'all',',1,4,3,17,',',','blog','1'),
	(69,1,'','boom','2011-05-13 04:55:05',60,1,'all',',1,4,3,17,',',','blog','1'),
	(53,1,'This is a message','Hi there...','2011-05-06 19:56:48',0,3,',1,',',3,1,',',3,1,','',''),
	(54,1,'','Well hello! Aren\'t things looking gorgeous over here!','2011-05-06 23:31:11',53,1,',3,',',1,3,',',','',''),
	(55,1,'','They are! I\'m on a roll! Aim to wrap it up tonight so we can review maÃ?Â±ana!','2011-05-07 00:54:48',53,3,',1,',',3,1,',',','',''),
	(56,1,'Take a look at your stars','I got them to work on the edit page and browse page!','2011-05-07 05:43:15',0,3,',1,',',3,1,',',','',''),
	(58,1,'Test of multiple users','...','2011-05-09 18:50:04',0,1,',4,3,',',1,3,4,',',4,','',''),
	(101,1,'You\'ve got money!','Nope.','2011-07-12 06:17:07',0,1,',3,',',1,3,',',','',''),
	(103,1,'','Are you?','2011-07-12 06:19:32',92,1,',4,',',1,4,',',','',''),
	(95,1,'','well, you\'re amazing','2011-07-06 21:20:22',92,4,',1,',',4,1,',',','',''),
	(102,1,'','I am!','2011-07-12 06:18:57',92,1,',4,',',1,4,',',','',''),
	(96,1,'','you are!','2011-07-06 21:21:54',92,4,',1,',',4,1,',',','',''),
	(99,1,'','goodnight','2011-07-11 06:17:06',75,1,'all',',1,4,3,23,',',','demo_table','2'),
	(100,1,'Alert Test','Hello!<br />\r\n<br />\r\n--<br />\r\nFrom Ranger Ben','2011-07-12 06:15:44',0,1,',3,',',1,3,',',','',''),
	(98,1,'','Test','2011-07-11 04:54:10',90,1,'all',',1,4,3,',',','demo_table','1'),
	(106,1,'Test','...','2011-07-12 18:39:53',0,1,',4,',',1,4,',',','',''),
	(107,1,'','test','2011-07-12 19:02:54',90,1,'all',',1,4,3,',',','demo_table','1'),
	(108,1,'','test','2011-07-12 19:07:21',90,1,'all',',1,4,3,',',','demo_table','1'),
	(109,1,'','Hello!','2011-07-13 01:54:15',0,1,'all',',1,4,20,3,',',','demo_table','17'),
	(110,1,'','Take a look at this page.','2011-08-22 17:44:55',0,3,'all',',3,1,4,23,',',4,','demo_table','3'),
	(120,1,'Just trying this out!!','Does it work?','2012-03-18 17:30:02',0,4,',1,',',4,1,',',','',''),
	(119,1,'','&lt;script&gt;alert(2);&lt;/script&gt;','2012-03-15 02:11:19',78,4,'all',',4,1,23,',',','demo_table','4'),
	(118,1,'','&lt;script&gt;alert(1);&lt;/script&gt;','2012-03-15 02:04:17',78,4,'all',',4,1,23,',',','demo_table','4'),
	(117,1,'alert(1);','&lt;script&gt;alert(2);&lt;/script&gt;','2012-03-14 18:36:35',0,1,',4,',',1,4,',',','',''),
	(121,1,'','Well?<br />\r\n<br />\r\nDoes it?','2012-03-18 17:32:12',120,4,',1,',',4,1,',',','',''),
	(122,1,'','content not complete','2012-04-26 14:13:21',91,1,'all',',1,',',','demo_table','2'),
	(123,1,'','This needs to be updated!','2012-06-13 18:47:37',0,1,'all',',1,23,',',','blog','6'),
	(124,1,'','dcscs','2012-07-31 15:46:53',0,23,'all',',23,',',','blog','42'),
	(125,1,'','TEST','2012-08-02 19:51:10',0,23,'all',',23,',',','demo_table','19');

/*!40000 ALTER TABLE `directus_messages` ENABLE KEYS */;
UNLOCK TABLES;


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

LOCK TABLES `directus_preferences` WRITE;
/*!40000 ALTER TABLE `directus_preferences` DISABLE KEYS */;

INSERT INTO `directus_preferences` (`id`, `user`, `table_name`, `columns_visible`, `sort`, `sort_order`, `active`)
VALUES
	(1,1,'directus_users','name,activity,email,description','id','asc','1'),
	(4,1,'directus_preferences','text_field','id','asc','1'),
	(5,1,'directus_activity','change_made,user,activity','change_made','ASC','1'),
	(9,1,'directus_media','item,title,type,size,user,date_uploaded','id','ASC','1'),
	(10,1,'directus_messages','subject,message,datetime,reply,from,to,viewed,archived,table,row','id','asc','2'),
	(21,1,'directus_preferences','user,table_name,columns_visible,sort_order,status','id','asc','1'),
	(37,1,'about','title,description,banner_image,button_link','id','asc','1'),
	(38,1,'bikes','room_id,bike_number,position','id','asc','1'),
	(39,1,'bike_parts','name','id','asc','1'),
	(40,1,'bike_tickets','bike_id,studio_id,date_created','id','asc','1'),
	(41,1,'bookmarks','user_id,class_id','id','asc','1'),
	(42,1,'classes','room_id,instructor_id,class_type_id,datetime','id','asc','1'),
	(43,1,'class_types','title,description','id','asc','1,2'),
	(44,1,'community','title,datetime','id','asc','1'),
	(45,1,'community_categories','title','id','asc','1'),
	(46,1,'community_comments','user_id,comment,datetime','id','asc','1'),
	(47,1,'faq','order,category,question','id','asc','1'),
	(48,1,'favorite_instructors','user_id,instructor_id','id','asc','1'),
	(49,1,'favorite_products','user_id,product_id','id','asc','1'),
	(50,1,'favorite_studios','user_id,studio_id','id','asc','1'),
	(51,1,'gift_cards','code,value,balance,date_created','id','asc','1'),
	(52,1,'instructors','first_name,last_name,nickname,address_2,state,zip','first_name','ASC','1,2'),
	(53,1,'instructor_music','instructor_id,track_id,artist,track,album_art_url','id','asc','1'),
	(54,1,'instructor_studios','instructor_id,studio_id','id','asc','1'),
	(55,1,'products','title,description,price','id','ASC','1'),
	(56,1,'product_brands','title','id','asc','1'),
	(57,1,'product_categories','title','id','asc','1'),
	(58,1,'product_features','title,product_id','id','asc','1'),
	(59,1,'product_sizes','title','id','asc','1'),
	(60,1,'product_styles','title','id','asc','1'),
	(61,1,'regions','title','id','asc','1'),
	(62,1,'reservations','class_id,user_id,guest_name,time_reserved','id','asc','1'),
	(63,1,'rooms','title,studio_id,seats','id','asc','1'),
	(64,1,'seats','seat_number,position,instructor','id','asc','1'),
	(65,1,'social_cache','type,datetime,content','id','asc','1'),
	(66,1,'studios','title,region_id,city','id','ASC','1'),
	(67,1,'users','first_name,last_name,email,gender,password,region,billing_address_2','email','ASC','1,2'),
	(68,1,'waitlist','user_id,class_id,priority','id','asc','1'),
	(69,1,'demo_table','title,number','id','asc','1,2'),
	(70,1,'directus_groups','name,description','id','asc','1,2');

/*!40000 ALTER TABLE `directus_preferences` ENABLE KEYS */;
UNLOCK TABLES;


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

LOCK TABLES `directus_privileges` WRITE;
/*!40000 ALTER TABLE `directus_privileges` DISABLE KEYS */;

INSERT INTO `directus_privileges` (`id`, `group_id`, `table_name`, `type`)
VALUES
	(1,1,'*','UPDATE'),
	(2,1,'*','INSERT'),
	(3,1,'*','DELETE'),
	(5,1,'*','VIEW'),
	(6,1,'*','REORDER'),
	(7,1,'*','DELETE'),
	(8,1,'*','PUBLISH'),
	(9,1,'directus_users','UPDATE'),
	(10,1,'directus_media','INSERT'),
	(12,1,'directus_messages','INSERT'),
	(13,1,'demo_table','VIEW'),
	(14,2,'demo_table','VIEW'),
	(15,2,'test_table','VIEW'),
	(16,2,'blog','VIEW'),
	(17,2,'directus_media','VIEW'),
	(18,2,'directus_users','VIEW');

/*!40000 ALTER TABLE `directus_privileges` ENABLE KEYS */;
UNLOCK TABLES;


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

LOCK TABLES `directus_settings` WRITE;
/*!40000 ALTER TABLE `directus_settings` DISABLE KEYS */;

INSERT INTO `directus_settings` (`id`, `collection`, `name`, `value`)
VALUES
	(1,'global','site_name','SoulCycle'),
	(2,'global','site_url','http://www.rngr.org'),
	(3,'global','cms_color','green'),
	(4,'media','media_folder','resources'),
	(5,'media','media_naming','original'),
	(6,'media','allowed_thumbnails','abc 123'),
	(8,'media','zxczxczxc','zxczxc'),
	(26,'global','cms_user_auto_sign_out','10'),
	(178,'media','thumbnail_quality','80'),
	(474,'media','site_name','soulcycle'),
	(475,'media','site_url',''),
	(476,'media','cms_color','green'),
	(477,'media','cms_user_auto_sign_out','');

/*!40000 ALTER TABLE `directus_settings` ENABLE KEYS */;
UNLOCK TABLES;


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

LOCK TABLES `directus_tables` WRITE;
/*!40000 ALTER TABLE `directus_tables` DISABLE KEYS */;

INSERT INTO `directus_tables` (`table_name`, `hidden`, `single`, `inactive_by_default`, `is_junction_table`, `footer`)
VALUES
	('about',0,1,0,0,0),
	('bookmarks',1,0,0,1,0),
	('directus_activity',1,0,0,0,0),
	('directus_groups',1,0,0,0,0),
	('directus_media',1,0,0,0,0),
	('directus_messages',1,0,0,0,0),
	('directus_users',1,0,0,0,0),
	('favorite_instructors',1,0,0,1,0),
	('favorite_products',1,0,0,1,0),
	('favorite_studios',1,0,0,1,0),
	('instructor_studios',1,0,0,1,0),
	('products',0,0,0,0,1),
	('seats',0,1,0,0,0),
	('social_cache',1,0,0,0,0);

/*!40000 ALTER TABLE `directus_tables` ENABLE KEYS */;
UNLOCK TABLES;


# Dump of table directus_ui
# ------------------------------------------------------------

DROP TABLE IF EXISTS `directus_ui`;

CREATE TABLE `directus_ui` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `table_name` varchar(64) DEFAULT NULL,
  `column_name` varchar(64) DEFAULT NULL,
  `ui_name` varchar(200) DEFAULT NULL,
  `name` varchar(200) DEFAULT NULL,
  `value` varchar(1000) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique` (`table_name`,`column_name`,`ui_name`,`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

LOCK TABLES `directus_ui` WRITE;
/*!40000 ALTER TABLE `directus_ui` DISABLE KEYS */;

INSERT INTO `directus_ui` (`id`, `table_name`, `column_name`, `ui_name`, `name`, `value`)
VALUES
	(1,'directus_media','user','directus_user','compact','true'),
	(3,'demo_table','blogs','relational','happy','I AM FROM THE DATABASE. HELLO!'),
	(6,'demo_table','neu_items','relational','happy','HELL'),
	(7,'demo_table','neu_items','relational','hacking','YEAH!'),
	(8,'demo_table','neu_items','relational','keyboard','I WORK!'),
	(12,'demo_table','blogs','relational','hacking','SO SO SO SO SO!'),
	(13,'demo_table','blogs','relational','keyboard','DO I!'),
	(15,'demo_table','blog_posts','relational','happy','X'),
	(16,'demo_table','blog_posts','relational','hacking','X'),
	(17,'demo_table','blog_posts','relational','keyboard','X'),
	(21,'demo_table','wysiwyg','textarea','rows','5'),
	(22,'demo_table','text_field','textarea','rows','10'),
	(25,'demo_table','text','textarea','rows','1'),
	(26,'demo_table','table','textarea','rows','2'),
	(28,'directus_media','caption','textarea','rows','4'),
	(29,'about','title','textinput','test','T3ST'),
	(30,'classes','room_id','many_to_one','related_table','rooms'),
	(31,'classes','room_id','many_to_one','visible_column','title'),
	(32,'classes','instructor_id','many_to_one','related_table','instructors'),
	(33,'classes','instructor_id','many_to_one','visible_column','nickname'),
	(36,'users','favourite_instructors','relational','visible_columns','first_name,last_name'),
	(37,'users','favourite_products','relational','visible_columns','title'),
	(38,'users','favourite_studios','relational','visible_columns','title'),
	(39,'community','category','numeric','related_table','community_categories'),
	(40,'community','category','numeric','visible_column','title'),
	(41,'community','category','many_to_one','related_table','community_categories'),
	(42,'community','category','many_to_one','visible_column','title'),
	(45,'community_comments','user_id','numeric','related_table','users'),
	(46,'community_comments','user_id','numeric','visible_column','first_name'),
	(47,'waitlist','user_id','numeric','related_table','users'),
	(48,'waitlist','user_id','numeric','visible_column','first_name'),
	(49,'waitlist','class_id','numeric','related_table','classes'),
	(50,'waitlist','class_id','numeric','visible_column','class_type'),
	(51,'classes','class_type_id','numeric','related_table','class_types'),
	(52,'classes','class_type_id','numeric','visible_column','title'),
	(53,'bike_tickets','bike_id','numeric','related_table','bikes'),
	(54,'bike_tickets','bike_id','numeric','visible_column','bike_number'),
	(55,'studios','region_id','numeric','related_table','regions'),
	(56,'studios','region_id','numeric','visible_column','title'),
	(57,'studios','region_id','many_to_one','related_table','regions'),
	(58,'studios','region_id','many_to_one','visible_column','title'),
	(59,'rooms','seats','relational','visible_columns','seat_number,position'),
	(60,'rooms','bikes','relational','visible_columns','bike_number,position'),
	(63,'classes','class_type_id','many_to_one','related_table','class_types'),
	(64,'classes','class_type_id','many_to_one','visible_column','title'),
	(65,'classes','Users','relational','visible_columns','first_name'),
	(66,'classes','waitlist','relational','visible_columns','user_id'),
	(67,'users','classes','relational','visible_columns','room_id,instructor_id'),
	(68,'users','first_name','textinput','test',''),
	(69,'users','first_name','textinput','input',''),
	(70,'users','first_name','textinput','another_input','I CAN STORE STUFF'),
	(71,'users','first_name','textinput','rows','20'),
	(75,'users','first_name','textarea','rows','20'),
	(76,'users','first_name','textarea','options','option1,option2,option3'),
	(80,'users','first_name','radiobuttons','options','olov,lasha,ben,tengu,max'),
	(83,'instructor_music','instructor_id','numeric','related_table','instructors'),
	(84,'instructor_music','instructor_id','numeric','visible_column','nickname'),
	(85,'instructor_music','instructor_id','many_to_one','related_table','instructors'),
	(86,'instructor_music','instructor_id','many_to_one','visible_column','nickname'),
	(87,'community_comments','user_id','many_to_one','related_table','users'),
	(88,'community_comments','user_id','many_to_one','visible_column','first_name'),
	(89,'waitlist','user_id','many_to_one','related_table','users'),
	(90,'waitlist','user_id','many_to_one','visible_column','first_name'),
	(91,'demo_table','title','textinput','test','test 11'),
	(92,'demo_table','title','textinput','input','test 21'),
	(105,'about','title','textinput','input','T3ST'),
	(109,'about','button_link','textinput','test','ttt'),
	(110,'about','button_link','textinput','input','ttt'),
	(113,'instructor_music','track_id','itunes_song_selector','field_mappings','{\"artistName\":\"artist\",\"trackName\":\"track_name\",\"artworkUrl100\":\"album_art_url\"}'),
	(114,'instructor_music','artist','textinput','readonly','on'),
	(115,'instructor_music','track_name','textinput','readonly','on'),
	(116,'instructor_music','album_art_url','textinput','readonly','on'),
	(117,'users','favourite_instructors','manytomany','visible_columns','first_name'),
	(118,'users','classes','manytomany','visible_columns','note'),
	(119,'users','favourite_products','manytomany','visible_columns','title'),
	(120,'users','favourite_studios','manytomany','visible_columns','title');

/*!40000 ALTER TABLE `directus_ui` ENABLE KEYS */;
UNLOCK TABLES;


# Dump of table directus_users
# ------------------------------------------------------------

DROP TABLE IF EXISTS `directus_users`;

CREATE TABLE `directus_users` (
  `id` tinyint(10) NOT NULL AUTO_INCREMENT,
  `active` tinyint(1) NOT NULL DEFAULT '1',
  `first_name` varchar(50) NOT NULL,
  `last_name` varchar(50) NOT NULL DEFAULT '',
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL DEFAULT '',
  `token` varchar(255) NOT NULL DEFAULT '',
  `reset_token` varchar(255) NOT NULL DEFAULT '',
  `reset_expiration` datetime NOT NULL,
  `description` text NOT NULL,
  `email_messages` tinyint(1) NOT NULL DEFAULT '1',
  `last_login` datetime NOT NULL DEFAULT '0000-00-00 00:00:00',
  `last_page` varchar(255) NOT NULL DEFAULT '',
  `ip` varchar(50) NOT NULL DEFAULT '',
  `group` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

LOCK TABLES `directus_users` WRITE;
/*!40000 ALTER TABLE `directus_users` DISABLE KEYS */;

INSERT INTO `directus_users` (`id`, `active`, `first_name`, `last_name`, `email`, `password`, `token`, `reset_token`, `reset_expiration`, `description`, `email_messages`, `last_login`, `last_page`, `ip`, `group`)
VALUES
	(1,1,'Ben','Haynes','ben@rngr.org','$P$BQlO4Pi2xzGulWlbqVgq.H0ky699FS.','lcjREKokJYNLkIjY7LUqnCs0wnWSvStvb2PTgw4HWu0=','yTGAt9Z2PHFrDQ9NWncUYzXlG8SUw9RkzkrW1JTdzvQ=','2012-03-18 10:57:47','Directus Developer',1,'2012-08-03 19:13:40','messages.php','24.103.115.138',0),
	(2,1,'Ben','Affleck','ben.affleck@gmail.com','','','','0000-00-00 00:00:00','Designer',0,'2011-05-24 03:35:37','dashboard.php','67.243.190.142',0),
	(3,1,'Chris','McCaddon','mcm@rngr.org','$P$BDyGLnpd1BsKXpf8qkC9fcc0D2HpvU/','','','0000-00-00 00:00:00','Directus Designer',0,'2012-03-19 15:24:27','edit.php?table=demo_table&item=1','24.103.115.138',0),
	(4,1,'Meagan','Campol','meagan.campol@gmail.com','$P$BFmfJ/gtXziEF.Zl2WPU79A7uDkTKr/','','','0000-00-00 00:00:00','Beta Tester',0,'2012-03-18 18:03:00','dashboard.php','98.14.119.188',0),
	(6,1,'Milena','Sadee','milena@2x4.org','','','','0000-00-00 00:00:00','CMS Review',0,'2011-05-03 18:54:51','dashboard.php','69.193.173.98',0),
	(11,1,'Aaron','Gemmill','gemmill@gmail.com','','','','0000-00-00 00:00:00','CMS Review',0,'2011-05-22 22:38:14','messages.php','67.243.190.142',0),
	(17,1,'Chris','Cannon','chrisc@projectprojects.com','','','','0000-00-00 00:00:00','CMS Review',0,'2011-07-05 15:47:06','messages.php?m=inbox','50.74.192.138',0),
	(22,1,'John','Legend','john@example.com','','','','0000-00-00 00:00:00','Dummy',1,'2011-07-05 15:47:06','','',0),
	(20,1,'John','Lennon','john.lennon@gmail.com','','','','0000-00-00 00:00:00','CMS Review',0,'2011-07-21 13:52:54','edit.php?table=blog&item=1','68.171.130.190',0),
	(21,1,'Chris','Kristofferson','c@avec.us','','','','0000-00-00 00:00:00','CMS Review',0,'2011-12-12 16:46:00','media.php','24.39.127.154',0),
	(23,1,'Olov','Sundstrom','olov@rngr.org','kaka','dinn','','0000-00-00 00:00:01','RANGER',0,'2012-08-03 19:13:44','settings.php','24.103.115.138',0);

/*!40000 ALTER TABLE `directus_users` ENABLE KEYS */;
UNLOCK TABLES;


# Dump of table faq
# ------------------------------------------------------------

DROP TABLE IF EXISTS `faq`;

CREATE TABLE `faq` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `active` tinyint(1) NOT NULL,
  `order` int(11) NOT NULL,
  `category` varchar(255) NOT NULL DEFAULT '',
  `question` text NOT NULL,
  `answer` text NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;



# Dump of table favorite_instructors
# ------------------------------------------------------------

DROP TABLE IF EXISTS `favorite_instructors`;

CREATE TABLE `favorite_instructors` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `instructor_id` int(11) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

LOCK TABLES `favorite_instructors` WRITE;
/*!40000 ALTER TABLE `favorite_instructors` DISABLE KEYS */;

INSERT INTO `favorite_instructors` (`id`, `user_id`, `instructor_id`)
VALUES
	(0,1,3),
	(1,1,1);

/*!40000 ALTER TABLE `favorite_instructors` ENABLE KEYS */;
UNLOCK TABLES;


# Dump of table favorite_products
# ------------------------------------------------------------

DROP TABLE IF EXISTS `favorite_products`;

CREATE TABLE `favorite_products` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `order` int(11) DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

LOCK TABLES `favorite_products` WRITE;
/*!40000 ALTER TABLE `favorite_products` DISABLE KEYS */;

INSERT INTO `favorite_products` (`id`, `user_id`, `product_id`, `order`)
VALUES
	(1,3,1,0),
	(0,1,1,0);

/*!40000 ALTER TABLE `favorite_products` ENABLE KEYS */;
UNLOCK TABLES;


# Dump of table favorite_studios
# ------------------------------------------------------------

DROP TABLE IF EXISTS `favorite_studios`;

CREATE TABLE `favorite_studios` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `studio_id` int(11) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

LOCK TABLES `favorite_studios` WRITE;
/*!40000 ALTER TABLE `favorite_studios` DISABLE KEYS */;

INSERT INTO `favorite_studios` (`id`, `user_id`, `studio_id`)
VALUES
	(1,5,1),
	(0,1,1);

/*!40000 ALTER TABLE `favorite_studios` ENABLE KEYS */;
UNLOCK TABLES;


# Dump of table gift_cards
# ------------------------------------------------------------

DROP TABLE IF EXISTS `gift_cards`;

CREATE TABLE `gift_cards` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `code` varchar(255) NOT NULL DEFAULT '',
  `value` float NOT NULL,
  `balance` float NOT NULL,
  `date_created` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;



# Dump of table instructor_music
# ------------------------------------------------------------

DROP TABLE IF EXISTS `instructor_music`;

CREATE TABLE `instructor_music` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `instructor_id` int(11) NOT NULL,
  `datetime` datetime NOT NULL,
  `track_id` int(11) NOT NULL COMMENT 'Custom UI: Prefills the other fields upon track selection',
  `artist` varchar(255) NOT NULL DEFAULT '',
  `track_name` varchar(255) NOT NULL DEFAULT '',
  `album_art_url` varchar(255) NOT NULL DEFAULT '',
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;



# Dump of table instructor_studios
# ------------------------------------------------------------

DROP TABLE IF EXISTS `instructor_studios`;

CREATE TABLE `instructor_studios` (
  `id` int(11) NOT NULL,
  `instructor_id` int(11) NOT NULL,
  `studio_id` int(11) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;



# Dump of table instructors
# ------------------------------------------------------------

DROP TABLE IF EXISTS `instructors`;

CREATE TABLE `instructors` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `active` tinyint(1) NOT NULL,
  `first_name` varchar(255) NOT NULL DEFAULT '',
  `last_name` varchar(255) NOT NULL DEFAULT '',
  `nickname` varchar(255) NOT NULL DEFAULT '',
  `image` int(11) NOT NULL,
  `password` varchar(255) NOT NULL DEFAULT '',
  `email` varchar(255) NOT NULL DEFAULT '',
  `phone` int(255) NOT NULL,
  `address_1` varchar(255) NOT NULL DEFAULT '',
  `address_2` varchar(255) NOT NULL DEFAULT '',
  `city` varchar(255) NOT NULL DEFAULT '',
  `state` varchar(2) NOT NULL,
  `zip` int(5) NOT NULL,
  `bio` text NOT NULL COMMENT 'Needs <!--read more--> or two fields',
  `facebook` varchar(255) NOT NULL DEFAULT '',
  `twitter` varchar(255) NOT NULL DEFAULT '',
  `tumblr` varchar(255) NOT NULL DEFAULT '',
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

LOCK TABLES `instructors` WRITE;
/*!40000 ALTER TABLE `instructors` DISABLE KEYS */;

INSERT INTO `instructors` (`id`, `active`, `first_name`, `last_name`, `nickname`, `image`, `password`, `email`, `phone`, `address_1`, `address_2`, `city`, `state`, `zip`, `bio`, `facebook`, `twitter`, `tumblr`)
VALUES
	(1,1,'Olov','Sundstrom','Olov',0,'','',0,'','','','',0,'','','',''),
	(2,1,'Benjamin ','Haynes','Ben',0,'','',0,'','','','',0,'','','',''),
	(3,1,'Max','Glantzman','Max',0,'','',0,'','','','',0,'','','','');

/*!40000 ALTER TABLE `instructors` ENABLE KEYS */;
UNLOCK TABLES;


# Dump of table product_brands
# ------------------------------------------------------------

DROP TABLE IF EXISTS `product_brands`;

CREATE TABLE `product_brands` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `active` tinyint(1) NOT NULL,
  `title` varchar(255) NOT NULL DEFAULT '',
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;



# Dump of table product_categories
# ------------------------------------------------------------

DROP TABLE IF EXISTS `product_categories`;

CREATE TABLE `product_categories` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL DEFAULT '',
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;



# Dump of table product_features
# ------------------------------------------------------------

DROP TABLE IF EXISTS `product_features`;

CREATE TABLE `product_features` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `active` tinyint(1) NOT NULL,
  `sort` int(11) NOT NULL,
  `title` varchar(255) NOT NULL DEFAULT '',
  `product_id` int(11) NOT NULL,
  `image` int(11) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;



# Dump of table product_sizes
# ------------------------------------------------------------

DROP TABLE IF EXISTS `product_sizes`;

CREATE TABLE `product_sizes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL DEFAULT '',
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;



# Dump of table product_styles
# ------------------------------------------------------------

DROP TABLE IF EXISTS `product_styles`;

CREATE TABLE `product_styles` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL DEFAULT '',
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;



# Dump of table products
# ------------------------------------------------------------

DROP TABLE IF EXISTS `products`;

CREATE TABLE `products` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL DEFAULT '',
  `category` int(11) NOT NULL,
  `description` text NOT NULL,
  `sizes` int(11) NOT NULL,
  `styles` int(11) NOT NULL,
  `price` float NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8 COMMENT='All products in the shop';

LOCK TABLES `products` WRITE;
/*!40000 ALTER TABLE `products` DISABLE KEYS */;

INSERT INTO `products` (`id`, `title`, `category`, `description`, `sizes`, `styles`, `price`)
VALUES
	(1,'Coca Cola',0,'American beverage',0,0,2),
	(2,'Hamburger',0,'German sandwich',0,0,2),
	(3,'Taco',0,'Mexican sandwich',0,0,10),
	(4,'French fries',0,'Belgian potatoes',0,0,7),
	(5,'Starburst',0,'Cuboid-shaped, fruit-flavoured soft candy',0,0,14),
	(6,'Ice cream',0,'Frozen dessert',0,0,6),
	(7,'Hot Sauce',0,'Spicy!',0,0,3),
	(8,'Water',0,'Healthy',0,0,5),
	(9,'Juice',0,'Tasty',0,0,7),
	(10,'Coffee',0,'Energy',0,0,9),
	(11,'Carrots',0,'Orange',0,0,1),
	(12,'Beer',0,'Drunky',0,0,6),
	(13,'Bugs',0,'Gross',0,0,8),
	(14,'Horse',0,'Neh',0,0,1000),
	(15,'Phone',0,'Communicate',0,0,250);

/*!40000 ALTER TABLE `products` ENABLE KEYS */;
UNLOCK TABLES;


# Dump of table regions
# ------------------------------------------------------------

DROP TABLE IF EXISTS `regions`;

CREATE TABLE `regions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL DEFAULT '',
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;



# Dump of table reservations
# ------------------------------------------------------------

DROP TABLE IF EXISTS `reservations`;

CREATE TABLE `reservations` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `class_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `guest_name` varchar(255) NOT NULL DEFAULT '',
  `time_reserved` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;



# Dump of table rooms
# ------------------------------------------------------------

DROP TABLE IF EXISTS `rooms`;

CREATE TABLE `rooms` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL DEFAULT '',
  `studio_id` int(11) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

LOCK TABLES `rooms` WRITE;
/*!40000 ALTER TABLE `rooms` DISABLE KEYS */;

INSERT INTO `rooms` (`id`, `title`, `studio_id`)
VALUES
	(1,'Red Room',0),
	(2,'Blue Room',0),
	(3,'Green Room',0);

/*!40000 ALTER TABLE `rooms` ENABLE KEYS */;
UNLOCK TABLES;


# Dump of table seats
# ------------------------------------------------------------

DROP TABLE IF EXISTS `seats`;

CREATE TABLE `seats` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `seat_number` varchar(11) NOT NULL COMMENT '# or i',
  `position` varchar(5) NOT NULL COMMENT 'x,y',
  `instructor` int(11) NOT NULL,
  `room_id` int(11) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;



# Dump of table social_cache
# ------------------------------------------------------------

DROP TABLE IF EXISTS `social_cache`;

CREATE TABLE `social_cache` (
  `id` int(11) NOT NULL,
  `type` varchar(255) NOT NULL DEFAULT '',
  `datetime` datetime NOT NULL,
  `content` text NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;



# Dump of table studios
# ------------------------------------------------------------

DROP TABLE IF EXISTS `studios`;

CREATE TABLE `studios` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL DEFAULT '',
  `region_id` int(11) NOT NULL,
  `address` varchar(255) NOT NULL DEFAULT '',
  `city` varchar(255) NOT NULL DEFAULT '',
  `state` varchar(2) NOT NULL,
  `zip` int(5) NOT NULL,
  `country` varchar(2) NOT NULL,
  `phone_number` int(10) NOT NULL,
  `email` varchar(255) NOT NULL DEFAULT '',
  `banner_image` int(11) NOT NULL,
  `slideshow_images` varchar(255) NOT NULL,
  `amenities` varchar(255) NOT NULL DEFAULT '' COMMENT 'parking, lockers, showers, changing rooms',
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

LOCK TABLES `studios` WRITE;
/*!40000 ALTER TABLE `studios` DISABLE KEYS */;

INSERT INTO `studios` (`id`, `title`, `region_id`, `address`, `city`, `state`, `zip`, `country`, `phone_number`, `email`, `banner_image`, `slideshow_images`, `amenities`)
VALUES
	(1,'Union Square',0,'','','',0,'',0,'',0,'','');

/*!40000 ALTER TABLE `studios` ENABLE KEYS */;
UNLOCK TABLES;


# Dump of table users
# ------------------------------------------------------------

DROP TABLE IF EXISTS `users`;

CREATE TABLE `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `active` tinyint(1) NOT NULL DEFAULT '1',
  `email` varchar(255) NOT NULL DEFAULT '',
  `first_name` varchar(255) NOT NULL DEFAULT '',
  `last_name` varchar(255) NOT NULL DEFAULT '',
  `gender` varchar(1) NOT NULL,
  `password` varchar(255) NOT NULL DEFAULT '',
  `region` int(11) NOT NULL,
  `phone_number` varchar(255) NOT NULL DEFAULT '',
  `address_1` varchar(255) NOT NULL DEFAULT '',
  `address_2` varchar(255) NOT NULL DEFAULT '',
  `city` varchar(255) NOT NULL DEFAULT '',
  `state` varchar(2) NOT NULL,
  `zip` int(5) NOT NULL,
  `billing_address_1` varchar(255) NOT NULL DEFAULT '',
  `billing_address_2` varchar(255) NOT NULL DEFAULT '',
  `billing_city` varchar(255) NOT NULL DEFAULT '',
  `billing_state` varchar(2) NOT NULL,
  `billing_zip` int(11) NOT NULL,
  `authorize_id` int(11) NOT NULL,
  `joined` datetime NOT NULL,
  `last_login` datetime NOT NULL,
  `shoe_size` int(3) NOT NULL,
  `bike_bar_height` int(3) NOT NULL,
  `bike_seat_height` int(3) NOT NULL,
  `service_water` tinyint(1) NOT NULL,
  `service_shoes` tinyint(1) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;

INSERT INTO `users` (`id`, `active`, `email`, `first_name`, `last_name`, `gender`, `password`, `region`, `phone_number`, `address_1`, `address_2`, `city`, `state`, `zip`, `billing_address_1`, `billing_address_2`, `billing_city`, `billing_state`, `billing_zip`, `authorize_id`, `joined`, `last_login`, `shoe_size`, `bike_bar_height`, `bike_seat_height`, `service_water`, `service_shoes`)
VALUES
	(1,1,'tengu@rngr.org','tengu','Sundstrom','','',1,'','','','','',0,'','','','',0,0,'0000-00-00 00:00:00','0000-00-00 00:00:00',0,0,0,0,0),
	(2,1,'olov@rngr.org','Olov','Sundstrom','M','',0,'','','','','',0,'','','','',0,0,'0000-00-00 00:00:00','0000-00-00 00:00:00',0,0,0,0,0),
	(3,0,'r@kelly.com','R','Kelly','','',0,'','','','','',0,'','','','',0,0,'0000-00-00 00:00:00','0000-00-00 00:00:00',0,0,0,0,0),
	(4,1,'brian@eno.com','Brian','Eno','','',0,'','','','','',0,'','','','',0,0,'0000-00-00 00:00:00','0000-00-00 00:00:00',0,0,0,0,0),
	(5,1,'','TEST','USER','','',0,'','','','','',0,'','','','',0,0,'0000-00-00 00:00:00','0000-00-00 00:00:00',0,0,0,0,0),
	(6,1,'lasha@rngr.org','Lasha','Krikheli','','',0,'','','','','',0,'','','','',0,0,'0000-00-00 00:00:00','0000-00-00 00:00:00',0,0,0,0,0),
	(7,1,'brian@eno.com','Brian','Eno','','',0,'','','','','',0,'','','','',0,0,'0000-00-00 00:00:00','0000-00-00 00:00:00',0,0,0,0,0),
	(8,1,'','Pablo','Picasso','','',0,'','','','','',0,'','','','',0,0,'0000-00-00 00:00:00','0000-00-00 00:00:00',0,0,0,0,0),
	(9,1,'','Don','Cherry','','',0,'','','','','',0,'','','','',0,0,'0000-00-00 00:00:00','0000-00-00 00:00:00',0,0,0,0,0),
	(10,1,'','Aisling','Hamrogue','','',0,'','','','','',0,'','','','',0,0,'0000-00-00 00:00:00','0000-00-00 00:00:00',0,0,0,0,0),
	(11,1,'','Bill','Cosby','','',0,'','','','','',0,'','','','',0,0,'0000-00-00 00:00:00','0000-00-00 00:00:00',0,0,0,0,0),
	(12,1,'','Richard','Stallman','','',0,'','','','','',0,'','','','',0,0,'0000-00-00 00:00:00','0000-00-00 00:00:00',0,0,0,0,0),
	(13,1,'','David','Bowie','','',0,'','','','','',0,'','','','',0,0,'0000-00-00 00:00:00','0000-00-00 00:00:00',0,0,0,0,0),
	(14,1,'','Marc','Bolan','','',0,'','','','','',0,'','','','',0,0,'0000-00-00 00:00:00','0000-00-00 00:00:00',0,0,0,0,0),
	(15,1,'','Marylin','Monroe','','',0,'','','','','',0,'','','','',0,0,'0000-00-00 00:00:00','0000-00-00 00:00:00',0,0,0,0,0),
	(16,1,'','Brian','Wilson','','',0,'','','','','',0,'','','','',0,0,'0000-00-00 00:00:00','0000-00-00 00:00:00',0,0,0,0,0),
	(17,1,'','Lou','Reed','','',0,'','','','','',0,'','','','',0,0,'0000-00-00 00:00:00','0000-00-00 00:00:00',0,0,0,0,0),
	(18,1,'','Ada','Lovelace','','',0,'','','','','',0,'','','','',0,0,'0000-00-00 00:00:00','0000-00-00 00:00:00',0,0,0,0,0);

/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;


# Dump of table waitlist
# ------------------------------------------------------------

DROP TABLE IF EXISTS `waitlist`;

CREATE TABLE `waitlist` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `class_id` int(11) NOT NULL,
  `priority` int(11) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;




/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;
/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;

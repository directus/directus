# ************************************************************
# Sequel Pro SQL dump
# Version 4004
#
# http://www.sequelpro.com/
# http://code.google.com/p/sequel-pro/
#
# Host: localhost (MySQL 5.5.25)
# Database: directus
# Generation Time: 2013-02-06 16:59:55 +0000
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
	(1,1,'i am active to','',0,'');

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



# Dump of table community_comments
# ------------------------------------------------------------

DROP TABLE IF EXISTS `community_comments`;

CREATE TABLE `community_comments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `active` tinyint(1) NOT NULL,
  `user_id` int(11) NOT NULL,
  `comment` text NOT NULL,
  `datetime` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;



# Dump of table directus_activity
# ------------------------------------------------------------

DROP TABLE IF EXISTS `directus_activity`;

CREATE TABLE `directus_activity` (
  `id` int(10) NOT NULL AUTO_INCREMENT,
  `table` varchar(100) NOT NULL DEFAULT '',
  `row` int(10) NOT NULL,
  `type` varchar(100) NOT NULL DEFAULT '',
  `change_made` datetime NOT NULL DEFAULT '0000-00-00 00:00:00',
  `user` int(10) NOT NULL DEFAULT '0',
  `sql` longtext NOT NULL,
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
	(275,'users','service_shoes',NULL,'checkbox',0,0,0,0,0,NULL,NULL,NULL,NULL,27,''),
	(274,'users','service_water',NULL,'checkbox',0,0,0,0,0,NULL,NULL,NULL,NULL,26,''),
	(273,'users','bike_seat_height',NULL,'numeric',0,0,0,0,0,NULL,NULL,NULL,NULL,25,''),
	(272,'users','bike_bar_height',NULL,'numeric',0,0,0,0,0,NULL,NULL,NULL,NULL,24,''),
	(271,'users','shoe_size',NULL,'numeric',0,0,0,0,0,NULL,NULL,NULL,NULL,23,''),
	(270,'users','last_login',NULL,'datetime',0,0,0,0,0,NULL,NULL,NULL,NULL,22,''),
	(269,'users','joined',NULL,'datetime',0,0,0,0,0,NULL,NULL,NULL,NULL,21,''),
	(268,'users','authorize_id',NULL,'numeric',0,0,0,0,0,NULL,NULL,NULL,NULL,20,''),
	(267,'users','billing_zip',NULL,'numeric',0,0,0,0,0,NULL,NULL,NULL,NULL,19,''),
	(266,'users','billing_state',NULL,'textinput',0,0,0,0,0,NULL,NULL,NULL,NULL,18,''),
	(265,'users','billing_city',NULL,'textinput',0,0,0,0,0,NULL,NULL,NULL,NULL,17,''),
	(264,'users','billing_address_2',NULL,'textinput',0,0,0,0,0,NULL,NULL,NULL,NULL,16,''),
	(263,'users','billing_address_1',NULL,'textinput',0,0,0,0,0,NULL,NULL,NULL,NULL,15,''),
	(262,'users','zip',NULL,'numeric',0,0,0,0,0,NULL,NULL,NULL,NULL,14,''),
	(261,'users','state',NULL,'textinput',0,0,0,0,0,NULL,NULL,NULL,NULL,13,''),
	(260,'users','city',NULL,'textinput',0,0,0,0,0,NULL,NULL,NULL,NULL,12,''),
	(259,'users','address_2',NULL,'textinput',0,0,0,0,0,NULL,NULL,NULL,NULL,11,''),
	(258,'users','address_1',NULL,'textinput',0,0,0,0,0,NULL,NULL,NULL,NULL,10,''),
	(257,'users','phone_number',NULL,'textinput',0,0,0,0,0,NULL,NULL,NULL,NULL,9,''),
	(256,'users','region',NULL,'numeric',0,0,0,0,0,NULL,NULL,NULL,NULL,8,''),
	(255,'users','password',NULL,'textinput',0,0,0,0,0,NULL,NULL,NULL,NULL,7,''),
	(254,'users','gender',NULL,'textinput',0,0,0,0,0,NULL,NULL,NULL,NULL,6,''),
	(253,'users','last_name',NULL,'textinput',0,0,0,0,0,NULL,NULL,NULL,NULL,5,''),
	(252,'users','first_name',NULL,'textinput',0,0,0,0,0,NULL,NULL,NULL,NULL,4,''),
	(248,'users','favourite_studios','MANYTOMANY','relational',0,0,0,0,0,'studios','favorite_studios','user_id','studio_id',9999,''),
	(249,'users','id',NULL,'numeric',0,0,0,0,0,NULL,NULL,NULL,NULL,1,''),
	(250,'users','active',NULL,'checkbox',0,0,0,0,0,NULL,NULL,NULL,NULL,2,''),
	(251,'users','email',NULL,'textinput',0,0,0,0,0,NULL,NULL,NULL,NULL,3,''),
	(247,'users','favourite_products','MANYTOMANY','relational',0,0,0,0,0,'products','favorite_products','user_id','product_id',9999,''),
	(238,'directus_media','tags','','tags',0,0,0,0,0,NULL,NULL,NULL,NULL,NULL,NULL),
	(239,'directus_media','embed_id',NULL,NULL,0,0,1,0,0,NULL,NULL,NULL,NULL,NULL,NULL),
	(246,'users','favourite_instructors','MANYTOMANY','relational',0,0,0,0,0,'instructors','favorite_instructors','user_id','instructor_id',9999,''),
	(245,'users','classes','MANYTOMANY','relational',0,0,0,0,0,'classes','bookmarks','user_id','class_id',9999,'');

/*!40000 ALTER TABLE `directus_columns` ENABLE KEYS */;
UNLOCK TABLES;


# Dump of table directus_groups
# ------------------------------------------------------------

DROP TABLE IF EXISTS `directus_groups`;

CREATE TABLE `directus_groups` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `name` int(11) DEFAULT NULL,
  `description` int(11) DEFAULT NULL,
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

LOCK TABLES `directus_media` WRITE;
/*!40000 ALTER TABLE `directus_media` DISABLE KEYS */;

INSERT INTO `directus_media` (`id`, `active`, `name`, `title`, `location`, `type`, `charset`, `caption`, `tags`, `width`, `height`, `size`, `embed_id`, `user`, `date_uploaded`)
VALUES
	(26,1,'garfield-1.jpeg','garfield.jpeg',NULL,'image/jpeg',NULL,NULL,NULL,600,362,38665,NULL,1,'2013-02-05 18:14:57'),
	(25,1,'sans-soleil-2.jpeg','sans-soleil.jpeg',NULL,'image/jpeg',NULL,NULL,NULL,350,245,32026,NULL,1,'2013-02-05 14:49:51'),
	(24,1,'pkWWWKKA8jY.jpg','Pincess Mononoke','','embed/youtube',NULL,'','trailer',480,360,11303,'pkWWWKKA8jY',1,'2013-02-05 14:08:07'),
	(23,1,'logo.png','Backbone','','image/png','','','',50,50,5964,'',1,'0000-00-00 00:00:00'),
	(22,1,'TAGGED-1.jpg','Felix','','image/jpeg','','','',32,32,1946,'',1,'0000-00-00 00:00:00');

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
  `status` varchar(5) DEFAULT '3',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

LOCK TABLES `directus_preferences` WRITE;
/*!40000 ALTER TABLE `directus_preferences` DISABLE KEYS */;

INSERT INTO `directus_preferences` (`id`, `user`, `table_name`, `columns_visible`, `sort`, `sort_order`, `status`)
VALUES
	(1,1,'directus_users','name,activity,email,description','id','asc','2,1'),
	(4,1,'directus_preferences','text_field','id','asc','2,1'),
	(5,1,'directus_activity','activity,user,change_made','id','asc','2,1'),
	(9,1,'directus_media','item,title,type,size,user,date_uploaded','id','asc','2,1'),
	(10,1,'directus_messages','subject,message,datetime,reply,from,to,viewed,archived,table,row','id','asc','2'),
	(21,1,'directus_preferences','user,table_name,columns_visible,sort_order,status','id','asc','2,1'),
	(37,1,'about','title,description,banner_image,button_link','id','asc','2,1'),
	(38,1,'bikes','room_id,bike_number,position','id','asc','2,1'),
	(39,1,'bike_parts','name,serial_number,price,part_allocation','id','asc','2,1'),
	(40,1,'bike_tickets','bike_id,studio_id,position,complaint,comment,date_created,adjusted,parts_used','id','asc','2,1'),
	(41,1,'bookmarks','user_id,class_id','id','asc','2,1'),
	(42,1,'classes','room_id,instructor_id,class_type_id,datetime,note','id','asc','2,1'),
	(43,1,'class_types','title,description,banner_image','id','asc','2,1'),
	(44,1,'community','title,category,description,media,datetime','id','asc','2,1'),
	(45,1,'community_categories','title','id','asc','2,1'),
	(46,1,'community_comments','user_id,comment,datetime','id','asc','2,1'),
	(47,1,'faq','order,category,question,answer','id','asc','2,1'),
	(48,1,'favorite_instructors','user_id,instructor_id','id','asc','2,1'),
	(49,1,'favorite_products','user_id,product_id','id','asc','2,1'),
	(50,1,'favorite_studios','user_id,studio_id','id','asc','2,1'),
	(51,1,'gift_cards','code,value,balance,date_created','id','asc','2,1'),
	(52,1,'instructors','first_name,last_name,nickname,image,password,email,phone,address_1,address_2,city,state,zip,bio,facebook,twitter,tumblr','id','asc','2,1'),
	(53,1,'instructor_music','instructor_id,datetime,track_id,artist,track,album_art_url','id','asc','2,1'),
	(54,1,'instructor_studios','instructor_id,studio_id','id','asc','2,1'),
	(55,1,'products','title,category,description,sizes,styles,price','id','asc','2,1'),
	(56,1,'product_brands','title','id','asc','2,1'),
	(57,1,'product_categories','title','id','asc','2,1'),
	(58,1,'product_features','title,product_id,image','id','asc','2,1'),
	(59,1,'product_sizes','title','id','asc','2,1'),
	(60,1,'product_styles','title','id','asc','2,1'),
	(61,1,'regions','title','id','asc','2,1'),
	(62,1,'reservations','class_id,user_id,guest_name,time_reserved','id','asc','2,1'),
	(63,1,'rooms','title,studio_id,seats','id','asc','2,1'),
	(64,1,'seats','seat_number,position,instructor','id','asc','2,1'),
	(65,1,'social_cache','type,datetime,content','id','asc','2,1'),
	(66,1,'studios','title,region_id,address,city,state,zip,country,phone_number,email,banner_image,slideshow_images,amenities','id','asc','2,1'),
	(67,1,'users','email,first_name,last_name,gender,password,region,phone_number,address_1,address_2,city,state,zip,billing_address_1,billing_address_2,billing_city,billing_state,billing_zip,authorize_id,joined,last_login,shoe_size,bike_bar_height,bike_seat_height,service_water,service_shoes','id','asc','2,1'),
	(68,1,'waitlist','user_id,class_id,priority','id','asc','2,1');

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
	(1,'global','site_name','RANGER'),
	(2,'global','site_url','http://www.rngr.org'),
	(3,'global','cms_color','green'),
	(4,'media','media_folder','resources'),
	(5,'media','media_naming','unique'),
	(6,'media','allowed_thumbnails','test test test'),
	(8,'media','zxczxczxc','zxczxc'),
	(26,'global','cms_user_auto_sign_out','10'),
	(178,'media','thumbnail_quality','90');

/*!40000 ALTER TABLE `directus_settings` ENABLE KEYS */;
UNLOCK TABLES;


# Dump of table directus_tables
# ------------------------------------------------------------

DROP TABLE IF EXISTS `directus_tables`;

CREATE TABLE `directus_tables` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `table_name` varchar(64) NOT NULL DEFAULT '',
  `hidden` tinyint(1) NOT NULL DEFAULT '0',
  `single` tinyint(1) NOT NULL DEFAULT '0',
  `inactive_by_default` tinyint(1) NOT NULL DEFAULT '0',
  `is_junction_table` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

LOCK TABLES `directus_tables` WRITE;
/*!40000 ALTER TABLE `directus_tables` DISABLE KEYS */;

INSERT INTO `directus_tables` (`id`, `table_name`, `hidden`, `single`, `inactive_by_default`, `is_junction_table`)
VALUES
	(4,'directus_messages',1,0,0,0),
	(5,'directus_media',1,0,0,0),
	(6,'directus_activity',1,0,0,0),
	(11,'directus_users',1,0,0,0),
	(12,'about',1,1,0,0),
	(13,'bookmarks',1,0,0,1),
	(14,'favorite_instructors',1,0,0,1),
	(15,'favorite_products',1,0,0,1),
	(16,'favorite_studios',1,0,0,1),
	(17,'instructor_studios',1,0,0,1);

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
  `value` varchar(200) DEFAULT NULL,
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
	(29,'about','title','textinput','test','TEST');

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
  `password` varchar(255) NOT NULL DEFAULT '',
  `token` varchar(255) NOT NULL DEFAULT '',
  `reset_token` varchar(255) NOT NULL DEFAULT '',
  `reset_expiration` datetime NOT NULL,
  `email` varchar(255) NOT NULL DEFAULT '',
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

INSERT INTO `directus_users` (`id`, `active`, `first_name`, `last_name`, `password`, `token`, `reset_token`, `reset_expiration`, `email`, `description`, `email_messages`, `last_login`, `last_page`, `ip`, `group`)
VALUES
	(1,1,'Ben','Haynes','$P$BQlO4Pi2xzGulWlbqVgq.H0ky699FS.','lcjREKokJYNLkIjY7LUqnCs0wnWSvStvb2PTgw4HWu0=','yTGAt9Z2PHFrDQ9NWncUYzXlG8SUw9RkzkrW1JTdzvQ=','2012-03-18 10:57:47','ben@rngr.org','Directus Developer',1,'2012-08-03 19:13:40','messages.php','24.103.115.138',-1),
	(2,1,'Rob','Giampietro','','','','0000-00-00 00:00:00','rob@projectprojects.com','Designer',0,'2011-05-24 03:35:37','dashboard.php','67.243.190.142',2),
	(3,1,'Chris','McCaddon','$P$BDyGLnpd1BsKXpf8qkC9fcc0D2HpvU/','','','0000-00-00 00:00:00','mcm@rngr.org','Directus Designer',0,'2012-03-19 15:24:27','edit.php?table=demo_table&item=1','24.103.115.138',1),
	(4,1,'Meagan','Campol','$P$BFmfJ/gtXziEF.Zl2WPU79A7uDkTKr/','','','0000-00-00 00:00:00','meagan.campol@gmail.com','Beta Tester',0,'2012-03-18 18:03:00','dashboard.php','98.14.119.188',NULL),
	(6,1,'Milena','Sadee','','','','0000-00-00 00:00:00','milena@2x4.org','CMS Review',0,'2011-05-03 18:54:51','dashboard.php','69.193.173.98',NULL),
	(11,1,'Aaron','Gemmill','','','','0000-00-00 00:00:00','gemmill@gmail.com','CMS Review',0,'2011-05-22 22:38:14','messages.php','67.243.190.142',NULL),
	(17,1,'Chris','Cannon','','','','0000-00-00 00:00:00','chrisc@projectprojects.com','CMS Review',0,'2011-07-05 15:47:06','messages.php?m=inbox','50.74.192.138',NULL),
	(22,1,'John','Smith','','','','0000-00-00 00:00:00','john@example.com','Dummy',1,'2011-07-05 15:47:06','','',NULL),
	(20,1,'Will','Scarbrough','','','','0000-00-00 00:00:00','wscarbrough@sasaki.com','CMS Review',0,'2011-07-21 13:52:54','edit.php?table=blog&item=1','68.171.130.190',NULL),
	(21,1,'Chris','Kristofferson','','','','0000-00-00 00:00:00','c@avec.us','CMS Review',0,'2011-12-12 16:46:00','media.php','24.39.127.154',NULL),
	(23,1,'Olov','Sundstrom','kaka','dinn','','0000-00-00 00:00:01','olov@rngr.org','RANGER',0,'2012-08-03 19:13:44','settings.php','24.103.115.138',-1);

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



# Dump of table favorite_products
# ------------------------------------------------------------

DROP TABLE IF EXISTS `favorite_products`;

CREATE TABLE `favorite_products` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;



# Dump of table favorite_studios
# ------------------------------------------------------------

DROP TABLE IF EXISTS `favorite_studios`;

CREATE TABLE `favorite_studios` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `studio_id` int(11) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;



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
  `track` varchar(255) NOT NULL DEFAULT '',
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
  `seats` varchar(255) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;



# Dump of table seats
# ------------------------------------------------------------

DROP TABLE IF EXISTS `seats`;

CREATE TABLE `seats` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `seat_number` varchar(11) NOT NULL COMMENT '# or i',
  `position` varchar(5) NOT NULL COMMENT 'x,y',
  `instructor` int(11) NOT NULL,
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



# Dump of table users
# ------------------------------------------------------------

DROP TABLE IF EXISTS `users`;

CREATE TABLE `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `active` tinyint(1) NOT NULL,
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
	(1,1,'','olov','sundstrom','','',0,'','','','','',0,'','','','',0,0,'0000-00-00 00:00:00','0000-00-00 00:00:00',0,0,0,0,0);

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

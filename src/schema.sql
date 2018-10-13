# ************************************************************
# Sequel Pro SQL dump
# Version 4541
#
# http://www.sequelpro.com/
# https://github.com/sequelpro/sequelpro
#
# Host: localhost (MySQL 5.6.38)
# Database: directus
# Generation Time: 2018-10-05 18:41:00 +0000
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
  `action` varchar(45) NOT NULL,
  `action_by` int(11) unsigned NOT NULL DEFAULT '0',
  `action_on` datetime NOT NULL,
  `ip` varchar(50) NOT NULL,
  `user_agent` varchar(255) NOT NULL,
  `collection` varchar(64) NOT NULL,
  `item` varchar(255) NOT NULL,
  `edited_on` datetime DEFAULT NULL,
  `comment` text,
  `comment_deleted_on` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;



# Dump of table directus_activity_seen
# ------------------------------------------------------------

DROP TABLE IF EXISTS `directus_activity_seen`;

CREATE TABLE `directus_activity_seen` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `activity` int(11) unsigned NOT NULL,
  `user` int(11) unsigned NOT NULL DEFAULT '0',
  `seen_on` datetime DEFAULT NULL,
  `archived` tinyint(1) unsigned NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;



# Dump of table directus_collection_presets
# ------------------------------------------------------------

DROP TABLE IF EXISTS `directus_collection_presets`;

CREATE TABLE `directus_collection_presets` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `title` varchar(255) DEFAULT NULL,
  `user` int(11) unsigned DEFAULT NULL,
  `role` int(11) unsigned DEFAULT NULL,
  `collection` varchar(64) NOT NULL,
  `search_query` varchar(100) DEFAULT NULL,
  `filters` text,
  `view_type` varchar(100) NOT NULL DEFAULT 'tabular',
  `view_query` text,
  `view_options` text,
  `translation` text,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_user_collection_title` (`user`,`collection`,`title`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

LOCK TABLES `directus_collection_presets` WRITE;
/*!40000 ALTER TABLE `directus_collection_presets` DISABLE KEYS */;

INSERT INTO `directus_collection_presets` (`id`, `title`, `user`, `role`, `collection`, `search_query`, `filters`, `view_type`, `view_query`, `view_options`, `translation`)
VALUES
	(1,NULL,NULL,NULL,'directus_activity',NULL,NULL,'tabular','{\"tabular\":{\"sort\":\"-action_on\",\"fields\":\"action,action_by,action_on,collection,item\"}}','{\"tabular\":{\"widths\":{\"action\":170,\"action_by\":170,\"action_on\":180,\"collection\":200,\"item\":200}}}',NULL),
	(2,NULL,NULL,NULL,'directus_files',NULL,NULL,'cards',NULL,'{\"cards\":{\"title\":\"title\",\"subtitle\":\"type\",\"content\":\"description\",\"src\":\"data\"}}',NULL),
	(3,NULL,NULL,NULL,'directus_users',NULL,NULL,'cards',NULL,'{\"cards\":{\"title\":\"first_name\",\"subtitle\":\"last_name\",\"content\":\"title\",\"src\":\"avatar\",\"icon\":\"person\"}}',NULL);

/*!40000 ALTER TABLE `directus_collection_presets` ENABLE KEYS */;
UNLOCK TABLES;


# Dump of table directus_collections
# ------------------------------------------------------------

DROP TABLE IF EXISTS `directus_collections`;

CREATE TABLE `directus_collections` (
  `collection` varchar(64) NOT NULL,
  `managed` tinyint(1) unsigned NOT NULL DEFAULT '1',
  `hidden` tinyint(1) unsigned NOT NULL DEFAULT '0',
  `single` tinyint(1) unsigned NOT NULL DEFAULT '0',
  `icon` varchar(20) DEFAULT NULL,
  `note` varchar(255) DEFAULT NULL,
  `translation` text,
  PRIMARY KEY (`collection`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;



# Dump of table directus_fields
# ------------------------------------------------------------

DROP TABLE IF EXISTS `directus_fields`;

CREATE TABLE `directus_fields` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `collection` varchar(64) NOT NULL,
  `field` varchar(64) NOT NULL,
  `type` varchar(64) NOT NULL,
  `interface` varchar(64) DEFAULT NULL,
  `options` text,
  `locked` tinyint(1) unsigned NOT NULL DEFAULT '0',
  `validation` varchar(255) DEFAULT NULL,
  `required` tinyint(1) unsigned NOT NULL DEFAULT '0',
  `readonly` tinyint(1) unsigned NOT NULL DEFAULT '0',
  `hidden_detail` tinyint(1) unsigned NOT NULL DEFAULT '0',
  `hidden_browse` tinyint(1) unsigned NOT NULL DEFAULT '0',
  `sort` int(11) unsigned DEFAULT NULL,
  `width` int(11) unsigned NOT NULL DEFAULT '4',
  `group` int(11) unsigned DEFAULT NULL,
  `note` varchar(1024) DEFAULT NULL,
  `translation` text,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_collection_field` (`collection`,`field`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

LOCK TABLES `directus_fields` WRITE;
/*!40000 ALTER TABLE `directus_fields` DISABLE KEYS */;

INSERT INTO `directus_fields` (`id`, `collection`, `field`, `type`, `interface`, `options`, `locked`, `validation`, `required`, `readonly`, `hidden_detail`, `hidden_browse`, `sort`, `width`, `group`, `note`, `translation`)
VALUES
	(1,'directus_activity','id','integer','primary-key',NULL,1,NULL,1,1,1,0,NULL,4,NULL,NULL,NULL),
	(2,'directus_activity','action','string','activity-icon',NULL,1,NULL,0,1,0,0,1,4,NULL,NULL,NULL),
	(3,'directus_activity','collection','string','collections',NULL,1,NULL,0,1,0,0,2,2,NULL,NULL,NULL),
	(4,'directus_activity','item','string','text-input',NULL,1,NULL,0,1,0,0,3,2,NULL,NULL,NULL),
	(5,'directus_activity','action_by','integer','user',NULL,1,NULL,0,1,0,0,4,2,NULL,NULL,NULL),
	(6,'directus_activity','action_on','datetime','datetime','{\"showRelative\":true}',1,NULL,0,1,0,0,5,2,NULL,NULL,NULL),
	(7,'directus_activity','edited_on','datetime','datetime','{\"showRelative\":true}',1,NULL,0,1,0,0,6,2,NULL,NULL,NULL),
	(8,'directus_activity','comment_deleted_on','datetime','datetime','{\"showRelative\":true}',1,NULL,0,1,0,0,7,2,NULL,NULL,NULL),
	(9,'directus_activity','ip','string','text-input',NULL,1,NULL,0,1,0,0,8,2,NULL,NULL,NULL),
	(10,'directus_activity','user_agent','string','text-input',NULL,1,NULL,0,1,0,0,9,2,NULL,NULL,NULL),
	(11,'directus_activity','comment','string','textarea',NULL,1,NULL,0,1,0,0,10,4,NULL,NULL,NULL),
	(12,'directus_collection_presets','id','integer','primary-key',NULL,1,NULL,0,0,0,0,NULL,4,NULL,NULL,NULL),
	(13,'directus_collection_presets','title','string','text-input',NULL,1,NULL,0,0,0,0,NULL,4,NULL,NULL,NULL),
	(14,'directus_collection_presets','user','integer','user',NULL,1,NULL,0,0,0,0,NULL,4,NULL,NULL,NULL),
	(15,'directus_collection_presets','role','m2o','many-to-one',NULL,1,NULL,0,0,0,0,NULL,4,NULL,NULL,NULL),
	(16,'directus_collection_presets','collection','m2o','many-to-one',NULL,1,NULL,0,0,0,0,NULL,4,NULL,NULL,NULL),
	(17,'directus_collection_presets','search_query','string','text-input',NULL,1,NULL,0,0,0,0,NULL,4,NULL,NULL,NULL),
	(18,'directus_collection_presets','filters','json','code',NULL,1,NULL,0,0,0,0,NULL,4,NULL,NULL,NULL),
	(19,'directus_collection_presets','view_options','json','code',NULL,1,NULL,0,0,0,0,NULL,4,NULL,NULL,NULL),
	(20,'directus_collection_presets','view_type','string','text-input',NULL,1,NULL,0,0,0,0,NULL,4,NULL,NULL,NULL),
	(21,'directus_collection_presets','view_query','json','code',NULL,1,NULL,0,0,0,0,NULL,4,NULL,NULL,NULL),
	(22,'directus_collections','fields','o2m','one-to-many',NULL,1,NULL,0,0,1,1,1,4,NULL,NULL,NULL),
	(23,'directus_collections','collection','string','primary-key',NULL,1,NULL,1,1,0,0,2,2,NULL,NULL,NULL),
	(24,'directus_collections','note','string','text-input',NULL,1,NULL,0,0,0,0,3,2,NULL,NULL,NULL),
	(25,'directus_collections','managed','boolean','toggle',NULL,1,NULL,0,0,0,0,4,1,NULL,NULL,NULL),
	(26,'directus_collections','hidden','boolean','toggle',NULL,1,NULL,0,0,0,0,5,1,NULL,NULL,NULL),
	(27,'directus_collections','single','boolean','toggle',NULL,1,NULL,0,0,0,0,6,1,NULL,NULL,NULL),
	(28,'directus_collections','translation','json','code',NULL,1,NULL,0,0,1,0,7,4,NULL,NULL,NULL),
	(29,'directus_collections','icon','string','icon',NULL,1,NULL,0,0,0,0,8,4,NULL,NULL,NULL),
	(30,'directus_fields','id','integer','primary-key',NULL,1,NULL,1,0,1,0,NULL,4,NULL,NULL,NULL),
	(31,'directus_fields','collection','m2o','many-to-one',NULL,1,NULL,0,0,0,0,NULL,4,NULL,NULL,NULL),
	(32,'directus_fields','field','string','text-input',NULL,1,NULL,0,0,0,0,NULL,4,NULL,NULL,NULL),
	(33,'directus_fields','type','string','primary-key',NULL,1,NULL,0,0,0,0,NULL,4,NULL,NULL,NULL),
	(34,'directus_fields','interface','string','primary-key',NULL,1,NULL,0,0,0,0,NULL,4,NULL,NULL,NULL),
	(35,'directus_fields','options','json','code',NULL,1,NULL,0,0,0,0,NULL,4,NULL,NULL,NULL),
	(36,'directus_fields','locked','boolean','toggle',NULL,1,NULL,0,0,0,0,NULL,4,NULL,NULL,NULL),
	(37,'directus_fields','translation','json','code',NULL,1,NULL,0,0,0,0,NULL,4,NULL,NULL,NULL),
	(38,'directus_fields','readonly','boolean','toggle',NULL,1,NULL,0,0,0,0,NULL,4,NULL,NULL,NULL),
	(39,'directus_fields','required','boolean','toggle',NULL,1,NULL,0,0,0,0,NULL,4,NULL,NULL,NULL),
	(40,'directus_fields','sort','sort','sort',NULL,1,NULL,0,0,0,0,NULL,4,NULL,NULL,NULL),
	(41,'directus_fields','note','string','text-input',NULL,1,NULL,0,0,0,0,NULL,4,NULL,NULL,NULL),
	(42,'directus_fields','hidden_detail','boolean','toggle',NULL,1,NULL,0,0,0,0,NULL,4,NULL,NULL,NULL),
	(43,'directus_fields','hidden_browse','boolean','toggle',NULL,1,NULL,0,0,0,0,NULL,4,NULL,NULL,NULL),
	(44,'directus_fields','width','integer','numeric',NULL,1,NULL,0,0,0,0,NULL,4,NULL,NULL,NULL),
	(45,'directus_fields','group','m2o','many-to-one',NULL,1,NULL,0,0,0,0,NULL,4,NULL,NULL,NULL),
	(46,'directus_files','data','alias','single-file',NULL,1,NULL,0,0,1,0,0,4,NULL,NULL,NULL),
	(47,'directus_files','id','integer','primary-key',NULL,1,NULL,1,0,1,0,1,4,NULL,NULL,NULL),
	(48,'directus_files','preview','alias','file',NULL,1,NULL,0,0,0,0,2,4,NULL,NULL,NULL),
	(49,'directus_files','title','string','text-input','{\"placeholder\":\"Enter a descriptive title...\",\"iconRight\":\"title\"}',1,NULL,0,0,0,0,3,2,NULL,NULL,NULL),
	(50,'directus_files','filename','string','text-input','{\"placeholder\":\"Enter a unique file name...\",\"iconRight\":\"insert_drive_file\"}',1,NULL,0,1,0,0,4,2,NULL,NULL,NULL),
	(51,'directus_files','tags','array','tags',NULL,0,NULL,0,0,0,0,5,2,NULL,NULL,NULL),
	(52,'directus_files','location','string','text-input','{\"placeholder\":\"Enter a location...\",\"iconRight\":\"place\"}',0,NULL,0,0,0,0,6,2,NULL,NULL,NULL),
	(53,'directus_files','description','string','wysiwyg','{\"placeholder\":\"Enter a caption or description...\"}',0,NULL,0,0,0,0,7,4,NULL,NULL,NULL),
	(54,'directus_files','width','integer','numeric','{\"iconRight\":\"straighten\"}',1,NULL,0,1,0,0,8,1,NULL,NULL,NULL),
	(55,'directus_files','height','integer','numeric','{\"iconRight\":\"straighten\"}',1,NULL,0,1,0,0,9,1,NULL,NULL,NULL),
	(56,'directus_files','duration','integer','numeric','{\"iconRight\":\"timer\"}',1,NULL,0,1,0,0,10,1,NULL,NULL,NULL),
	(57,'directus_files','filesize','integer','file-size','{\"iconRight\":\"storage\"}',1,NULL,0,1,0,0,11,1,NULL,NULL,NULL),
	(58,'directus_files','uploaded_on','datetime','datetime','{\"iconRight\":\"today\"}',1,NULL,0,1,0,0,12,2,NULL,NULL,NULL),
	(59,'directus_files','uploaded_by','integer','user',NULL,1,NULL,0,1,0,0,13,2,NULL,NULL,NULL),
	(60,'directus_files','metadata','json','code',NULL,1,NULL,0,0,0,0,14,4,NULL,NULL,NULL),
	(61,'directus_files','type','string','text-input',NULL,1,NULL,0,1,1,0,NULL,4,NULL,NULL,NULL),
	(62,'directus_files','charset','string','text-input',NULL,1,NULL,0,1,1,1,NULL,4,NULL,NULL,NULL),
	(63,'directus_files','embed','string','text-input',NULL,1,NULL,0,1,1,0,NULL,4,NULL,NULL,NULL),
	(64,'directus_files','folder','m2o','many-to-one',NULL,1,NULL,0,0,1,0,NULL,4,NULL,NULL,NULL),
	(65,'directus_files','storage','string','text-input',NULL,1,NULL,0,0,1,1,NULL,4,NULL,NULL,NULL),
	(66,'directus_folders','id','integer','primary-key',NULL,1,NULL,1,0,1,0,NULL,4,NULL,NULL,NULL),
	(67,'directus_folders','name','string','text-input',NULL,1,NULL,0,0,0,0,NULL,4,NULL,NULL,NULL),
	(68,'directus_folders','parent_folder','m2o','many-to-one',NULL,1,NULL,0,0,0,0,NULL,4,NULL,NULL,NULL),
	(69,'directus_permissions','id','integer','primary-key',NULL,1,NULL,1,0,1,0,NULL,4,NULL,NULL,NULL),
	(70,'directus_permissions','collection','m2o','many-to-one',NULL,1,NULL,0,0,0,0,NULL,4,NULL,NULL,NULL),
	(71,'directus_permissions','role','m2o','many-to-one',NULL,1,NULL,0,0,0,0,NULL,4,NULL,NULL,NULL),
	(72,'directus_permissions','status','string','text-input',NULL,1,NULL,0,0,0,0,NULL,4,NULL,NULL,NULL),
	(73,'directus_permissions','create','string','text-input',NULL,1,NULL,0,0,0,0,NULL,4,NULL,NULL,NULL),
	(74,'directus_permissions','read','string','text-input',NULL,1,NULL,0,0,0,0,NULL,4,NULL,NULL,NULL),
	(75,'directus_permissions','update','string','text-input',NULL,1,NULL,0,0,0,0,NULL,4,NULL,NULL,NULL),
	(76,'directus_permissions','delete','string','primary-key',NULL,1,NULL,0,0,0,0,NULL,4,NULL,NULL,NULL),
	(77,'directus_permissions','comment','string','text-input',NULL,1,NULL,0,0,0,0,NULL,4,NULL,NULL,NULL),
	(78,'directus_permissions','explain','string','text-input',NULL,1,NULL,0,0,0,0,NULL,4,NULL,NULL,NULL),
	(79,'directus_permissions','status_blacklist','array','tags',NULL,1,NULL,0,0,0,0,NULL,4,NULL,NULL,NULL),
	(80,'directus_permissions','read_field_blacklist','array','tags',NULL,1,NULL,0,0,0,0,NULL,4,NULL,NULL,NULL),
	(81,'directus_permissions','write_field_blacklist','array','tags',NULL,1,NULL,0,0,0,0,NULL,4,NULL,NULL,NULL),
	(82,'directus_relations','id','integer','primary-key',NULL,1,NULL,0,0,0,0,NULL,4,NULL,NULL,NULL),
	(83,'directus_relations','collection_many','string','collections',NULL,1,NULL,0,0,0,0,NULL,4,NULL,NULL,NULL),
	(84,'directus_relations','field_many','string','text-input',NULL,1,NULL,0,0,0,0,NULL,4,NULL,NULL,NULL),
	(85,'directus_relations','collection_one','string','collections',NULL,1,NULL,0,0,0,0,NULL,4,NULL,NULL,NULL),
	(86,'directus_relations','field_one','string','text-input',NULL,1,NULL,0,0,0,0,NULL,4,NULL,NULL,NULL),
	(87,'directus_relations','junction_field','string','text-input',NULL,1,NULL,0,0,0,0,NULL,4,NULL,NULL,NULL),
	(88,'directus_revisions','id','integer','primary-key',NULL,1,NULL,0,0,0,0,NULL,4,NULL,NULL,NULL),
	(89,'directus_revisions','activity','m2o','many-to-one',NULL,1,NULL,0,0,0,0,NULL,4,NULL,NULL,NULL),
	(90,'directus_revisions','collection','m2o','many-to-one',NULL,1,NULL,0,0,0,0,NULL,4,NULL,NULL,NULL),
	(91,'directus_revisions','item','string','text-input',NULL,1,NULL,0,0,0,0,NULL,4,NULL,NULL,NULL),
	(92,'directus_revisions','data','json','code',NULL,1,NULL,0,0,0,0,NULL,4,NULL,NULL,NULL),
	(93,'directus_revisions','delta','json','code',NULL,1,NULL,0,0,0,0,NULL,4,NULL,NULL,NULL),
	(94,'directus_revisions','parent_item','string','text-input',NULL,1,NULL,0,0,0,0,NULL,4,NULL,NULL,NULL),
	(95,'directus_revisions','parent_collection','string','collections',NULL,1,NULL,0,0,0,0,NULL,4,NULL,NULL,NULL),
	(96,'directus_revisions','parent_changed','boolean','toggle',NULL,1,NULL,0,0,0,0,NULL,4,NULL,NULL,NULL),
	(97,'directus_roles','id','integer','primary-key',NULL,1,NULL,1,0,1,0,NULL,4,NULL,NULL,NULL),
	(98,'directus_roles','external_id','string','text-input',NULL,1,NULL,0,1,1,1,NULL,4,NULL,NULL,NULL),
	(99,'directus_roles','name','string','text-input',NULL,1,NULL,0,0,0,0,1,2,NULL,NULL,NULL),
	(100,'directus_roles','description','string','text-input',NULL,1,NULL,0,0,0,0,2,2,NULL,NULL,NULL),
	(101,'directus_roles','ip_whitelist','string','textarea',NULL,1,NULL,0,0,0,0,NULL,4,NULL,NULL,NULL),
	(102,'directus_roles','nav_blacklist','string','textarea',NULL,1,NULL,0,0,1,1,NULL,4,NULL,NULL,NULL),
	(103,'directus_settings','auto_sign_out','integer','numeric',NULL,1,NULL,0,0,0,0,NULL,4,NULL,NULL,NULL),
	(104,'directus_settings','logo','file','single_file',NULL,1,NULL,0,0,0,0,NULL,4,NULL,NULL,NULL),
	(105,'directus_settings','color','string','color-palette',NULL,1,NULL,0,0,0,0,NULL,4,NULL,NULL,NULL),
	(106,'directus_users','id','integer','primary-key',NULL,1,NULL,1,0,1,0,1,4,NULL,NULL,NULL),
	(107,'directus_users','status','status','status','{\"status_mapping\":{\"draft\":{\"name\":\"Draft\",\"text_color\":\"white\",\"background_color\":\"light-gray\",\"listing_subdued\":false,\"listing_badge\":true,\"soft_delete\":false,\"published\":true},\"invited\":{\"name\":\"Invited\",\"text_color\":\"white\",\"background_color\":\"light-gray\",\"listing_subdued\":false,\"listing_badge\":true,\"soft_delete\":false,\"published\":false},\"active\":{\"name\":\"Active\",\"text_color\":\"white\",\"background_color\":\"success\",\"listing_subdued\":false,\"listing_badge\":false,\"soft_delete\":false,\"published\":true},\"suspended\":{\"name\":\"Suspended\",\"text_color\":\"white\",\"background_color\":\"light-gray\",\"listing_subdued\":false,\"listing_badge\":true,\"soft_delete\":false,\"published\":false},\"deleted\":{\"name\":\"Deleted\",\"text_color\":\"white\",\"background_color\":\"danger\",\"listing_subdued\":false,\"listing_badge\":true,\"soft_delete\":true,\"published\":false}}}',1,NULL,0,0,0,0,2,4,NULL,NULL,NULL),
	(108,'directus_users','first_name','string','text-input','{\"placeholder\":\"Enter your give name...\"}',1,NULL,1,0,0,0,3,2,NULL,NULL,NULL),
	(109,'directus_users','last_name','string','text-input','{\"placeholder\":\"Enter your surname...\"}',1,NULL,1,0,0,0,4,2,NULL,NULL,NULL),
	(110,'directus_users','email','string','text-input','{\"placeholder\":\"Enter your email address...\"}',1,NULL,1,0,0,0,5,2,NULL,NULL,NULL),
	(111,'directus_users','email_notifications','boolean','toggle',NULL,1,NULL,0,0,0,0,6,2,NULL,NULL,NULL),
	(112,'directus_users','password','string','password',NULL,1,NULL,1,0,0,0,7,4,NULL,NULL,NULL),
	(113,'directus_users','company','string','text-input','{\"placeholder\":\"Enter your company or organization name...\"}',0,NULL,0,0,0,0,8,2,NULL,NULL,NULL),
	(114,'directus_users','title','string','text-input','{\"placeholder\":\"Enter your title or role...\"}',0,NULL,0,0,0,0,9,2,NULL,NULL,NULL),
	(115,'directus_users','timezone','string','dropdown','{\"choices\":{\"America\\/Puerto_Rico\":\"Puerto Rico (Atlantic)\",\"America\\/New_York\":\"New York (Eastern)\",\"America\\/Chicago\":\"Chicago (Central)\",\"America\\/Denver\":\"Denver (Mountain)\",\"America\\/Phoenix\":\"Phoenix (MST)\",\"America\\/Los_Angeles\":\"Los Angeles (Pacific)\",\"America\\/Anchorage\":\"Anchorage (Alaska)\",\"Pacific\\/Honolulu\":\"Honolulu (Hawaii)\"},\"placeholder\":\"Choose a timezone...\"}',1,NULL,0,0,0,0,10,2,NULL,NULL,NULL),
	(116,'directus_users','locale','string','dropdown','{\"choices\":{\"en-US\":\"English (US)\",\"nl-NL\":\"Dutch (Nederlands)\",\"de-DE\":\"German (Deutsche)\"},\"placeholder\":\"Choose a language...\"}',1,NULL,0,0,0,0,11,2,NULL,NULL,NULL),
	(117,'directus_users','locale_options','json','code',NULL,1,NULL,0,0,0,1,12,4,NULL,NULL,NULL),
	(118,'directus_users','token','string','text-input',NULL,1,NULL,0,0,1,1,13,4,NULL,NULL,NULL),
	(119,'directus_users','last_login','datetime','datetime',NULL,1,NULL,0,1,0,0,14,2,NULL,NULL,NULL),
	(120,'directus_users','last_access_on','datetime','datetime',NULL,1,NULL,0,1,1,0,15,2,NULL,NULL,NULL),
	(121,'directus_users','last_page','string','text-input',NULL,1,NULL,0,1,1,1,16,2,NULL,NULL,NULL),
	(122,'directus_users','avatar','file','single-file',NULL,1,NULL,0,0,0,0,17,4,NULL,NULL,NULL),
	(123,'directus_users','invite_token','string','text-input',NULL,1,NULL,0,0,1,1,NULL,4,NULL,NULL,NULL),
	(124,'directus_users','invite_accepted','boolean','toggle',NULL,1,NULL,0,0,1,1,NULL,4,NULL,NULL,NULL),
	(125,'directus_users','last_ip','string','text-input',NULL,1,NULL,0,1,1,0,NULL,4,NULL,NULL,NULL),
	(126,'directus_users','roles','o2m','many-to-many',NULL,1,NULL,0,0,1,1,NULL,4,NULL,NULL,NULL),
	(127,'directus_users','external_id','string','text-input',NULL,1,NULL,0,1,1,0,NULL,4,NULL,NULL,NULL),
	(128,'directus_user_roles','id','integer','primary-key',NULL,1,NULL,1,0,1,0,NULL,4,NULL,NULL,NULL),
	(129,'directus_user_roles','user_id','m2o','many-to-one',NULL,1,NULL,0,0,0,0,NULL,4,NULL,NULL,NULL),
	(130,'directus_user_roles','role_id','m2o','many-to-one',NULL,1,NULL,0,0,0,0,NULL,4,NULL,NULL,NULL);

/*!40000 ALTER TABLE `directus_fields` ENABLE KEYS */;
UNLOCK TABLES;


# Dump of table directus_files
# ------------------------------------------------------------

DROP TABLE IF EXISTS `directus_files`;

CREATE TABLE `directus_files` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `storage` varchar(50) NOT NULL DEFAULT 'local',
  `filename` varchar(255) NOT NULL,
  `title` varchar(255) DEFAULT NULL,
  `type` varchar(255) DEFAULT NULL,
  `uploaded_by` int(11) unsigned NOT NULL,
  `uploaded_on` datetime NOT NULL,
  `charset` varchar(50) DEFAULT NULL,
  `filesize` int(11) unsigned NOT NULL DEFAULT '0',
  `width` int(11) unsigned DEFAULT NULL,
  `height` int(11) unsigned DEFAULT NULL,
  `duration` int(11) DEFAULT NULL,
  `embed` varchar(200) DEFAULT NULL,
  `folder` int(11) unsigned DEFAULT NULL,
  `description` text,
  `location` varchar(200) DEFAULT NULL,
  `tags` varchar(255) DEFAULT NULL,
  `metadata` text,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;



# Dump of table directus_folders
# ------------------------------------------------------------

DROP TABLE IF EXISTS `directus_folders`;

CREATE TABLE `directus_folders` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(191) CHARACTER SET utf8mb4 NOT NULL,
  `parent_folder` int(11) unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_name_parent_folder` (`name`,`parent_folder`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;



# Dump of table directus_migrations
# ------------------------------------------------------------

DROP TABLE IF EXISTS `directus_migrations`;

CREATE TABLE `directus_migrations` (
  `version` bigint(20) NOT NULL,
  `migration_name` varchar(100) DEFAULT NULL,
  `start_time` timestamp NULL DEFAULT NULL,
  `end_time` timestamp NULL DEFAULT NULL,
  `breakpoint` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`version`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

LOCK TABLES `directus_migrations` WRITE;
/*!40000 ALTER TABLE `directus_migrations` DISABLE KEYS */;

INSERT INTO `directus_migrations` (`version`, `migration_name`, `start_time`, `end_time`, `breakpoint`)
VALUES
	(20180220023138,'CreateActivityTable','2018-10-05 18:40:31','2018-10-05 18:40:31',0),
	(20180220023144,'CreateActivitySeenTable','2018-10-05 18:40:31','2018-10-05 18:40:31',0),
	(20180220023152,'CreateCollectionsPresetsTable','2018-10-05 18:40:31','2018-10-05 18:40:31',0),
	(20180220023157,'CreateCollectionsTable','2018-10-05 18:40:31','2018-10-05 18:40:31',0),
	(20180220023202,'CreateFieldsTable','2018-10-05 18:40:31','2018-10-05 18:40:31',0),
	(20180220023208,'CreateFilesTable','2018-10-05 18:40:31','2018-10-05 18:40:31',0),
	(20180220023213,'CreateFoldersTable','2018-10-05 18:40:31','2018-10-05 18:40:31',0),
	(20180220023217,'CreateRolesTable','2018-10-05 18:40:31','2018-10-05 18:40:31',0),
	(20180220023226,'CreatePermissionsTable','2018-10-05 18:40:31','2018-10-05 18:40:31',0),
	(20180220023232,'CreateRelationsTable','2018-10-05 18:40:31','2018-10-05 18:40:31',0),
	(20180220023238,'CreateRevisionsTable','2018-10-05 18:40:31','2018-10-05 18:40:31',0),
	(20180220023243,'CreateSettingsTable','2018-10-05 18:40:31','2018-10-05 18:40:31',0),
	(20180220023248,'CreateUsersTable','2018-10-05 18:40:31','2018-10-05 18:40:31',0),
	(20180426173310,'CreateUserRoles','2018-10-05 18:40:31','2018-10-05 18:40:31',0);

/*!40000 ALTER TABLE `directus_migrations` ENABLE KEYS */;
UNLOCK TABLES;


# Dump of table directus_permissions
# ------------------------------------------------------------

DROP TABLE IF EXISTS `directus_permissions`;

CREATE TABLE `directus_permissions` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `collection` varchar(64) NOT NULL,
  `role` int(11) unsigned NOT NULL,
  `status` varchar(64) DEFAULT NULL,
  `create` varchar(16) DEFAULT 'none',
  `read` varchar(16) DEFAULT 'none',
  `update` varchar(16) DEFAULT 'none',
  `delete` varchar(16) DEFAULT 'none',
  `comment` varchar(8) DEFAULT 'none',
  `explain` varchar(8) DEFAULT 'none',
  `read_field_blacklist` varchar(1000) DEFAULT NULL,
  `write_field_blacklist` varchar(1000) DEFAULT NULL,
  `status_blacklist` varchar(1000) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;



# Dump of table directus_relations
# ------------------------------------------------------------

DROP TABLE IF EXISTS `directus_relations`;

CREATE TABLE `directus_relations` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `collection_many` varchar(64) NOT NULL,
  `field_many` varchar(45) NOT NULL,
  `collection_one` varchar(64) DEFAULT NULL,
  `field_one` varchar(64) DEFAULT NULL,
  `junction_field` varchar(64) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

LOCK TABLES `directus_relations` WRITE;
/*!40000 ALTER TABLE `directus_relations` DISABLE KEYS */;

INSERT INTO `directus_relations` (`id`, `collection_many`, `field_many`, `collection_one`, `field_one`, `junction_field`)
VALUES
	(1,'directus_activity','action_by','directus_users',NULL,NULL),
	(2,'directus_activity_seen','user','directus_users',NULL,NULL),
	(3,'directus_activity_seen','activity','directus_activity',NULL,NULL),
	(4,'directus_collections_presets','user','directus_users',NULL,NULL),
	(5,'directus_collections_presets','group','directus_groups',NULL,NULL),
	(6,'directus_files','uploaded_by','directus_users',NULL,NULL),
	(7,'directus_files','folder','directus_folders',NULL,NULL),
	(8,'directus_folders','parent_folder','directus_folders',NULL,NULL),
	(9,'directus_permissions','group','directus_groups',NULL,NULL),
	(10,'directus_revisions','activity','directus_activity',NULL,NULL),
	(11,'directus_user_roles','user','directus_users','roles','role'),
	(12,'directus_user_roles','role','directus_roles','users','user'),
	(13,'directus_users','avatar','directus_files',NULL,NULL),
	(14,'directus_fields','collection','directus_collections','fields',NULL);

/*!40000 ALTER TABLE `directus_relations` ENABLE KEYS */;
UNLOCK TABLES;


# Dump of table directus_revisions
# ------------------------------------------------------------

DROP TABLE IF EXISTS `directus_revisions`;

CREATE TABLE `directus_revisions` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `activity` int(11) unsigned NOT NULL,
  `collection` varchar(64) NOT NULL,
  `item` varchar(255) NOT NULL,
  `data` longtext NOT NULL,
  `delta` longtext,
  `parent_collection` varchar(64) DEFAULT NULL,
  `parent_item` varchar(255) DEFAULT NULL,
  `parent_changed` tinyint(1) unsigned DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;



# Dump of table directus_roles
# ------------------------------------------------------------

DROP TABLE IF EXISTS `directus_roles`;

CREATE TABLE `directus_roles` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `description` varchar(500) DEFAULT NULL,
  `ip_whitelist` text,
  `nav_blacklist` text,
  `external_id` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_group_name` (`name`),
  UNIQUE KEY `idx_roles_external_id` (`external_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

LOCK TABLES `directus_roles` WRITE;
/*!40000 ALTER TABLE `directus_roles` DISABLE KEYS */;

INSERT INTO `directus_roles` (`id`, `name`, `description`, `ip_whitelist`, `nav_blacklist`, `external_id`)
VALUES
	(1,'Administrator','Admins have access to all managed data within the system by default',NULL,NULL,NULL),
	(2,'Public','This sets the data that is publicly available through the API without a token',NULL,NULL,NULL);

/*!40000 ALTER TABLE `directus_roles` ENABLE KEYS */;
UNLOCK TABLES;


# Dump of table directus_settings
# ------------------------------------------------------------

DROP TABLE IF EXISTS `directus_settings`;

CREATE TABLE `directus_settings` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `scope` varchar(64) NOT NULL,
  `key` varchar(64) NOT NULL,
  `value` text NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_scope_name` (`scope`,`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

LOCK TABLES `directus_settings` WRITE;
/*!40000 ALTER TABLE `directus_settings` DISABLE KEYS */;

INSERT INTO `directus_settings` (`id`, `scope`, `key`, `value`)
VALUES
	(1,'global','auto_sign_out','60'),
	(2,'global','project_name','Directus'),
	(3,'global','default_limit','200'),
	(4,'global','logo',''),
	(5,'files','youtube_api_key','');

/*!40000 ALTER TABLE `directus_settings` ENABLE KEYS */;
UNLOCK TABLES;


# Dump of table directus_user_roles
# ------------------------------------------------------------

DROP TABLE IF EXISTS `directus_user_roles`;

CREATE TABLE `directus_user_roles` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `user` int(11) unsigned DEFAULT NULL,
  `role` int(11) unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_user_role` (`user`,`role`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

LOCK TABLES `directus_user_roles` WRITE;
/*!40000 ALTER TABLE `directus_user_roles` DISABLE KEYS */;

INSERT INTO `directus_user_roles` (`id`, `user`, `role`)
VALUES
	(1,1,1);

/*!40000 ALTER TABLE `directus_user_roles` ENABLE KEYS */;
UNLOCK TABLES;


# Dump of table directus_users
# ------------------------------------------------------------

DROP TABLE IF EXISTS `directus_users`;

CREATE TABLE `directus_users` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `status` varchar(16) NOT NULL DEFAULT 'draft',
  `first_name` varchar(50) DEFAULT NULL,
  `last_name` varchar(50) DEFAULT NULL,
  `email` varchar(128) NOT NULL,
  `password` varchar(255) DEFAULT NULL,
  `token` varchar(255) DEFAULT NULL,
  `timezone` varchar(32) NOT NULL DEFAULT 'America/New_York',
  `locale` varchar(8) DEFAULT 'en-US',
  `locale_options` text,
  `avatar` int(11) unsigned DEFAULT NULL,
  `company` varchar(191) DEFAULT NULL,
  `title` varchar(191) DEFAULT NULL,
  `email_notifications` int(1) NOT NULL DEFAULT '1',
  `last_access_on` datetime DEFAULT NULL,
  `last_page` varchar(45) DEFAULT NULL,
  `external_id` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_users_email` (`email`),
  UNIQUE KEY `idx_users_token` (`token`),
  UNIQUE KEY `idx_users_external_id` (`external_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

LOCK TABLES `directus_users` WRITE;
/*!40000 ALTER TABLE `directus_users` DISABLE KEYS */;

INSERT INTO `directus_users` (`id`, `status`, `first_name`, `last_name`, `email`, `password`, `token`, `timezone`, `locale`, `locale_options`, `avatar`, `company`, `title`, `email_notifications`, `last_access_on`, `last_page`, `external_id`)
VALUES
	(1,'active','Admin','User','admin@example.com','$2y$10$PA4vjJ5SODMiBBsBp4Jn/OO.YCOXQo.SHfmP9gF8RJnWgWGcJRcCW','admin_token','America/New_York','en-US',NULL,NULL,NULL,NULL,1,NULL,NULL,NULL);

/*!40000 ALTER TABLE `directus_users` ENABLE KEYS */;
UNLOCK TABLES;



/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;
/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;

# ************************************************************
# Sequel Pro SQL dump
# Version 4004
#
# http://www.sequelpro.com/
# http://code.google.com/p/sequel-pro/
#
# Host: localhost (MySQL 5.5.29)
# Database: directus
# Generation Time: 2013-08-03 18:56:31 +0000
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
  `delta` text NOT NULL,
  `parent_id` int(11) DEFAULT NULL,
  `parent_changed` tinyint(1) NOT NULL COMMENT 'Did the top-level record in the change set alter (scalar values/many-to-one relationships)? Or only the data within its related foreign collection records? (*toMany)',
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

LOCK TABLES `directus_columns` WRITE;
/*!40000 ALTER TABLE `directus_columns` DISABLE KEYS */;

INSERT INTO `directus_columns` (`id`, `table_name`, `column_name`, `data_type`, `ui`, `system`, `master`, `hidden_input`, `hidden_list`, `required`, `table_related`, `junction_table`, `junction_key_left`, `junction_key_right`, `sort`, `comment`)
VALUES
	(1,'ui_gallery','id',NULL,'numeric',0,0,0,0,0,NULL,NULL,NULL,NULL,1,''),
	(2,'ui_gallery','active',NULL,'checkbox',0,0,0,0,0,NULL,NULL,NULL,NULL,2,''),
	(3,'ui_gallery','sort',NULL,'numeric',0,0,0,0,0,NULL,NULL,NULL,NULL,3,''),
	(4,'ui_gallery','input_field',NULL,'textinput',0,0,0,0,0,NULL,NULL,NULL,NULL,4,''),
	(5,'ui_gallery','slug',NULL,'textinput',0,0,0,0,0,NULL,NULL,NULL,NULL,5,''),
	(6,'ui_gallery','datetime',NULL,'datetime',0,0,0,0,0,NULL,NULL,NULL,NULL,6,''),
	(7,'ui_gallery','date',NULL,'date',0,0,0,0,0,NULL,NULL,NULL,NULL,7,''),
	(8,'ui_gallery','time',NULL,'time',0,0,0,0,0,NULL,NULL,NULL,NULL,8,''),
	(9,'ui_gallery','numeric',NULL,'numeric',0,0,0,0,0,NULL,NULL,NULL,NULL,9,''),
	(10,'ui_gallery','options',NULL,'select',0,0,0,0,0,NULL,NULL,NULL,NULL,10,''),
	(11,'ui_gallery','tags',NULL,'tags',0,0,0,0,0,NULL,NULL,NULL,NULL,11,''),
	(12,'ui_gallery','radio_buttons',NULL,'radiobuttons',0,0,0,0,0,NULL,NULL,NULL,NULL,12,''),
	(13,'ui_gallery','checkbox',NULL,'checkbox',0,0,0,0,0,NULL,NULL,NULL,NULL,13,''),
	(14,'ui_gallery','text_area',NULL,'textarea',0,0,0,0,0,NULL,NULL,NULL,NULL,14,''),
	(15,'ui_gallery','wysiwyg',NULL,'wysiwyg',0,0,0,0,0,NULL,NULL,NULL,NULL,15,''),
	(16,'ui_gallery','password',NULL,'password',0,0,0,0,0,NULL,NULL,NULL,NULL,16,''),
	(17,'ui_gallery','color',NULL,'color',0,0,0,0,0,NULL,NULL,NULL,NULL,17,''),
	(18,'ui_gallery','slider',NULL,'slider',0,0,0,0,0,NULL,NULL,NULL,NULL,18,''),
	(19,'ui_gallery','single_media',NULL,'single_media',0,0,0,0,0,NULL,NULL,NULL,NULL,19,'');

/*!40000 ALTER TABLE `directus_columns` ENABLE KEYS */;
UNLOCK TABLES;


# Dump of table directus_groups
# ------------------------------------------------------------

DROP TABLE IF EXISTS `directus_groups`;

CREATE TABLE `directus_groups` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(100) DEFAULT NULL,
  `description` varchar(500) DEFAULT NULL,
  `restrict_to_ip_whitelist` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

LOCK TABLES `directus_groups` WRITE;
/*!40000 ALTER TABLE `directus_groups` DISABLE KEYS */;

INSERT INTO `directus_groups` (`id`, `name`, `description`, `restrict_to_ip_whitelist`)
VALUES
	(1,'Administrator',NULL,0);

/*!40000 ALTER TABLE `directus_groups` ENABLE KEYS */;
UNLOCK TABLES;


# Dump of table directus_ip_whitelist
# ------------------------------------------------------------

DROP TABLE IF EXISTS `directus_ip_whitelist`;

CREATE TABLE `directus_ip_whitelist` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `ip_address` varchar(250) DEFAULT NULL,
  `description` varchar(250) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;



# Dump of table directus_media
# ------------------------------------------------------------

DROP TABLE IF EXISTS `directus_media`;

CREATE TABLE `directus_media` (
  `id` int(10) NOT NULL AUTO_INCREMENT,
  `active` tinyint(1) DEFAULT '1',
  `name` varchar(255) DEFAULT NULL,
  `url` varchar(2000) DEFAULT NULL,
  `title` varchar(255) DEFAULT '',
  `location` varchar(200) DEFAULT NULL,
  `caption` text,
  `type` varchar(50) DEFAULT '',
  `charset` varchar(50) DEFAULT '',
  `tags` varchar(255) DEFAULT '',
  `width` int(5) DEFAULT '0',
  `height` int(5) DEFAULT '0',
  `size` int(20) DEFAULT '0',
  `embed_id` varchar(200) DEFAULT NULL,
  `user` int(11) NOT NULL,
  `date_uploaded` datetime DEFAULT NULL,
  `storage_adapter` int(11) unsigned DEFAULT NULL COMMENT 'FK `directus_storage_adapters`.`id`',
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
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `table_name` varchar(255) NOT NULL,
  `permissions` varchar(500) DEFAULT NULL COMMENT 'Table-level permissions (insert, delete, etc.)',
  `group_id` int(11) NOT NULL,
  `read_field_blacklist` varchar(1000) DEFAULT NULL,
  `write_field_blacklist` varchar(1000) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

LOCK TABLES `directus_privileges` WRITE;
/*!40000 ALTER TABLE `directus_privileges` DISABLE KEYS */;

INSERT INTO `directus_privileges` (`id`, `table_name`, `permissions`, `group_id`, `read_field_blacklist`, `write_field_blacklist`)
VALUES
	(1,'directus_activity','add,edit,bigedit,delete,bigdelete,alter,view',0,NULL,NULL),
	(2,'directus_columns','add,edit,bigedit,delete,bigdelete,alter,view',0,NULL,NULL),
	(3,'directus_groups','add,edit,bigedit,delete,bigdelete,alter,view',0,NULL,NULL),
	(4,'directus_media','add,edit,bigedit,delete,bigdelete,alter,view',0,NULL,NULL),
	(5,'directus_messages','add,edit,bigedit,delete,bigdelete,alter,view',0,NULL,NULL),
	(6,'directus_preferences','add,edit,bigedit,delete,bigdelete,alter,view',0,NULL,NULL),
	(7,'directus_privileges','add,edit,bigedit,delete,bigdelete,alter,view',0,NULL,NULL),
	(8,'directus_settings','add,edit,bigedit,delete,bigdelete,alter,view',0,NULL,NULL),
	(9,'directus_tables','add,edit,bigedit,delete,bigdelete,alter,view',0,NULL,NULL),
	(10,'directus_ui','add,edit,bigedit,delete,bigdelete,alter,view',0,NULL,NULL),
	(11,'directus_users','add,edit,bigedit,delete,bigdelete,alter,view',0,NULL,NULL),
	(12,'ui_gallery','add,edit,bigedit,delete,bigdelete,alter,view',0,NULL,NULL);

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
  UNIQUE KEY `Unique Collection and Name` (`collection`,`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

LOCK TABLES `directus_settings` WRITE;
/*!40000 ALTER TABLE `directus_settings` DISABLE KEYS */;

INSERT INTO `directus_settings` (`id`, `collection`, `name`, `value`)
VALUES
	(1,'global','site_name','Site Name'),
	(2,'media','media_naming','original'),
	(3,'media','storage_adapter','FileSystemAdapter'),
	(4,'media','storage_destination',NULL),
	(5,'media','thumbnail_storage_adapter','FileSystemAdapter'),
	(6,'media','thumbnail_storage_destination',NULL),
	(7,'media','thumbnail_size','200'),
	(8,'media','thumbnail_quality','80');

/*!40000 ALTER TABLE `directus_settings` ENABLE KEYS */;
UNLOCK TABLES;


# Dump of table directus_social_feeds
# ------------------------------------------------------------

DROP TABLE IF EXISTS `directus_social_feeds`;

CREATE TABLE `directus_social_feeds` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `active` tinyint(1) NOT NULL DEFAULT '1',
  `type` tinyint(2) NOT NULL COMMENT 'Twitter (1), Instagram (2)',
  `last_checked` datetime DEFAULT NULL,
  `name` varchar(255) NOT NULL,
  `foreign_id` varchar(255) NOT NULL,
  `data` text NOT NULL COMMENT 'Feed metadata. JSON format.',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;



# Dump of table directus_social_posts
# ------------------------------------------------------------

DROP TABLE IF EXISTS `directus_social_posts`;

CREATE TABLE `directus_social_posts` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `active` tinyint(1) NOT NULL DEFAULT '1',
  `feed` int(11) NOT NULL COMMENT 'The FK ID of the feed.',
  `datetime` datetime NOT NULL COMMENT 'The date/time this entry was published.',
  `foreign_id` varchar(55) NOT NULL,
  `data` text NOT NULL COMMENT 'The API response for this entry, excluding unnecessary feed metadata, which is stored on the directus_social_feeds table.',
  PRIMARY KEY (`id`),
  UNIQUE KEY `feed` (`feed`,`foreign_id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;



# Dump of table directus_storage_adapters
# ------------------------------------------------------------

DROP TABLE IF EXISTS `directus_storage_adapters`;

CREATE TABLE `directus_storage_adapters` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `key` varchar(255) NOT NULL,
  `adapter_name` varchar(255) NOT NULL DEFAULT '',
  `role` varchar(255) DEFAULT NULL COMMENT 'DEFAULT, THUMBNAIL, or Null. DEFAULT and THUMBNAIL should only occur once each.',
  `public` tinyint(1) unsigned NOT NULL DEFAULT '1' COMMENT '1 for yes, 0 for no.',
  `destination` varchar(255) NOT NULL DEFAULT '',
  `url` varchar(2000) DEFAULT '' COMMENT 'Trailing slash required.',
  `params` varchar(2000) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;



# Dump of table directus_tab_privileges
# ------------------------------------------------------------

DROP TABLE IF EXISTS `directus_tab_privileges`;

CREATE TABLE `directus_tab_privileges` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `group_id` int(11) DEFAULT NULL,
  `tab_blacklist` varchar(500) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;



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
  `magic_owner_column` varchar(64) DEFAULT NULL,
  PRIMARY KEY (`table_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

LOCK TABLES `directus_tables` WRITE;
/*!40000 ALTER TABLE `directus_tables` DISABLE KEYS */;

INSERT INTO `directus_tables` (`table_name`, `hidden`, `single`, `inactive_by_default`, `is_junction_table`, `footer`, `magic_owner_column`)
VALUES
	('directus_activity',1,0,0,0,0,NULL),
	('directus_groups',1,0,0,0,0,NULL),
	('directus_media',1,0,0,0,0,NULL),
	('directus_messages',1,0,0,0,0,NULL),
	('directus_users',1,0,0,0,0,NULL),
	('ui_gallery',0,0,0,0,0,NULL);

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
  `value` text,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique` (`table_name`,`column_name`,`ui_name`,`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

LOCK TABLES `directus_ui` WRITE;
/*!40000 ALTER TABLE `directus_ui` DISABLE KEYS */;

INSERT INTO `directus_ui` (`id`, `table_name`, `column_name`, `ui_name`, `name`, `value`)
VALUES
	(1,'ui_gallery','slider','slider','minimum','0'),
	(2,'ui_gallery','slider','slider','maximum','100'),
	(3,'ui_gallery','slider','slider','step','1'),
	(4,'ui_gallery','text_area','textarea','rows','10'),
	(5,'ui_gallery','radio_buttons','radiobuttons','options','Apple,Banana,Carrot'),
	(6,'ui_gallery','numeric','numeric','size','medium'),
	(7,'ui_gallery','options','select','options','{\r\n    \"AL\": \"Alabama\",\r\n    \"AK\": \"Alaska\",\r\n    \"AS\": \"American Samoa\",\r\n    \"AZ\": \"Arizona\",\r\n    \"AR\": \"Arkansas\",\r\n    \"CA\": \"California\",\r\n    \"CO\": \"Colorado\",\r\n    \"CT\": \"Connecticut\",\r\n    \"DE\": \"Delaware\",\r\n    \"DC\": \"District Of Columbia\",\r\n    \"FM\": \"Federated States Of Micronesia\",\r\n    \"FL\": \"Florida\",\r\n    \"GA\": \"Georgia\",\r\n    \"GU\": \"Guam\",\r\n    \"HI\": \"Hawaii\",\r\n    \"ID\": \"Idaho\",\r\n    \"IL\": \"Illinois\",\r\n    \"IN\": \"Indiana\",\r\n    \"IA\": \"Iowa\",\r\n    \"KS\": \"Kansas\",\r\n    \"KY\": \"Kentucky\",\r\n    \"LA\": \"Louisiana\",\r\n    \"ME\": \"Maine\",\r\n    \"MH\": \"Marshall Islands\",\r\n    \"MD\": \"Maryland\",\r\n    \"MA\": \"Massachusetts\",\r\n    \"MI\": \"Michigan\",\r\n    \"MN\": \"Minnesota\",\r\n    \"MS\": \"Mississippi\",\r\n    \"MO\": \"Missouri\",\r\n    \"MT\": \"Montana\",\r\n    \"NE\": \"Nebraska\",\r\n    \"NV\": \"Nevada\",\r\n    \"NH\": \"New Hampshire\",\r\n    \"NJ\": \"New Jersey\",\r\n    \"NM\": \"New Mexico\",\r\n    \"NY\": \"New York\",\r\n    \"NC\": \"North Carolina\",\r\n    \"ND\": \"North Dakota\",\r\n    \"MP\": \"Northern Mariana Islands\",\r\n    \"OH\": \"Ohio\",\r\n    \"OK\": \"Oklahoma\",\r\n    \"OR\": \"Oregon\",\r\n    \"PW\": \"Palau\",\r\n    \"PA\": \"Pennsylvania\",\r\n    \"PR\": \"Puerto Rico\",\r\n    \"RI\": \"Rhode Island\",\r\n    \"SC\": \"South Carolina\",\r\n    \"SD\": \"South Dakota\",\r\n    \"TN\": \"Tennessee\",\r\n    \"TX\": \"Texas\",\r\n    \"UT\": \"Utah\",\r\n    \"VT\": \"Vermont\",\r\n    \"VI\": \"Virgin Islands\",\r\n    \"VA\": \"Virginia\",\r\n    \"WA\": \"Washington\",\r\n    \"WV\": \"West Virginia\",\r\n    \"WI\": \"Wisconsin\",\r\n    \"WY\": \"Wyoming\"\r\n}');

/*!40000 ALTER TABLE `directus_ui` ENABLE KEYS */;
UNLOCK TABLES;


# Dump of table directus_users
# ------------------------------------------------------------

DROP TABLE IF EXISTS `directus_users`;

CREATE TABLE `directus_users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `active` tinyint(1) DEFAULT '1',
  `first_name` varchar(50) DEFAULT '',
  `last_name` varchar(50) DEFAULT '',
  `email` varchar(255) DEFAULT '',
  `password` varchar(255) DEFAULT '',
  `salt` varchar(255) NOT NULL,
  `token` varchar(255) DEFAULT '',
  `reset_token` varchar(255) DEFAULT '',
  `reset_expiration` datetime DEFAULT NULL,
  `description` text,
  `email_messages` tinyint(1) DEFAULT '1',
  `last_login` datetime DEFAULT '0000-00-00 00:00:00',
  `last_access` datetime DEFAULT NULL,
  `last_page` varchar(255) DEFAULT '',
  `ip` varchar(50) DEFAULT '',
  `group` int(11) DEFAULT NULL,
  `avatar` varchar(500) DEFAULT NULL,
  `closest_studio` varchar(255) DEFAULT NULL,
  `adp_id` int(11) DEFAULT NULL,
  `phone` varchar(255) DEFAULT NULL,
  `office_phone` varchar(255) DEFAULT NULL,
  `address` varchar(255) DEFAULT NULL,
  `city` varchar(255) DEFAULT NULL,
  `state` varchar(2) DEFAULT NULL,
  `zip` varchar(10) DEFAULT NULL,
  `emergency_name` varchar(255) DEFAULT NULL,
  `emergency_email` varchar(255) DEFAULT NULL,
  `emergency_phone` varchar(255) DEFAULT NULL,
  `emergency_name_2` varchar(255) DEFAULT NULL,
  `emergency_email_2` varchar(255) DEFAULT NULL,
  `emergency_phone_2` varchar(255) DEFAULT NULL,
  `vestigial_username` varchar(255) DEFAULT NULL,
  `vestigial_role` varchar(255) DEFAULT NULL,
  `vestigial_password` varchar(255) DEFAULT NULL,
  `vestigial_isretailadmin` varchar(255) DEFAULT NULL,
  `vestigial_directorycategory` varchar(255) DEFAULT NULL,
  `vestigial_image` varchar(255) DEFAULT NULL,
  `vestigial_can_buy_old` varchar(255) DEFAULT NULL,
  `vestigial_hide_in_directory` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

LOCK TABLES `directus_users` WRITE;
/*!40000 ALTER TABLE `directus_users` DISABLE KEYS */;

INSERT INTO `directus_users` (`id`, `active`, `first_name`, `last_name`, `email`, `password`, `salt`, `token`, `reset_token`, `reset_expiration`, `description`, `email_messages`, `last_login`, `last_access`, `last_page`, `ip`, `group`, `avatar`, `closest_studio`, `adp_id`, `phone`, `office_phone`, `address`, `city`, `state`, `zip`, `emergency_name`, `emergency_email`, `emergency_phone`, `emergency_name_2`, `emergency_email_2`, `emergency_phone_2`, `vestigial_username`, `vestigial_role`, `vestigial_password`, `vestigial_isretailadmin`, `vestigial_directorycategory`, `vestigial_image`, `vestigial_can_buy_old`, `vestigial_hide_in_directory`)
VALUES
	(1,1,'Change Me','Change Me','admin@getdirectus.com','cb7ada116bcb98ebfbf0e5f9da82de03310e49fa','514c5be0dffa9','','',NULL,NULL,1,'0000-00-00 00:00:00','0000-00-00 00:00:00','','',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL);

/*!40000 ALTER TABLE `directus_users` ENABLE KEYS */;
UNLOCK TABLES;


# Dump of table ui_gallery
# ------------------------------------------------------------

DROP TABLE IF EXISTS `ui_gallery`;

CREATE TABLE `ui_gallery` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `active` tinyint(1) NOT NULL DEFAULT '1',
  `sort` int(11) NOT NULL,
  `input_field` varchar(200) NOT NULL,
  `slug` varchar(200) NOT NULL,
  `datetime` datetime NOT NULL,
  `date` date NOT NULL,
  `time` time NOT NULL,
  `numeric` int(11) NOT NULL,
  `options` varchar(200) NOT NULL,
  `tags` varchar(200) NOT NULL,
  `radio_buttons` varchar(200) NOT NULL,
  `checkbox` tinyint(1) NOT NULL,
  `text_area` text NOT NULL,
  `wysiwyg` text NOT NULL,
  `password` varchar(200) NOT NULL DEFAULT '',
  `color` varchar(255) DEFAULT NULL,
  `slider` int(11) DEFAULT NULL,
  `single_media` int(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;




/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;
/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;

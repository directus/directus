/*
SQLyog Ultimate v12.09 (64 bit)
MySQL - 5.7.21-log : Database - directus-live
*********************************************************************
*/


/*!40101 SET NAMES utf8 */;

/*!40101 SET SQL_MODE=''*/;

/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

/*Table structure for table `directus_activity` */

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
  `comment` text CHARACTER SET utf8mb4,
  `comment_deleted_on` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8;

/*Data for the table `directus_activity` */

insert  into `directus_activity`(`id`,`action`,`action_by`,`action_on`,`ip`,`user_agent`,`collection`,`item`,`edited_on`,`comment`,`comment_deleted_on`) values (1,'authenticate',1,'2019-06-22 07:28:21','::1','Mozilla/5.0 (Windows NT 6.3; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/75.0.3770.100 Safari/537.36','directus_users','1',NULL,NULL,NULL);

/*Table structure for table `directus_activity_seen` */

DROP TABLE IF EXISTS `directus_activity_seen`;

CREATE TABLE `directus_activity_seen` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `activity` int(11) unsigned NOT NULL,
  `user` int(11) unsigned NOT NULL DEFAULT '0',
  `seen_on` datetime DEFAULT NULL,
  `archived` tinyint(1) unsigned NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

/*Data for the table `directus_activity_seen` */

/*Table structure for table `directus_collection_presets` */

DROP TABLE IF EXISTS `directus_collection_presets`;

CREATE TABLE `directus_collection_presets` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `title` varchar(255) CHARACTER SET utf8mb4 DEFAULT NULL,
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
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8;

/*Data for the table `directus_collection_presets` */

insert  into `directus_collection_presets`(`id`,`title`,`user`,`role`,`collection`,`search_query`,`filters`,`view_type`,`view_query`,`view_options`,`translation`) values (1,NULL,NULL,NULL,'directus_activity',NULL,NULL,'timeline','{\"timeline\":{\"sort\":\"-action_on\"}}','{\"timeline\":{\"date\":\"action_on\",\"title\":\"{{ action_by.first_name }} {{ action_by.last_name }} ({{ action }})\",\"content\":\"action_by\",\"color\":\"action\"}}',NULL),(2,NULL,NULL,NULL,'directus_files',NULL,NULL,'cards',NULL,'{\"cards\":{\"title\":\"title\",\"subtitle\":\"type\",\"content\":\"description\",\"src\":\"data\"}}',NULL),(3,NULL,NULL,NULL,'directus_users',NULL,NULL,'cards',NULL,'{\"cards\":{\"title\":\"first_name\",\"subtitle\":\"last_name\",\"content\":\"title\",\"src\":\"avatar\",\"icon\":\"person\"}}',NULL);

/*Table structure for table `directus_collections` */

DROP TABLE IF EXISTS `directus_collections`;

CREATE TABLE `directus_collections` (
  `collection` varchar(64) NOT NULL,
  `managed` tinyint(1) unsigned NOT NULL DEFAULT '1',
  `hidden` tinyint(1) unsigned NOT NULL DEFAULT '0',
  `single` tinyint(1) unsigned NOT NULL DEFAULT '0',
  `icon` varchar(30) DEFAULT NULL,
  `note` varchar(255) DEFAULT NULL,
  `translation` text,
  PRIMARY KEY (`collection`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

/*Data for the table `directus_collections` */

/*Table structure for table `directus_fields` */

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
  `width` varchar(30) DEFAULT NULL,
  `group` int(11) unsigned DEFAULT NULL,
  `note` varchar(1024) DEFAULT NULL,
  `translation` text,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_collection_field` (`collection`,`field`)
) ENGINE=InnoDB AUTO_INCREMENT=145 DEFAULT CHARSET=utf8;

/*Data for the table `directus_fields` */

insert  into `directus_fields`(`id`,`collection`,`field`,`type`,`interface`,`options`,`locked`,`validation`,`required`,`readonly`,`hidden_detail`,`hidden_browse`,`sort`,`width`,`group`,`note`,`translation`) values (1,'directus_activity','id','integer','primary-key',NULL,1,NULL,1,1,1,0,NULL,'full',NULL,NULL,NULL),(2,'directus_activity','action','string','activity-icon',NULL,1,NULL,0,1,0,0,1,'full',NULL,NULL,NULL),(3,'directus_activity','collection','string','collections',NULL,1,NULL,0,1,0,0,2,'half',NULL,NULL,NULL),(4,'directus_activity','item','string','text-input',NULL,1,NULL,0,1,0,0,3,'half',NULL,NULL,NULL),(5,'directus_activity','action_by','integer','user',NULL,1,NULL,0,1,0,0,4,'half',NULL,NULL,NULL),(6,'directus_activity','action_on','datetime','datetime','{\"showRelative\":true}',1,NULL,0,1,0,0,5,'half',NULL,NULL,NULL),(7,'directus_activity','edited_on','datetime','datetime','{\"showRelative\":true}',1,NULL,0,1,0,0,6,'half',NULL,NULL,NULL),(8,'directus_activity','comment_deleted_on','datetime','datetime','{\"showRelative\":true}',1,NULL,0,1,0,0,7,'half',NULL,NULL,NULL),(9,'directus_activity','ip','string','text-input',NULL,1,NULL,0,1,0,0,8,'half',NULL,NULL,NULL),(10,'directus_activity','user_agent','string','text-input',NULL,1,NULL,0,1,0,0,9,'half',NULL,NULL,NULL),(11,'directus_activity','comment','string','textarea',NULL,1,NULL,0,1,0,0,10,'full',NULL,NULL,NULL),(12,'directus_collection_presets','id','integer','primary-key',NULL,1,NULL,0,0,0,0,NULL,'full',NULL,NULL,NULL),(13,'directus_collection_presets','title','string','text-input',NULL,1,NULL,0,0,0,0,NULL,'full',NULL,NULL,NULL),(14,'directus_collection_presets','user','integer','user',NULL,1,NULL,0,0,0,0,NULL,'full',NULL,NULL,NULL),(15,'directus_collection_presets','role','m2o','many-to-one',NULL,1,NULL,0,0,0,0,NULL,'full',NULL,NULL,NULL),(16,'directus_collection_presets','collection','m2o','many-to-one',NULL,1,NULL,0,0,0,0,NULL,'full',NULL,NULL,NULL),(17,'directus_collection_presets','search_query','string','text-input',NULL,1,NULL,0,0,0,0,NULL,'full',NULL,NULL,NULL),(18,'directus_collection_presets','filters','json','json',NULL,1,NULL,0,0,0,0,NULL,'full',NULL,NULL,NULL),(19,'directus_collection_presets','view_options','json','json',NULL,1,NULL,0,0,0,0,NULL,'full',NULL,NULL,NULL),(20,'directus_collection_presets','view_type','string','text-input',NULL,1,NULL,0,0,0,0,NULL,'full',NULL,NULL,NULL),(21,'directus_collection_presets','view_query','json','json',NULL,1,NULL,0,0,0,0,NULL,'full',NULL,NULL,NULL),(22,'directus_collections','fields','o2m','one-to-many',NULL,1,NULL,0,0,1,1,1,'full',NULL,NULL,NULL),(23,'directus_collections','collection','string','primary-key',NULL,1,NULL,1,1,0,0,2,'half',NULL,NULL,NULL),(24,'directus_collections','note','string','text-input',NULL,1,NULL,0,0,0,0,3,'half',NULL,'An internal description.',NULL),(25,'directus_collections','managed','boolean','toggle',NULL,1,NULL,0,0,1,0,4,'half',NULL,'[Learn More](https://docs.directus.io/guides/collections.html#managing-collections).',NULL),(26,'directus_collections','hidden','boolean','toggle',NULL,1,NULL,0,0,0,0,5,'half',NULL,'[Learn More](https://docs.directus.io/guides/collections.html#hidden).',NULL),(27,'directus_collections','single','boolean','toggle',NULL,1,NULL,0,0,0,0,6,'half',NULL,'[Learn More](https://docs.directus.io/guides/collections.html#single).',NULL),(28,'directus_collections','translation','json','json',NULL,1,NULL,0,0,1,0,7,'full',NULL,NULL,NULL),(29,'directus_collections','icon','string','icon',NULL,1,NULL,0,0,0,0,8,'full',NULL,'The icon shown in the App\'s navigation sidebar.',NULL),(30,'directus_fields','id','integer','primary-key',NULL,1,NULL,1,0,1,0,NULL,'full',NULL,NULL,NULL),(31,'directus_fields','collection','m2o','many-to-one',NULL,1,NULL,0,0,0,0,NULL,'full',NULL,NULL,NULL),(32,'directus_fields','field','string','text-input',NULL,1,NULL,0,0,0,0,NULL,'full',NULL,NULL,NULL),(33,'directus_fields','type','string','primary-key',NULL,1,NULL,0,0,0,0,NULL,'full',NULL,NULL,NULL),(34,'directus_fields','interface','string','primary-key',NULL,1,NULL,0,0,0,0,NULL,'full',NULL,NULL,NULL),(35,'directus_fields','options','json','json',NULL,1,NULL,0,0,0,0,NULL,'full',NULL,NULL,NULL),(36,'directus_fields','locked','boolean','toggle',NULL,1,NULL,0,0,0,0,NULL,'full',NULL,NULL,NULL),(37,'directus_fields','translation','json','json',NULL,1,NULL,0,0,0,0,NULL,'full',NULL,NULL,NULL),(38,'directus_fields','readonly','boolean','toggle',NULL,1,NULL,0,0,0,0,NULL,'full',NULL,NULL,NULL),(39,'directus_fields','validation','string','text-input',NULL,1,NULL,0,0,0,0,NULL,'full',NULL,NULL,NULL),(40,'directus_fields','required','boolean','toggle',NULL,1,NULL,0,0,0,0,NULL,'full',NULL,NULL,NULL),(41,'directus_fields','sort','sort','sort',NULL,1,NULL,0,0,0,0,NULL,'full',NULL,NULL,NULL),(42,'directus_fields','note','string','text-input',NULL,1,NULL,0,0,0,0,NULL,'full',NULL,NULL,NULL),(43,'directus_fields','hidden_detail','boolean','toggle',NULL,1,NULL,0,0,0,0,NULL,'full',NULL,NULL,NULL),(44,'directus_fields','hidden_browse','boolean','toggle',NULL,1,NULL,0,0,0,0,NULL,'full',NULL,NULL,NULL),(45,'directus_fields','width','integer','numeric',NULL,1,NULL,0,0,0,0,NULL,'full',NULL,NULL,NULL),(46,'directus_fields','group','m2o','many-to-one',NULL,1,NULL,0,0,0,0,NULL,'full',NULL,NULL,NULL),(47,'directus_files','data','alias','file',NULL,1,NULL,0,0,1,0,0,'full',NULL,NULL,NULL),(48,'directus_files','id','integer','primary-key',NULL,1,NULL,1,0,1,0,1,'full',NULL,NULL,NULL),(49,'directus_files','preview','alias','file-preview',NULL,1,NULL,0,0,0,0,2,'full',NULL,NULL,NULL),(50,'directus_files','title','string','text-input','{\"placeholder\":\"Enter a descriptive title...\",\"iconRight\":\"title\"}',1,NULL,0,0,0,0,3,'half',NULL,NULL,NULL),(51,'directus_files','filename','string','text-input','{\"placeholder\":\"Enter a unique file name...\",\"iconRight\":\"insert_drive_file\"}',1,NULL,1,1,0,0,4,'half',NULL,NULL,NULL),(52,'directus_files','tags','array','tags',NULL,0,NULL,0,0,0,0,5,'half',NULL,NULL,NULL),(53,'directus_files','location','string','text-input','{\"placeholder\":\"Enter a location...\",\"iconRight\":\"place\"}',0,NULL,0,0,0,0,6,'half',NULL,NULL,NULL),(54,'directus_files','description','string','wysiwyg','{\"placeholder\":\"Enter a caption or description...\"}',0,NULL,0,0,0,0,7,'full',NULL,NULL,NULL),(55,'directus_files','width','integer','numeric','{\"iconRight\":\"straighten\"}',1,NULL,0,1,0,0,10,'half',NULL,NULL,NULL),(56,'directus_files','height','integer','numeric','{\"iconRight\":\"straighten\"}',1,NULL,0,1,0,0,11,'half',NULL,NULL,NULL),(57,'directus_files','duration','integer','numeric','{\"iconRight\":\"timer\"}',1,NULL,0,1,0,0,12,'half',NULL,NULL,NULL),(58,'directus_files','filesize','integer','file-size','{\"iconRight\":\"storage\"}',1,NULL,0,1,0,0,13,'half',NULL,NULL,NULL),(59,'directus_files','uploaded_on','datetime','datetime','{\"iconRight\":\"today\"}',1,NULL,1,1,0,0,8,'half',NULL,NULL,NULL),(60,'directus_files','uploaded_by','integer','user',NULL,1,NULL,1,1,0,0,9,'half',NULL,NULL,NULL),(61,'directus_files','metadata','json','json',NULL,1,NULL,0,0,0,0,14,'full',NULL,NULL,NULL),(62,'directus_files','type','string','text-input',NULL,1,NULL,0,1,1,0,NULL,'full',NULL,NULL,NULL),(63,'directus_files','charset','string','text-input',NULL,1,NULL,0,1,1,1,NULL,'full',NULL,NULL,NULL),(64,'directus_files','embed','string','text-input',NULL,1,NULL,0,1,1,0,NULL,'full',NULL,NULL,NULL),(65,'directus_files','folder','m2o','many-to-one',NULL,1,NULL,0,0,1,0,NULL,'full',NULL,NULL,NULL),(66,'directus_files','storage','string','text-input',NULL,1,NULL,0,0,1,1,NULL,'full',NULL,NULL,NULL),(67,'directus_files','checksum','string','text-input',NULL,1,NULL,0,1,1,1,NULL,'full',NULL,NULL,NULL),(68,'directus_folders','id','integer','primary-key',NULL,1,NULL,1,0,1,0,NULL,'full',NULL,NULL,NULL),(69,'directus_folders','name','string','text-input',NULL,1,NULL,0,0,0,0,NULL,'full',NULL,NULL,NULL),(70,'directus_folders','parent_folder','m2o','many-to-one',NULL,1,NULL,0,0,0,0,NULL,'full',NULL,NULL,NULL),(71,'directus_permissions','id','integer','primary-key',NULL,1,NULL,1,0,1,0,NULL,'full',NULL,NULL,NULL),(72,'directus_permissions','collection','m2o','many-to-one',NULL,1,NULL,0,0,0,0,NULL,'full',NULL,NULL,NULL),(73,'directus_permissions','role','m2o','many-to-one',NULL,1,NULL,0,0,0,0,NULL,'full',NULL,NULL,NULL),(74,'directus_permissions','status','string','text-input',NULL,1,NULL,0,0,0,0,NULL,'full',NULL,NULL,NULL),(75,'directus_permissions','create','string','text-input',NULL,1,NULL,0,0,0,0,NULL,'full',NULL,NULL,NULL),(76,'directus_permissions','read','string','text-input',NULL,1,NULL,0,0,0,0,NULL,'full',NULL,NULL,NULL),(77,'directus_permissions','update','string','text-input',NULL,1,NULL,0,0,0,0,NULL,'full',NULL,NULL,NULL),(78,'directus_permissions','delete','string','primary-key',NULL,1,NULL,0,0,0,0,NULL,'full',NULL,NULL,NULL),(79,'directus_permissions','comment','string','text-input',NULL,1,NULL,0,0,0,0,NULL,'full',NULL,NULL,NULL),(80,'directus_permissions','explain','string','text-input',NULL,1,NULL,0,0,0,0,NULL,'full',NULL,NULL,NULL),(81,'directus_permissions','status_blacklist','array','tags',NULL,1,NULL,0,0,0,0,NULL,'full',NULL,NULL,NULL),(82,'directus_permissions','read_field_blacklist','array','tags',NULL,1,NULL,0,0,0,0,NULL,'full',NULL,NULL,NULL),(83,'directus_permissions','write_field_blacklist','array','tags',NULL,1,NULL,0,0,0,0,NULL,'full',NULL,NULL,NULL),(84,'directus_relations','id','integer','primary-key',NULL,1,NULL,0,0,0,0,NULL,'full',NULL,NULL,NULL),(85,'directus_relations','collection_many','string','collections',NULL,1,NULL,0,0,0,0,NULL,'full',NULL,NULL,NULL),(86,'directus_relations','field_many','string','text-input',NULL,1,NULL,0,0,0,0,NULL,'full',NULL,NULL,NULL),(87,'directus_relations','collection_one','string','collections',NULL,1,NULL,0,0,0,0,NULL,'full',NULL,NULL,NULL),(88,'directus_relations','field_one','string','text-input',NULL,1,NULL,0,0,0,0,NULL,'full',NULL,NULL,NULL),(89,'directus_relations','junction_field','string','text-input',NULL,1,NULL,0,0,0,0,NULL,'full',NULL,NULL,NULL),(90,'directus_revisions','id','integer','primary-key',NULL,1,NULL,0,0,0,0,NULL,'full',NULL,NULL,NULL),(91,'directus_revisions','activity','m2o','many-to-one',NULL,1,NULL,0,0,0,0,NULL,'full',NULL,NULL,NULL),(92,'directus_revisions','collection','m2o','many-to-one',NULL,1,NULL,0,0,0,0,NULL,'full',NULL,NULL,NULL),(93,'directus_revisions','item','string','text-input',NULL,1,NULL,0,0,0,0,NULL,'full',NULL,NULL,NULL),(94,'directus_revisions','data','json','json',NULL,1,NULL,0,0,0,0,NULL,'full',NULL,NULL,NULL),(95,'directus_revisions','delta','json','json',NULL,1,NULL,0,0,0,0,NULL,'full',NULL,NULL,NULL),(96,'directus_revisions','parent_item','string','text-input',NULL,1,NULL,0,0,0,0,NULL,'full',NULL,NULL,NULL),(97,'directus_revisions','parent_collection','string','collections',NULL,1,NULL,0,0,0,0,NULL,'full',NULL,NULL,NULL),(98,'directus_revisions','parent_changed','boolean','toggle',NULL,1,NULL,0,0,0,0,NULL,'full',NULL,NULL,NULL),(99,'directus_roles','id','integer','primary-key',NULL,1,NULL,1,0,1,0,NULL,'full',NULL,NULL,NULL),(100,'directus_roles','external_id','string','text-input',NULL,1,NULL,0,1,1,1,NULL,'full',NULL,NULL,NULL),(101,'directus_roles','name','string','text-input',NULL,1,NULL,1,0,0,0,1,'half',NULL,NULL,NULL),(102,'directus_roles','description','string','text-input',NULL,1,NULL,0,0,0,0,2,'half',NULL,NULL,NULL),(103,'directus_roles','ip_whitelist','string','textarea',NULL,1,NULL,0,0,0,0,NULL,'full',NULL,NULL,NULL),(104,'directus_roles','nav_blacklist','string','textarea',NULL,1,NULL,0,0,1,1,NULL,'full',NULL,NULL,NULL),(105,'directus_roles','users','o2m','many-to-many','{\"fields\":\"first_name,last_name\"}',1,NULL,0,0,0,0,NULL,'full',NULL,NULL,NULL),(106,'directus_roles','nav_override','json','json','[\r\n                    {\r\n                        \"title\": \"$t:collections\",\r\n                        \"include\": \"collections\"\r\n                    },\r\n                    {\r\n                        \"title\": \"$t:bookmarks\",\r\n                        \"include\": \"bookmarks\"\r\n                    },\r\n                    {\r\n                        \"title\": \"$t:extensions\",\r\n                        \"include\": \"extensions\"\r\n                    },\r\n                    {\r\n                        \"title\": \"Custom Links\",\r\n                        \"links\": [\r\n                            {\r\n                                \"name\": \"RANGER Studio\",\r\n                                \"path\": \"https://rangerstudio.com\",\r\n                                \"icon\": \"star\"\r\n                            },\r\n                            {\r\n                                \"name\": \"Movies\",\r\n                                \"path\": \"/collections/movies\"\r\n                            }\r\n                        ]\r\n                    }\r\n                ]',1,NULL,0,0,0,0,NULL,'full',NULL,NULL,NULL),(107,'directus_settings','project_name','string','text-input',NULL,1,NULL,1,0,0,0,1,'half-space',NULL,NULL,NULL),(108,'directus_settings','color','string','color-palette',NULL,1,NULL,0,0,0,0,2,'half',NULL,'How many minutes before an idle user is signed out.',NULL),(109,'directus_settings','logo','file','file',NULL,1,NULL,0,0,0,0,3,'half',NULL,'Your brand\'s logo.',NULL),(110,'directus_settings','app_url','string','text-input',NULL,1,NULL,1,0,0,0,4,'half-space',NULL,'The URL where your app is hosted. The API will use this to direct your users to the correct login page.',NULL),(111,'directus_settings','default_limit','integer','numeric',NULL,1,NULL,1,0,0,0,5,'half',NULL,'How many minutes before an idle user is signed out.',NULL),(112,'directus_settings','sort_null_last','boolean','toggle',NULL,1,NULL,0,0,0,0,6,'half-space',NULL,'Put items with `null` for the value last when sorting.',NULL),(113,'directus_settings','auto_sign_out','integer','numeric',NULL,1,NULL,1,0,0,0,7,'half',NULL,'How many minutes before an idle user is signed out.',NULL),(114,'directus_settings','youtube_api','string','text-input',NULL,1,NULL,0,0,0,0,8,'half',NULL,'When provided, this allows more information to be collected for YouTube embeds.',NULL),(115,'directus_settings','thumbnail_dimensions','array','tags',NULL,1,NULL,0,0,0,0,9,'full',NULL,'Allowed dimensions for thumbnails.',NULL),(116,'directus_settings','thumbnail_quality_tags','json','json',NULL,1,NULL,0,0,0,0,10,'half',NULL,'Allowed quality for thumbnails.',NULL),(117,'directus_settings','thumbnail_actions','json','json',NULL,1,NULL,0,0,0,0,11,'half',NULL,'Defines how the thumbnail will be generated based on the requested dimensions.',NULL),(118,'directus_settings','thumbnail_cache_ttl','integer','numeric',NULL,1,NULL,1,0,0,0,12,'half',NULL,'`max-age` HTTP header of the thumbnail.',NULL),(119,'directus_settings','thumbnail_not_found_location','string','text-input',NULL,1,NULL,0,0,0,0,13,'half',NULL,'This image will be used when trying to generate a thumbnail with invalid options or an error happens on the server when creating the image.',NULL),(120,'directus_users','id','integer','primary-key',NULL,1,NULL,1,0,1,0,1,'full',NULL,NULL,NULL),(121,'directus_users','status','status','status','{\"status_mapping\":{\"draft\":{\"name\":\"Draft\",\"text_color\":\"white\",\"background_color\":\"light-gray\",\"listing_subdued\":false,\"listing_badge\":true,\"soft_delete\":false},\"invited\":{\"name\":\"Invited\",\"text_color\":\"white\",\"background_color\":\"light-gray\",\"listing_subdued\":false,\"listing_badge\":true,\"soft_delete\":false},\"active\":{\"name\":\"Active\",\"text_color\":\"white\",\"background_color\":\"success\",\"listing_subdued\":false,\"listing_badge\":false,\"soft_delete\":false},\"suspended\":{\"name\":\"Suspended\",\"text_color\":\"white\",\"background_color\":\"light-gray\",\"listing_subdued\":false,\"listing_badge\":true,\"soft_delete\":false},\"deleted\":{\"name\":\"Deleted\",\"text_color\":\"white\",\"background_color\":\"danger\",\"listing_subdued\":false,\"listing_badge\":true,\"soft_delete\":true}}}',1,NULL,1,0,0,0,2,'full',NULL,NULL,NULL),(122,'directus_users','first_name','string','text-input','{\"placeholder\":\"Enter your give name...\"}',1,NULL,1,0,0,0,3,'half',NULL,NULL,NULL),(123,'directus_users','last_name','string','text-input','{\"placeholder\":\"Enter your surname...\"}',1,NULL,1,0,0,0,4,'half',NULL,NULL,NULL),(124,'directus_users','email','string','text-input','{\"placeholder\":\"Enter your email address...\"}',1,'$email',1,0,0,0,5,'half',NULL,NULL,NULL),(125,'directus_users','email_notifications','boolean','toggle',NULL,1,NULL,0,0,0,0,6,'half',NULL,NULL,NULL),(126,'directus_users','password','hash','password',NULL,1,NULL,1,0,0,0,7,'half',NULL,NULL,NULL),(127,'directus_users','roles','o2m','user-roles',NULL,1,NULL,1,0,0,0,8,'half',NULL,NULL,NULL),(128,'directus_users','company','string','text-input','{\"placeholder\":\"Enter your company or organization name...\"}',0,NULL,0,0,0,0,9,'half',NULL,NULL,NULL),(129,'directus_users','title','string','text-input','{\"placeholder\":\"Enter your title or role...\"}',0,NULL,0,0,0,0,10,'half',NULL,NULL,NULL),(130,'directus_users','timezone','string','dropdown','{\"choices\":{\"Pacific\\/Midway\":\"(UTC-11:00) Midway Island\",\"Pacific\\/Samoa\":\"(UTC-11:00) Samoa\",\"Pacific\\/Honolulu\":\"(UTC-10:00) Hawaii\",\"US\\/Alaska\":\"(UTC-09:00) Alaska\",\"America\\/Los_Angeles\":\"(UTC-08:00) Pacific Time (US & Canada)\",\"America\\/Tijuana\":\"(UTC-08:00) Tijuana\",\"US\\/Arizona\":\"(UTC-07:00) Arizona\",\"America\\/Chihuahua\":\"(UTC-07:00) Chihuahua\",\"America\\/Mexico\\/La_Paz\":\"(UTC-07:00) La Paz\",\"America\\/Mazatlan\":\"(UTC-07:00) Mazatlan\",\"US\\/Mountain\":\"(UTC-07:00) Mountain Time (US & Canada)\",\"America\\/Managua\":\"(UTC-06:00) Central America\",\"US\\/Central\":\"(UTC-06:00) Central Time (US & Canada)\",\"America\\/Guadalajara\":\"(UTC-06:00) Guadalajara\",\"America\\/Mexico_City\":\"(UTC-06:00) Mexico City\",\"America\\/Monterrey\":\"(UTC-06:00) Monterrey\",\"Canada\\/Saskatchewan\":\"(UTC-06:00) Saskatchewan\",\"America\\/Bogota\":\"(UTC-05:00) Bogota\",\"US\\/Eastern\":\"(UTC-05:00) Eastern Time (US & Canada)\",\"US\\/East-Indiana\":\"(UTC-05:00) Indiana (East)\",\"America\\/Lima\":\"(UTC-05:00) Lima\",\"America\\/Quito\":\"(UTC-05:00) Quito\",\"Canada\\/Atlantic\":\"(UTC-04:00) Atlantic Time (Canada)\",\"America\\/New_York\":\"(UTC-04:00) New York\",\"America\\/Caracas\":\"(UTC-04:30) Caracas\",\"America\\/La_Paz\":\"(UTC-04:00) La Paz\",\"America\\/Santiago\":\"(UTC-04:00) Santiago\",\"America\\/Santo_Domingo\":\"(UTC-04:00) Santo Domingo\",\"Canada\\/Newfoundland\":\"(UTC-03:30) Newfoundland\",\"America\\/Sao_Paulo\":\"(UTC-03:00) Brasilia\",\"America\\/Argentina\\/Buenos_Aires\":\"(UTC-03:00) Buenos Aires\",\"America\\/Argentina\\/GeorgeTown\":\"(UTC-03:00) Georgetown\",\"America\\/Godthab\":\"(UTC-03:00) Greenland\",\"America\\/Noronha\":\"(UTC-02:00) Mid-Atlantic\",\"Atlantic\\/Azores\":\"(UTC-01:00) Azores\",\"Atlantic\\/Cape_Verde\":\"(UTC-01:00) Cape Verde Is.\",\"Africa\\/Casablanca\":\"(UTC+00:00) Casablanca\",\"Europe\\/Edinburgh\":\"(UTC+00:00) Edinburgh\",\"Etc\\/Greenwich\":\"(UTC+00:00) Greenwich Mean Time : Dublin\",\"Europe\\/Lisbon\":\"(UTC+00:00) Lisbon\",\"Europe\\/London\":\"(UTC+00:00) London\",\"Africa\\/Monrovia\":\"(UTC+00:00) Monrovia\",\"UTC\":\"(UTC+00:00) UTC\",\"Europe\\/Amsterdam\":\"(UTC+01:00) Amsterdam\",\"Europe\\/Belgrade\":\"(UTC+01:00) Belgrade\",\"Europe\\/Berlin\":\"(UTC+01:00) Berlin\",\"Europe\\/Bern\":\"(UTC+01:00) Bern\",\"Europe\\/Bratislava\":\"(UTC+01:00) Bratislava\",\"Europe\\/Brussels\":\"(UTC+01:00) Brussels\",\"Europe\\/Budapest\":\"(UTC+01:00) Budapest\",\"Europe\\/Copenhagen\":\"(UTC+01:00) Copenhagen\",\"Europe\\/Ljubljana\":\"(UTC+01:00) Ljubljana\",\"Europe\\/Madrid\":\"(UTC+01:00) Madrid\",\"Europe\\/Paris\":\"(UTC+01:00) Paris\",\"Europe\\/Prague\":\"(UTC+01:00) Prague\",\"Europe\\/Rome\":\"(UTC+01:00) Rome\",\"Europe\\/Sarajevo\":\"(UTC+01:00) Sarajevo\",\"Europe\\/Skopje\":\"(UTC+01:00) Skopje\",\"Europe\\/Stockholm\":\"(UTC+01:00) Stockholm\",\"Europe\\/Vienna\":\"(UTC+01:00) Vienna\",\"Europe\\/Warsaw\":\"(UTC+01:00) Warsaw\",\"Africa\\/Lagos\":\"(UTC+01:00) West Central Africa\",\"Europe\\/Zagreb\":\"(UTC+01:00) Zagreb\",\"Europe\\/Athens\":\"(UTC+02:00) Athens\",\"Europe\\/Bucharest\":\"(UTC+02:00) Bucharest\",\"Africa\\/Cairo\":\"(UTC+02:00) Cairo\",\"Africa\\/Harare\":\"(UTC+02:00) Harare\",\"Europe\\/Helsinki\":\"(UTC+02:00) Helsinki\",\"Europe\\/Istanbul\":\"(UTC+02:00) Istanbul\",\"Asia\\/Jerusalem\":\"(UTC+02:00) Jerusalem\",\"Europe\\/Kyiv\":\"(UTC+02:00) Kyiv\",\"Africa\\/Johannesburg\":\"(UTC+02:00) Pretoria\",\"Europe\\/Riga\":\"(UTC+02:00) Riga\",\"Europe\\/Sofia\":\"(UTC+02:00) Sofia\",\"Europe\\/Tallinn\":\"(UTC+02:00) Tallinn\",\"Europe\\/Vilnius\":\"(UTC+02:00) Vilnius\",\"Asia\\/Baghdad\":\"(UTC+03:00) Baghdad\",\"Asia\\/Kuwait\":\"(UTC+03:00) Kuwait\",\"Europe\\/Minsk\":\"(UTC+03:00) Minsk\",\"Africa\\/Nairobi\":\"(UTC+03:00) Nairobi\",\"Asia\\/Riyadh\":\"(UTC+03:00) Riyadh\",\"Europe\\/Volgograd\":\"(UTC+03:00) Volgograd\",\"Asia\\/Tehran\":\"(UTC+03:30) Tehran\",\"Asia\\/Abu_Dhabi\":\"(UTC+04:00) Abu Dhabi\",\"Asia\\/Baku\":\"(UTC+04:00) Baku\",\"Europe\\/Moscow\":\"(UTC+04:00) Moscow\",\"Asia\\/Muscat\":\"(UTC+04:00) Muscat\",\"Europe\\/St_Petersburg\":\"(UTC+04:00) St. Petersburg\",\"Asia\\/Tbilisi\":\"(UTC+04:00) Tbilisi\",\"Asia\\/Yerevan\":\"(UTC+04:00) Yerevan\",\"Asia\\/Kabul\":\"(UTC+04:30) Kabul\",\"Asia\\/Islamabad\":\"(UTC+05:00) Islamabad\",\"Asia\\/Karachi\":\"(UTC+05:00) Karachi\",\"Asia\\/Tashkent\":\"(UTC+05:00) Tashkent\",\"Asia\\/Calcutta\":\"(UTC+05:30) Chennai\",\"Asia\\/Kolkata\":\"(UTC+05:30) Kolkata\",\"Asia\\/Mumbai\":\"(UTC+05:30) Mumbai\",\"Asia\\/New_Delhi\":\"(UTC+05:30) New Delhi\",\"Asia\\/Sri_Jayawardenepura\":\"(UTC+05:30) Sri Jayawardenepura\",\"Asia\\/Katmandu\":\"(UTC+05:45) Kathmandu\",\"Asia\\/Almaty\":\"(UTC+06:00) Almaty\",\"Asia\\/Astana\":\"(UTC+06:00) Astana\",\"Asia\\/Dhaka\":\"(UTC+06:00) Dhaka\",\"Asia\\/Yekaterinburg\":\"(UTC+06:00) Ekaterinburg\",\"Asia\\/Rangoon\":\"(UTC+06:30) Rangoon\",\"Asia\\/Bangkok\":\"(UTC+07:00) Bangkok\",\"Asia\\/Hanoi\":\"(UTC+07:00) Hanoi\",\"Asia\\/Jakarta\":\"(UTC+07:00) Jakarta\",\"Asia\\/Novosibirsk\":\"(UTC+07:00) Novosibirsk\",\"Asia\\/Beijing\":\"(UTC+08:00) Beijing\",\"Asia\\/Chongqing\":\"(UTC+08:00) Chongqing\",\"Asia\\/Hong_Kong\":\"(UTC+08:00) Hong Kong\",\"Asia\\/Krasnoyarsk\":\"(UTC+08:00) Krasnoyarsk\",\"Asia\\/Kuala_Lumpur\":\"(UTC+08:00) Kuala Lumpur\",\"Australia\\/Perth\":\"(UTC+08:00) Perth\",\"Asia\\/Singapore\":\"(UTC+08:00) Singapore\",\"Asia\\/Taipei\":\"(UTC+08:00) Taipei\",\"Asia\\/Ulan_Bator\":\"(UTC+08:00) Ulaan Bataar\",\"Asia\\/Urumqi\":\"(UTC+08:00) Urumqi\",\"Asia\\/Irkutsk\":\"(UTC+09:00) Irkutsk\",\"Asia\\/Osaka\":\"(UTC+09:00) Osaka\",\"Asia\\/Sapporo\":\"(UTC+09:00) Sapporo\",\"Asia\\/Seoul\":\"(UTC+09:00) Seoul\",\"Asia\\/Tokyo\":\"(UTC+09:00) Tokyo\",\"Australia\\/Adelaide\":\"(UTC+09:30) Adelaide\",\"Australia\\/Darwin\":\"(UTC+09:30) Darwin\",\"Australia\\/Brisbane\":\"(UTC+10:00) Brisbane\",\"Australia\\/Canberra\":\"(UTC+10:00) Canberra\",\"Pacific\\/Guam\":\"(UTC+10:00) Guam\",\"Australia\\/Hobart\":\"(UTC+10:00) Hobart\",\"Australia\\/Melbourne\":\"(UTC+10:00) Melbourne\",\"Pacific\\/Port_Moresby\":\"(UTC+10:00) Port Moresby\",\"Australia\\/Sydney\":\"(UTC+10:00) Sydney\",\"Asia\\/Yakutsk\":\"(UTC+10:00) Yakutsk\",\"Asia\\/Vladivostok\":\"(UTC+11:00) Vladivostok\",\"Pacific\\/Auckland\":\"(UTC+12:00) Auckland\",\"Pacific\\/Fiji\":\"(UTC+12:00) Fiji\",\"Pacific\\/Kwajalein\":\"(UTC+12:00) International Date Line West\",\"Asia\\/Kamchatka\":\"(UTC+12:00) Kamchatka\",\"Asia\\/Magadan\":\"(UTC+12:00) Magadan\",\"Pacific\\/Marshall_Is\":\"(UTC+12:00) Marshall Is.\",\"Asia\\/New_Caledonia\":\"(UTC+12:00) New Caledonia\",\"Asia\\/Solomon_Is\":\"(UTC+12:00) Solomon Is.\",\"Pacific\\/Wellington\":\"(UTC+12:00) Wellington\",\"Pacific\\/Tongatapu\":\"(UTC+13:00) Nuku\'alofa\"},\"placeholder\":\"Choose a timezone...\"}',1,NULL,1,0,0,0,11,'half',NULL,NULL,NULL),(131,'directus_users','locale','string','language','{\"limit\":true}',1,NULL,1,0,0,0,12,'half',NULL,NULL,NULL),(132,'directus_users','locale_options','json','json',NULL,1,NULL,0,0,1,1,13,'full',NULL,NULL,NULL),(133,'directus_users','token','string','text-input',NULL,1,NULL,0,0,1,1,14,'full',NULL,NULL,NULL),(134,'directus_users','last_login','datetime','datetime',NULL,1,NULL,0,1,0,0,15,'half',NULL,NULL,NULL),(135,'directus_users','last_access_on','datetime','datetime',NULL,1,NULL,0,1,1,0,16,'half',NULL,NULL,NULL),(136,'directus_users','last_page','string','text-input',NULL,1,NULL,0,1,1,1,17,'half',NULL,NULL,NULL),(137,'directus_users','avatar','file','file',NULL,1,NULL,0,0,0,0,18,'full',NULL,NULL,NULL),(138,'directus_users','invite_token','string','text-input',NULL,1,NULL,0,0,1,1,NULL,'full',NULL,NULL,NULL),(139,'directus_users','invite_accepted','boolean','toggle',NULL,1,NULL,0,0,1,1,NULL,'full',NULL,NULL,NULL),(140,'directus_users','last_ip','string','text-input',NULL,1,NULL,0,1,1,0,NULL,'full',NULL,NULL,NULL),(141,'directus_users','external_id','string','text-input',NULL,1,NULL,0,1,1,0,NULL,'full',NULL,NULL,NULL),(142,'directus_user_roles','id','integer','primary-key',NULL,1,NULL,1,0,1,0,NULL,'full',NULL,NULL,NULL),(143,'directus_user_roles','user','m2o','many-to-one',NULL,1,NULL,0,0,0,0,NULL,'full',NULL,NULL,NULL),(144,'directus_user_roles','role','m2o','many-to-one',NULL,1,NULL,0,0,0,0,NULL,'full',NULL,NULL,NULL);

/*Table structure for table `directus_files` */

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
  `checksum` varchar(32) DEFAULT NULL,
  `metadata` text,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

/*Data for the table `directus_files` */

/*Table structure for table `directus_folders` */

DROP TABLE IF EXISTS `directus_folders`;

CREATE TABLE `directus_folders` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(191) CHARACTER SET utf8mb4 NOT NULL,
  `parent_folder` int(11) unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_name_parent_folder` (`name`,`parent_folder`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

/*Data for the table `directus_folders` */

/*Table structure for table `directus_migrations` */

DROP TABLE IF EXISTS `directus_migrations`;

CREATE TABLE `directus_migrations` (
  `version` bigint(20) NOT NULL,
  `migration_name` varchar(100) DEFAULT NULL,
  `start_time` timestamp NULL DEFAULT NULL,
  `end_time` timestamp NULL DEFAULT NULL,
  `breakpoint` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`version`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

/*Data for the table `directus_migrations` */

insert  into `directus_migrations`(`version`,`migration_name`,`start_time`,`end_time`,`breakpoint`) values (20180220023138,'CreateActivityTable','2019-06-22 07:28:11','2019-06-22 07:28:11',0),(20180220023144,'CreateActivitySeenTable','2019-06-22 07:28:11','2019-06-22 07:28:11',0),(20180220023152,'CreateCollectionsPresetsTable','2019-06-22 07:28:11','2019-06-22 07:28:11',0),(20180220023157,'CreateCollectionsTable','2019-06-22 07:28:11','2019-06-22 07:28:11',0),(20180220023202,'CreateFieldsTable','2019-06-22 07:28:11','2019-06-22 07:28:11',0),(20180220023208,'CreateFilesTable','2019-06-22 07:28:11','2019-06-22 07:28:11',0),(20180220023213,'CreateFoldersTable','2019-06-22 07:28:11','2019-06-22 07:28:11',0),(20180220023217,'CreateRolesTable','2019-06-22 07:28:11','2019-06-22 07:28:11',0),(20180220023226,'CreatePermissionsTable','2019-06-22 07:28:11','2019-06-22 07:28:11',0),(20180220023232,'CreateRelationsTable','2019-06-22 07:28:11','2019-06-22 07:28:11',0),(20180220023238,'CreateRevisionsTable','2019-06-22 07:28:11','2019-06-22 07:28:11',0),(20180220023243,'CreateSettingsTable','2019-06-22 07:28:11','2019-06-22 07:28:11',0),(20180220023248,'CreateUsersTable','2019-06-22 07:28:11','2019-06-22 07:28:11',0),(20180426173310,'CreateUserRoles','2019-06-22 07:28:11','2019-06-22 07:28:12',0),(20181022175715,'Upgrade070003','2019-06-22 07:28:32','2019-06-22 07:28:32',0),(20181102153600,'TimezoneChoices','2019-06-22 07:28:32','2019-06-22 07:28:32',0),(20181105165224,'Upgrade070006','2019-06-22 07:28:32','2019-06-22 07:28:32',0),(20181122195602,'LocaleInterface','2019-06-22 07:28:32','2019-06-22 07:28:32',0),(20181123171520,'RemoveScope','2019-06-22 07:28:32','2019-06-22 07:28:32',0),(20181210204720,'AddTrustedProxiesSettingField','2019-06-22 07:28:32','2019-06-22 07:28:32',0),(20181222023800,'AddProjectUrlSettingField','2019-06-22 07:28:32','2019-06-22 07:28:32',0),(20181227042755,'IncreaseUsersLastPageLength','2019-06-22 07:28:32','2019-06-22 07:28:32',0),(20190104155309,'AddUsersEmailValidation','2019-06-22 07:28:32','2019-06-22 07:28:32',0),(20190111193724,'AddAppUrlSettingField','2019-06-22 07:28:32','2019-06-22 07:28:32',0),(20190111212736,'AddMissingSettingsField','2019-06-22 07:28:32','2019-06-22 07:28:32',0),(20190118181424,'AddRolesUsersField','2019-06-22 07:28:32','2019-06-22 07:28:32',0),(20190130215921,'AddFilesChecksumField','2019-06-22 07:28:32','2019-06-22 07:28:32',0),(20190318173400,'AddNavOverride','2019-06-22 07:28:32','2019-06-22 07:28:32',0),(20190412122400,'SetPasswordTypeToHash','2019-06-22 07:28:32','2019-06-22 07:28:32',0),(20190412123000,'UseFileInterface','2019-06-22 07:28:32','2019-06-22 07:28:32',0),(20190412145800,'SetO2MOptionsRoles','2019-06-22 07:28:32','2019-06-22 07:28:32',0),(20190415125300,'SetWidth','2019-06-22 07:28:32','2019-06-22 07:28:32',0),(20190419154400,'SettingsFields','2019-06-22 07:28:32','2019-06-22 07:28:32',0),(20190419161200,'CollectionNotes','2019-06-22 07:28:32','2019-06-22 07:28:32',0),(20190419173000,'MiscRequiredFields','2019-06-22 07:28:32','2019-06-22 07:28:32',0),(20190422131600,'UseJson','2019-06-22 07:28:32','2019-06-22 07:28:32',0),(20190426156200,'SetNullableValueFieldSettingsTable','2019-06-22 07:28:32','2019-06-22 07:28:32',0),(20190520094300,'UseTimeline','2019-06-22 07:28:32','2019-06-22 07:28:32',0);

/*Table structure for table `directus_permissions` */

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

/*Data for the table `directus_permissions` */

/*Table structure for table `directus_relations` */

DROP TABLE IF EXISTS `directus_relations`;

CREATE TABLE `directus_relations` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `collection_many` varchar(64) NOT NULL,
  `field_many` varchar(45) NOT NULL,
  `collection_one` varchar(64) DEFAULT NULL,
  `field_one` varchar(64) DEFAULT NULL,
  `junction_field` varchar(64) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8;

/*Data for the table `directus_relations` */

insert  into `directus_relations`(`id`,`collection_many`,`field_many`,`collection_one`,`field_one`,`junction_field`) values (1,'directus_activity','action_by','directus_users',NULL,NULL),(2,'directus_activity_seen','user','directus_users',NULL,NULL),(3,'directus_activity_seen','activity','directus_activity',NULL,NULL),(4,'directus_collections_presets','user','directus_users',NULL,NULL),(5,'directus_collections_presets','group','directus_groups',NULL,NULL),(6,'directus_files','uploaded_by','directus_users',NULL,NULL),(7,'directus_files','folder','directus_folders',NULL,NULL),(8,'directus_folders','parent_folder','directus_folders',NULL,NULL),(9,'directus_permissions','group','directus_groups',NULL,NULL),(10,'directus_revisions','activity','directus_activity',NULL,NULL),(11,'directus_user_roles','user','directus_users','roles','role'),(12,'directus_user_roles','role','directus_roles','users','user'),(13,'directus_users','avatar','directus_files',NULL,NULL),(14,'directus_fields','collection','directus_collections','fields',NULL);

/*Table structure for table `directus_revisions` */

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

/*Data for the table `directus_revisions` */

/*Table structure for table `directus_roles` */

DROP TABLE IF EXISTS `directus_roles`;

CREATE TABLE `directus_roles` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `description` varchar(500) DEFAULT NULL,
  `ip_whitelist` text,
  `nav_blacklist` text,
  `external_id` varchar(255) DEFAULT NULL,
  `nav_override` text,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_group_name` (`name`),
  UNIQUE KEY `idx_roles_external_id` (`external_id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8;

/*Data for the table `directus_roles` */

insert  into `directus_roles`(`id`,`name`,`description`,`ip_whitelist`,`nav_blacklist`,`external_id`,`nav_override`) values (1,'Administrator','Admins have access to all managed data within the system by default',NULL,NULL,NULL,NULL),(2,'Public','This sets the data that is publicly available through the API without a token',NULL,NULL,NULL,NULL);

/*Table structure for table `directus_settings` */

DROP TABLE IF EXISTS `directus_settings`;

CREATE TABLE `directus_settings` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `key` varchar(64) NOT NULL,
  `value` text,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_key` (`key`)
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8;

/*Data for the table `directus_settings` */

insert  into `directus_settings`(`id`,`key`,`value`) values (1,'logo',''),(2,'color','darkest-gray'),(3,'default_limit','200'),(4,'sort_null_last','1'),(5,'auto_sign_out','60'),(6,'youtube_api_key',''),(7,'trusted_proxies',''),(8,'thumbnail_dimensions','200x200'),(9,'thumbnail_quality_tags','{\"poor\": 25, \"good\": 50, \"better\":  75, \"best\": 100}'),(10,'thumbnail_actions','{\"contain\":{\"options\":{\"resizeCanvas\":false,\"position\":\"center\",\"resizeRelative\":false,\"canvasBackground\":\"ccc\"}},\"crop\":{\"options\":{\"position\":\"center\"}}}'),(11,'thumbnail_cache_ttl','86400'),(12,'thumbnail_not_found_location',''),(13,'project_name','Directus'),(14,'app_url',''),(15,'project_url','');

/*Table structure for table `directus_user_roles` */

DROP TABLE IF EXISTS `directus_user_roles`;

CREATE TABLE `directus_user_roles` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `user` int(11) unsigned DEFAULT NULL,
  `role` int(11) unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_user_role` (`user`,`role`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8;

/*Data for the table `directus_user_roles` */

insert  into `directus_user_roles`(`id`,`user`,`role`) values (1,1,1);

/*Table structure for table `directus_users` */

DROP TABLE IF EXISTS `directus_users`;

CREATE TABLE `directus_users` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `status` varchar(16) NOT NULL DEFAULT 'draft',
  `first_name` varchar(50) DEFAULT NULL,
  `last_name` varchar(50) DEFAULT NULL,
  `email` varchar(128) NOT NULL,
  `password` varchar(255) DEFAULT NULL,
  `token` varchar(255) DEFAULT NULL,
  `timezone` varchar(32) NOT NULL DEFAULT 'UTC',
  `locale` varchar(8) DEFAULT 'en-US',
  `locale_options` text,
  `avatar` int(11) unsigned DEFAULT NULL,
  `company` varchar(191) DEFAULT NULL,
  `title` varchar(191) DEFAULT NULL,
  `email_notifications` int(1) NOT NULL DEFAULT '1',
  `last_access_on` datetime DEFAULT NULL,
  `last_page` varchar(192) DEFAULT NULL,
  `external_id` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_users_email` (`email`),
  UNIQUE KEY `idx_users_token` (`token`),
  UNIQUE KEY `idx_users_external_id` (`external_id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8;

/*Data for the table `directus_users` */

insert  into `directus_users`(`id`,`status`,`first_name`,`last_name`,`email`,`password`,`token`,`timezone`,`locale`,`locale_options`,`avatar`,`company`,`title`,`email_notifications`,`last_access_on`,`last_page`,`external_id`) values (1,'active','Admin','User','admin@example.com','$2y$12$WzyHxXSOPzSKtDeOQek2P.mlHyYTslUUzZim9nG8aqUMS8ekhGI3m',NULL,'UTC','en-US',NULL,NULL,NULL,NULL,1,'2019-06-22 07:28:29','/settings',NULL);

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

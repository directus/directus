# ************************************************************
# Sequel Pro SQL dump
# Version 4004
#
# http://www.sequelpro.com/
# http://code.google.com/p/sequel-pro/
#
# Host: localhost (MySQL 5.5.29)
# Database: directus
# Generation Time: 2013-08-03 19:58:49 +0000
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



# Dump of table directus_columns
# ------------------------------------------------------------

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

LOCK TABLES `directus_groups` WRITE;
/*!40000 ALTER TABLE `directus_groups` DISABLE KEYS */;

INSERT INTO `directus_groups` (`id`, `name`, `description`, `restrict_to_ip_whitelist`)
VALUES
	(1,'Administrator',NULL,0);

/*!40000 ALTER TABLE `directus_groups` ENABLE KEYS */;
UNLOCK TABLES;


# Dump of table directus_ip_whitelist
# ------------------------------------------------------------



# Dump of table directus_media
# ------------------------------------------------------------



# Dump of table directus_messages
# ------------------------------------------------------------



# Dump of table directus_preferences
# ------------------------------------------------------------



# Dump of table directus_privileges
# ------------------------------------------------------------

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
  (8,'media','thumbnail_quality','80'),
	(8,'media','thumbnail_crop_enabled','1');

/*!40000 ALTER TABLE `directus_settings` ENABLE KEYS */;
UNLOCK TABLES;


# Dump of table directus_social_feeds
# ------------------------------------------------------------



# Dump of table directus_social_posts
# ------------------------------------------------------------



# Dump of table directus_storage_adapters
# ------------------------------------------------------------

LOCK TABLES `directus_storage_adapters` WRITE;
/*!40000 ALTER TABLE `directus_storage_adapters` DISABLE KEYS */;

INSERT INTO `directus_storage_adapters` (`id`, `key`, `adapter_name`, `role`, `public`, `destination`, `url`, `params`)
VALUES
	(1,'media','FileSystemAdapter','DEFAULT',1,'','',NULL),
	(2,'thumbnails','FileSystemAdapter','THUMBNAIL',1,'','',NULL);

/*!40000 ALTER TABLE `directus_storage_adapters` ENABLE KEYS */;
UNLOCK TABLES;


# Dump of table directus_tab_privileges
# ------------------------------------------------------------



# Dump of table directus_tables
# ------------------------------------------------------------

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

LOCK TABLES `directus_users` WRITE;
/*!40000 ALTER TABLE `directus_users` DISABLE KEYS */;

INSERT INTO `directus_users` (`id`, `active`, `first_name`, `last_name`, `email`, `password`, `salt`, `token`, `reset_token`, `reset_expiration`, `description`, `email_messages`, `last_login`, `last_access`, `last_page`, `ip`, `group`, `avatar`, `closest_studio`, `adp_id`, `phone`, `office_phone`, `address`, `city`, `state`, `zip`, `emergency_name`, `emergency_email`, `emergency_phone`, `emergency_name_2`, `emergency_email_2`, `emergency_phone_2`, `vestigial_username`, `vestigial_role`, `vestigial_password`, `vestigial_isretailadmin`, `vestigial_directorycategory`, `vestigial_image`, `vestigial_can_buy_old`, `vestigial_hide_in_directory`)
VALUES
	(1,1,'Change Me','Change Me','admin@getdirectus.com','cb7ada116bcb98ebfbf0e5f9da82de03310e49fa','514c5be0dffa9','','',NULL,NULL,1,'0000-00-00 00:00:00','0000-00-00 00:00:00','','',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL);

/*!40000 ALTER TABLE `directus_users` ENABLE KEYS */;
UNLOCK TABLES;


# Dump of table ui_gallery
# ------------------------------------------------------------




/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;
/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;

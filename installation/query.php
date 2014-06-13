<?php
$create_activity = "CREATE TABLE `directus_activity` (
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
  `logged_ip` varchar(20) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='Contains history of revisions';";


$create_bookmarks = "CREATE TABLE `directus_bookmarks` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `user` int(11) DEFAULT NULL,
  `title` varchar(255) DEFAULT NULL,
  `url` varchar(255) DEFAULT NULL,
  `icon_class` varchar(255) DEFAULT NULL,
  `active` tinyint(4) DEFAULT NULL,
  `section` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;";

$create_columns = "CREATE TABLE `directus_columns` (
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
  `relationship_type` varchar(20) DEFAULT NULL,
  `table_related` varchar(64) DEFAULT NULL,
  `junction_table` varchar(64) DEFAULT NULL,
  `junction_key_left` varchar(64) DEFAULT NULL,
  `junction_key_right` varchar(64) DEFAULT NULL,
  `sort` int(11) DEFAULT NULL,
  `comment` varchar(1024) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `table-column` (`table_name`,`column_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;";

$insert_columns = "INSERT INTO `directus_columns` (`id`, `table_name`, `column_name`, `data_type`, `ui`, `system`, `master`, `hidden_input`, `hidden_list`, `required`, `relationship_type`, `table_related`, `junction_table`, `junction_key_left`, `junction_key_right`, `sort`, `comment`)
VALUES
  (1,'directus_users','group',NULL,'many_to_one',0,0,0,0,0,'MANYTOONE','directus_groups',NULL,NULL,'group_id',NULL,'');";

$create_groups = "CREATE TABLE `directus_groups` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(100) DEFAULT NULL,
  `description` varchar(500) DEFAULT NULL,
  `restrict_to_ip_whitelist` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;";

$insert_groups = "INSERT INTO `directus_groups` (`id`, `name`, `description`, `restrict_to_ip_whitelist`)
VALUES
  (1,'Administrator',NULL,0);";

$create_ip_whitelist = "CREATE TABLE `directus_ip_whitelist` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `ip_address` varchar(250) DEFAULT NULL,
  `description` varchar(250) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;";

$create_media = "CREATE TABLE `directus_files` (
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
  `needs_index` tinyint(4) DEFAULT '1',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='Directus Files Storage';";

$create_messages = "CREATE TABLE `directus_messages` (
  `id` int(10) NOT NULL AUTO_INCREMENT,
  `from` int(11) DEFAULT NULL,
  `subject` varchar(255) NOT NULL DEFAULT '',
  `message` text NOT NULL,
  `datetime` datetime NOT NULL DEFAULT '0000-00-00 00:00:00',
  `attachment` int(11) DEFAULT NULL,
  `response_to` int(11) DEFAULT NULL,
  `comment_metadata` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;";

$create_messages_recipients = "CREATE TABLE `directus_messages_recipients` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `message_id` int(11) NOT NULL,
  `recipient` int(11) NOT NULL,
  `read` tinyint(11) NOT NULL,
  `group` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;";

$create_preferences = "CREATE TABLE `directus_preferences` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `user` int(11) DEFAULT NULL,
  `table_name` varchar(64) DEFAULT NULL,
  `title` varchar(255) DEFAULT NULL,
  `columns_visible` varchar(300) DEFAULT NULL,
  `sort` varchar(64) DEFAULT 'id',
  `sort_order` varchar(5) DEFAULT 'asc',
  `active` varchar(5) DEFAULT '3',
  `search_string` text,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user` (`user`,`table_name`,`title`),
  UNIQUE KEY `pref_title_constraint` (`user`,`table_name`,`title`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;";

$create_privileges = "CREATE TABLE `directus_privileges` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `table_name` varchar(255) CHARACTER SET latin1 NOT NULL,
  `permissions` varchar(500) CHARACTER SET latin1 DEFAULT NULL COMMENT 'Table-level permissions (insert, delete, etc.)',
  `group_id` int(11) NOT NULL,
  `read_field_blacklist` varchar(1000) CHARACTER SET latin1 DEFAULT NULL,
  `write_field_blacklist` varchar(1000) CHARACTER SET latin1 DEFAULT NULL,
  `unlisted` tinyint(1) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;";

$insert_privileges = "INSERT INTO `directus_privileges` (`id`, `table_name`, `permissions`, `group_id`, `read_field_blacklist`, `write_field_blacklist`, `unlisted`)
VALUES
  (1,'directus_activity','add,edit,bigedit,delete,bigdelete,alter,view,bigview',1,NULL,NULL,NULL),
  (2,'directus_columns','add,edit,bigedit,delete,bigdelete,alter,view,bigview',1,NULL,NULL,NULL),
  (3,'directus_groups','add,edit,bigedit,delete,bigdelete,alter,view,bigview',1,NULL,NULL,NULL),
  (4,'directus_files','add,edit,bigedit,delete,bigdelete,alter,view,bigview',1,NULL,NULL,NULL),
  (5,'directus_messages','add,edit,bigedit,delete,bigdelete,alter,view,bigview',1,NULL,NULL,NULL),
  (6,'directus_preferences','add,edit,bigedit,delete,bigdelete,alter,view,bigview',1,NULL,NULL,NULL),
  (7,'directus_privileges','add,edit,bigedit,delete,bigdelete,alter,view,bigview',1,NULL,NULL,NULL),
  (8,'directus_settings','add,edit,bigedit,delete,bigdelete,alter,view,bigview',1,NULL,NULL,NULL),
  (9,'directus_tables','add,edit,bigedit,delete,bigdelete,alter,view,bigview',1,NULL,NULL,NULL),
  (10,'directus_ui','add,edit,bigedit,delete,bigdelete,alter,view,bigview',1,NULL,NULL,NULL),
  (11,'directus_users','add,edit,bigedit,delete,bigdelete,alter,view,bigview',1,NULL,NULL,NULL),
  (12,'directus_ip_whitelist','add,edit,bigedit,delete,bigdelete,alter,view,bigview',1,NULL,NULL,NULL),
  (13,'directus_social_feeds','add,edit,bigedit,delete,bigdelete,alter,view,bigview',1,NULL,NULL,NULL),
  (14,'directus_messages_recipients','add,edit,bigedit,delete,bigdelete,alter,view,bigview',1,NULL,NULL,NULL),
  (15,'directus_social_posts','add,edit,bigedit,delete,bigdelete,alter,view,bigview',1,NULL,NULL,NULL),
  (16,'directus_storage_adapters','add,edit,bigedit,delete,bigdelete,alter,view,bigview',1,NULL,NULL,NULL),
  (17,'directus_tab_privileges','add,edit,bigedit,delete,bigdelete,alter,view,bigview',1,NULL,NULL,NULL),
  (18,'directus_bookmarks','add,edit,bigedit,delete,bigdelete,alter,view,bigview',1,NULL,NULL,NULL);";

$create_settings = "CREATE TABLE `directus_settings` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `collection` varchar(250) DEFAULT NULL,
  `name` varchar(250) DEFAULT NULL,
  `value` varchar(250) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `Unique Collection and Name` (`collection`,`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;";

$insert_settings = "INSERT INTO `directus_settings` (`id`, `collection`, `name`, `value`)
VALUES
  (1,'global','cms_user_auto_sign_out','60'),
  (3,'global','site_name','".$_SESSION['site_name']."'),
  (4,'global','site_url','http://examplesite.dev/'),
  (5,'global','cms_color','#7ac943'),
  (6,'global','rows_per_page','200'),
  (7,'files','storage_adapter','FileSystemAdapter'),
  (8,'files','storage_destination',''),
  (9,'fiels','thumbnail_storage_adapter','FileSystemAdapter'),
  (10,'files','thumbnail_storage_destination',''),
  (11,'files','allowed_thumbnails',''),
  (12,'files','thumbnail_quality','100'),
  (13,'files','thumbnail_size','200'),
  (14,'global','cms_thumbnail_url',''),
  (15,'files','file_file_naming','file_id'),
  (16,'files','file_title_naming','file_name'),
  (17,'files','thumbnail_crop_enabled','1');";

  $create_social_feeds = "CREATE TABLE `directus_social_feeds` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `active` tinyint(1) NOT NULL DEFAULT '1',
  `type` tinyint(2) NOT NULL COMMENT 'Twitter (1), Instagram (2)',
  `last_checked` datetime DEFAULT NULL,
  `name` varchar(255) CHARACTER SET latin1 NOT NULL,
  `foreign_id` varchar(255) CHARACTER SET latin1 NOT NULL,
  `data` text CHARACTER SET latin1 NOT NULL COMMENT 'Feed metadata. JSON format.',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;";

$create_social_posts = "CREATE TABLE `directus_social_posts` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `active` tinyint(1) NOT NULL DEFAULT '1',
  `feed` int(11) NOT NULL COMMENT 'The FK ID of the feed.',
  `datetime` datetime NOT NULL COMMENT 'The date/time this entry was published.',
  `foreign_id` varchar(55) CHARACTER SET latin1 NOT NULL,
  `data` text CHARACTER SET latin1 NOT NULL COMMENT 'The API response for this entry, excluding unnecessary feed metadata, which is stored on the directus_social_feeds table.',
  PRIMARY KEY (`id`),
  UNIQUE KEY `feed` (`feed`,`foreign_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;";

$create_storage_adapters = "CREATE TABLE `directus_storage_adapters` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `key` varchar(255) CHARACTER SET latin1 NOT NULL,
  `adapter_name` varchar(255) CHARACTER SET latin1 NOT NULL DEFAULT '',
  `role` varchar(255) CHARACTER SET latin1 DEFAULT NULL COMMENT 'DEFAULT, THUMBNAIL, or Null. DEFAULT and THUMBNAIL should only occur once each.',
  `public` tinyint(1) unsigned NOT NULL DEFAULT '1' COMMENT '1 for yes, 0 for no.',
  `destination` varchar(255) CHARACTER SET latin1 NOT NULL DEFAULT '',
  `url` varchar(2000) CHARACTER SET latin1 DEFAULT '' COMMENT 'Trailing slash required.',
  `params` varchar(2000) CHARACTER SET latin1 DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;";

$create_tab_priv = "CREATE TABLE `directus_tab_privileges` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `group_id` int(11) DEFAULT NULL,
  `tab_blacklist` varchar(500) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;";

$create_tables = "CREATE TABLE `directus_tables` (
  `table_name` varchar(64) NOT NULL DEFAULT '',
  `hidden` tinyint(1) NOT NULL DEFAULT '0',
  `single` tinyint(1) NOT NULL DEFAULT '0',
  `inactive_by_default` tinyint(1) NOT NULL DEFAULT '0',
  `is_junction_table` tinyint(1) NOT NULL DEFAULT '0',
  `footer` tinyint(1) DEFAULT '0',
  `list_view` varchar(200) DEFAULT NULL,
  `column_groupings` varchar(255) DEFAULT NULL,
  `primary_column` varchar(255) DEFAULT NULL,
  `user_create_column` varchar(64) DEFAULT NULL,
  `user_update_column` varchar(64) DEFAULT NULL,
  `date_create_column` varchar(64) DEFAULT NULL,
  `date_update_column` varchar(64) DEFAULT NULL,
  PRIMARY KEY (`table_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;";

$create_ui = "CREATE TABLE `directus_ui` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `table_name` varchar(64) DEFAULT NULL,
  `column_name` varchar(64) DEFAULT NULL,
  `ui_name` varchar(200) DEFAULT NULL,
  `name` varchar(200) DEFAULT NULL,
  `value` text,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique` (`table_name`,`column_name`,`ui_name`,`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;";

$create_users = "CREATE TABLE `directus_users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `active` tinyint(1) DEFAULT '1',
  `first_name` varchar(50) DEFAULT '',
  `last_name` varchar(50) DEFAULT '',
  `email` varchar(255) DEFAULT '',
  `password` varchar(255) DEFAULT '',
  `salt` varchar(255) DEFAULT '',
  `token` varchar(255) DEFAULT '',
  `reset_token` varchar(255) DEFAULT '',
  `reset_expiration` datetime DEFAULT NULL,
  `position` varchar(500) DEFAULT '',
  `email_messages` tinyint(1) DEFAULT '1',
  `last_login` datetime DEFAULT NULL,
  `last_access` datetime DEFAULT NULL,
  `last_page` varchar(255) DEFAULT '',
  `ip` varchar(50) DEFAULT '',
  `group` int(11) DEFAULT NULL,
  `avatar` varchar(500) DEFAULT NULL,
  `location` varchar(255) DEFAULT NULL,
  `phone` varchar(255) DEFAULT NULL,
  `address` varchar(255) DEFAULT NULL,
  `city` varchar(255) DEFAULT NULL,
  `state` varchar(2) DEFAULT NULL,
  `zip` varchar(10) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;";


$create_statements = [$create_activity, $create_bookmarks, $create_columns, $create_groups, $create_ip_whitelist, $create_media, $create_messages, $create_messages_recipients, $create_preferences, $create_privileges,
  $create_settings, $create_social_feeds, $create_social_posts, $create_storage_adapters, $create_tab_priv, $create_tables, $create_ui, $create_users];

$insert_statements = [$insert_columns, $insert_groups, $insert_settings, $insert_privileges];

$mysqli = new mysqli($_SESSION['host_name'], $_SESSION['username'], $_SESSION['db_password'], $_SESSION['db_name']);

function CreateTables($create_statements, $mysqli)
{
  foreach($create_statements as $statement) {
    $mysqli->query($statement);
  }
}

function RunInserts($insert_statements, $mysqli)
{
  foreach($insert_statements as $statement) {
    $mysqli->query($statement);
  }
}

function AddDefaultUser($email, $password, $mysqli) {
  $salt = uniqid();
  $composite = $salt . $password;
  $hash = sha1( $composite );

  $insert = "INSERT INTO `directus_users` (`id`, `active`, `email`, `password`, `salt`, `group`)
VALUES
  (1, 1, '$email', '$hash', '$salt', 1);";

  $mysqli->query($insert);
}

function AddStorageAdapters($mysqli)
{
  $dd = $_SESSION['default_dest'];
  $du = $_SESSION['default_url'];
  $td = $_SESSION['thumb_dest'];
  $tu = $_SESSION['thumb_url'];
  $tempd = $_SESSION['temp_dest'];
  $tempu = $_SESSION['temp_url'];
  $insert = "INSERT INTO `directus_storage_adapters` (`id`, `key`, `adapter_name`, `role`, `public`, `destination`, `url`, `params`)
  VALUES
    (1, 'files', 'FileSystemAdapter', 'DEFAULT', 1, '$dd', '$du', NULL),
    (2, 'thumbnails', 'FileSystemAdapter', 'THUMBNAIL', 1, '$td', '$tu', NULL),
    (3, 'temp', 'FileSystemAdapter', 'TEMP', 1, '$tempd', '$tempu', NULL);";

  $mysqli->query($insert);
}

?>
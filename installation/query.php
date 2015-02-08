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
  (1,'directus_users','group',NULL,'many_to_one',0,0,0,0,0,'MANYTOONE','directus_groups',NULL,NULL,'group_id',NULL,''),
  (2,'directus_users','avatar_file_id','INT','single_file',0,0,0,0,0,'MANYTOONE','directus_files',NULL,NULL,'avatar_file_id',NULL,'');";

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
  `status_id` int(11) DEFAULT NULL,
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
  (9,'files','thumbnail_storage_adapter','FileSystemAdapter'),
  (10,'files','thumbnail_storage_destination',''),
  (11,'files','thumbnail_quality','100'),
  (12,'files','thumbnail_size','200'),
  (13,'global','cms_thumbnail_url',''),
  (14,'files','file_file_naming','file_id'),
  (15,'files','file_title_naming','file_name'),
  (16,'files','thumbnail_crop_enabled','1');";

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
  `nav_override` text,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;";

$create_tables = "CREATE TABLE `directus_tables` (
  `table_name` varchar(64) NOT NULL DEFAULT '',
  `hidden` tinyint(1) NOT NULL DEFAULT '0',
  `single` tinyint(1) NOT NULL DEFAULT '0',
  `is_junction_table` tinyint(1) NOT NULL DEFAULT '0',
  `footer` tinyint(1) DEFAULT '0',
  `list_view` varchar(200) DEFAULT NULL,
  `column_groupings` varchar(255) DEFAULT NULL,
  `primary_column` varchar(255) DEFAULT NULL,
  `user_create_column` varchar(64) DEFAULT NULL,
  `user_update_column` varchar(64) DEFAULT NULL,
  `date_create_column` varchar(64) DEFAULT NULL,
  `date_update_column` varchar(64) DEFAULT NULL,
  `filter_column_blacklist` text,
  PRIMARY KEY (`table_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;";

$insert_tables = "INSERT INTO `directus_tables` (`table_name`, `hidden`, `single`, `is_junction_table`, `footer`, `list_view`, `column_groupings`, `primary_column`, `user_create_column`, `user_update_column`, `date_create_column`, `date_update_column`)
VALUES
  ('directus_messages_recipients', 1, 0, 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
  ('directus_users', 1, 0, 0, 0, NULL, NULL, NULL, 'id', NULL, NULL, NULL);";

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

$insert_ui = "INSERT INTO `directus_ui` (`table_name`, `column_name`, `ui_name`, `name`, `value`)
VALUES
  ('directus_users','avatar_file_id', 'single_file', 'allowed_filetypes', 'image/');";

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
  `avatar_file_id` int(11) DEFAULT NULL,
  `avatar_is_file` tinyint(1) DEFAULT 0,
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

$insert_statements = [$insert_columns, $insert_groups, $insert_settings, $insert_privileges, $insert_tables, $insert_ui];

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

function InstallSampleData($mysqli) {
  $create = "CREATE TABLE `ui_gallery` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `active` tinyint(4) DEFAULT NULL,
  `wysiwyg` text,
  `checkbox` tinyint(4) DEFAULT NULL,
  `color` varchar(10) DEFAULT NULL,
  `date` date DEFAULT NULL,
  `datetime` datetime DEFAULT NULL,
  `enum` enum('ENTRY 1','ENTRY 2','ENTRY 3') DEFAULT NULL,
  `multiselect` varchar(255) DEFAULT NULL,
  `numeric` int(11) DEFAULT NULL,
  `password` varchar(255) DEFAULT NULL,
  `salt` varchar(255) DEFAULT NULL,
  `radiobuttons` varchar(255) DEFAULT NULL,
  `select` varchar(255) DEFAULT NULL,
  `slider` int(11) DEFAULT NULL,
  `slug` varchar(255) DEFAULT NULL,
  `system` tinyint(4) DEFAULT NULL,
  `tags` varchar(255) DEFAULT NULL,
  `textarea` text,
  `textinput` varchar(255) DEFAULT NULL,
  `time` time DEFAULT NULL,
  `single_file` int(11) DEFAULT NULL,
  `user` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;";

  $mysqli->query($create);

  $create = "CREATE TABLE `ui_users` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `ui_id` int(4) DEFAULT NULL,
  `user_id` int(4) DEFAULT NULL,
  PRIMARY KEY (`id`)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8;";
  $mysqli->query($create);

  $create = "CREATE TABLE `ui_files` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `file_id` int(4) DEFAULT NULL,
  `ui_id` int(4) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;";
  $mysqli->query($create);

  $insert = "INSERT INTO `ui_users` (`ui_id`, `user_id`)
VALUES
  (1, 1);";
  $mysqli->query($insert);

  $insert = "INSERT INTO `ui_gallery` (`id`, `active`, `wysiwyg`, `checkbox`, `color`, `date`, `datetime`, `enum`, `multiselect`, `numeric`, `password`, `salt`, `radiobuttons`, `select`, `slider`, `slug`, `system`, `tags`, `textarea`, `textinput`, `time`, `single_file`, `user`)
VALUES
  (1, 1, '<u>Test</u>', 1, '#27cd2b', '2014-07-10', '2014-07-10 11:53:00', 'ENTRY 2', 'Option 1,Option 2', 634, '74d26f2ab730ac48ee8a9c8f494508a542a6273e', '537d2d1852208', 'Option 2', 'Select 2', 46, 'test-field', 2, 'tag1,tag 2,tag 3', 'Test Text Area', 'test field', '11:58:00', NULL, 1);";
  $mysqli->query($insert);

  $insert = "INSERT INTO `directus_columns` ( `table_name`, `column_name`, `data_type`, `ui`, `system`, `master`, `hidden_input`, `hidden_list`, `required`, `relationship_type`, `table_related`, `junction_table`, `junction_key_left`, `junction_key_right`, `sort`, `comment`)
VALUES
  ('ui_gallery', 'id', NULL, 'numeric', 0, 0, 0, 0, 1, NULL, NULL, NULL, NULL, NULL, 1, ''),
  ('ui_gallery', 'active', NULL, 'checkbox', 0, 0, 0, 0, 0, NULL, NULL, NULL, NULL, NULL, 2, ''),
  ('ui_gallery', 'wysiwyg', NULL, 'wysiwyg', 0, 1, 0, 0, 0, NULL, NULL, NULL, NULL, NULL, 3, ''),
  ('ui_gallery', 'checkbox', NULL, 'checkbox', 0, 0, 0, 0, 0, NULL, NULL, NULL, NULL, NULL, 4, ''),
  ('ui_gallery', 'color', NULL, 'color', 0, 0, 0, 0, 0, NULL, NULL, NULL, NULL, NULL, 5, ''),
  ('ui_gallery', 'date', NULL, 'date', 0, 0, 0, 0, 0, NULL, NULL, NULL, NULL, NULL, 6, ''),
  ('ui_gallery', 'datetime', NULL, 'datetime', 0, 0, 0, 0, 0, NULL, NULL, NULL, NULL, NULL, 7, ''),
  ('ui_gallery', 'enum', NULL, 'enum', 0, 0, 0, 0, 0, NULL, NULL, NULL, NULL, NULL, 8, ''),
  ('ui_gallery', 'many_to_one', NULL, 'many_to_one', 0, 0, 0, 0, 0, NULL, NULL, NULL, NULL, NULL, 9, ''),
  ('ui_gallery', 'multiselect', NULL, 'multi_select', 0, 0, 0, 0, 0, NULL, NULL, NULL, NULL, NULL, 10, ''),
  ('ui_gallery', 'numeric', NULL, 'numeric', 0, 0, 0, 0, 0, NULL, NULL, NULL, NULL, NULL, 11, ''),
  ('ui_gallery', 'password', NULL, 'password', 0, 0, 0, 0, 0, NULL, NULL, NULL, NULL, NULL, 12, ''),
  ('ui_gallery', 'salt', NULL, 'salt', 0, 0, 0, 0, 0, NULL, NULL, NULL, NULL, NULL, 13, ''),
  ('ui_gallery', 'radiobuttons', NULL, 'radiobuttons', 0, 0, 0, 0, 0, NULL, NULL, NULL, NULL, NULL, 14, ''),
  ('ui_gallery', 'select', NULL, 'select', 0, 0, 0, 0, 0, NULL, NULL, NULL, NULL, NULL, 15, ''),
  ('ui_gallery', 'slider', NULL, 'slider', 0, 0, 0, 0, 0, NULL, NULL, NULL, NULL, NULL, 16, ''),
  ('ui_gallery', 'slug', NULL, 'slug', 0, 0, 0, 0, 0, NULL, NULL, NULL, NULL, NULL, 17, ''),
  ('ui_gallery', 'system', NULL, 'system', 0, 0, 0, 0, 0, NULL, NULL, NULL, NULL, NULL, 18, ''),
  ('ui_gallery', 'tags', NULL, 'tags', 0, 0, 0, 0, 0, NULL, NULL, NULL, NULL, NULL, 19, ''),
  ('ui_gallery', 'textarea', NULL, 'textarea', 0, 0, 0, 0, 0, NULL, NULL, NULL, NULL, NULL, 20, ''),
  ('ui_gallery', 'textinput', NULL, 'textinput', 0, 0, 0, 0, 0, NULL, NULL, NULL, NULL, NULL, 21, ''),
  ('ui_gallery', 'time', NULL, 'time', 0, 0, 0, 0, 0, NULL, NULL, NULL, NULL, NULL, 22, ''),
  ('ui_gallery', 'single_file', 'INT', 'single_file', 0, 0, 0, 0, 0, 'MANYTOONE', 'directus_files', NULL, NULL, 'single_file', 9999, ''),
  ('ui_gallery', 'user', 'INT', 'many_to_one', 0, 0, 0, 0, 0, 'MANYTOONE', 'directus_users', NULL, NULL, 'user', 9999, ''),
  ('ui_gallery', 'users', 'MANYTOMANY', 'many_to_many', 0, 0, 0, 0, 1, 'MANYTOMANY', 'directus_users', 'ui_users', 'ui_id', 'user_id', 9999, ''),
  ('ui_gallery', 'files', 'MANYTOMANY', 'multiple_files', 0, 0, 0, 0, 1, 'MANYTOMANY', 'directus_files', 'ui_files', 'ui_id', 'file_id', 9999, '');";
  $mysqli->query($insert);

  $insert = "INSERT INTO `directus_privileges` (`table_name`, `permissions`, `group_id`, `read_field_blacklist`, `write_field_blacklist`, `unlisted`)
VALUES
  ('ui_gallery', 'add,edit,bigedit,delete,bigdelete,alter,view,bigview', 1, NULL, NULL, NULL),
  ('ui_users', 'add,edit,bigedit,delete,bigdelete,alter,view,bigview', 1, NULL, NULL, NULL),
  ('ui_files', 'add,edit,bigedit,delete,bigdelete,alter,view,bigview', 1, NULL, NULL, NULL);";
  $mysqli->query($insert);

  $insert = "INSERT INTO `directus_ui` (`table_name`, `column_name`, `ui_name`, `name`, `value`)
VALUES
  ('ui_gallery', 'radiobuttons', 'radiobuttons', 'options', 'Option 1,Option 2,Option 3'),
  ('ui_gallery', 'multiselect', 'multi_select', 'type', 'select_list'),
  ('ui_gallery', 'multiselect', 'multi_select', 'delimiter', ','),
  ('ui_gallery', 'multiselect', 'multi_select', 'options', '{\r\n\"Option 1\":\"option_1\",\r\n\"Option 2\":\"option_2\",\r\n\"Option 3\":\"option_3\"\r\n}'),
  ('ui_gallery', 'password', 'password', 'require_confirmation', '1'),
  ('ui_gallery', 'password', 'password', 'salt_field', 'salt'),
  ('ui_gallery', 'select', 'select', 'options', '{\r\n\"Select 1\":\"select_1\",\r\n\"Select 2\":\"select_2\",\r\n\"Select 3\":\"select_3\"\r\n}'),
  ('ui_gallery', 'select', 'select', 'allow_null', '0'),
  ('ui_gallery', 'select', 'select', 'placeholder_text', ''),
  ('ui_gallery', 'slider', 'slider', 'minimum', '0'),
  ('ui_gallery', 'slider', 'slider', 'maximum', '100'),
  ('ui_gallery', 'slider', 'slider', 'step', '2'),
  ('ui_gallery', 'slug', 'slug', 'readonly', '1'),
  ('ui_gallery', 'slug', 'slug', 'size', 'large'),
  ('ui_gallery', 'slug', 'slug', 'mirrored_field', 'textinput'),
  ('ui_gallery', 'user', 'many_to_one', 'readonly', '0'),
  ('ui_gallery', 'user', 'many_to_one', 'visible_status_ids', '1'),
  ('ui_gallery', 'user', 'many_to_one', 'visible_column', 'email'),
  ('ui_gallery', 'user', 'many_to_one', 'visible_column_template', '{{email}}'),
  ('ui_gallery', 'user', 'many_to_one', 'placeholder_text', ''),
  ('ui_gallery', 'user', 'many_to_one', 'filter_type', 'dropdown'),
  ('ui_gallery', 'user', 'many_to_one', 'filter_column', 'email'),
  ('ui_gallery', 'users', 'many_to_many', 'visible_columns', 'email'),
  ('ui_gallery', 'users', 'many_to_many', 'add_button', '0'),
  ('ui_gallery', 'users', 'many_to_many', 'choose_button', '1'),
  ('ui_gallery', 'users', 'many_to_many', 'remove_button', '1'),
  ('ui_gallery', 'users', 'many_to_many', 'filter_type', 'dropdown'),
  ('ui_gallery', 'users', 'many_to_many', 'filter_column', 'email'),
  ('ui_gallery', 'users', 'many_to_many', 'visible_column_template', '{{email}}'),
  ('ui_gallery', 'files', 'multiple_files', 'add_button', '0'),
  ('ui_gallery', 'files', 'multiple_files', 'choose_button', '1'),
  ('ui_gallery', 'files', 'multiple_files', 'remove_button', '1');";

  $mysqli->query($insert);
}

?>
<?php

$loader = require '../api/vendor/autoload.php';
$loader->add("Ruckusing", "../api/vendor/ruckusing/ruckusing-migrations/lib/");

use Ruckusing\Framework as Ruckusing_Framework;

$config = require '../api/ruckusing.conf.php';
$config['db']['development'] = array(
  'type' => 'mysql',
  'host' => $_SESSION['host_name'],
  'port' => 3306,
  'database' => $_SESSION['db_name'],
  'user' => $_SESSION['username'],
  'password' => $_SESSION['db_password']
);

$main = new Ruckusing_Framework($config);
$mysqli = new mysqli($_SESSION['host_name'], $_SESSION['username'], $_SESSION['db_password'], $_SESSION['db_name']);

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
<?php

$dns = sprintf('%s:host=%s;port=%s;dbname=%s', $_SESSION['db_type'], $_SESSION['db_host'], $_SESSION['db_port'], $_SESSION['db_name']);
$pdo = new PDO($dns, $_SESSION['db_user'], $_SESSION['db_password']);
if ($pdo && !file_exists('../api/vendor/autoload.php') || !file_exists('../api/ruckusing.conf.php')  || filesize('../api/ruckusing.conf.php') == 0) {
    $_SESSION['step'] = 3;
    header('refresh: 0');
    exit;
}

$loader = require '../api/vendor/autoload.php';
$loader->add('Ruckusing', '../api/vendor/ruckusing/ruckusing-migrations/lib/');

use Ruckusing\Framework as Ruckusing_Framework;

$config = require '../api/ruckusing.conf.php';

$dbconfig = getDatabaseConfig(array(
  'type' => $_SESSION['db_type'],
  'host' => $_SESSION['db_host'],
  'port' => $_SESSION['db_port'],
  'name' => $_SESSION['db_name'],
  'user' => $_SESSION['db_user'],
  'pass' => $_SESSION['db_password'],
  'directory' => 'directus',
  'prefix' => '', //$_SESSION['db_prefix']
));
$config = array_merge($config, $dbconfig);
$main = new Ruckusing_Framework($config);

function getTableName($table_name)
{
    $prefix = ''; //$_SESSION['db_prefix'];
    return $prefix.$table_name;
}

function AddSettings()
{
    global $pdo;

    $pdo->query("INSERT INTO `directus_settings`
        (`id`, `collection`, `name`, `value`)
        VALUES
        (1,'global','cms_user_auto_sign_out','60'),
        (2,'global','project_name','".$_SESSION['site_name']."'),
        (3,'global','project_url','http://examplesite.dev/'),
        (4,'global','rows_per_page','200'),
        (5,'files','storage_adapter','FileSystemAdapter'),
        (6,'files','storage_destination',''),
        (7,'files','thumbnail_storage_adapter','FileSystemAdapter'),
        (8,'files','thumbnail_storage_destination',''),
        (9,'files','thumbnail_quality','100'),
        (10,'files','thumbnail_size','200'),
        (11,'global','cms_thumbnail_url',''),
        (12,'files','file_naming','file_id'),
        (13,'files','thumbnail_crop_enabled','1');");
}

function AddDefaultUser($email, $password)
{
    global $pdo;

    $salt = uniqid();
    $composite = $salt.$password;
    $hash = sha1($composite);
    $tableName = getTableName('directus_users');

    $insert = "INSERT INTO `$tableName`
        (`id`, `active`, `first_name`, `last_name`, `email`, `password`, `salt`, `group`)
        VALUES
        (1, 1, 'Admin', 'User', '$email', '$hash', '$salt', 1);";

    $pdo->query($insert);
}

function AddStorageAdapters()
{
    global $pdo;

    $dd = $_SESSION['default_dest'];
    $du = $_SESSION['default_url'];
    $td = $_SESSION['thumb_dest'];
    $tu = $_SESSION['thumb_url'];
    $tempd = $_SESSION['temp_dest'];
    $tempu = $_SESSION['temp_url'];
    $tableName = getTableName('directus_storage_adapters');

    $insert = "INSERT INTO `$tableName`
        (`id`, `key`, `adapter_name`, `role`, `public`, `destination`, `url`, `params`)
        VALUES
        (1, 'files', 'FileSystemAdapter', 'DEFAULT', 1, '$dd', '$du', NULL),
        (2, 'thumbnails', 'FileSystemAdapter', 'THUMBNAIL', 1, '$td', '$tu', NULL),
        (3, 'temp', 'FileSystemAdapter', 'TEMP', 1, '$tempd', '$tempu', NULL);";

    $pdo->query($insert);
}

function InstallSampleData()
{
    global $pdo;
    $galleryTableName = getTableName('example_gallery');

    $create = "CREATE TABLE `$galleryTableName` (
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

    $pdo->query($create);

    $uiUsersTableName = getTableName('example_users');
    $create = "CREATE TABLE `$uiUsersTableName` (
        `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
        `ui_id` int(4) DEFAULT NULL,
        `user_id` int(4) DEFAULT NULL,
        PRIMARY KEY (`id`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8;";
    $pdo->query($create);

    $uiFilesTableName = getTableName('example_files');
    $create = "CREATE TABLE `$uiFilesTableName` (
        `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
        `file_id` int(4) DEFAULT NULL,
        `ui_id` int(4) DEFAULT NULL,
        PRIMARY KEY (`id`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8;";
    $pdo->query($create);

    $insert = "INSERT INTO `$uiUsersTableName`
        (`ui_id`, `user_id`)
        VALUES
        (1, 1);";

    $pdo->query($insert);

    $insert = "INSERT INTO `$galleryTableName`
        (`id`, `active`, `wysiwyg`, `checkbox`, `color`, `date`, `datetime`, `enum`, `multiselect`, `numeric`, `password`, `salt`, `radiobuttons`, `select`, `slider`, `slug`, `system`, `tags`, `textarea`, `textinput`, `time`, `single_file`, `user`)
        VALUES
        (1, 1, '<u>Test</u>', 1, '#27cd2b', '2014-07-10', '2014-07-10 11:53:00', 'ENTRY 2', 'Option 1,Option 2', 634, '74d26f2ab730ac48ee8a9c8f494508a542a6273e', '537d2d1852208', 'Option 2', 'Select 2', 46, 'test-field', 2, 'tag1,tag 2,tag 3', 'Test Text Area', 'test field', '11:58:00', NULL, 1);";

    $pdo->query($insert);

    $columnsTableName = getTableName('directus_columns');
    $insert = "INSERT INTO `$columnsTableName`
        ( `table_name`, `column_name`, `data_type`, `ui`, `system`, `master`, `hidden_input`, `hidden_list`, `required`, `relationship_type`, `table_related`, `junction_table`, `junction_key_left`, `junction_key_right`, `sort`, `comment`)
        VALUES
        ('example_gallery', 'id', NULL, 'numeric', 0, 0, 0, 0, 1, NULL, NULL, NULL, NULL, NULL, 1, ''),
        ('example_gallery', 'active', NULL, 'checkbox', 0, 0, 0, 0, 0, NULL, NULL, NULL, NULL, NULL, 2, ''),
        ('example_gallery', 'wysiwyg', NULL, 'wysiwyg', 0, 1, 0, 0, 0, NULL, NULL, NULL, NULL, NULL, 3, ''),
        ('example_gallery', 'checkbox', NULL, 'checkbox', 0, 0, 0, 0, 0, NULL, NULL, NULL, NULL, NULL, 4, ''),
        ('example_gallery', 'color', NULL, 'color', 0, 0, 0, 0, 0, NULL, NULL, NULL, NULL, NULL, 5, ''),
        ('example_gallery', 'date', NULL, 'date', 0, 0, 0, 0, 0, NULL, NULL, NULL, NULL, NULL, 6, ''),
        ('example_gallery', 'datetime', NULL, 'datetime', 0, 0, 0, 0, 0, NULL, NULL, NULL, NULL, NULL, 7, ''),
        ('example_gallery', 'enum', NULL, 'enum', 0, 0, 0, 0, 0, NULL, NULL, NULL, NULL, NULL, 8, ''),
        ('example_gallery', 'many_to_one', NULL, 'many_to_one', 0, 0, 0, 0, 0, NULL, NULL, NULL, NULL, NULL, 9, ''),
        ('example_gallery', 'multiselect', NULL, 'multi_select', 0, 0, 0, 0, 0, NULL, NULL, NULL, NULL, NULL, 10, ''),
        ('example_gallery', 'numeric', NULL, 'numeric', 0, 0, 0, 0, 0, NULL, NULL, NULL, NULL, NULL, 11, ''),
        ('example_gallery', 'password', NULL, 'password', 0, 0, 0, 0, 0, NULL, NULL, NULL, NULL, NULL, 12, ''),
        ('example_gallery', 'salt', NULL, 'salt', 0, 0, 0, 0, 0, NULL, NULL, NULL, NULL, NULL, 13, ''),
        ('example_gallery', 'radiobuttons', NULL, 'radiobuttons', 0, 0, 0, 0, 0, NULL, NULL, NULL, NULL, NULL, 14, ''),
        ('example_gallery', 'select', NULL, 'select', 0, 0, 0, 0, 0, NULL, NULL, NULL, NULL, NULL, 15, ''),
        ('example_gallery', 'slider', NULL, 'slider', 0, 0, 0, 0, 0, NULL, NULL, NULL, NULL, NULL, 16, ''),
        ('example_gallery', 'slug', NULL, 'slug', 0, 0, 0, 0, 0, NULL, NULL, NULL, NULL, NULL, 17, ''),
        ('example_gallery', 'system', NULL, 'system', 0, 0, 0, 0, 0, NULL, NULL, NULL, NULL, NULL, 18, ''),
        ('example_gallery', 'tags', NULL, 'tags', 0, 0, 0, 0, 0, NULL, NULL, NULL, NULL, NULL, 19, ''),
        ('example_gallery', 'textarea', NULL, 'textarea', 0, 0, 0, 0, 0, NULL, NULL, NULL, NULL, NULL, 20, ''),
        ('example_gallery', 'textinput', NULL, 'textinput', 0, 0, 0, 0, 0, NULL, NULL, NULL, NULL, NULL, 21, ''),
        ('example_gallery', 'time', NULL, 'time', 0, 0, 0, 0, 0, NULL, NULL, NULL, NULL, NULL, 22, ''),
        ('example_gallery', 'single_file', 'INT', 'single_file', 0, 0, 0, 0, 0, 'MANYTOONE', 'directus_files', NULL, NULL, 'single_file', 9999, ''),
        ('example_gallery', 'user', 'INT', 'many_to_one', 0, 0, 0, 0, 0, 'MANYTOONE', 'directus_users', NULL, NULL, 'user', 9999, ''),
        ('example_gallery', 'users', 'MANYTOMANY', 'many_to_many', 0, 0, 0, 0, 1, 'MANYTOMANY', 'directus_users', 'example_users', 'ui_id', 'user_id', 9999, ''),
        ('example_gallery', 'files', 'MANYTOMANY', 'multiple_files', 0, 0, 0, 0, 0, 'MANYTOMANY', 'directus_files', 'example_files', 'ui_id', 'file_id', 9999, '');";

    $pdo->query($insert);

    $columnsTableName = getTableName('directus_tables');
    $insert = "INSERT INTO `$columnsTableName`
        (`table_name`, `hidden`, `single`, `is_junction_table`, `footer`, `list_view`, `column_groupings`, `primary_column`, `user_create_column`, `user_update_column`, `date_create_column`, `date_update_column`, `filter_column_blacklist`)
        VALUES
        ('example_gallery',0,0,0,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),
        ('example_users',1,0,1,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),
        ('example_files',1,0,1,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL);";

    $pdo->query($insert);

    $directusPrivilegesTableName = getTableName('directus_privileges');
    $insert = "INSERT INTO `$directusPrivilegesTableName`
        (`id`, `table_name`, `group_id`, `read_field_blacklist`, `write_field_blacklist`, `nav_listed`, `allow_view`, `allow_add`, `allow_edit`, `allow_delete`, `allow_alter`, `status_id`)
        VALUES
        (DEFAULT, 'example_gallery',1,NULL,NULL,1,2,1,2,2,1,NULL),
        (DEFAULT, 'example_users',1,NULL,NULL,1,2,1,2,2,1,NULL),
        (DEFAULT, 'example_files',1,NULL,NULL,1,2,1,2,2,1,NULL);";

    $pdo->query($insert);

    $directusUITableName = getTableName('directus_ui');
    $insert = "INSERT INTO `$directusUITableName`
        (`table_name`, `column_name`, `ui_name`, `name`, `value`)
        VALUES
        ('example_gallery', 'radiobuttons', 'radiobuttons', 'options', 'Option 1,Option 2,Option 3'),
        ('example_gallery', 'multiselect', 'multi_select', 'type', 'select_list'),
        ('example_gallery', 'multiselect', 'multi_select', 'delimiter', ','),
        ('example_gallery', 'multiselect', 'multi_select', 'options', '{\r\n\"Option 1\":\"option_1\",\r\n\"Option 2\":\"option_2\",\r\n\"Option 3\":\"option_3\"\r\n}'),
        ('example_gallery', 'password', 'password', 'require_confirmation', '1'),
        ('example_gallery', 'password', 'password', 'salt_field', 'salt'),
        ('example_gallery', 'select', 'select', 'options', '{\r\n\"Select 1\":\"select_1\",\r\n\"Select 2\":\"select_2\",\r\n\"Select 3\":\"select_3\"\r\n}'),
        ('example_gallery', 'select', 'select', 'allow_null', '0'),
        ('example_gallery', 'select', 'select', 'placeholder_text', ''),
        ('example_gallery', 'slider', 'slider', 'minimum', '0'),
        ('example_gallery', 'slider', 'slider', 'maximum', '100'),
        ('example_gallery', 'slider', 'slider', 'step', '2'),
        ('example_gallery', 'slug', 'slug', 'readonly', '1'),
        ('example_gallery', 'slug', 'slug', 'size', 'large'),
        ('example_gallery', 'slug', 'slug', 'mirrored_field', 'textinput'),
        ('example_gallery', 'user', 'many_to_one', 'readonly', '0'),
        ('example_gallery', 'user', 'many_to_one', 'visible_status_ids', '1'),
        ('example_gallery', 'user', 'many_to_one', 'visible_column', 'email'),
        ('example_gallery', 'user', 'many_to_one', 'visible_column_template', '{{email}}'),
        ('example_gallery', 'user', 'many_to_one', 'placeholder_text', ''),
        ('example_gallery', 'user', 'many_to_one', 'filter_type', 'dropdown'),
        ('example_gallery', 'user', 'many_to_one', 'filter_column', 'email'),
        ('example_gallery', 'users', 'many_to_many', 'visible_columns', 'email'),
        ('example_gallery', 'users', 'many_to_many', 'add_button', '0'),
        ('example_gallery', 'users', 'many_to_many', 'choose_button', '1'),
        ('example_gallery', 'users', 'many_to_many', 'remove_button', '1'),
        ('example_gallery', 'users', 'many_to_many', 'filter_type', 'dropdown'),
        ('example_gallery', 'users', 'many_to_many', 'filter_column', 'email'),
        ('example_gallery', 'users', 'many_to_many', 'visible_column_template', '{{email}}'),
        ('example_gallery', 'files', 'multiple_files', 'add_button', '0'),
        ('example_gallery', 'files', 'multiple_files', 'choose_button', '1'),
        ('example_gallery', 'files', 'multiple_files', 'remove_button', '1');";

    $pdo->query($insert);
}

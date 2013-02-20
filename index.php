<?php
require 'api/api.php';

$data = array();
$data['tables'] = request('tables', 'GET');
$data['users'] = request('users', 'GET');
$data['groups'] = request('groups', 'GET');
$data['settings'] = request('settings', 'GET');
$data['page'] = '#tables';
$data['path'] = DIRECTUS_PATH;
$data['active_media'] = $db->count_active('directus_media');
$data['extensions'] = array();
//$data['active_activity'] = $db->count_active('directus_media');
//$data['active_activity'] = $db->count_active('directus_activity');

if ($data == 401) {
  header( 'location: login.html' ) ;
  die();
}

// Scan for extensions
foreach (new DirectoryIterator('./extensions') as $file) {
	if($file->isDot()) continue;
	if(is_dir('./extensions/'.$file->getFilename()))
	{
	  array_push($data['extensions'], 'extensions/'.$file->getFilename().'/'.$file->getFilename());
	}
}

echo template(file_get_contents('main.html'), array(
	'data'=> json_encode($data),
	'path'=> DIRECTUS_PATH
));

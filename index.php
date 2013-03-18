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
$data['ui'] = array();

// No access, forward to login page
if ($data == 401) {
  header( 'location: login.html' ) ;
  die();
}

// Scan for extensions
foreach (new DirectoryIterator('./extensions') as $file) {
	if($file->isDot()) continue;
	if(is_dir('./extensions/'.$file->getFilename()))
	{
	  array_push($data['extensions'], 'extensions/'.$file->getFilename().'/main');
	}
}

// Scan for UI's
foreach (new DirectoryIterator('./ui') as $file) {
	$info = pathinfo($file->getFilename());
	if (array_key_exists('extension',$info) && $info['extension'] != 'js') continue;
	if($file->isDot()) continue;
	array_push($data['ui'], 'ui/'.basename($file->getFilename(),'.js'));
}

echo template(file_get_contents('main.html'), array(
	'data'=> json_encode($data),
	'path'=> DIRECTUS_PATH
));

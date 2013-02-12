<?php
require 'api/api.php';

$data = array();
$data['tables'] = request('tables', 'GET');
$data['users'] = request('users', 'GET');
$data['groups'] = request('groups', 'GET');
$data['settings'] = request('settings', 'GET');
$data['page'] = '#tables';
$data['path'] = DIRECTUS_PATH;

if ($data == 401) {
  header( 'location: login.html' ) ;
  die();
}

echo template(file_get_contents('main.html'), array(
	'data'=> json_encode($data),
	'path'=> DIRECTUS_PATH
));

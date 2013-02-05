<?php
require 'api/api.php';

$data = array();
$data['tables'] = request('tables', 'GET');
$data['users'] = request('users', 'GET');
$data['settings'] = request('settings', 'GET');
$data['page'] = '#tables';

// add setup here...

if ($data == 401) {
  header( 'location: login.html' ) ;
  die();
}

echo sprintf(file_get_contents('main.html'), json_encode($data));

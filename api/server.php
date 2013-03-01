<?php
require 'core/media.php';
$result = array();

foreach ($_FILES as $file) {
  $media = new Media($file, '/Users/olov/RNGR/resources/');
  array_push($result, $media->data());
}

header("Content-Type: application/json; charset=utf-8");
echo json_encode($result);
?>
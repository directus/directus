<?php
require 'core/media.php';
require 'config.php';
$result = array();

foreach ($_FILES as $file) {
  $media = new Media($file, RESOURCES_PATH);
  array_push($result, $media->data());
}

header("Content-Type: application/json; charset=utf-8");
echo json_encode($result);
?>
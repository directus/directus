<?php

$filename = $_GET['filename'];

preg_match("/(.+)\-([\d]+)x([\d]+)(\-crop)?\.(jpg|jpeg|png|gif)/i", $filename, $matches);

if(empty($matches)) {
    header("HTTP/1.0 404 Not Found");
    exit;
}

require 'api/config.php';

list($name, $basename, $targetWidth, $targetHeight, $crop, $ext) = $matches;

$cropEnabled = !empty($crop);
$real_name = "$basename.$ext";
$path = RESOURCES_PATH . "$real_name";

if(!file_exists($path)) {
    header("HTTP/1.0 404 Not Found");
    exit;
}

switch($ext) {
    case 'jpg':
    case 'jpeg': $mime = 'image/jpeg'; break;
    case 'gif': $mime = 'image/gif'; break;
    case 'png': $mime = 'image/png'; break;
}

header("Content-Type: $mime");

$thumbnails = RESOURCES_PATH . "thumbnail/";
$cachedThumbnail = $thumbnails . $filename;
if(file_exists($cachedThumbnail)) {
	die(file_get_contents($cachedThumbnail));
}

// Composer Autoloader
$loader = require 'api/vendor/autoload.php';
$loader->add("Directus", dirname(__FILE__) . "/api/core/");

use Directus\Media\ImageManipulator;
$Image = new ImageManipulator($path);

if($cropEnabled) {
	// Crop to center
	$height = $Image->getHeight();
	$width = $Image->getWidth();
	$centerX = round($width / 2);
	$centerY = round($height / 2);
	$cropWidthHalf  = round($targetWidth / 2);
	$cropHeightHalf = round($targetHeight / 2);
	$x1 = max(0, $centerX - $cropWidthHalf);
	$y1 = max(0, $centerY - $cropHeightHalf);
	$x2 = min($width, $centerX + $cropWidthHalf);
	$y2 = min($height, $centerY + $cropHeightHalf);
	$Image->crop($x1, $y1, $x2, $y2);
}else {
	// @todo seems to only respect the width
	$Image->resample($targetWidth, $targetHeight);
}

$Image->save($cachedThumbnail);
$resource = $Image->getResource();

switch($ext) {
    case 'jpg':
    case 'jpeg': imagejpeg($resource); break;
    case 'gif': imagegif($resource); break;
    case 'png': imagepng($resource); break;
}
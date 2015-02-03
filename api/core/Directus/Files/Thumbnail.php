<?php

namespace Directus\Files;

class Thumbnail {

	public static function generateThumbnail($localPath, $format, $thumbnailSize, $cropEnabled) {
        switch($format) {
            case 'jpg':
            case 'jpeg':
                $img = imagecreatefromjpeg($localPath);
                break;
            case 'gif':
                $img = imagecreatefromgif($localPath);
                break;
            case 'png':
                $img = imagecreatefrompng($localPath);
                break;
            case 'pdf':
            case 'psd':
            case 'tif':
            case 'tiff':
              if(extension_loaded('imagick')) {
                $image = new \Imagick();
                $image->readImage($localPath);
                $image->setIteratorIndex(0);
                $image->setImageFormat('jpeg');
                $tempName = tempnam(sys_get_temp_dir(), 'DirectusThumbnail');
                $image->writeImage($tempName);
                $img = imagecreatefromjpeg($tempName);
              } else {
                return false;
              }
              break;
			      default:
				      return false;
        }

        $w = imagesx($img);
        $h = imagesy($img);
        $x1 = 0; // used for crops
        $y1 = 0; // used for crops
        $aspectRatio = $w / $h;

        if($cropEnabled) {
            // crop to center of image
            if($aspectRatio <= 1){
                $newW = $thumbnailSize;
                $newH = $h*($thumbnailSize/$w);
                $y1 = -1 * (($newH - $thumbnailSize)/2);
            } else {
                $newH = $thumbnailSize;
                $newW = $w*($thumbnailSize/$h);
                $x1 = -1 * (($newW - $thumbnailSize)/2);
            }
        } else {
          // portrait (or square) mode, maximize height
          if ($aspectRatio <= 1) {
              $newH = $thumbnailSize;
              $newW = $thumbnailSize * $aspectRatio;
          }
          // landscape mode, maximize width
          if ($aspectRatio > 1) {
              $newW = $thumbnailSize;
              $newH = $thumbnailSize / $aspectRatio;
          }
        }

        if($cropEnabled) {
            $imgResized = imagecreatetruecolor($thumbnailSize, $thumbnailSize);
        } else {
            $imgResized = imagecreatetruecolor($newW, $newH);
        }

        // Preserve transperancy for gifs and pngs
        if ($format == 'gif' || $format == 'png') {
            imagealphablending($imgResized, false);
            imagesavealpha($imgResized,true);
            $transparent = imagecolorallocatealpha($imgResized, 255, 255, 255, 127);
            imagefilledrectangle($imgResized, 0, 0, $newW, $newH, $transparent);
        }

        imagecopyresampled($imgResized, $img, $x1, $y1, 0, 0, $newW, $newH, $w, $h);

        imagedestroy($img);
        return $imgResized;
	}

	public static function writeImage($extension, $path, $img, $quality) {
        switch($extension) {
            case 'jpg':
            case 'jpeg':
                return imagejpeg($img, $path, $quality);
                break;
            case 'gif':
                return imagegif($img, $path);
                break;
            case 'png':
                return imagepng($img, $path);
                break;
            case 'pdf':
            case 'psd':
            case 'tif':
            case 'tiff':
                return imagejpeg($img, $path, $quality);
                break;
        }
        return false;
	}

}
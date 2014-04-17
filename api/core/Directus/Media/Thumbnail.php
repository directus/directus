<?php

namespace Directus\Media;

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
			default:
				return false;
        }
        $w = imagesx($img);
        $h = imagesy($img);
        $aspectRatio = $w / $h;

        if($cropEnabled) {
          $centerX = round($w / 2);
          $centerY = round($h / 2);
          $cropWidthHalf  = round($thumbnailSize / 2);
          $cropHeightHalf = round($thumbnailSize / 2);
          $x1 = max(0, $centerX - $cropWidthHalf);
          $y1 = max(0, $centerY - $cropHeightHalf);
          $x2 = min($w, $centerX + $cropWidthHalf);
          $y2 = min($h, $centerY + $cropHeightHalf);
          $newW = $x2 - $x1;
          $newH = $y2 - $y1;
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

        $imgResized = imagecreatetruecolor($newW, $newH);

        // Preserve transperancy for gifs and pngs
        if ($format == 'gif' || $format == 'png') {
            imagealphablending($imgResized, false);
            imagesavealpha($imgResized,true);
            $transparent = imagecolorallocatealpha($imgResized, 255, 255, 255, 127);
            imagefilledrectangle($imgResized, 0, 0, $newW, $newH, $transparent);
        }

        if($cropEnabled) {
          imagecopy($imgResized, $img, 0, 0, $x1, $y1, $newW, $newH);
        } else {
          imagecopyresampled($imgResized, $img, 0, 0, 0, 0, $newW, $newH, $w, $h);
        }
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
        }
        return false;
	}

}
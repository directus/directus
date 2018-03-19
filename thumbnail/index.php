<?php
require __DIR__ . '/../vendor/autoload.php';
require __DIR__ . '/../api/api.php';

use Directus\Util\ArrayUtils;
use Directus\Filesystem\Thumbnailer as ThumbnailerService;

try 
{
    $app = \Directus\Bootstrap::get('app');
    $config = $app->container->get('config')->get('thumbnailer');
    
    /*
	    Set the fallback option in the thumbnailer config - '/api/configuration.php'
	    If not set, a 404 img will be sent back if the dimensions 
        are not supported within 'supportedThumbnailDimensions'
    */
    
    if (ArrayUtils::get($config, 'fallback'))
    {
		/*
			Fall back to one of supported sizes
		*/
	    
	    $pathinfo = $app->request->getPathInfo();
	    $pathinfo = ltrim($pathinfo, '/');
	    $pathinfo = explode('/', $pathinfo);
	    
	    $config = $app->container->get('config')->get('thumbnailer');
	    $sizes = ArrayUtils::get($config, 'supportedThumbnailDimensions');
	    $redirect = NULL;
	    
	    /*
		    Get the nearest size above the required size
		    We must assume the first and second indexes are the width and height
	    */
	    
	    foreach ($sizes as $size)
	    {
		    $size = explode('x', trim($size));
		    
		    $width = (int) $size[0];
		    $height = (int) $size[1];
		    
		    $imgwidth = (int) $pathinfo[0];
		    $imgheight = (int) $pathinfo[1];
		    
		    /*
			    If the sizes are validated continue with the rest of the script
			    Otherwise falback to the nearest valid sizes
		    */
		    
		    if ($imgwidth === $width && $imgheight === $height)
		    {
			    break;
		    }
		    elseif ($imgwidth < $width && $imgheight < $height)
		    {
			    $pathinfo[0] = $size[0];
			    $pathinfo[1] = $size[1];
			    
			    $redirect = $app->request->getRootUri() . '/' . implode('/', $pathinfo);
			    
			    break;
		    }
	    }
	    
	    /*
		    If redirect, do a permanent redirect to the valid size URL
	    */
	    
	    if ($redirect) 
	    {
		    header("Location: {$redirect}", true, 301);
		    
		    die();
	    }
	}
    
    /*
	    If the thumb already exists, return it
    */ 
    
    $thumbnailer = new ThumbnailerService($app->files, $app->container->get('config')->get('thumbnailer'), $app->request->getPathInfo());
    $image = $thumbnailer->get();

    if (! $image) 
    {

        /*
	        Now we can create the thumb - defaulting to contain
	        
        */ 
        
        switch ($thumbnailer->action) 
        {
            /*
	            Documentation: http://image.intervention.io/api/resize
            */ 
            
            case 'contain':
                $image = $thumbnailer->contain();
                break;

            /*
	            Documentation: http://image.intervention.io/api/fit
            */ 
            
            case 'crop':
                $image = $thumbnailer->crop();
                break;
                
            /*
	            Keep the API agnostic and non destructive - saves creating one off images (different heights)
	            Set the action to prevent error on /api/core/Directus/Filesystem/Thumbnailer.php:152
            */
            
            default:
            	$thumbnailer->action = 'contain';
                $image = $thumbnailer->contain();
        }
    }

    header('HTTP/1.1 200 OK');
    header('Content-type: ' . $thumbnailer->getThumbnailMimeType());
    header("Pragma: cache");
    header('Cache-Control: max-age=86400');
    header('Last-Modified: '. gmdate('D, d M Y H:i:s \G\M\T', time()));
    header('Expires: '. gmdate('D, d M Y H:i:s \G\M\T', time() + 86400));
    
    echo $image;
    exit(0);
}

catch (Exception $e) 
{
    $filePath = ArrayUtils::get($app->container->get('config')->get('thumbnailer'), '404imageLocation', './img-not-found.png');
    $mime = image_type_to_mime_type(exif_imagetype($filePath));

    header('Content-type: ' . $mime);
    header("Pragma: cache");
    header('Cache-Control: max-age=86400');
    header('Last-Modified: '. gmdate('D, d M Y H:i:s \G\M\T', time()));
    header('Expires: '. gmdate('D, d M Y H:i:s \G\M\T', time() + 86400));
    
    echo file_get_contents($filePath);
    exit(0);
}

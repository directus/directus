<?PHP
//die(print_r($_GET, true));

// Redirect if exists (Ideally should be in htaccess)
//$file_check_path = $_GET['file_name'] . "-" . $_GET['extension'] . "-" . $_GET['w'] . "-" . $_GET['h'] . "-" . $_GET['c'] . ".jpg";
//if(file_exists($file_check_path) && $_GET['refresh'] != 'code' && $_GET['refresh'] != 'true' && $_GET['refresh'] != 'refresh') {
//    header('content-type: image/jpeg');
//    echo file_get_contents($file_check_path);
//    die();
//}


//////////////////////////////////////////////////////////////////////////////


// We need to establish a database connection here
// require_once("../../public_html/directus/inc/setup.php");
// Composer Autoloader
define('DIRECTUS_PATH', __DIR__ . '/directus6');
$loader = require DIRECTUS_PATH . '/vendor/autoload.php';

// Non-autoloaded components
require DIRECTUS_PATH . '/api/api.php';
require DIRECTUS_PATH . '/api/globals.php';

$filesystem = \Directus\Bootstrap::get('filesystem');

$file_check_path = $_GET['file_name'] . "-" . $_GET['extension'] . "-" . $_GET['w'] . "-" . $_GET['h'] . "-" . $_GET['c'] . ".jpg";

if($filesystem->getAdapter()->has($file_check_path) && $_GET['refresh'] != 'code' && $_GET['refresh'] != 'true' && $_GET['refresh'] != 'refresh') {
    header('content-type: image/jpeg');
    echo file_get_contents($file_check_path);
    die();
}

//////////////////////////////////////////////////////////////////////////////

if($_GET['file_name'] && $_GET['w'] && $_GET['h'] && $_GET['c']){

    // Get file name without extension
    $file_name_temp = explode(".", $_GET['file_name']);
    $file_name = $file_name_temp[0];
    $extension = end($file_name_temp);

    // Get image parent image
    $zendDb = \Directus\Bootstrap::get('zendDb');
    $table = new \Zend\Db\TableGateway\TableGateway('directus_files', $zendDb);
    $select = new \Zend\Db\Sql\Select($table->getTable());
    $select->where([
        'name' => $_GET['file_name']
    ])
    ->limit(1);
    $result = $table->selectWith($select);
    $parent = $result->current();
//    $sth = $zendDb->prepare("SELECT * FROM `directus_files` WHERE `file_name` = :file_name AND `extension` = :extension ");
//    $sth->bindParam(':file_name', $_GET['file_name']); //  probably needs to be: $file_name_temp
//    $sth->bindParam(':extension', $_GET['extension']);
//    $sth->execute();
    // if($parent = $sth->fetch()){
    if ($parent) {

        // Variables
        $extension = ($parent['extension'] == "vimeo")? "jpg" : $extension;//$parent['extension'];
        if($parent['extension'] == "vimeo"){
            $path = "../../" . $settings['cms']['media_path'] . "vimeo_" . $parent['source'].".jpg";
        } else {
            // $path = "../../" . $settings['cms']['media_path'] . $parent['source'];
            $path = $filesystem->getPath() . '/' . $parent['name'];
        }

        if($parent['extension'] == "vimeo"){
            list($width, $height, $type, $attr) = getimagesize($path);
            $parent_width = $new_width = $width;
            $parent_height = $new_height = $height;
        } else {
            $parent_width = $new_width = $parent['width'];
            $parent_height = $new_height = $parent['height'];
        }

        $width_max = $_GET['w'];
        $height_max = $_GET['h'];
        $crop = $_GET['c'];

        // Check if this size is allowed
        $thumb_check = "$width_max,$height_max,$crop";
        $allowed_thumbs = [
            "100,100,true","120,68,true","125,125,true","140,79,true","140,180,true","167,180,true","220,124,true","300,169,true","940,529,true"
        ];

        if(!in_array($thumb_check, $allowed_thumbs)){
            echo "Thumbnail not allowed";
        } else {

            // Set the quality of the thumbnail
            $quality = 90;

            // Load image
            switch($extension){
                case "jpg":
                    $source = imagecreatefromjpeg($path);
                    break;
                case "gif":
                    $source = imagecreatefromgif($path);
                    break;
                case "png":
                    $source = imagecreatefrompng($path);
                    break;
                default:
                    echo "Failed image extension";
            }

            // If we load the image then continue
            if($source){

                if($crop == "true" && $width_max && $height_max){

                    $test_height = $parent_height*($width_max/$parent_width);

                    if($test_height > $height_max){
                        $new_width = $width_max;
                        $new_height = $parent_height*($width_max/$parent_width);
                        $new_x = 0;
                        $new_y = -1 * (($new_height - $height_max)/2);
                    } else {
                        $new_height = $height_max;
                        $new_width = $parent_width*($height_max/$parent_height);
                        $new_x = -1 * (($new_width - $width_max)/2);
                        $new_y = 0;
                    }

                    // Create a blank image
                    $new_image = imagecreatetruecolor($width_max,$height_max);

                    // Resize or crop image
                    imagecopyresampled($new_image, $source, $new_x, $new_y, 0, 0, $new_width, $new_height, $parent_width, $parent_height);

                    // For database sizes
                    $new_width = $width_max;
                    $new_height = $height_max;

                } else {
                    // Resize for width
                    if ($width_max && ($new_width > $width_max)) {
                        $new_height = $parent_height*($width_max/$parent_width);
                        $new_width = $width_max;
                    }

                    // Adjust for height if need be
                    if ($height_max && ($new_height > $height_max)) {
                        $new_width = $parent_width*($height_max/$parent_height);
                        $new_height = $height_max;
                    }

                    // Create a blank image
                    $new_image = imagecreatetruecolor($new_width,$new_height);

                    // Resize or crop image
                    imagecopyresampled($new_image, $source, 0, 0, 0, 0, $new_width, $new_height, $parent_width, $parent_height);

                }

                // Create it
                // Probably an issue with "file_name" below
                if(imagejpeg($new_image, $parent['file_name'] . "-" . $parent['extension'] . "-" . $width_max . "-" . $height_max . "-" . $crop . ".jpg", $quality)) {
                    if($_GET['refresh'] == 'code') {
                        echo "Success";
                    } else {
                        // Output headers for an image
                        header("Content-type: image/jpeg");
                        imagejpeg($new_image, NULL, $quality);
                    }
                } else {
                    echo "Failed to move image";
                }

                // Tidy up
                imagedestroy($source);
                imagedestroy($new_image);

            } else {
                echo "Failed to load image";
            }
        }
    } else {
        echo "Failed to find image";
    }
} else {
    echo "Missing required parameters";
}
?>

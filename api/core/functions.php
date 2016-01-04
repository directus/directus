<?php

/**
 * Converts a string to title
 * @param string $text The string to convert.
 * @return string Formatted string.
 */
function uc_convert($text){
	$phrase = preg_replace('!\s+!', ' ', trim(ucwords(strtolower(str_replace('_', ' ', $text)))));
	$uc_caps        = array("Ssn", "Ein", "Nda", "Api", "Youtube", "Faq", "Iphone", "Ipad", "Ipod", "Pdf", "Pdfs", "Url", "Ip", "Ftp", "Db", "Cv", "Id", "Ph", "Php", "Html", "Js", "Css", "Ios", "Iso", "Rngr");
	$special_caps   = array("SSN", "EIN", "NDA", "API", "YouTube", "FAQ", "iPhone", "iPad", "iPod", "PDF", "PDFs", "URL", "IP", "FTP", "DB", "CV", "ID", "pH", "PHP", "HTML", "JS", "CSS", "iOS", "ISO", "RNGR");

	foreach($uc_caps as $key => $value){
		$uc_caps[$key] = ("/\b".$value."\b/");
	}

	return preg_replace($uc_caps, $special_caps, $phrase);
}

/**
 * Returns full URL to system
 * @return string URL.
 */
function get_full_url() {
	$https = !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off';
	return
		($https ? 'https://' : 'http://').
		(!empty($_SERVER['REMOTE_USER']) ? $_SERVER['REMOTE_USER'].'@' : '').
		(isset($_SERVER['HTTP_HOST']) ? $_SERVER['HTTP_HOST'] : ($_SERVER['SERVER_NAME'].
		($https && $_SERVER['SERVER_PORT'] === 443 ||
		$_SERVER['SERVER_PORT'] === 80 ? '' : ':'.$_SERVER['SERVER_PORT']))).
		substr($_SERVER['SCRIPT_NAME'],0, strrpos($_SERVER['SCRIPT_NAME'], '/'));
 }

/**
 * Get info about a file, return extensive information about images (more to come)
 * @return array File info
 */
function get_file_info($file) {
	$finfo = new finfo(FILEINFO_MIME);
	$type = explode('; charset=', $finfo->file($file));
	$info = array('type'=>$type[0], 'charset'=>$type[1]);

	$type_str = explode('/', $info['type']);

	if ($type_str[0] == 'image') {
		$size = getimagesize($file, $meta);
		$info['width'] = $size[0];
		$info['height'] = $size[1];
		if (isset($meta["APP13"])) {
			$iptc = iptcparse($meta["APP13"]);
			$info['caption'] = $iptc['2#120'][0];
			$info['title'] = $iptc['2#005'][0];
			$info['tags'] = implode($iptc['2#025'], ',');
		}
	}
return $info;
}


/**
 * Renders a single line. Looks for {{ var }}
 *
 * @param string $string
 * @param array $parameters
 *
 * @return string
 */
function template($string, array $parameters)
{
    $replacer = function ($match) use ($parameters)
    {
        return isset($parameters[$match[1]]) ? $parameters[$match[1]] : $match[0];
    };

    return preg_replace_callback('/{{\s*(.+?)\s*}}/', $replacer, $string);
}


function to_name_value($array, $keys=null) {
	$data = array();
	foreach($array as $name => $value) {
		$row = array('name'=>$name,'value'=>$value);
		if (isset($keys)) $row = array_merge($row, $keys);
		array_push($data, $row);
	}
	return $data;
}

function find($array, $key, $value) {
	foreach ($array as $item) {
		if (isset($item[$key]) && ($item[$key] == $value)) return $item;
	}
}


// http://stackoverflow.com/questions/902857/php-getting-array-type
function is_numeric_array($array) {
	return ($array == array_values($array));
}

function debug($data, $title=null) {
	echo '<div style="padding:10px;">';
	echo "<b>$title</b>";
	echo '<pre>';
	print_r($data);
	echo '</pre>';
	echo '</div>';
}


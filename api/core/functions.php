<?
/**
 * Indents a flat JSON string to make it more human-readable.
 * @param string $json The original JSON string to process.
 * @return string Indented version of the original JSON string.
 */
function format_json($json) {

	$result      = '';
	$pos         = 0;
	$strLen      = strlen($json);
	$indentStr   = '  ';
	$newLine     = "\n";
	$prevChar    = '';
	$outOfQuotes = true;

	for ($i=0; $i<=$strLen; $i++) {

		// Grab the next character in the string.
		$char = substr($json, $i, 1);

		// Are we inside a quoted string?
		if ($char == '"' && $prevChar != '\\') {
			$outOfQuotes = !$outOfQuotes;

		// If this character is the end of an element,
		// output a new line and indent the next line.
		} else if(($char == '}' || $char == ']') && $outOfQuotes) {
			$result .= $newLine;
			$pos --;
			for ($j=0; $j<$pos; $j++) {
				$result .= $indentStr;
			}
		}

		// Add the character to the result string.
		$result .= $char;

		// If the last character was the beginning of an element,
		// output a new line and indent the next line.
		if (($char == ',' || $char == '{' || $char == '[') && $outOfQuotes) {
			$result .= $newLine;
			if ($char == '{' || $char == '[') {
				$pos ++;
			}

			for ($j = 0; $j < $pos; $j++) {
				$result .= $indentStr;
			}
		}

		$prevChar = $char;
	}

	return $result;
}

/**
 * Converts a string to title
 * @param string $text The string to convert.
 * @return string Formatted string.
 */
function uc_convert($text){
	$phrase = preg_replace('!\s+!', ' ', trim(ucwords(strtolower(str_replace('_', ' ', $text)))));
	$uc_caps        = array("Faq", "Iphone", "Ipad", "Ipod", "Pdf", "Pdfs", "Url", "Ip", "Ftp", "Db", "Cv", "Id", "Ph", "Php", "Html", "Js", "Css", "Mccaddon", "Rngr");
	$special_caps   = array("FAQ", "iPhone", "iPad", "iPod", "PDF", "PDFs", "URL", "IP", "FTP", "DB", "CV", "ID", "pH", "PHP", "HTML", "JS", "CSS", "McCaddon", "RNGR");

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
 * Cast a php string to the same type as MySQL.
 */
function parse_mysql_type($string, $type = NULL) {
	$type = strtolower($type);
	switch ($type) {
		case 'blob':
		case 'mediumblob':
			return base64_encode($string);
		case 'year':
		case 'int':
		case 'long':
			return (int)$string;
		case 'tinyint':
			return (int)$string;
		case 'float':
			return (float)$string;
		case 'date':
		case 'datetime':
			return date("r", strtotime($string));
		case 'VAR_STRING':
			return $string;
	}
	// If type is not present, just cast numbers...
	if (is_numeric($string)) {
		return (float)$string;
	}
	return $string;
}

/**
 * Get either a Gravatar URL or complete image tag for a specified email address.
 *
 * @param string $email The email address
 * @param string $s Size in pixels, defaults to 80px [ 1 - 2048 ]
 * @param string $d Default imageset to use [ 404 | mm | identicon | monsterid | wavatar ]
 * @param string $r Maximum rating (inclusive) [ g | pg | r | x ]
 * @param boole $img True to return a complete IMG tag False for just the URL
 * @param array $atts Optional, additional key/value attributes to include in the IMG tag
 * @return String containing either just a URL or a complete image tag
 * @source http://gravatar.com/site/implement/images/php/
 */
function get_gravatar( $email, $s = 80, $d = 'mm', $r = 'g', $img = false, $atts = array() ) {
	$url = 'http://www.gravatar.com/avatar/';
	$url .= md5( strtolower( trim( $email ) ) );
	$url .= "?s=$s&d=$d&r=$r";
	if ( $img ) {
		$url = '<img src="' . $url . '"';
		foreach ( $atts as $key => $val )
			$url .= ' ' . $key . '="' . $val . '"';
		$url .= ' />';
	}
	return $url;
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
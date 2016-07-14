<?php

if (!function_exists('uc_convert')) {
    /**
     * Converts a string to title
     *
     * @param string $text The string to convert.
     * @return string Formatted string.
     */
    function uc_convert($text)
    {
        $phrase = preg_replace('!\s+!', ' ', trim(ucwords(strtolower(str_replace('_', ' ', $text)))));
        $specialCaps = [
            "Ids" => 'IDs',
            "Ssn" => 'SSN',
            "Ein" => 'EIN',
            "Nda" => 'NDA',
            "Api" => 'API',
            "Youtube" => 'YouTube',
            "Faq" => 'FAQ',
            "Iphone" => 'iPhone',
            "Ipad" => 'iPad',
            "Ipod" => 'iPod',
            "Pdf" => 'PDF',
            "Pdfs" => 'PDFs',
            "Url" => 'URL',
            "Ip" => 'IP',
            "Ftp" => 'FTP',
            "Db" => 'DB',
            "Cv" => 'CV',
            "Id" => 'ID',
            "Ph" => 'pH',
            "Php" => 'PHP',
            "Html" => 'HTML',
            "Js" => 'JS',
            "Css" => 'CSS',
            "Ios" => 'iOS',
            "Iso" => 'ISO',
            "Rngr" => 'RNGR'
        ];

        $searchPattern = array_keys($specialCaps);
        $replaceValues = array_values($specialCaps);
        foreach ($searchPattern as $key => $value) {
            $searchPattern[$key] = ("/\b" . $value . "\b/");
        }

        return preg_replace($searchPattern, $replaceValues, $phrase);
    }
}

if (!function_exists('get_full_url')) {
    /**
     * Returns full URL to system
     *
     * @return string URL.
     */
    function get_full_url()
    {
        $https = !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off';
        return
            ($https ? 'https://' : 'http://') .
            (!empty($_SERVER['REMOTE_USER']) ? $_SERVER['REMOTE_USER'] . '@' : '') .
            (isset($_SERVER['HTTP_HOST']) ? $_SERVER['HTTP_HOST'] : ($_SERVER['SERVER_NAME'] .
                ($https && $_SERVER['SERVER_PORT'] === 443 ||
                $_SERVER['SERVER_PORT'] === 80 ? '' : ':' . $_SERVER['SERVER_PORT']))) .
            substr($_SERVER['SCRIPT_NAME'], 0, strrpos($_SERVER['SCRIPT_NAME'], '/'));
    }
}

if (!function_exists(' get_file_info')) {
    /**
     * Get info about a file, return extensive information about images (more to come)
     *
     * @return array File info
     */
    function get_file_info($file)
    {
        $finfo = new finfo(FILEINFO_MIME);
        $type = explode('; charset=', $finfo->file($file));
        $info = array('type' => $type[0], 'charset' => $type[1]);

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
}

if (!function_exists('template')) {
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
        $replacer = function ($match) use ($parameters) {
            return isset($parameters[$match[1]]) ? $parameters[$match[1]] : $match[0];
        };

        return preg_replace_callback('/{{\s*(.+?)\s*}}/', $replacer, $string);
    }
}

if (!function_exists('to_name_value')) {
    function to_name_value($array, $keys = null)
    {
        $data = array();
        foreach ($array as $name => $value) {
            $row = array('name' => $name, 'value' => $value);
            if (isset($keys)) $row = array_merge($row, $keys);
            array_push($data, $row);
        }

        return $data;
    }
}

if (!function_exists('find')) {
    function find($array, $key, $value)
    {
        foreach ($array as $item) {
            if (isset($item[$key]) && ($item[$key] == $value)) return $item;
        }
    }
}

if (!function_exists('is_numeric_array')) {
    // http://stackoverflow.com/questions/902857/php-getting-array-type
    function is_numeric_array($array)
    {
        return ($array == array_values($array));
    }
}

if (!function_exists('debug')) {
    function debug($data, $title = null)
    {
        echo '<div style="padding:10px;">';
        echo "<b>$title</b>";
        echo '<pre>';
        print_r($data);
        echo '</pre>';
        echo '</div>';
    }
}

if (!function_exists('load_registered_hooks')) {
    function load_registered_hooks($listeners, $areFilters = false)
    {
        foreach ($listeners as $event => $handlers) {
            if (!is_array($handlers)) {
                $handlers = [$handlers];
            }

            foreach ($handlers as $handler) {
                if (!$areFilters) {
                    \Directus\Hook\Hook::addListener($event, $handler);
                } else {
                    \Directus\Hook\Hook::addFilter($event, $handler);
                }
            }
        }
    }
}

if (!function_exists('get_user_timezone')) {
    function get_user_timezone() {
        return date_default_timezone_get();
    }
}

if (!function_exists('get_user_locale')) {
    function get_user_locale() {
        $locale = $defaultLocale = 'en';

        if (isset($_SESSION['install_locale'])) {
            $locale = $_SESSION['install_locale'];
        } elseif (get_auth_locale()) {
            $locale = get_auth_locale();
        } elseif (get_default_locale()) {
            $locale = get_default_locale();
        }

        if (!is_locale_available($locale)) {
            $locale = $defaultLocale;
        }

        return $locale;
    }
}

if (!function_exists('get_default_locale')) {
    function get_default_locale()
    {
        // if there's not config files created
        if (!defined('BASE_PATH') || !defined('APPLICATION_PATH')) {
            return null;
        }

        $config = \Directus\Bootstrap::get('config');

        return isset($config['default_language']) ? $config['default_language'] : null;
    }
}

if (!function_exists('get_auth_locale')) {
    function get_auth_locale() {
        // if there's not config files created
        if (!defined('BASE_PATH') || !defined('APPLICATION_PATH')) {
            return null;
        }

        if (!Directus\Auth\Provider::loggedIn()) {
            return null;
        }

        $userInfo = \Directus\Auth\Provider::getUserRecord();

        return isset($userInfo['language']) ? $userInfo['language'] : null;
    }
}

if (!function_exists('get_locales_available')) {
    function get_locales_available() {
        $languagesManager = \Directus\Bootstrap::get('languagesManager');

        return $languagesManager->getLanguagesAvailable();
    }
}

if (!function_exists('is_locale_available')) {
    function is_locale_available($locale) {
        $languagesManager = \Directus\Bootstrap::get('languagesManager');

        return $languagesManager->isLanguageAvailable($locale);
    }
}

if (!function_exists('get_default_phrases')) {
    function get_default_phrases() {
        $phrasesPath = BASE_PATH.'/api/locales/en.json';

        return json_decode(file_get_contents($phrasesPath), true);
    }
}

if (!function_exists('get_phrases')) {
    function get_phrases($locale = 'en') {
        $defaultPhrases = get_default_phrases();
        $langFile = BASE_PATH.'/api/locales/'.$locale.'.json';

        $phrases = [];
        if (file_exists($langFile)) {
            $phrases = json_decode(file_get_contents($langFile), true);
        }

        return is_array($phrases) ? array_merge($defaultPhrases, $phrases) : $defaultPhrases;
    }
}

if (!function_exists('__t')) {
    function __t($key, $data = [])
    {
        static $phrases;

        if (!$phrases) {
            $phrases = get_phrases(get_user_locale());
        }

        $phrase = isset($phrases[$key]) ? $phrases[$key] : $key;
        $phrase = \Directus\Util\StringUtils::replacePlaceholder($phrase, $data, \Directus\Util\StringUtils::PLACEHOLDER_PERCENTAGE_MUSTACHE);

        return $phrase;
    }
}

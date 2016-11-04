<?php

namespace Directus\View;

use Directus\Bootstrap;

/**
 * @todo  Could be implemented as middleware.
 */
class JsonView
{

    /**
     * @var callable
     */
    public static $preDispatch;

    /**
     * Pass a closure to this function in order to modify the output data
     * before it is json_encoded and sent to the client. The callable should
     * accept an array parameter, and return the modified array.
     * @param  callable $callable
     * @return null
     */
    public static function preDispatch($callable)
    {
        if (!is_callable($callable)) {
            throw new \InvalidArgumentException(__t('predispatch_callable_must_be_callable'));
        }
        self::$preDispatch = $callable;
    }

    /**
     * @param  array|\JsonSerializable $responseData The new API layer's response.
     * @param  array $responseDataComparison The old API layer's response
     * @return null
     * @todo only format JSON for non-prod environments when DIRECTUS_ENV
     * is available
     */
    public static function render($responseData, $responseDataComparison = null)
    {
        if (!is_array($responseData) && !$responseData instanceof \JsonSerializable) {
            $message = sprintf('JsonView::render - ResponseData must be of the type array or JsonSerializable, %s given', [
                gettype($responseData)
            ]);
            throw new \InvalidArgumentException($message);
        }

        if (!is_null(self::$preDispatch)) {
            $preDispatch = self::$preDispatch;
            $responseData = $preDispatch($responseData);
        }
        $responseData = json_encode($responseData);
        if ('production' !== DIRECTUS_ENV) { // e.g. 'production' !== DIRECTUS_ENV
            //$responseData = self::format_json($responseData);
            //$responseData .= "\n";
        }

        /**
         * TRANSITIONAL - Do comparison between two possible responses, the old
         * DB layer response data and the new.
         */
        if (!is_null($responseDataComparison)) {
            self::compareApiResponses($responseData, $responseDataComparison);
        }

        echo $responseData;
    }

    public static function compareApiResponses($new, $old)
    {
        $id = time();
        $old = self::format_json(json_encode($old));
        $log = Bootstrap::get('app')->getLog();
        $uri = $_SERVER['REQUEST_URI'];
        if (0 === strcmp($new, $old))
            return $log->info('The response comparison matched. [' . $uri . ']');
        $log->warn('The response comparison failed. [' . $uri . ']');
        // Output path
        $fname_prefix = 'cmp_' . $id;
        $dir = APPLICATION_PATH . '/docs/api-responses';
        if (!is_dir($dir)) {
            $log->fatal('Can\'t write API responses to output directory: ' . $dir);
            return;
        }
        // Write API responses to disk
        foreach (['new', 'old'] as $version) {
            $fname = $fname_prefix . '_' . $version . '.json';
            $fpath = $dir . '/' . $fname;
            $fp = fopen($fpath, 'w+');
            fwrite($fp, $$version);
            fclose($fp);
            $log->info('Wrote $version API response version to ' . $fpath);
        }
    }

    /**
     * Indents a flat JSON string to make it more human-readable.
     * @param string $json The original JSON string to process.
     * @return string Indented version of the original JSON string.
     */
    public static function format_json($json)
    {

        $result = '';
        $pos = 0;
        $strLen = strlen($json);
        $indentStr = '  ';
        $newLine = "\n";
        $prevChar = '';
        $outOfQuotes = true;

        for ($i = 0; $i <= $strLen; $i++) {

            // Grab the next character in the string.
            $char = substr($json, $i, 1);

            // Are we inside a quoted string?
            if ($char == '"' && $prevChar != '\\') {
                $outOfQuotes = !$outOfQuotes;

                // If this character is the end of an element,
                // output a new line and indent the next line.
            } else if (($char == '}' || $char == ']') && $outOfQuotes) {
                $result .= $newLine;
                $pos--;
                for ($j = 0; $j < $pos; $j++) {
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
                    $pos++;
                }

                for ($j = 0; $j < $pos; $j++) {
                    $result .= $indentStr;
                }
            }

            $prevChar = $char;
        }

        return $result;
    }

}

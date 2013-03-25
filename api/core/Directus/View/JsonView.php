<?php

namespace Directus\View;

class JsonView {

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
    public static function preDispatch($callable) {
        if (!is_callable($callable)) {
            throw new \InvalidArgumentException('PreDispatch callable must be callable');
        }
        self::$preDispatch = $callable;
    }

    /**
     * @todo only format JSON for non-prod environments when DIRECTUS_ENV
     * is available
     */
    public static function render(array $params) {
        $responseData = $params;
        if(!is_null(self::$preDispatch))
            $responseData = self::$preDispatch($responseData);
        $responseData = json_encode($responseData);
        if(true) // e.g. 'production' !== DIRECTUS_ENV
            $responseData = self::format_json($responseData);
        echo $responseData;
    }

    /**
     * Indents a flat JSON string to make it more human-readable.
     * @param string $json The original JSON string to process.
     * @return string Indented version of the original JSON string.
     */
    public static function format_json($json) {

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

}
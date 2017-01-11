<?php
/**
 * Zend Framework (http://framework.zend.com/)
 *
 * @link      http://github.com/zendframework/zf2 for the canonical source repository
 * @copyright Copyright (c) 2005-2015 Zend Technologies USA Inc. (http://www.zend.com)
 * @license   http://framework.zend.com/license/new-bsd New BSD License
 */

namespace Zend\Stdlib\StringWrapper;

use Zend\Stdlib\Exception;

class Intl extends AbstractStringWrapper
{
    /**
     * List of supported character sets (upper case)
     *
     * @var string[]
     */
    protected static $encodings = ['UTF-8'];

    /**
     * Get a list of supported character encodings
     *
     * @return string[]
     */
    public static function getSupportedEncodings()
    {
        return static::$encodings;
    }

    /**
     * Constructor
     *
     * @throws Exception\ExtensionNotLoadedException
     */
    public function __construct()
    {
        if (!extension_loaded('intl')) {
            throw new Exception\ExtensionNotLoadedException(
                'PHP extension "intl" is required for this wrapper'
            );
        }
    }

    /**
     * Returns the length of the given string
     *
     * @param string $str
     * @return int|false
     */
    public function strlen($str)
    {
        return grapheme_strlen($str);
    }

    /**
     * Returns the portion of string specified by the start and length parameters
     *
     * @param string   $str
     * @param int      $offset
     * @param int|null $length
     * @return string|false
     */
    public function substr($str, $offset = 0, $length = null)
    {
        // Due fix of PHP #62759 The third argument returns an empty string if is 0 or null.
        if ($length !== null) {
            return grapheme_substr($str, $offset, $length);
        }

        return grapheme_substr($str, $offset);
    }

    /**
     * Find the position of the first occurrence of a substring in a string
     *
     * @param string $haystack
     * @param string $needle
     * @param int    $offset
     * @return int|false
     */
    public function strpos($haystack, $needle, $offset = 0)
    {
        return grapheme_strpos($haystack, $needle, $offset);
    }
}

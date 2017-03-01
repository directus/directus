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
use Zend\Stdlib\StringUtils;

class Native extends AbstractStringWrapper
{
    /**
     * The character encoding working on
     * (overwritten to change defaut encoding)
     *
     * @var string
     */
    protected $encoding = 'ASCII';

    /**
     * Check if the given character encoding is supported by this wrapper
     * and the character encoding to convert to is also supported.
     *
     * @param  string      $encoding
     * @param  string|null $convertEncoding
     * @return bool
     */
    public static function isSupported($encoding, $convertEncoding = null)
    {
        $encodingUpper      = strtoupper($encoding);
        $supportedEncodings = static::getSupportedEncodings();

        if (!in_array($encodingUpper, $supportedEncodings)) {
            return false;
        }

        // This adapter doesn't support to convert between encodings
        if ($convertEncoding !== null && $encodingUpper !== strtoupper($convertEncoding)) {
            return false;
        }

        return true;
    }

    /**
     * Get a list of supported character encodings
     *
     * @return string[]
     */
    public static function getSupportedEncodings()
    {
        return StringUtils::getSingleByteEncodings();
    }

    /**
     * Set character encoding working with and convert to
     *
     * @param string      $encoding         The character encoding to work with
     * @param string|null $convertEncoding  The character encoding to convert to
     * @return StringWrapperInterface
     */
    public function setEncoding($encoding, $convertEncoding = null)
    {
        $supportedEncodings = static::getSupportedEncodings();

        $encodingUpper = strtoupper($encoding);
        if (!in_array($encodingUpper, $supportedEncodings)) {
            throw new Exception\InvalidArgumentException(
                'Wrapper doesn\'t support character encoding "' . $encoding . '"'
            );
        }

        if ($encodingUpper !== strtoupper($convertEncoding)) {
            $this->convertEncoding = $encodingUpper;
        }

        if ($convertEncoding !== null) {
            if ($encodingUpper !== strtoupper($convertEncoding)) {
                throw new Exception\InvalidArgumentException(
                    'Wrapper doesn\'t support to convert between character encodings'
                );
            }

            $this->convertEncoding = $encodingUpper;
        } else {
            $this->convertEncoding = null;
        }
        $this->encoding = $encodingUpper;

        return $this;
    }

    /**
     * Returns the length of the given string
     *
     * @param string $str
     * @return int|false
     */
    public function strlen($str)
    {
        return strlen($str);
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
        return substr($str, $offset, $length);
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
        return strpos($haystack, $needle, $offset);
    }
}

<?php
/**
 * Slim - a micro PHP 5 framework
 *
 * @author      Josh Lockhart <info@slimframework.com>
 * @copyright   2011 Josh Lockhart
 * @link        http://www.slimframework.com
 * @license     http://www.slimframework.com/license
 * @version     2.2.0
 * @package     Slim
 *
 * MIT LICENSE
 *
 * Permission is hereby granted, free of charge, to any person obtaining
 * a copy of this software and associated documentation files (the
 * "Software"), to deal in the Software without restriction, including
 * without limitation the rights to use, copy, modify, merge, publish,
 * distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to
 * the following conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
 * LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
 * OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
 * WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */
namespace Slim;

/**
 * Log
 *
 * This is the primary logger for a Slim application. You may provide
 * a Log Writer in conjunction with this Log to write to various output
 * destinations (e.g. a file). This class provides this interface:
 *
 * debug( mixed $object )
 * info( mixed $object )
 * warn( mixed $object )
 * error( mixed $object )
 * fatal( mixed $object )
 *
 * This class assumes only that your Log Writer has a public `write()` method
 * that accepts any object as its one and only argument. The Log Writer
 * class may write or send its argument anywhere: a file, STDERR,
 * a remote web API, etc. The possibilities are endless.
 *
 * @package Slim
 * @author  Josh Lockhart
 * @since   1.0.0
 */
class Log
{
    const FATAL = 0;
    const ERROR = 1;
    const WARN = 2;
    const INFO = 3;
    const DEBUG = 4;

    /**
     * @var array
     */
    protected static $levels = array(
        self::FATAL => 'FATAL',
        self::ERROR => 'ERROR',
        self::WARN =>  'WARN',
        self::INFO =>  'INFO',
        self::DEBUG => 'DEBUG'
    );

    /**
     * @var mixed
     */
    protected $writer;

    /**
     * @var bool
     */
    protected $enabled;

    /**
     * @var int
     */
    protected $level;

    /**
     * Constructor
     * @param  mixed $writer
     */
    public function __construct($writer)
    {
        $this->writer = $writer;
        $this->enabled = true;
        $this->level = self::DEBUG;
    }

    /**
     * Is logging enabled?
     * @return bool
     */
    public function getEnabled()
    {
        return $this->enabled;
    }

    /**
     * Enable or disable logging
     * @param  bool $enabled
     */
    public function setEnabled($enabled)
    {
        if ($enabled) {
            $this->enabled = true;
        } else {
            $this->enabled = false;
        }
    }

    /**
     * Set level
     * @param  int                          $level
     * @throws \InvalidArgumentException    If invalid log level specified
     */
    public function setLevel($level)
    {
        if (!isset(self::$levels[$level])) {
            throw new \InvalidArgumentException('Invalid log level');
        }
        $this->level = $level;
    }

    /**
     * Get level
     * @return int
     */
    public function getLevel()
    {
        return $this->level;
    }

    /**
     * Set writer
     * @param  mixed $writer
     */
    public function setWriter($writer)
    {
        $this->writer = $writer;
    }

    /**
     * Get writer
     * @return mixed
     */
    public function getWriter()
    {
        return $this->writer;
    }

    /**
     * Is logging enabled?
     * @return bool
     */
    public function isEnabled()
    {
        return $this->enabled;
    }

    /**
     * Log debug message
     * @param  mixed       $object
     * @return mixed|false What the Logger returns, or false if Logger not set or not enabled
     */
    public function debug($object)
    {
        return $this->write($object, self::DEBUG);
    }

    /**
     * Log info message
     * @param  mixed       $object
     * @return mixed|false What the Logger returns, or false if Logger not set or not enabled
     */
    public function info($object)
    {
        return $this->write($object, self::INFO);
    }

    /**
     * Log warn message
     * @param  mixed       $object
     * @return mixed|false What the Logger returns, or false if Logger not set or not enabled
     */
    public function warn($object)
    {
        return $this->write($object, self::WARN);
    }

    /**
     * Log error message
     * @param  mixed       $object
     * @return mixed|false What the Logger returns, or false if Logger not set or not enabled
     */
    public function error($object)
    {
        return $this->write($object, self::ERROR);
    }

    /**
     * Log fatal message
     * @param  mixed       $object
     * @return mixed|false What the Logger returns, or false if Logger not set or not enabled
     */
    public function fatal($object)
    {
        return $this->write($object, self::FATAL);
    }

    /**
     * Log message
     * @param   mixed   The object to log
     * @param   int     The message level
     * @return int|false
     */
    protected function write($object, $level)
    {
        if ($this->enabled && $this->writer && $level <= $this->level) {
            return $this->writer->write($object, $level);
        } else {
            return false;
        }
    }
}

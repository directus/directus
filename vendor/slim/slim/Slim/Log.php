<?php
/**
 * Slim - a micro PHP 5 framework
 *
 * @author      Josh Lockhart <info@slimframework.com>
 * @copyright   2011 Josh Lockhart
 * @link        http://www.slimframework.com
 * @license     http://www.slimframework.com/license
 * @version     2.6.1
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
 * debug( mixed $object, array $context )
 * info( mixed $object, array $context )
 * notice( mixed $object, array $context )
 * warning( mixed $object, array $context )
 * error( mixed $object, array $context )
 * critical( mixed $object, array $context )
 * alert( mixed $object, array $context )
 * emergency( mixed $object, array $context )
 * log( mixed $level, mixed $object, array $context )
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
    const EMERGENCY = 1;
    const ALERT     = 2;
    const CRITICAL  = 3;
    const FATAL     = 3; //DEPRECATED replace with CRITICAL
    const ERROR     = 4;
    const WARN      = 5;
    const NOTICE    = 6;
    const INFO      = 7;
    const DEBUG     = 8;

    /**
     * @var array
     */
    protected static $levels = array(
        self::EMERGENCY => 'EMERGENCY',
        self::ALERT     => 'ALERT',
        self::CRITICAL  => 'CRITICAL',
        self::ERROR     => 'ERROR',
        self::WARN      => 'WARNING',
        self::NOTICE    => 'NOTICE',
        self::INFO      => 'INFO',
        self::DEBUG     => 'DEBUG'
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
     * @param  array       $context
     * @return mixed|bool What the Logger returns, or false if Logger not set or not enabled
     */
    public function debug($object, $context = array())
    {
        return $this->log(self::DEBUG, $object, $context);
    }

    /**
     * Log info message
     * @param  mixed       $object
     * @param  array       $context
     * @return mixed|bool What the Logger returns, or false if Logger not set or not enabled
     */
    public function info($object, $context = array())
    {
        return $this->log(self::INFO, $object, $context);
    }

    /**
     * Log notice message
     * @param  mixed       $object
     * @param  array       $context
     * @return mixed|bool What the Logger returns, or false if Logger not set or not enabled
     */
    public function notice($object, $context = array())
    {
        return $this->log(self::NOTICE, $object, $context);
    }

    /**
     * Log warning message
     * @param  mixed       $object
     * @param  array       $context
     * @return mixed|bool What the Logger returns, or false if Logger not set or not enabled
     */
    public function warning($object, $context = array())
    {
        return $this->log(self::WARN, $object, $context);
    }

    /**
     * DEPRECATED for function warning
     * Log warning message
     * @param  mixed       $object
     * @param  array       $context
     * @return mixed|bool What the Logger returns, or false if Logger not set or not enabled
     */
    public function warn($object, $context = array())
    {
        return $this->log(self::WARN, $object, $context);
    }

    /**
     * Log error message
     * @param  mixed       $object
     * @param  array       $context
     * @return mixed|bool What the Logger returns, or false if Logger not set or not enabled
     */
    public function error($object, $context = array())
    {
        return $this->log(self::ERROR, $object, $context);
    }

    /**
     * Log critical message
     * @param  mixed       $object
     * @param  array       $context
     * @return mixed|bool What the Logger returns, or false if Logger not set or not enabled
     */
    public function critical($object, $context = array())
    {
        return $this->log(self::CRITICAL, $object, $context);
    }

    /**
     * DEPRECATED for function critical
     * Log fatal message
     * @param  mixed       $object
     * @param  array       $context
     * @return mixed|bool What the Logger returns, or false if Logger not set or not enabled
     */
    public function fatal($object, $context = array())
    {
        return $this->log(self::CRITICAL, $object, $context);
    }

    /**
     * Log alert message
     * @param  mixed       $object
     * @param  array       $context
     * @return mixed|bool What the Logger returns, or false if Logger not set or not enabled
     */
    public function alert($object, $context = array())
    {
        return $this->log(self::ALERT, $object, $context);
    }

    /**
     * Log emergency message
     * @param  mixed       $object
     * @param  array       $context
     * @return mixed|bool What the Logger returns, or false if Logger not set or not enabled
     */
    public function emergency($object, $context = array())
    {
        return $this->log(self::EMERGENCY, $object, $context);
    }

    /**
     * Log message
     * @param  mixed       $level
     * @param  mixed       $object
     * @param  array       $context
     * @return mixed|bool What the Logger returns, or false if Logger not set or not enabled
     * @throws \InvalidArgumentException If invalid log level
     */
    public function log($level, $object, $context = array())
    {
        if (!isset(self::$levels[$level])) {
            throw new \InvalidArgumentException('Invalid log level supplied to function');
        } else if ($this->enabled && $this->writer && $level <= $this->level) {
            if (is_array($object) || (is_object($object) && !method_exists($object, "__toString"))) {
                $message = print_r($object, true);
            } else {
                $message = (string) $object;
            }

            if (count($context) > 0) {
                if (isset($context['exception']) && $context['exception'] instanceof \Exception) {
                    $message .= ' - ' . $context['exception'];
                    unset($context['exception']);
                }
                $message = $this->interpolate($message, $context);
            }
            return $this->writer->write($message, $level);
        } else {
            return false;
        }
    }

    /**
     * DEPRECATED for function log
     * Log message
     * @param   mixed    $object The object to log
     * @param   int      $level  The message level
     * @return  int|bool
     */
    protected function write($object, $level)
    {
        return $this->log($level, $object);
    }

    /**
     * Interpolate log message
     * @param  mixed     $message               The log message
     * @param  array     $context               An array of placeholder values
     * @return string    The processed string
     */
    protected function interpolate($message, $context = array())
    {
        $replace = array();
        foreach ($context as $key => $value) {
            $replace['{' . $key . '}'] = $value;
        }
        return strtr($message, $replace);
    }
}

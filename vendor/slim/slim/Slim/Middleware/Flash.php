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
namespace Slim\Middleware;

 /**
  * Flash
  *
  * This is middleware for a Slim application that enables
  * Flash messaging between HTTP requests. This allows you
  * set Flash messages for the current request, for the next request,
  * or to retain messages from the previous request through to
  * the next request.
  *
  * @package    Slim
  * @author     Josh Lockhart
  * @since      1.6.0
  */
class Flash extends \Slim\Middleware implements \ArrayAccess, \IteratorAggregate
{
    /**
     * @var array
     */
    protected $settings;

    /**
     * @var array
     */
    protected $messages;

    /**
     * Constructor
     * @param  array  $settings
     */
    public function __construct($settings = array())
    {
        $this->settings = array_merge(array('key' => 'slim.flash'), $settings);
        $this->messages = array(
            'prev' => array(), //flash messages from prev request (loaded when middleware called)
            'next' => array(), //flash messages for next request
            'now' => array() //flash messages for current request
        );
    }

    /**
     * Call
     */
    public function call()
    {
        //Read flash messaging from previous request if available
        $this->loadMessages();

        //Prepare flash messaging for current request
        $env = $this->app->environment();
        $env['slim.flash'] = $this;
        $this->next->call();
        $this->save();
    }

    /**
     * Now
     *
     * Specify a flash message for a given key to be shown for the current request
     *
     * @param  string $key
     * @param  string $value
     */
    public function now($key, $value)
    {
        $this->messages['now'][(string) $key] = $value;
    }

    /**
     * Set
     *
     * Specify a flash message for a given key to be shown for the next request
     *
     * @param  string $key
     * @param  string $value
     */
    public function set($key, $value)
    {
        $this->messages['next'][(string) $key] = $value;
    }

    /**
     * Keep
     *
     * Retain flash messages from the previous request for the next request
     */
    public function keep()
    {
        foreach ($this->messages['prev'] as $key => $val) {
            $this->messages['next'][$key] = $val;
        }
    }

    /**
     * Save
     */
    public function save()
    {
        $_SESSION[$this->settings['key']] = $this->messages['next'];
    }

    /**
     * Load messages from previous request if available
     */
    public function loadMessages()
    {
        if (isset($_SESSION[$this->settings['key']])) {
            $this->messages['prev'] = $_SESSION[$this->settings['key']];
        }
    }

    /**
     * Return array of flash messages to be shown for the current request
     *
     * @return array
     */
    public function getMessages()
    {
        return array_merge($this->messages['prev'], $this->messages['now']);
    }

    /**
     * Array Access: Offset Exists
     */
    public function offsetExists($offset)
    {
        $messages = $this->getMessages();

        return isset($messages[$offset]);
    }

    /**
     * Array Access: Offset Get
     */
    public function offsetGet($offset)
    {
        $messages = $this->getMessages();

        return isset($messages[$offset]) ? $messages[$offset] : null;
    }

    /**
     * Array Access: Offset Set
     */
    public function offsetSet($offset, $value)
    {
        $this->now($offset, $value);
    }

    /**
     * Array Access: Offset Unset
     */
    public function offsetUnset($offset)
    {
        unset($this->messages['prev'][$offset], $this->messages['now'][$offset]);
    }

    /**
     * Iterator Aggregate: Get Iterator
     * @return \ArrayIterator
     */
    public function getIterator()
    {
        $messages = $this->getMessages();

        return new \ArrayIterator($messages);
    }
}

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
namespace Slim\Http;

 /**
  * HTTP Headers
  *
  * This class is an abstraction of the HTTP response headers and
  * provides array access to the header list while automatically
  * stores and retrieves headers with lowercase canonical keys regardless
  * of the input format.
  *
  * This class also implements the `Iterator` and `Countable`
  * interfaces for even more convenient usage.
  *
  * @package Slim
  * @author  Josh Lockhart
  * @since   1.6.0
  */
class Headers implements \ArrayAccess, \Iterator, \Countable
{
    /**
     * @var array HTTP headers
     */
    protected $headers;

    /**
     * @var array Map canonical header name to original header name
     */
    protected $map;

    /**
     * Constructor
     * @param  array $headers
     */
    public function __construct($headers = array())
    {
        $this->merge($headers);
    }

    /**
     * Merge Headers
     * @param  array $headers
     */
    public function merge($headers)
    {
        foreach ($headers as $name => $value) {
            $this[$name] = $value;
        }
    }

    /**
     * Transform header name into canonical form
     * @param  string $name
     * @return string
     */
    protected function canonical($name)
    {
        return strtolower(trim($name));
    }

    /**
     * Array Access: Offset Exists
     */
    public function offsetExists($offset)
    {
        return isset($this->headers[$this->canonical($offset)]);
    }

    /**
     * Array Access: Offset Get
     */
    public function offsetGet($offset)
    {
        $canonical = $this->canonical($offset);
        if (isset($this->headers[$canonical])) {
            return $this->headers[$canonical];
        } else {
            return null;
        }
    }

    /**
     * Array Access: Offset Set
     */
    public function offsetSet($offset, $value)
    {
        $canonical = $this->canonical($offset);
        $this->headers[$canonical] = $value;
        $this->map[$canonical] = $offset;
    }

    /**
     * Array Access: Offset Unset
     */
    public function offsetUnset($offset)
    {
        $canonical = $this->canonical($offset);
        unset($this->headers[$canonical], $this->map[$canonical]);
    }

    /**
     * Countable: Count
     */
    public function count()
    {
        return count($this->headers);
    }

    /**
     * Iterator: Rewind
     */
    public function rewind()
    {
        reset($this->headers);
    }

    /**
     * Iterator: Current
     */
    public function current()
    {
        return current($this->headers);
    }

    /**
     * Iterator: Key
     */
    public function key()
    {
        $key = key($this->headers);

        return $this->map[$key];
    }

    /**
     * Iterator: Next
     */
    public function next()
    {
        return next($this->headers);
    }

    /**
     * Iterator: Valid
     */
    public function valid()
    {
        return current($this->headers) !== false;
    }
}

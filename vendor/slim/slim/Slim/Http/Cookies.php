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
namespace Slim\Http;

class Cookies extends \Slim\Helper\Set
{
    /**
     * Default cookie settings
     * @var array
     */
    protected $defaults = array(
        'value' => '',
        'domain' => null,
        'path' => null,
        'expires' => null,
        'secure' => false,
        'httponly' => false
    );

    /**
     * Set cookie
     *
     * The second argument may be a single scalar value, in which case
     * it will be merged with the default settings and considered the `value`
     * of the merged result.
     *
     * The second argument may also be an array containing any or all of
     * the keys shown in the default settings above. This array will be
     * merged with the defaults shown above.
     *
     * @param string $key   Cookie name
     * @param mixed  $value Cookie settings
     */
    public function set($key, $value)
    {
        if (is_array($value)) {
            $cookieSettings = array_replace($this->defaults, $value);
        } else {
            $cookieSettings = array_replace($this->defaults, array('value' => $value));
        }
        parent::set($key, $cookieSettings);
    }

    /**
     * Remove cookie
     *
     * Unlike \Slim\Helper\Set, this will actually *set* a cookie with
     * an expiration date in the past. This expiration date will force
     * the client-side cache to remove its cookie with the given name
     * and settings.
     *
     * @param  string $key      Cookie name
     * @param  array  $settings Optional cookie settings
     */
    public function remove($key, $settings = array())
    {
        $settings['value'] = '';
        $settings['expires'] = time() - 86400;
        $this->set($key, array_replace($this->defaults, $settings));
    }
}

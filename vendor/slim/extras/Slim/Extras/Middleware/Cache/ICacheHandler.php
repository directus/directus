<?php
/**
 * Cache Handler Interface
 *
 * Implement this interface to create your own cache handler.
 *
 * @author Timothy Boronczyk
 * @version 1.0
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
namespace Slim\Extras\Middleware\Cache;

Interface ICacheHandler
{
    /**
     * Retrieve content from cache.
     * Looks up content in the cache for the given key and returns either
     * an array with the content or false if the content is not found.
     * 
     * @param string $key the cache key
     * @return array|false array with the elements content_type and body on
     *  success, false if content not found
     */
    public function fetch($key);

    /**
     * Store content in the cache.
     * Persists content in the cache storeage for later lookup.
     *
     * @param string $key the cache key
     * @param string $contenType the content's Content-Type
     * @param string $body the content
     */
    public function save($key, $contentType, $body);
}

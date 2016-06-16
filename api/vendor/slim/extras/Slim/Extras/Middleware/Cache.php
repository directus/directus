<?php
/**
 * Cache
 *
 * Use this middleware with your Slim Framework application
 * for basic caching abilities
 *
 * @author Timothy Boronczyk
 * @version 1.0
 *
 * USAGE
 *
 * use \Slim\Slim;
 * use \Slim\Extras\Middleware\Cache;
 * use \Slim\Extras\Middleware\Cache\PDOCacheHandler;
 *
 * $db = ...
 * $app = new Slim();
 * $handler = new PDOCacheHandler($db);
 * $app->add(new Cache($handler));
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
namespace Slim\Extras\Middleware;
use \Slim\Extras\Middleware\Cache\ICacheHandler;

class Cache extends \Slim\Middleware
{
    protected $handler;

    public function __construct(ICacheHandler $handler)
    {
        $this->handler = $handler;
    }

    public function call()
    {
        $req     = $this->app->request();
        $resp    = $this->app->response();
        $handler = $this->handler;

        $key = $req->getResourceUri();
        $data = $handler->fetch($key);
        if ($data) {
            $resp['Content-Type'] = $data['content_type'];
            $resp->body($data['body']);
            return;
        }

        $this->next->call();

        if ($resp->status() == 200) {
            $handler->save($key, $resp['Content-Type'], $resp->body());
        }
    }
}

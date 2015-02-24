<?php
/**
 * HTTP Digest Authentication
 *
 * Use this middleware with your Slim Framework application
 * to require HTTP digest auth for all routes.
 *
 * Much of this code was created using <http://php.net/manual/en/features.http-auth.php>
 * as a reference. I do not claim ownership or copyright on this code. This
 * derivative class is provided under the MIT public license.
 *
 * @author Josh Lockhart <info@slimframework.com>
 * @author Samer Bechara <sam@thoughtengineer.com>
 * @version 1.0
 *
 * USAGE
 *
 * $app = new \Slim\Slim();
 * $app->add(new \Slim\Extras\Middleware\HttpDigestAuth(array('user1' => 'password1', 'user2' => 'password2')));
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

class HttpDigestAuth extends \Slim\Middleware {
    /**
     * @var array
     */
    protected $credentials;

    /**
     * @var string
     */
    protected $realm;

    /**
     * Constructor
     *
     * @param   array	$credentials	An array of usernames and passwords
     * @param   string  $realm      The HTTP Authentication realm
     * @return  void
     */
    public function __construct( $credentials, $realm = 'Protected Area' ) {
        

        $this->credentials = $credentials;
        $this->realm = $realm;
    }

    /**
     * Call
     *
     * This method will check the HTTP request headers for previous authentication. If
     * the request has already authenticated, the next middleware is called. Otherwise,
     * a 401 Authentication Required response is returned to the client.
     *
     * @return void
     */
    public function call() {
        //Check header and header username
        if ( empty($_SERVER['PHP_AUTH_DIGEST']) ) {
            $this->fail();
            return;
        } else {
            $data = $this->parseHttpDigest($_SERVER['PHP_AUTH_DIGEST']);
            if ( !$data || !array_key_exists($data['username'], $this->credentials) ) {
                $this->fail();
                return;
            }
        }

        //Check header response
        $A1 = md5($data['username'] . ':' . $this->realm . ':' . $this->credentials[$data['username']]);
        $A2 = md5($_SERVER['REQUEST_METHOD'] . ':' . $data['uri']);
        $validResponse = md5($A1 . ':' . $data['nonce'] . ':' . $data['nc'] . ':' . $data['cnonce'] . ':' . $data['qop'] . ':' . $A2);
        if ( $data['response'] !== $validResponse ) {
            $this->fail();
            return;
        }

        //By this point the request is authenticated
        $this->next->call();
    }

    /**
     * Require Authentication from HTTP Client
     *
     * @return void
     */
    protected function fail() {
        $this->app->response()->status(401);
        $this->app->response()->header('WWW-Authenticate', sprintf('Digest realm="%s",qop="auth",nonce="%s",opaque="%s"', $this->realm, uniqid(), md5($this->realm)));
    }

    /**
     * Parse HTTP Digest Authentication header
     *
     * @return array|false
     */
    protected function parseHttpDigest( $headerValue ) {
        $needed_parts = array('nonce' => 1, 'nc' => 1, 'cnonce' => 1, 'qop' => 1, 'username' => 1, 'uri' => 1, 'response' => 1);
        $data = array();
        $keys = implode('|', array_keys($needed_parts));
        preg_match_all('@(' . $keys . ')=(?:([\'"])([^\2]+?)\2|([^\s,]+))@', $headerValue, $matches, PREG_SET_ORDER);
        foreach ( $matches as $m ) {
            $data[$m[1]] = $m[3] ? $m[3] : $m[4];
            unset($needed_parts[$m[1]]);
        }
        return $needed_parts ? false : $data;
    }
}
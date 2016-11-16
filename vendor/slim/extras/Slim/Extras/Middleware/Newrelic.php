<?php
/**
 * Newrelic integration
 *
 * Use this middleware with your Slim Framework application
 * to track your transactions with newrelic.com
 *
 * @author Alex Soban <soban.vue@gmail.com>
 * @version 1.0
 * @copyright 2013 Alex Soban
 *
 * USAGE
 *
 * use \Slim\Slim;
 * use \Slim\Extras\Middleware\Newrelic;
 *
 * $app = new Slim();
 * $app->add(new Newrelic(array(
 *  "newrelic.appname" => ini_get("newrelic.appname") | "AppName",
 * )));
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

class Newrelic extends \Slim\Middleware
{
    /**
     * Extension status
     *
     * @var boolean
     */
    protected static $_extensionLoaded;

    /**
     * Middleware configuration
     *
     * @var array
     */
    protected static $_options = array(
        'newrelic.appname' => null,
        'transaction.method' => false,
    );

    /**
     * Constructor.
     *
     * @param  array $config Configuration options
     * @return void
     */
    public function __construct(array $config = array())
    {
        static::$_options = array_merge(static::$_options, $config);
    }

    /**
     * Call middleware.
     *
     * @return void
     */
    public function call()
    {
        // Attach hooks.
        $this->app->hook('slim.before', array($this, 'setAppName'), 0);
        $this->app->hook('slim.before.dispatch', array($this, 'setTransactionName'), 0);
        $this->app->hook('slim.after.dispatch', array($this, 'nameTransaction'), 0);

        // Call next middleware.
        $this->next->call();
    }

    /**
     * Get/Set Options
     *
     * @param  string $key   Option name
     * @param  mixed  $value (Optional) Value of the option
     * @return mixed
     */
    public function option($key, $value = null)
    {
        // Set option
        if (!empty($value)) {
          static::$_options[$key] = $value;
        }

        // Get option
        if (array_key_exists($key, static::$_options)) {
            return static::$_options[$key];
        }

        return null;
    }

    /**
     * Newrelic application name API
     *
     * @return void
     */
    public function setAppName()
    {
        if ($this->extensionLoaded() && $this->option('newrelic.appname')) {
            newrelic_set_appname($this->option('newrelic.appname'));
        }
    }

    /**
     * Newrelic transaction name API
     *
     * @return void
     */
    public function nameTransaction()
    {
        if ($this->extensionLoaded() && $this->option('transaction.name')) {
            newrelic_name_transaction($this->option('transaction.name'));
        }
    }

    /**
     * Newrelic browser timing header (RUM) API
     *
     * @param  boolean $scriptTag Should the API return with <script> and </script>
     * @return mixed
     */
    public function getRumHeader($scriptTag = true)
    {
        if (static::extensionLoaded()) {
          return newrelic_get_browser_timing_header($scriptTag);
        }

        return null;
    }

    /**
     * Newrelic browser timing footer (RUM) API
     *
     * @param  boolean $scriptTag Should the API return with <script> and </script>
     * @return mixed
     */
    public function getRumFooter($scriptTag = true)
    {
        if (static::extensionLoaded()) {
          return newrelic_get_browser_timing_footer($scriptTag);
        }

        return null;
    }

    /**
     * Set transaction name
     *
     * @return void
     */
    public function setTransactionName()
    {
        if ($this->option('transaction.method')) {
            // Set the transaction name using Method and PathInfo
            $this->option(
              'transaction.name',
              $this->app->request()->getMethod() . $this->app->request()->getPathInfo()
            );
        } else {
            // Set the transaction name PathInfo
            $this->option('transaction.name', $this->app->request()->getPathInfo());
        }
    }

    /**
     * Check if Newrelic extension is loaded
     *
     * @return boolean
     */
    public function extensionLoaded()
    {
        // Check if the extension is loaded and store the result
        if (null === static::$_extensionLoaded) {
            static::$_extensionLoaded = extension_loaded('newrelic');
        }

        return static::$_extensionLoaded;
    }

}

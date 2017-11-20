<?php

/**
 * Directus – <http://getdirectus.com>
 *
 * @link      The canonical repository – <https://github.com/directus/directus>
 * @copyright Copyright 2006-2017 RANGER Studio, LLC – <http://rangerstudio.com>
 * @license   GNU General Public License (v3) – <http://www.gnu.org/copyleft/gpl.html>
 */

namespace Directus\Application;

/**
 * Application Environment variables
 *
 * This class was created to fix an issue in Slim 2.x
 * the query string from the request differ from the query string in $_SERVER
 * missing the run_api_router set in api/.htaccess
 *
 * @author Welling Guzmán <welling@rngr.org>
 */
class Environment extends \Slim\Environment
{
    /**
     * Gets the instance
     *
     * @param bool $refresh
     *
     * @return \Slim\Environment
     */
    public static function getInstance($refresh = false)
    {
        $newInstance = false;
        if (is_null(self::$environment) || $refresh) {
            $newInstance = true;
        }

        $instance = parent::getInstance($refresh);

        // ----------------------------------------------------------------------------
        // Fix the path info
        // ----------------------------------------------------------------------------
        // When a new instance was created we re-created the PATH_INFO value
        // By removing everything after "?" in the REQUEST_URI
        // The query string is removed.
        //
        // Also we remove the physical path out of the REQUEST_URI
        // ----------------------------------------------------------------------------
        if ($newInstance) {
            $requestUri = $_SERVER['REQUEST_URI'];
            $scriptName = $_SERVER['SCRIPT_NAME'];
            $scriptDir = dirname($scriptName);

            // Physical path
            $physicalPath = '';
            if (strpos($requestUri, $scriptName) !== false) {
                // Without rewriting
                $physicalPath = $scriptName;
            } else if ($scriptDir !== '/') {
                // With rewriting
                $physicalPath = str_replace('\\', '', $scriptDir);
            }

            // if Virtual path, starts with physical path
            // Remove the physical path from request
            if (substr($requestUri, 0, strlen($physicalPath)) == $physicalPath) {
                $requestUri = substr($requestUri, strlen($physicalPath));
            }

            // remove the query string from the request uri
            $qsPosition = strpos($requestUri, '?');
            if ($qsPosition !== false) {
                $requestUri = substr_replace($requestUri, '', $qsPosition);
            }

            $instance['PATH_INFO'] = $requestUri;
        }

        // ----------------------------------------------------------------------------
        // Fix missing PHP_USER_AUTH/AUTHORIZATION
        // ----------------------------------------------------------------------------
        // Apache does not pass HTTP Basic authorization nor authorization
        // when running php in CGI Mode.
        // inside api/.htaccess file there is a line where we can pass the authorization
        // into HTTP_AUTHORIZATION if a redirect has been made the values will be stored
        // in REDIRECT_HTTP_AUTHORIZATION instead
        // ----------------------------------------------------------------------------
        $httpAuth = null;
        if (isset($_SERVER['HTTP_AUTHORIZATION'])) {
            $httpAuth = $_SERVER['HTTP_AUTHORIZATION'];
        } else if (isset($_SERVER['REDIRECT_HTTP_AUTHORIZATION'])) {
            $httpAuth = $_SERVER['REDIRECT_HTTP_AUTHORIZATION'];
            $instance['HTTP_AUTHORIZATION'] = $httpAuth;
        }

        if ($httpAuth && !isset($_SERVER['PHP_AUTH_USER']) && substr(strtolower($httpAuth), 0, 5) === 'basic') {
            $parts = explode(':', base64_decode(substr($httpAuth, 6)));

            if (count($parts) === 2) {
                $instance['PHP_AUTH_USER'] = $parts[0];
                $instance['PHP_AUTH_PW'] = $parts[1];
            }
        }

        return $instance;
    }
}

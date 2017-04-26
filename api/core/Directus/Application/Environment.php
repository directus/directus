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

            // Physical path
            if (strpos($requestUri, $scriptName) !== false) {
                // Without rewriting
                $physicalPath = $scriptName;
            } else {
                // With rewriting
                $physicalPath = str_replace('\\', '', dirname($scriptName));
            }

            // if Virtual path, starts with physical path
            // Remove the physical path from request
            if (substr($requestUri, 0, strlen($physicalPath)) == $physicalPath) {
                $requestUri = substr($requestUri, strlen($physicalPath));
            }

            // remove the query string from the request uri
            $qsPosition = strpos($requestUri, '?');
            if ($qsPosition !== FALSE) {
                $requestUri = substr_replace($requestUri, '', $qsPosition);
            }

            $instance['PATH_INFO'] = $requestUri;
        }

        return $instance;
    }

}

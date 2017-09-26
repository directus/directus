<?php

/**
 * Directus – <http://getdirectus.com>
 *
 * @link      The canonical repository – <https://github.com/directus/directus>
 * @copyright Copyright 2006-2017 RANGER Studio, LLC – <http://rangerstudio.com>
 * @license   GNU General Public License (v3) – <http://www.gnu.org/copyleft/gpl.html>
 */

namespace Directus\View;

use Directus\Application\Application;
use Directus\Exception\Http\InternalServerErrorException;
use Directus\Exception\HttpExceptionInterface;
use Directus\Util\ArrayUtils;

/**
 * Handles the http exception response
 *
 * @author Daniel Bickett <daniel@rngr.org>
 * @author Welling Guzmán <welling@rngr.org>
 */
class ExceptionView
{
    /**
     * @param Application $app
     * @param \Exception $exception
     */
    public function exceptionHandler($app, $exception)
    {
        $productionMode = $app->config('production');

        $response = $app->response();
        $response->header('Content-type', 'application/json');

        $httpCode = 500;
        $data = [
            'success' => false
        ];

        // Not showing internal PHP errors (for PHP7) for production
        if($productionMode && ($exception instanceof \Error || $exception instanceof \ErrorException)) {
            $exception = new InternalServerErrorException(__t('internal_server_error'));
        }

        // set default exception
        ArrayUtils::set($data, 'error.message', $exception->getMessage());

        if($exception instanceof HttpExceptionInterface) {
            $httpCode = $exception->getHttpStatus();
        }

        if (!$productionMode) {
            $data = array_merge($data, [
                'code' => $exception->getCode(),
                'class' => get_class($exception),
                'file' => $exception->getFile(),
                'line' => $exception->getLine(),
                // Do not output the trace
                // it can be so long or complex
                // that json_encode fails
                // 'trace' => $exception->getTrace(),
                // maybe as string, but let's get rid of them, for the best
                // and look at the logs instead
                // 'traceAsString' => $exception->getTraceAsString(),
            ]);
        }

        $response = $app->response($data);
        $data = $response->getBody();

        if (!$productionMode) {
            $data = JsonView::format_json($data);
        }

        http_response_code($httpCode);
        header('Content-type: application/json');
        echo $data;
        exit;
    }

}

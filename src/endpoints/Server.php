<?php

namespace Directus\Api\Routes;

use Directus\Application\Application;
use Directus\Application\Route;
use Directus\Application\Http\Request;
use Directus\Application\Http\Response;
use Directus\Exception\NotInstalledException;
use Directus\Util\StringUtils;
use Directus\Services\ServerService;
use Directus\Application\Http\Middleware\TableGatewayMiddleware;

class Server extends Route
{
    /**
     * @param Application $app
     */
    public function __invoke(Application $app)
    {
        \Directus\create_ping_route($app);
        $app->get('/projects', [$this, 'projects']);
        $app->post('/projects', \Directus\Api\Routes\ProjectsCreate::class);
        $app->delete('/projects/{name}', \Directus\Api\Routes\ProjectsDelete::class)
            ->add(new TableGatewayMiddleware($this->container));

        $app->get('/info', [$this, 'getInfo']);
    }

    /**
     * Return the projects
     *
     * @return Response
     */
    public function projects(Request $request, Response $response)
    {
        $scannedDirectory = \Directus\scan_config_folder();

        $projectNames = [];
        if(empty($scannedDirectory)){
            throw new NotInstalledException('This Directus instance has not been configured. Install via the Directus App (eg: /admin) or read more about configuration at: https://docs.directus.io/getting-started/installation.html#configure');
        }else{
            foreach($scannedDirectory as $fileName){
                if(!StringUtils::startsWith($fileName, 'private.')){
                    $fileObject = explode(".",$fileName);
                    $projectNames[] = $fileObject[0];
                }
            }
        }

        $responseData['data'] = $projectNames;
        return $this->responseWithData($request, $response, $responseData);
    }

     /**
     * Return the current setup of server.
     *
     * @return Response
     */
    public function getInfo(Request $request, Response $response)
    {
        $data = $request->getQueryParams();
        $service = new ServerService($this->container);
        $service->validateServerInfo($data);

        $basePath = $this->container->get('path_base');
        $responseData['data'] = [
            'directus' => Application::DIRECTUS_VERSION,
            'server' => [
                'type' => $_SERVER['SERVER_SOFTWARE'],
                'rewrites' => function_exists('apache_get_modules') ? in_array('mod_rewrite', apache_get_modules()) : null,
                'os' => PHP_OS,
                'os_version' => php_uname('v'),
            ],
            'php' => [
                'version' => phpversion(),
                'max_upload_size' => \Directus\get_max_upload_size(ServerService::INFO_SETTINGS_RUNTIME === ServerService::INFO_SETTINGS_CORE),
                'extensions' => [
                    'pdo' => defined('PDO::ATTR_DRIVER_NAME'),
                    'mysqli' => extension_loaded("mysqli"),
                    'curl' => extension_loaded("curl"),
                    'gd' => extension_loaded("gd"),
                    'fileinfo' => extension_loaded("fileinfo"),
                    'libapache2_mod_php' => extension_loaded("libapache2-mod-php"),
                    'mbstring' => extension_loaded("mbstring"),
                    'json' => extension_loaded("json"),
                ],
            ],
            'permissions' => [
                'public' => substr(sprintf('%o', fileperms($basePath."/public")), -4),
                'logs' => substr(sprintf('%o', fileperms($basePath."/logs")), -4),
                'uploads' => substr(sprintf('%o', fileperms($basePath."/public/uploads")), -4),
            ]
        ];
        return $this->responseWithData($request, $response, $responseData);
    }
}

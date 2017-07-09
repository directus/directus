<?php

namespace Directus\Providers;

use Directus\Application\Application;
use Directus\Application\ServiceProviderInterface;
use Directus\Database\TableGateway\DirectusSettingsTableGateway;
use Directus\Filesystem\Files;
use Directus\Util\ArrayUtils;
use Slim\Helper\Set;

class FilesServiceProvider implements ServiceProviderInterface
{
    public function register(Application $app)
    {
        $app->container->set('fileSettings', function(Set $container) {
            $adapter = $container->get('zenddb');
            $acl = $container->get('acl');
            $Settings = new DirectusSettingsTableGateway($adapter, $acl);

            return $Settings->fetchCollection('files', [
                'thumbnail_size', 'thumbnail_quality', 'thumbnail_crop_enabled'
            ]);
        });

        $app->container->singleton('files', function(Set $container) {
            $filesystem = $container->get('filesystem');
            $config = $container->get('config');
            $config = $config->get('filesystem', []);
            $settings = $container->get('fileSettings');
            $emitter = $container->get('hookEmitter');

            return new Files($filesystem, $config, $settings, $emitter);
        });
    }

    public function boot(Application $app)
    {

    }
}

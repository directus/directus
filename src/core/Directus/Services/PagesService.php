<?php

namespace Directus\Services;

use Directus\Application\Container;

class PagesService extends AbstractExtensionsController
{
    public function __construct(Container $container)
    {
        parent::__construct($container);

        $basePath = $this->container->get('path_base');
        $this->paths = [
            $basePath . '/public/extensions/core/pages',
            $basePath . '/public/extensions/custom/pages',
        ];
    }

    public function findAll(array $params = [])
    {
        return $this->all($params);
    }
}

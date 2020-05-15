<?php

namespace Directus\Services;

use Directus\Application\Container;

class LayoutsService extends AbstractExtensionsController
{
    public function __construct(Container $container)
    {
        parent::__construct($container);

        $basePath = $this->container->get('path_base');
        $this->paths = [
            $basePath . '/public/extensions/core/layouts',
            $basePath . '/public/extensions/custom/layouts',
        ];
    }

    public function findAll(array $params = [])
    {
        return $this->all($params);
    }
}

<?php

namespace Directus\Services;

use Directus\Application\Container;

class ModulesService extends AbstractExtensionsController
{
    public function __construct(Container $container)
    {
        parent::__construct($container);

        $basePath = $this->container->get('path_base');
        $this->paths = [
            $basePath . '/public/extensions/core/modules',
            $basePath . '/public/extensions/custom/modules',
        ];
    }

    public function findAll(array $params = [])
    {
        return $this->all($params);
    }
}

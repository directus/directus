<?php

namespace Directus\Services;

abstract class AbstractExtensionsController extends AbstractService
{
    protected $basePath = null;

    protected function all($basePath, array $params = [])
    {
        $addOns = [];

        if (!file_exists($basePath)) {
            return ['data' => $addOns];
        }

        $directusBasePath = $this->container->get('path_base');

        $filePaths = \Directus\find_directories($basePath);
        foreach ($filePaths as $path) {
            $path .= '/meta.json';

            if (!file_exists($path)) {
                continue;
            }

            $addOnsPath = trim(substr($path, strlen($basePath)), '/');
            $data = [
                'id' => basename(dirname($addOnsPath)),
                // NOTE: This is a temporary solution until we implement core config
                // In this case /public is the public root path
                'path' => trim(substr($path, strlen($directusBasePath) + strlen('/public')), '/')
            ];

            $meta = @json_decode(file_get_contents($path), true);
            if ($meta) {
                unset($meta['id']);
                $data = array_merge($data, $meta);
            }

            $addOns[] = $data;
        }

        return ['data' => $addOns];
    }
}

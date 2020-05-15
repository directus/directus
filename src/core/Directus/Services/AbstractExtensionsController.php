<?php

namespace Directus\Services;

abstract class AbstractExtensionsController extends AbstractService
{
    protected $paths = [];

    protected function all(array $params = [])
    {
        $addOns = [];
        foreach ($this->paths as $path) {
            if ($path && file_exists($path)) {
                $addOns = array_merge($addOns, $this->findIn($path, $params));
            }
        }

        return ['data' => $addOns];
    }

    protected function findIn($basePath, array $params = [])
    {
        $addOns = [];
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

        return $addOns;
    }
}

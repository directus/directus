<?php

namespace Directus\Services;

use Directus\Application\Application;
use Directus\Exception\UnauthorizedException;

class ServerService extends AbstractService
{
    /**
     * @param bool $global
     * @return array
     *
     * @throws UnauthorizedException
     */
    public function findAllInfo($global = true)
    {
        // TODO: Move Admin verification to middleware
        if (!$this->getAcl()->isAdmin()) {
            throw new UnauthorizedException('Only Admin can see this information');
        }

        $data = [
            'api' => [
                'version' => Application::DIRECTUS_VERSION
            ],
            'server' => [
                'general' => [
                    'php_version' => phpversion(),
                    'php_api' => php_sapi_name()
                ],
                'max_upload_size' => \Directus\get_max_upload_size($global)
            ]
        ];

        if ($global !== true) {
            $config = $this->getContainer()->get('config');
            $data['api']['database'] = $config->get('database.type');
        }

        return [
            'data' => $data
        ];
    }
}

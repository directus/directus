<?php

namespace Directus\Application;

use Directus\Database\TableGateway\RelationalTableGateway;
use Directus\Hook\Emitter;
use Directus\Hook\Payload;

abstract class Route
{
    /**
     * @var \Slim\Slim
     */
    protected $app;

    public function __construct(Application $app)
    {
        $this->app = $app;
    }

    public function setTags($tags)
    {
        $this->app->container->get('responseCache')->setTags($tags);
    }

    public function invalidateTags($tags)
    {
        $this->app->container->get('responseCache')->invalidateTags($tags);
    }

    public function getEntriesAndSetTags(RelationalTableGateway $gateway, array $params = [], \Closure $queryCallback = null)
    {
        $setIdTags = function(Payload $payload) use($gateway) {
            $tableName = $payload->attribute('tableName');

            $this->setTags('table_'.$tableName);

            foreach($payload->getData() as $item) {
                $this->setTags('entity_'.$tableName.'_'.$item[$gateway->primaryKeyFieldName]);
            }

            return $payload;
        };

        /** @var Emitter $hookEmitter */
        $hookEmitter = $this->app->container->get('hookEmitter');

        $listenerId = $hookEmitter->addFilter('table.select', $setIdTags);
        $result = $gateway->getEntries($params);
        $hookEmitter->removeListener($listenerId);

        return $result;
    }

}
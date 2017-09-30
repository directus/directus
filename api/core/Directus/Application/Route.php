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

    protected function setResponseCacheTags($tags)
    {
        $this->app->container->get('responseCache')->setTags($tags);
    }

    protected function invalidateResponseCacheTags($tags)
    {
        $this->app->container->get('responseCache')->invalidateTags($tags);
    }

    /**
     * @param RelationalTableGateway $gateway
     * @param array $params
     * @param \Closure|null $queryCallback
     * @return array|mixed
     */
    protected function getEntriesAndSetResponseCacheTags(RelationalTableGateway $gateway, array $params, \Closure $queryCallback = null)
    {
        return $this->getDataAndSetResponseCacheTags([$gateway, 'getEntries'], [$params, $queryCallback]);
    }

    /**
     * @param callable $callable
     * @param array $callableParams
     * @param null $pkName
     * @return array|mixed
     */
    protected function getDataAndSetResponseCacheTags(Callable $callable, array $callableParams = [], $pkName = null)
    {
        if(is_array($callable) && $callable[0] instanceof RelationalTableGateway) {
            /** @var $callable[0] RelationalTableGateway */
            $pkName = $callable[0]->primaryKeyFieldName;
        }

        $setIdTags = function(Payload $payload) use($pkName) {
            $tableName = $payload->attribute('tableName');

            $this->setResponseCacheTags('table_'.$tableName);

            foreach($payload->getData() as $item) {
                $this->setResponseCacheTags('entity_'.$tableName.'_'.$item[$pkName]);
            }

            return $payload;
        };

        /** @var Emitter $hookEmitter */
        $hookEmitter = $this->app->container->get('hookEmitter');

        $listenerId = $hookEmitter->addFilter('table.select', $setIdTags, Emitter::P_LOW);
        $result = call_user_func_array($callable, $callableParams);
        $hookEmitter->removeListener($listenerId);

        return $result;
    }

}
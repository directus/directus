<?php

namespace Directus\Application;

use Directus\Database\TableGateway\RelationalTableGateway;
use Directus\Exception\Exception;
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

    protected function tagResponseCache($tags)
    {
        $this->app->container->get('responseCache')->tag($tags);
    }

    protected function invalidateCacheTags($tags)
    {
        $this->app->container->get('cache')->getPool()->invalidateTags($tags);
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
     *
     * @return array|mixed
     *
     * @throws Exception
     */
    protected function getDataAndSetResponseCacheTags(Callable $callable, array $callableParams = [], $pkName = null)
    {
        $container = $this->app->container;

        // Make sure the callable is [RelationalTableGateway, 'method'] format
        if (!is_array($callable) || !($callable[0] instanceof RelationalTableGateway)) {
            throw new Exception('callable must be a instance of RelationalTableGateway');
        }

        /** @var $callable[0] RelationalTableGateway */
        $pkName = $callable[0]->primaryKeyFieldName;
        $tableName = $callable[0]->getTable();

        $setIdTags = function (Payload $payload) use($pkName, $container) {
            $tableName = $payload->attribute('tableName');

            $this->tagResponseCache('table_'.$tableName);
            $this->tagResponseCache('privilege_table_'.$tableName.'_group_'.$container->get('acl')->getGroupId());

            foreach ($payload->getData() as $item) {
                $this->tagResponseCache('entity_'.$tableName.'_'.$item[$pkName]);
            }

            return $payload;
        };

        /** @var Emitter $hookEmitter */
        $hookEmitter = $container->get('hookEmitter');

        $listenerId = $hookEmitter->addFilter('table.select.' . $tableName, $setIdTags, Emitter::P_LOW);
        $result = call_user_func_array($callable, $callableParams);
        $hookEmitter->removeListener($listenerId);

        return $result;
    }

}

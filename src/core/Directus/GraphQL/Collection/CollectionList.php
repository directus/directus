<?php

namespace Directus\GraphQL\Collection;

use Directus\GraphQL\Types;
use Directus\Application\Application;

class CollectionList
{

    protected $param;
    protected $limit;
    protected $offset;
    protected $container;
    protected $lang;

    public function __construct()
    {
        $this->param = ['fields' => '*.*.*.*.*.*', 'meta' => '*'];
        $this->id = ['id' => Types::int()];
        $this->limit = ['limit' => Types::int()];
        $this->offset = ['offset' => Types::int()];
        $this->container = Application::getInstance()->getContainer();
        $this->lang = ['lang' => Types::string()];
    }

    protected function convertArgsToFilter($args)
    {
        $this->param = (isset($args)) ? array_merge($this->param, $args) : $this->param;
        if (isset($this->param['filter'])) {
            $filters = [];
            foreach ($this->param['filter'] as $filter => $value) {
                /**
                 * TODO :: Need to rewrite the code for better readiablity.
                 */
                if ($filter == 'or' || $filter == 'and') {
                    $c = 0;
                    foreach ($value as $innerFilters) {
                        $innerFilter = array_keys($innerFilters)[0];
                        $innerFilterValue = $innerFilters[$innerFilter];
                        $temp = $this->parseArg($innerFilter, $innerFilterValue);
                        $filters[$temp['key']] = $temp['value'];
                        if ($c++ > 0) { // Logical filter is not allowed on first filter
                            $filters[$temp['key']]['logical'] = $filter;
                        }
                    }
                } else {
                    $temp = $this->parseArg($filter, $value);
                    $filters[$temp['key']] = $temp['value'];
                }
            }
            $this->param['filter'] = $filters;
        }
    }

    private function parseArg($key, $value)
    {
        $filterParts = preg_split('~_(?=[^_]*$)~', $key);
        $res['key'] = $filterParts[0];
        $res['value'] = [$filterParts[1] => $value];
        return $res;
    }
}

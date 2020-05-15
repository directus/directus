<?php

namespace Directus\Services;

use Directus\GraphQL\Types;
use GraphQL\GraphQL;
use GraphQL\Type\Schema;
use GraphQL\Error\Debug;

class GraphQLService extends AbstractService
{
    public function index($inputs)
    {

        $schema = new Schema([
            'query' => Types::query()
        ]);

        $inputs = json_decode($inputs, true);
        $query = $inputs['query'];
        $variableValues = isset($inputs['variables']) ? $inputs['variables'] : null;

        try {
            $rootValue = null;
            $result = GraphQL::executeQuery($schema, $query, $rootValue, null, $variableValues);
            $responseData = $result->toArray();
        } catch (\Exception $e) {
            $responseData = [
                'errors' => [
                    [
                        'message' => $e->getMessage()
                    ]
                ]
            ];
        }
        return $responseData;
    }
}

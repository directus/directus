<?php

namespace Directus\Services;

use Directus\Application\Container;
use Directus\Database\TableGateway\DirectusUsersTableGateway;
use Directus\Exception\UnprocessableEntityException;
use Directus\Util\ArrayUtils;

class ScimService extends AbstractService
{
    const SCHEMA_LIST  = 'urn:ietf:params:scim:api:messages:2.0:ListResponse';
    const SCHEMA_GROUP = 'urn:ietf:params:scim:schemas:core:2.0:Group';
    const SCHEMA_USER  = 'urn:ietf:params:scim:schemas:core:2.0:User';
    const SCHEMA_ERROR = 'urn:ietf:params:scim:api:messages:2.0:Error';

    const RESOURCE_GROUP = 'Group';
    const RESOURCE_USER  = 'User';

    /**
     * @var UsersService
     */
    protected $usersService;

    /**
     * @var RolesService
     */
    protected $rolesService;

    public function __construct(Container $container)
    {
        parent::__construct($container);

        $this->usersService = new UsersService($this->container);
        $this->rolesService = new RolesService($this->container);
    }

    public function createUser(array $data, array $params = [])
    {
        // TODO: Validate the payload schema
        $user = $this->usersService->create($this->parseScimUserData($data), $params);

        if ($user) {
            $user = $this->parseUserData(ArrayUtils::get($user, 'data', []));
        }

        return $user;
    }

    public function createGroup(array $data, array $params = [])
    {
        // TODO: Validate the payload schema
        $user = $this->rolesService->create($this->parseScimGroupData($data), $params);

        if ($user) {
            $user = $this->parseGroupData(ArrayUtils::get($user, 'data', []));
        }

        return $user;
    }

    public function updateUser($id, array $data, array $params = [])
    {
        $user = $this->usersService->findOne([
            'fields' => 'id',
            'single' => true,
            'filter' => [
                'external_id' => $id
            ]
        ]);

        $parsedData = $this->parseScimUserData($data);
        ArrayUtils::pull($parsedData, 'external_id');

        $user = $this->usersService->update(ArrayUtils::get($user, 'data.id'), $parsedData, $params);

        if ($user) {
            $user = $this->parseUserData(ArrayUtils::get($user, 'data', []));
        }

        return $user;
    }

    public function updateGroup($id, array $data, array $params = [])
    {
        $user = $this->rolesService->findOne([
            'fields' => 'id',
            'single' => true,
            'filter' => [
                'external_id' => $id
            ]
        ]);

        $parsedData = $this->parseScimGroupData($data);
        ArrayUtils::pull($parsedData, 'external_id');

        $user = $this->rolesService->update(ArrayUtils::get($user, 'data.id'), $parsedData, $params);

        if ($user) {
            $user = $this->parseGroupData(ArrayUtils::get($user, 'data', []));
        }

        return $user;
    }

    /**
     * Returns the data of the give user id
     *
     * @param mixed $id
     * @param array $params
     * @return array
     *
     * @throws UnprocessableEntityException
     */
    public function findUser($id, array $params = [])
    {
        if (empty($id)) {
            throw new UnprocessableEntityException('id cannot be empty');
        }

        $userData = $this->usersService->findOne(
            [
                'single' => true,
                'filter' => ['external_id' => $id]
            ]
        );

        return $this->parseUserData(ArrayUtils::get($userData, 'data', []));
    }

    /**
     * Returns the data of the give group id
     *
     * @param mixed $id
     * @param array $params
     * @return array
     *
     * @throws UnprocessableEntityException
     */
    public function findGroup($id, array $params = [])
    {
        if (empty($id)) {
            throw new UnprocessableEntityException('id cannot be empty');
        }

        $roleData = $this->rolesService->findOne(
            [
                'single' => true,
                'filter' => ['external_id' => $id],
                'fields' => [
                    '*',
                    'users.*.*'
                ]
            ]
        );

        return $this->parseGroupData(ArrayUtils::get($roleData, 'data', []));
    }

    /**
     * Returns a list of users
     *
     * @param array $scimParams
     *
     * @return array
     */
    public function findAllUsers(array $scimParams = [])
    {
        $parameters = $this->parseListParameters(static::RESOURCE_USER, $scimParams);
        $items = $this->usersService->findAll($parameters);

        return $this->parseUsersData(
            ArrayUtils::get($items, 'data', []),
            ArrayUtils::get($items, 'meta', []),
            $parameters
        );
    }

    /**
     * Returns a list of groups
     *
     * @param array $scimParams
     *
     * @return array
     */
    public function findAllGroups(array $scimParams = [])
    {
        $parameters = $this->parseListParameters(static::RESOURCE_GROUP, $scimParams);
        $items = $this->rolesService->findAll(array_merge($parameters, [
            'fields' => [
                '*',
                'users.*.*'
            ]
        ]));

        return $this->parseGroupsData(
            ArrayUtils::get($items, 'data', []),
            ArrayUtils::get($items, 'meta', []),
            $parameters
        );
    }

    /**
     * @param mixed $id
     * @param array $params
     *
     * @return bool
     */
    public function deleteGroup($id, array $params = [])
    {
        $role = $this->rolesService->findOne([
            'fields' => 'id',
            'single' => true,
            'filter' => [
                'external_id' => $id
            ]
        ]);

        return $this->rolesService->delete(ArrayUtils::get($role, 'data.id'));
    }

    /**
     * Parse Scim parameters into Directus parameters
     *
     * @param string $resourceType
     * @param array $scimParams
     *
     * @return array
     */
    protected function parseListParameters($resourceType, array $scimParams)
    {
        $filter = $this->getFilter($resourceType, ArrayUtils::get($scimParams, 'filter'));

        $parameters = [
            'filter' => $filter
        ];

        if (ArrayUtils::has($scimParams, 'startIndex')) {
            $offset = (int)ArrayUtils::get($scimParams, 'startIndex', 1);
            $parameters['offset'] =  $offset - 1;
        }

        if (ArrayUtils::has($scimParams, 'count')) {
            $limit  = (int)ArrayUtils::get($scimParams, 'count', 0);
            $parameters['limit'] = $limit > 0 ? $limit : 0;
        }

        $parameters['meta'] = '*';

        return $parameters;
    }

    /**
     * @param string $filter
     *
     * @param string $resourceType
     *
     * @return array
     *
     * @throws UnprocessableEntityException
     */
    protected function getFilter($resourceType, $filter)
    {
        if (empty($filter)) {
            return [];
        }

        if (!is_string($filter)) {
            throw new UnprocessableEntityException('Filter must be a string');
        }

        $filterParts = preg_split('/\s+/', $filter);

        if (count($filterParts) !== 3) {
            throw new UnprocessableEntityException('Filter must be: <attribute> <operator> <value>');
        }

        $attribute = $filterParts[0];
        $operator = $filterParts[1];
        $value = trim($filterParts[2], '"');
        if (!$this->isOperatorSupported($operator)) {
            throw new UnprocessableEntityException(
                sprintf('Unsupported operator "%s"', $operator)
            );
        }

        return [
            $this->convertFilterAttribute($resourceType, $attribute) => [$operator => $value]
        ];
    }

    /**
     * Converts scim user attribute to directus's user attribute
     *
     * @param string $resourceType
     * @param string $attribute
     *
     * @return string
     *
     * @throws UnprocessableEntityException
     */
    public function convertFilterAttribute($resourceType, $attribute)
    {
        $resourcesMapping = $this->getFilterAttributesMapping();
        $mapping = ArrayUtils::get($resourcesMapping, $resourceType, []);

        if (!array_key_exists($attribute, $mapping)) {
            throw new UnprocessableEntityException(
                sprintf('Unknown attribute "%s"', $attribute)
            );
        }

        return $mapping[$attribute];
    }

    /**
     * Parse Scim user data
     *
     * @param array $data
     *
     * @return array
     */
    public function parseScimUserData(array $data)
    {
        $userData = [];

        if (ArrayUtils::has($data, 'userName')) {
            $userData['email'] = $data['userName'];
        }

        if (ArrayUtils::has($data, 'externalId')) {
            $userData['external_id'] = $data['externalId'];
        }

        if (ArrayUtils::has($data, 'name')) {
            if (is_array($data['name']) && !empty($data['name'])) {
                $name = $data['name'];
                $firstName = ArrayUtils::get($name, 'givenName');
                $lastName = ArrayUtils::get($name, 'familyName');
            } else {
                $firstName = $lastName = null;
            }

            $userData['first_name'] = $firstName;
            $userData['last_name'] = $lastName;
        }

        if (
            ArrayUtils::has($data, 'emails')
            && is_array($data['emails'])
            && ArrayUtils::isNumericKeys($data['emails'])
        ) {
            $email = null;
            foreach ($data['emails'] as $emailData) {
                $email = ArrayUtils::get($emailData, 'value');
                if (isset($emailData['primary']) && $emailData['primary'] === true) {
                    break;
                }
            }

            if ($email) {
                $userData['email'] = $email;
            }
        }

        if (ArrayUtils::has($data, 'locale')) {
            $userData['locale'] = $data['locale'];
        }

        if (ArrayUtils::has($data, 'timezone')) {
            $userData['timezone'] = $data['timezone'];
        }

        if (ArrayUtils::has($data, 'active')) {
            $userData['status'] = $data['active'] === true
                                    ? DirectusUsersTableGateway::STATUS_ACTIVE
                                    : DirectusUsersTableGateway::STATUS_DRAFT;
        }

        return $userData;
    }

    /**
     * Parse Scim group data
     *
     * @param array $data
     *
     * @return array
     */
    public function parseScimGroupData(array $data)
    {
        $groupData = [];

        if (ArrayUtils::has($data, 'displayName')) {
            $groupData['name'] = $data['displayName'];
        }

        if (ArrayUtils::has($data, 'id')) {
            $groupData['external_id'] = $data['id'];
        }

        return $groupData;
    }

    /**
     * Attributes mapping from scim schema to directus users schema
     *
     * @return array
     */
    public function getFilterAttributesMapping()
    {
        return [
            static::RESOURCE_GROUP => [
                'displayName' => 'name',
            ],

            static::RESOURCE_USER => [
                'userName' => 'email',
                'externalId' => 'external_id',
                'id' => 'id',
                'emails.value' => 'email'
            ]
        ];
    }

    /**
     * Checks whether the given operator is supported
     *
     * @param string $operator
     *
     * @return bool
     */
    public function isOperatorSupported($operator)
    {
        return in_array(strtolower($operator), $this->getOperators());
    }

    /**
     * List of supported operators
     *
     * @return array
     */
    public function getOperators()
    {
        return [
            'eq'
        ];
    }

    /**
     * Parses a list of users data into a SCIM schema
     *
     * @param array $list
     * @param array $meta
     * @param array $parameters
     *
     * @return array
     */
    public function parseUsersData(array $list, array $meta = [], array $parameters = [])
    {
        $items = [];
        foreach ($list as $item) {
            $items[] = $this->parseUserData($item);
        }

        return $this->addSchemaListAttributes($items, $meta, $parameters);
    }

    /**
     * Parses a list of users data into a SCIM schema
     *
     * @param array $list
     * @param array $meta
     * @param array $parameters
     *
     * @return array
     */
    public function parseGroupsData(array $list, array $meta = [], array $parameters = [])
    {
        $items = [];
        foreach ($list as $item) {
            $items[] = $this->parseGroupData($item);
        }

        return $this->addSchemaListAttributes($items, $meta, $parameters);
    }

    /**
     * Parses an user data into a SCIM schema
     *
     * @param array $data
     *
     * @return array
     */
    public function parseUserData(array $data)
    {
        // TODO: This is a real example on how we need to improve the response filter
        $tableGateway = $this->usersService->getTableGateway();

        $userId = ArrayUtils::get($data, $tableGateway->primaryKeyFieldName);
        $externalId = ArrayUtils::get($data, 'external_id');
        $email = ArrayUtils::get($data, 'email');
        $firstName = ArrayUtils::get($data, 'first_name');
        $lastName = ArrayUtils::get($data, 'last_name');
        $location = \Directus\get_url($this->container->get('router')->pathFor('scim_v2_read_user', [
            'project' => \Directus\get_api_project_from_request(),
            'id' => $externalId
        ]));

        return [
            'schemas' => [static::SCHEMA_USER],
            'id' => $externalId,
            'externalId' => $userId,
            'meta' => [
                'resourceType' => 'User',
                // 'created' => null,
                // 'lastModified' => null,
                'location' => $location,
                'version' => sprintf('W/"%s"', md5($lastName . $firstName . $email))
            ],
            'name' => [
                // 'formatted' => sprintf('%s %s', $firstName, $lastName),
                'familyName' => $lastName,
                'givenName' => $firstName
            ],
            'userName' => $email,
            // 'phoneNumbers' => [],
            'emails' => [
                [
                    'value' => $email,
                    'type' => 'work',
                    'primary' => true
                ]
            ],
            'locale' => ArrayUtils::get($data, 'locale'),
            'timezone' => ArrayUtils::get($data, 'timezone'),
            'active' => ArrayUtils::get($data, 'status') === DirectusUsersTableGateway::STATUS_ACTIVE
        ];
    }

    /**
     * Parses an group data into a SCIM schema
     *
     * @param array $data
     *
     * @return array
     */
    public function parseGroupData(array $data)
    {
        // TODO: This is a real example on how we need to improve the response filter
        $tableGateway = $this->usersService->getTableGateway();

        $userId = ArrayUtils::get($data, $tableGateway->primaryKeyFieldName);
        $externalId = ArrayUtils::get($data, 'external_id');
        // $email = ArrayUtils::get($data, 'email');
        // $firstName = ArrayUtils::get($data, 'first_name');
        // $lastName = ArrayUtils::get($data, 'last_name');
        $location = \Directus\get_url($this->container->get('router')->pathFor('scim_v2_read_group', [
            'project' => \Directus\get_api_project_from_request(),
            'id' => $externalId
        ]));

        $eTag = sprintf(
            'W/"%s"',
            md5(
                ArrayUtils::get($data, 'ip_whitelist')
                . ArrayUtils::get($data, 'name')
                . ArrayUtils::get($data, 'nav_blacklist')
            )
        );

        $users = ArrayUtils::get($data, 'users', []);
        $members = array_map(function ($junction) {
            $user = $junction['user'];
            return [
                'value' => ArrayUtils::get($user, 'email'),
                '$ref' => \Directus\get_url($this->container->get('router')->pathFor('scim_v2_read_user', [
                    'project' => \Directus\get_api_project_from_request(),
                    'id' => ArrayUtils::get($user, 'id')
                ])),
                'display' => sprintf(
                    '%s %s',
                    ArrayUtils::get($user, 'first_name'), ArrayUtils::get($user, 'last_name')
                )
            ];
        }, $users);

        return [
            'schemas' => [static::SCHEMA_GROUP],
            'id' => $externalId,
            'externalId' => $userId,
            'meta' => [
                'resourceType' => 'Group',
                // 'created' => null,
                // 'lastModified' => null,
                'location' => $location,
                'version' => $eTag
            ],
            'displayName' => ArrayUtils::get($data, 'name'),
            'members' => $members
        ];
    }

    /**
     * Adds Schema List attributes such as totalResults
     *
     * @param array $items
     * @param array $meta
     * @param array $parameters
     *
     * @return array
     */
    protected function addSchemaListAttributes(array $items, array $meta, array $parameters)
    {
        $result = [
            'schemas' => [static::SCHEMA_LIST]
        ];

        if (ArrayUtils::has($parameters, 'offset')) {
            $startIndex = ArrayUtils::get($parameters, 'offset');
            $result['startIndex'] = $startIndex + 1;
        }

        if (ArrayUtils::has($parameters, 'limit')) {
            $totalResults = ArrayUtils::get($meta, 'total_count');
            $result['itemsPerPage'] = count($items);
        } else {
            $totalResults = count($items);
        }

        $result['totalResults'] = $totalResults;

        $result['Resources'] = $items;

        return $result;
    }

    /**
     * @param array $params
     *
     * @return array
     */
    protected function getFieldsParams(array $params)
    {
        $attributes = ArrayUtils::createFromCSV(ArrayUtils::get($params, 'attributes'));
        $excludedAttributes = ArrayUtils::createFromCSV(ArrayUtils::get($params, 'excludedAttributes'));

        if (!empty($excludedAttributes)) {
            $excludedAttributes = array_map(function ($attribute) {
                return '-' . $attribute;
            }, $excludedAttributes);
        }

        $fields = array_merge($attributes, $excludedAttributes);

        $result = [];
        if ($fields) {
            $result['fields'] = $fields;
        }

        return $result;
    }
}

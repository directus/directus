<?php

namespace Directus\Database\TableGateway;

use Directus\Permissions\Acl;
use Zend\Db\Adapter\Adapter;
use Zend\Db\Adapter\AdapterInterface;
use Zend\Db\Sql\Select;

class DirectusUsersTableGateway extends RelationalTableGateway
{
    const STATUS_HIDDEN = 0;
    const STATUS_ACTIVE = 1;
    const STATUS_DISABLED = 2;

    const GRAVATAR_SIZE = 100;

    public static $_tableName = 'directus_users';

    public $primaryKeyFieldName = 'id';

    public function __construct(AdapterInterface $adapter, Acl $acl = null)
    {
        parent::__construct(self::$_tableName, $adapter, $acl);
    }

    // @todo sanitize parameters and implement ACL
    public function findUserByFirstOrLastName($tokens)
    {
        $tokenString = implode('|', $tokens);
        $sql = 'SELECT id, "directus_users" as type, CONCAT(first_name, " ", last_name) name from `directus_users` WHERE `first_name` REGEXP "^(' . $tokenString . ')" OR `last_name` REGEXP "^(' . $tokenString . ')"';
        $result = $this->adapter->query($sql, Adapter::QUERY_MODE_EXECUTE);
        return $result->toArray();
    }

    public function fetchAllWithGroupData()
    {
        $statusColumnName = $this->getTableSchema()->getStatusColumn();

        $rowset = $this->select(function (Select $select) {
            $select->join(
                'directus_groups',
                'directus_groups.id = directus_users.group',
                ['group_name' => 'name'],
                $select::JOIN_LEFT
            );
        });

        $rowset = $rowset->toArray();

        $results = [];
        foreach ($rowset as $row) {
            $row['group'] = ['id' => (int)$row['group'], 'name' => $row['group_name']];
            unset($row['group_name']);
            $row[$statusColumnName] = (int)$row[$statusColumnName];
            array_push($results, $row);
        }
        return ['rows' => $results];
    }

    public function findActiveUserIdsByGroupIds($ids = [])
    {
        $statusColumnName = $this->getTableSchema()->getStatusColumn();

        $select = new Select($this->getTable());
        $select
            ->columns(['id', 'group'])
            ->where
                ->in('group', $ids)
                ->and
                ->equalTo($statusColumnName, STATUS_ACTIVE_NUM);

        return $this->selectWith($select)->toArray();
    }

    /**
     * Get either a Gravatar URL or complete image tag for a specified email address.
     *
     * @param string $email The email address
     * @param int $s Size in pixels, defaults to 80px [ 1 - 2048 ]
     * @param string $d Default imageset to use [ 404 | mm | identicon | monsterid | wavatar ]
     * @param string $r Maximum rating (inclusive) [ g | pg | r | x ]
     * @param bool $img True to return a complete IMG tag False for just the URL
     * @param array $atts Optional, additional key/value attributes to include in the IMG tag
     * @return String containing either just a URL or a complete image tag
     * @source http://gravatar.com/site/implement/images/php/
     */
    public static function get_avatar($email, $s = 200, $d = 'identicon', $r = 'g', $img = false, $atts = [])
    {
        return get_gravatar($email, $s, $d, $r, $img, $atts);
    }

}

<?php

namespace Directus\Db\TableGateway;

use Directus\Acl\Acl;
use Directus\Db\TableGateway\AclAwareTableGateway;
use Zend\Db\Adapter\AdapterInterface;
use Zend\Db\Sql\Select;
use Zend\Db\Sql\Sql;
use Zend\Db\Adapter\Adapter;

class DirectusUsersTableGateway extends AclAwareTableGateway {

    public static $_tableName = "directus_users";

    public function __construct(Acl $acl, AdapterInterface $adapter) {
        parent::__construct($acl, self::$_tableName, $adapter);
    }

    const GRAVATAR_SIZE = 100;

    // @todo sanitize parameters and implement ACL
    public function findUserByFirstOrLastName($tokens) {
        $tokenString = implode("|", $tokens);
        $sql = "SELECT id, 'directus_users' as type, CONCAT(first_name, ' ', last_name) name from `directus_users` WHERE `first_name` REGEXP '^($tokenString)' OR `last_name` REGEXP '^($tokenString)'";
        $result = $this->adapter->query($sql, Adapter::QUERY_MODE_EXECUTE);
        return $result->toArray();
    }

    public function fetchAllWithGroupData() {
        $rowset = $this->select(function(Select $select) {
            $select->join(
                "directus_groups",
                "directus_groups.id = directus_users.group",
                array('group_name' => 'name'),
                $select::JOIN_LEFT
            );
        });

        $rowset = $rowset->toArray();

        $results = array();
        foreach ($rowset as $row) {
            $row['group'] = array('id'=> (int) $row['group'], 'name' => $row['group_name']);
            unset($row['group_name']);
            $row[STATUS_COLUMN_NAME] = (int) $row[STATUS_COLUMN_NAME];
            array_push($results, $row);
        }
        return array('rows' => $results);
    }

    public function findActiveUserIdsByGroupIds($ids = array()) {
        $select = new Select($this->getTable());
        $select
            ->columns(array('id','group'))
            ->where->in('group', $ids)->and->equalTo(STATUS_COLUMN_NAME, STATUS_ACTIVE_NUM);
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
    public static function get_avatar( $email, $s = 200, $d = 'identicon', $r = 'g', $img = false, $atts = array() ) {
        return get_gravatar($email, $s, $d, $r, $img, $atts);
    }

}

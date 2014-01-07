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
            $row['active'] = (int) $row['active'];
            array_push($results, $row);
        }
        return array('rows' => $results);
    }

    public function findActiveUserIdsByGroupIds($ids = array()) {
        $select = new Select($this->getTable());
        $select
            ->columns(array('id','group'))
            ->where->in('group', $ids)->and->equalTo('active', 1);
        return $this->selectWith($select)->toArray();
    }

    public function getUserByGroupAndStudio($groupId, $studioId){
        $select = new Select(self::$_tableName);
        $select
            ->where
                ->equalTo('default_studio_id', $studioId)
                ->equalTo('group', $groupId);
        return $this->selectWith($select);
    }

    /**
     * Get either a Gravatar URL or complete image tag for a specified email address.
     *
     * @param string $email The email address
     * @param string $s Size in pixels, defaults to 80px [ 1 - 2048 ]
     * @param string $d Default imageset to use [ 404 | mm | identicon | monsterid | wavatar ]
     * @param string $r Maximum rating (inclusive) [ g | pg | r | x ]
     * @param boole $img True to return a complete IMG tag False for just the URL
     * @param array $atts Optional, additional key/value attributes to include in the IMG tag
     * @return String containing either just a URL or a complete image tag
     * @source http://gravatar.com/site/implement/images/php/
     */
    public static function get_gravatar( $email, $s = 100, $d = 'mm', $r = 'g', $img = false, $atts = array() ) {
        $url = 'http://www.gravatar.com/avatar/';
        $url .= md5( strtolower( trim( $email ) ) );
        $url .= "?s=$s&d=$d&r=$r";
        if ( $img ) {
            $url = '<img src="' . $url . '"';
            foreach ( $atts as $key => $val )
                $url .= ' ' . $key . '="' . $val . '"';
            $url .= ' />';
        }
        return $url;
    }

}

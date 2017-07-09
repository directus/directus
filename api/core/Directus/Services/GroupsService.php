<?php

/**
 * Directus – <http://getdirectus.com>
 *
 * @link      The canonical repository – <https://github.com/directus/directus>
 * @copyright Copyright 2006-2017 RANGER Studio, LLC – <http://rangerstudio.com>
 * @license   GNU General Public License (v3) – <http://www.gnu.org/copyleft/gpl.html>
 */

namespace Directus\Services;

use Directus\Database\RowGateway\BaseRowGateway;
use Directus\Database\TableGateway\DirectusGroupsTableGateway;

/**
 *
 *
 * @author Welling Guzmán <welling@rngr.org>
 */
class GroupsService extends AbstractService
{
    /**
     * @var BaseRowGateway
     */
    protected $lastGroup = null;

    /**
     * @var DirectusGroupsTableGateway
     */
    protected $tableGateway = null;

    /**
     * Finds a group by the given ID in the database
     *
     * @param $id
     *
     * @return BaseRowGateway
     */
    public function find($id)
    {
        $tableGateway = $this->getTableGateway();

        $group = $tableGateway->select(['id' => $id])->current();

        $this->lastGroup = $group;

        return $group;
    }

    /**
     * Checks whether the the group be deleted
     *
     * @param $id
     * @param bool $fetchNew
     *
     * @return bool
     */
    public function canDelete($id, $fetchNew = false)
    {
        if (!$this->lastGroup || $fetchNew === true) {
            $group = $this->find($id);
        } else {
            $group = $this->lastGroup;
        }

        // TODO: RowGateWay should parse values against their column type
        return !(!$group || $group->id == 1 || strtolower($group->name) === 'public');
    }

    /**
     * @return DirectusGroupsTableGateway
     */
    public function getTableGateway()
    {
        if (!$this->tableGateway) {
            $app = $this->app;
            $acl = $app->container->get('acl');
            $dbConnection = $app->container->get('zenddb');

            $this->tableGateway = new DirectusGroupsTableGateway($dbConnection, $acl);
        }

        return $this->tableGateway;
    }
}

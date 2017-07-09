<?php

/**
 * Directus – <http://getdirectus.com>
 *
 * @link      The canonical repository – <https://github.com/directus/directus>
 * @copyright Copyright 2006-2017 RANGER Studio, LLC – <http://rangerstudio.com>
 * @license   GNU General Public License (v3) – <http://www.gnu.org/copyleft/gpl.html>
 */

namespace Directus\API\Routes\A1;

use Directus\Application\Route;
use Directus\Database\TableGateway\BaseTableGateway;
use Directus\Util\DateUtils;

/**
 * Tracking routes
 *
 * @author Welling Guzmán <welling@rngr.org>
 */
class Tracking extends Route
{
    // /1.1/users/tracking/page
    public function page()
    {
        $acl = $this->app->container->get('acl');
        $dbConnection = $this->app->container->get('zenddb');
        $tableGateway = new BaseTableGateway('directus_users', $dbConnection);
        $lastPage = $this->app->request()->post('last_page');

        $updated = $tableGateway->update([
            'ip' => get_request_ip(),
            'last_page' => $lastPage,
            'last_access' => DateUtils::now()
        ], ['id' => $acl->getUserId()]);

        return $this->app->response([
            'success' => (bool) $updated
        ]);
    }
}

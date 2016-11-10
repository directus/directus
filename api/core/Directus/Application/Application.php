<?php

/**
 * Directus – <http://getdirectus.com>
 *
 * @link      The canonical repository – <https://github.com/directus/directus>
 * @copyright Copyright 2006-2016 RANGER Studio, LLC – <http://rangerstudio.com>
 * @license   GNU General Public License (v3) – <http://www.gnu.org/copyleft/gpl.html>
 */

namespace Directus\Application;

use Slim\Http\Util;
use Slim\Slim;

/**
 * Application
 *
 * @author Welling Guzmán <welling@rngr.org>
 */
class Application extends Slim
{
    public function __construct(array $userSettings)
    {
        parent::__construct($userSettings);

        $request = $this->request();
        // @NOTE: Slim request do not parse a json request body
        //        We need to parse it ourselves
        if ($request->getMediaType() == 'application/json') {
            $env = $this->environment();
            $jsonRequest = json_decode($request->getBody(), true);
            $env['slim.request.form_hash'] = Util::stripSlashesIfMagicQuotes($jsonRequest);
        }
    }
}

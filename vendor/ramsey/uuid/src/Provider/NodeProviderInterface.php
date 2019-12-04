<?php
/**
 * This file is part of the ramsey/uuid library
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 *
 * @copyright Copyright (c) Ben Ramsey <ben@benramsey.com>
 * @license http://opensource.org/licenses/MIT MIT
 * @link https://benramsey.com/projects/ramsey-uuid/ Documentation
 * @link https://packagist.org/packages/ramsey/uuid Packagist
 * @link https://github.com/ramsey/uuid GitHub
 */

namespace Ramsey\Uuid\Provider;

use Exception;

/**
 * NodeProviderInterface provides functionality to get the node ID (or host ID
 * in the form of the system's MAC address) from a specific type of node provider
 */
interface NodeProviderInterface
{
    /**
     * Returns the system node ID
     *
     * @return string System node ID as a hexadecimal string
     * @throws Exception if it was not possible to gather sufficient entropy
     */
    public function getNode();
}

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

namespace Ramsey\Uuid\Provider\Node;

use Exception;
use Ramsey\Uuid\Provider\NodeProviderInterface;

/**
 * RandomNodeProvider provides functionality to generate a random node ID, in
 * the event that the node ID could not be obtained from the host system
 *
 * @link http://tools.ietf.org/html/rfc4122#section-4.5
 */
class RandomNodeProvider implements NodeProviderInterface
{
    /**
     * Returns the system node ID
     *
     * @return string System node ID as a hexadecimal string
     * @throws Exception if it was not possible to gather sufficient entropy
     */
    public function getNode()
    {
        $nodeBytes = random_bytes(6);

        // Split the node bytes for math on 32-bit systems.
        $nodeMsb = substr($nodeBytes, 0, 3);
        $nodeLsb = substr($nodeBytes, 3);

        // Set the multicast bit; see RFC 4122, section 4.5.
        $nodeMsb = hex2bin(
            str_pad(
                dechex(hexdec(bin2hex($nodeMsb)) | 0x010000),
                6,
                '0',
                STR_PAD_LEFT
            )
        );

        // Recombine the node bytes.
        $node = $nodeMsb . $nodeLsb;

        return str_pad(bin2hex($node), 12, '0', STR_PAD_LEFT);
    }
}

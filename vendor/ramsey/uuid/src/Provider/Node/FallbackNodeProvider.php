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
 * FallbackNodeProvider attempts to gain the system host ID from an array of
 * providers, falling back to the next in line in the event a host ID can not be
 * obtained
 */
class FallbackNodeProvider implements NodeProviderInterface
{
    /**
     * @var NodeProviderInterface[]
     */
    private $nodeProviders;

    /**
     * Constructs a `FallbackNodeProvider` using an array of node providers
     *
     * @param NodeProviderInterface[] $providers Array of node providers
     */
    public function __construct(array $providers)
    {
        $this->nodeProviders = $providers;
    }

    /**
     * Returns the system node ID by iterating over an array of node providers
     * and returning the first non-empty value found
     *
     * @return string System node ID as a hexadecimal string
     * @throws Exception
     */
    public function getNode()
    {
        foreach ($this->nodeProviders as $provider) {
            if ($node = $provider->getNode()) {
                return $node;
            }
        }

        return null;
    }
}

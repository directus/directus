<?php

/*
 * This file is part of the Symfony package.
 *
 * (c) Fabien Potencier <fabien@symfony.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace Symfony\Component\Config;

use Symfony\Component\Config\Resource\ResourceInterface;

/**
 * Interface for ResourceCheckers.
 *
 * When a ResourceCheckerConfigCache instance is checked for freshness, all its associated
 * metadata resources are passed to ResourceCheckers. The ResourceCheckers
 * can then inspect the resources and decide whether the cache can be considered
 * fresh or not.
 *
 * @author Matthias Pigulla <mp@webfactory.de>
 * @author Benjamin Klotz <bk@webfactory.de>
 */
interface ResourceCheckerInterface
{
    /**
     * Queries the ResourceChecker whether it can validate a given
     * resource or not.
     *
     * @return bool True if the ResourceChecker can handle this resource type, false if not
     */
    public function supports(ResourceInterface $metadata);

    /**
     * Validates the resource.
     *
     * @param int $timestamp The timestamp at which the cache associated with this resource was created
     *
     * @return bool True if the resource has not changed since the given timestamp, false otherwise
     */
    public function isFresh(ResourceInterface $resource, $timestamp);
}

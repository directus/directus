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

namespace Ramsey\Uuid\Generator;

use Ramsey\Uuid\BinaryUtils;
use Ramsey\Uuid\Converter\TimeConverterInterface;
use Ramsey\Uuid\Provider\NodeProviderInterface;
use Ramsey\Uuid\Provider\TimeProviderInterface;

/**
 * DefaultTimeGenerator provides functionality to generate strings of binary
 * data for version 1 UUIDs based on a host ID, sequence number, and the current
 * time
 */
class DefaultTimeGenerator implements TimeGeneratorInterface
{
    /**
     * @var NodeProviderInterface
     */
    private $nodeProvider;

    /**
     * @var TimeConverterInterface
     */
    private $timeConverter;

    /**
     * @var TimeProviderInterface
     */
    private $timeProvider;

    /**
     * Constructs a `DefaultTimeGenerator` using a node provider, time converter,
     * and time provider
     *
     * @param NodeProviderInterface $nodeProvider
     * @param TimeConverterInterface $timeConverter
     * @param TimeProviderInterface $timeProvider
     */
    public function __construct(
        NodeProviderInterface $nodeProvider,
        TimeConverterInterface $timeConverter,
        TimeProviderInterface $timeProvider
    ) {
        $this->nodeProvider = $nodeProvider;
        $this->timeConverter = $timeConverter;
        $this->timeProvider = $timeProvider;
    }

    /**
     * Generate a version 1 UUID from a host ID, sequence number, and the current time
     *
     * If $node is not given, we will attempt to obtain the local hardware
     * address. If $clockSeq is given, it is used as the sequence number;
     * otherwise a random 14-bit sequence number is chosen.
     *
     * @param int|string $node A 48-bit number representing the hardware address
     *     This number may be represented as an integer or a hexadecimal string.
     * @param int $clockSeq A 14-bit number used to help avoid duplicates that
     *     could arise when the clock is set backwards in time or if the node ID
     *     changes.
     * @return string A binary string
     * @throws \Ramsey\Uuid\Exception\UnsatisfiedDependencyException if called on a 32-bit system and
     *     `Moontoast\Math\BigNumber` is not present
     * @throws \InvalidArgumentException
     * @throws \Exception if it was not possible to gather sufficient entropy
     */
    public function generate($node = null, $clockSeq = null)
    {
        $node = $this->getValidNode($node);

        if ($clockSeq === null) {
            // Not using "stable storage"; see RFC 4122, Section 4.2.1.1
            $clockSeq = random_int(0, 0x3fff);
        }

        // Create a 60-bit time value as a count of 100-nanosecond intervals
        // since 00:00:00.00, 15 October 1582
        $timeOfDay = $this->timeProvider->currentTime();
        $uuidTime = $this->timeConverter->calculateTime($timeOfDay['sec'], $timeOfDay['usec']);

        $timeHi = BinaryUtils::applyVersion($uuidTime['hi'], 1);
        $clockSeqHi = BinaryUtils::applyVariant($clockSeq >> 8);

        $hex = vsprintf(
            '%08s%04s%04s%02s%02s%012s',
            array(
                $uuidTime['low'],
                $uuidTime['mid'],
                sprintf('%04x', $timeHi),
                sprintf('%02x', $clockSeqHi),
                sprintf('%02x', $clockSeq & 0xff),
                $node,
            )
        );

        return hex2bin($hex);
    }

    /**
     * Uses the node provider given when constructing this instance to get
     * the node ID (usually a MAC address)
     *
     * @param string|int $node A node value that may be used to override the node provider
     * @return string Hexadecimal representation of the node ID
     * @throws \InvalidArgumentException
     * @throws \Exception
     */
    protected function getValidNode($node)
    {
        if ($node === null) {
            $node = $this->nodeProvider->getNode();
        }

        // Convert the node to hex, if it is still an integer
        if (is_int($node)) {
            $node = sprintf('%012x', $node);
        }

        if (!ctype_xdigit($node) || strlen($node) > 12) {
            throw new \InvalidArgumentException('Invalid node value');
        }

        return strtolower(sprintf('%012s', $node));
    }
}

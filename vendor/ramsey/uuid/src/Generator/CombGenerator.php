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

use Ramsey\Uuid\Converter\NumberConverterInterface;

/**
 * CombGenerator provides functionality to generate COMB (combined GUID/timestamp)
 * sequential UUIDs
 *
 * @link https://en.wikipedia.org/wiki/Globally_unique_identifier#Sequential_algorithms
 */
class CombGenerator implements RandomGeneratorInterface
{
    const TIMESTAMP_BYTES = 6;

    /**
     * @var RandomGeneratorInterface
     */
    private $randomGenerator;

    /**
     * @var NumberConverterInterface
     */
    private $converter;

    /**
     * Constructs a `CombGenerator` using a random-number generator and a number converter
     *
     * @param RandomGeneratorInterface $generator Random-number generator for the non-time part.
     * @param NumberConverterInterface $numberConverter Instance of number converter.
     */
    public function __construct(RandomGeneratorInterface $generator, NumberConverterInterface $numberConverter)
    {
        $this->converter = $numberConverter;
        $this->randomGenerator = $generator;
    }

    /**
     * Generates a string of binary data of the specified length
     *
     * @param integer $length The number of bytes of random binary data to generate
     * @return string A binary string
     * @throws \Ramsey\Uuid\Exception\UnsatisfiedDependencyException if `Moontoast\Math\BigNumber` is not present
     * @throws \InvalidArgumentException if length is not a positive integer
     * @throws \Exception
     */
    public function generate($length)
    {
        if ($length < self::TIMESTAMP_BYTES || $length < 0) {
            throw new \InvalidArgumentException('Length must be a positive integer.');
        }

        $hash = '';

        if (self::TIMESTAMP_BYTES > 0 && $length > self::TIMESTAMP_BYTES) {
            $hash = $this->randomGenerator->generate($length - self::TIMESTAMP_BYTES);
        }

        $lsbTime = str_pad($this->converter->toHex($this->timestamp()), self::TIMESTAMP_BYTES * 2, '0', STR_PAD_LEFT);

        return hex2bin(str_pad(bin2hex($hash), $length - self::TIMESTAMP_BYTES, '0') . $lsbTime);
    }

    /**
     * Returns current timestamp as integer, precise to 0.00001 seconds
     *
     * @return string
     */
    private function timestamp()
    {
        $time = explode(' ', microtime(false));

        return $time[1] . substr($time[0], 2, 5);
    }
}

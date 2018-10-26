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

namespace Ramsey\Uuid\Builder;

use Ramsey\Uuid\Codec\CodecInterface;
use Ramsey\Uuid\Converter\NumberConverterInterface;
use Ramsey\Uuid\DegradedUuid;

/**
 * DegradedUuidBuilder builds instances of DegradedUuid
 */
class DegradedUuidBuilder implements UuidBuilderInterface
{
    /**
     * @var NumberConverterInterface
     */
    private $converter;

    /**
     * Constructs the DegradedUuidBuilder
     *
     * @param NumberConverterInterface $converter The number converter to use when constructing the DegradedUuid
     */
    public function __construct(NumberConverterInterface $converter)
    {
        $this->converter = $converter;
    }

    /**
     * Builds a DegradedUuid
     *
     * @param CodecInterface $codec The codec to use for building this DegradedUuid
     * @param array $fields An array of fields from which to construct the DegradedUuid;
     *     see {@see \Ramsey\Uuid\UuidInterface::getFieldsHex()} for array structure.
     * @return DegradedUuid
     */
    public function build(CodecInterface $codec, array $fields)
    {
        return new DegradedUuid($fields, $this->converter, $codec);
    }
}

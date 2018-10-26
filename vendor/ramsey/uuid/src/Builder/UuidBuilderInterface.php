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
use Ramsey\Uuid\UuidInterface;

/**
 * UuidBuilderInterface builds instances UuidInterface
 */
interface UuidBuilderInterface
{
    /**
     * Builds an instance of a UuidInterface
     *
     * @param CodecInterface $codec The codec to use for building this UuidInterface instance
     * @param array $fields An array of fields from which to construct a UuidInterface instance;
     *     see {@see \Ramsey\Uuid\UuidInterface::getFieldsHex()} for array structure.
     * @return UuidInterface
     */
    public function build(CodecInterface $codec, array $fields);
}

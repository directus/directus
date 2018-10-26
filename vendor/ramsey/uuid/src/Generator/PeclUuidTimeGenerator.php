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

/**
 * PeclUuidTimeGenerator provides functionality to generate strings of binary
 * data for version 1 UUIDs using the PECL UUID PHP extension
 *
 * @link https://pecl.php.net/package/uuid
 */
class PeclUuidTimeGenerator implements TimeGeneratorInterface
{
    /**
     * Generate a version 1 UUID using the PECL UUID extension
     *
     * @param int|string $node Not used in this context
     * @param int $clockSeq Not used in this context
     * @return string A binary string
     */
    public function generate($node = null, $clockSeq = null)
    {
        $uuid = uuid_create(UUID_TYPE_TIME);

        return uuid_parse($uuid);
    }
}

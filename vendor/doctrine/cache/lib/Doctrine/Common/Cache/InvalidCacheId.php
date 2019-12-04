<?php
declare(strict_types=1);

namespace Doctrine\Common\Cache;

use InvalidArgumentException;
use function sprintf;

final class InvalidCacheId extends InvalidArgumentException
{
    public static function exceedsMaxLength($id, int $maxLength) : self
    {
        return new self(sprintf('Cache id "%s" exceeds maximum length %d', $id, $maxLength));
    }

    public static function containsUnauthorizedCharacter($id, string $character) : self
    {
        return new self(sprintf('Cache id "%s" contains unauthorized character "%s"', $id, $character));
    }

    public static function containsControlCharacter($id) : self
    {
        return new self(sprintf('Cache id "%s" contains at least one control character', $id));
    }
}

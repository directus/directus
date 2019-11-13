<?php

namespace Doctrine\Common\Cache;

use function is_object;
use function method_exists;
use function restore_error_handler;
use function serialize;
use function set_error_handler;
use function sprintf;
use function time;
use function var_export;

/**
 * Php file cache driver.
 */
class PhpFileCache extends FileCache
{
    public const EXTENSION = '.doctrinecache.php';

    /**
     * @var callable
     *
     * This is cached in a local static variable to avoid instantiating a closure each time we need an empty handler
     */
    private static $emptyErrorHandler;

    /**
     * {@inheritdoc}
     */
    public function __construct($directory, $extension = self::EXTENSION, $umask = 0002)
    {
        parent::__construct($directory, $extension, $umask);

        self::$emptyErrorHandler = static function () {
        };
    }

    /**
     * {@inheritdoc}
     */
    protected function doFetch($id)
    {
        $value = $this->includeFileForId($id);

        if ($value === null) {
            return false;
        }

        if ($value['lifetime'] !== 0 && $value['lifetime'] < time()) {
            return false;
        }

        return $value['data'];
    }

    /**
     * {@inheritdoc}
     */
    protected function doContains($id)
    {
        $value = $this->includeFileForId($id);

        if ($value === null) {
            return false;
        }

        return $value['lifetime'] === 0 || $value['lifetime'] > time();
    }

    /**
     * {@inheritdoc}
     */
    protected function doSave($id, $data, $lifeTime = 0)
    {
        if ($lifeTime > 0) {
            $lifeTime = time() + $lifeTime;
        }

        $filename = $this->getFilename($id);

        $value = [
            'lifetime'  => $lifeTime,
            'data'      => $data,
        ];

        if (is_object($data) && method_exists($data, '__set_state')) {
            $value = var_export($value, true);
            $code  = sprintf('<?php return %s;', $value);
        } else {
            $value = var_export(serialize($value), true);
            $code  = sprintf('<?php return unserialize(%s);', $value);
        }

        return $this->writeFile($filename, $code);
    }

    /**
     * @return array|null
     */
    private function includeFileForId(string $id) : ?array
    {
        $fileName = $this->getFilename($id);

        // note: error suppression is still faster than `file_exists`, `is_file` and `is_readable`
        set_error_handler(self::$emptyErrorHandler);

        $value = include $fileName;

        restore_error_handler();

        if (! isset($value['lifetime'])) {
            return null;
        }

        return $value;
    }
}

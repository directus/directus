<?php

namespace Intervention\Image;

use Closure;

class ImageManagerStatic
{
    /**
     * Instance of Intervention\Image\ImageManager
     *
     * @var ImageManager
     */
    public static $manager;

    /**
     * Creates a new instance
     *
     * @param ImageManager $manager
     */
    public function __construct(ImageManager $manager = null)
    {
        self::$manager = $manager ? $manager : new ImageManager;
    }

    /**
     * Get or create new ImageManager instance
     *
     * @return ImageManager
     */
    public static function getManager()
    {
        return self::$manager ? self::$manager : new ImageManager;
    }

    /**
     * Statically create new custom configured image manager
     *
     * @param  array $config
     *
     * @return ImageManager
     */
    public static function configure(array $config = [])
    {
        return self::$manager = self::getManager()->configure($config);
    }

    /**
     * Statically initiates an Image instance from different input types
     *
     * @param  mixed $data
     *
     * @return \Intervention\Image\Image
     */
    public static function make($data)
    {
        return self::getManager()->make($data);
    }

    /**
     * Statically creates an empty image canvas
     *
     * @param  integer $width
     * @param  integer $height
     * @param  mixed $background
     *
     * @return \Intervention\Image\Image
     */
    public static function canvas($width, $height, $background = null)
    {
        return self::getManager()->canvas($width, $height, $background);
    }

    /**
     * Create new cached image and run callback statically
     *
     * @param  Closure  $callback
     * @param  integer  $lifetime
     * @param  boolean  $returnObj
     *
     * @return mixed
     */
    public static function cache(Closure $callback, $lifetime = null, $returnObj = false)
    {
        return self::getManager()->cache($callback, $lifetime, $returnObj);
    }
}

<?php

namespace Intervention\Image;

use Illuminate\Support\ServiceProvider;

class ImageServiceProviderLaravelRecent extends ServiceProvider
{
    /**
     * Determines if Intervention Imagecache is installed
     *
     * @return boolean
     */
    private function cacheIsInstalled()
    {
        return class_exists('Intervention\\Image\\ImageCache');
    }

    /**
     * Bootstrap the application events.
     *
     * @return void
     */
    public function boot()
    {
        $this->publishes([
            __DIR__.'/../../config/config.php' => config_path('image.php')
        ]);

        // setup intervention/imagecache if package is installed
        $this->cacheIsInstalled() ? $this->bootstrapImageCache() : null;
    }

    /**
     * Register the service provider.
     *
     * @return void
     */
    public function register()
    {
        $app = $this->app;

        // merge default config
        $this->mergeConfigFrom(
            __DIR__.'/../../config/config.php',
            'image'
        );

        // create image
        $app->singleton('image', function ($app) {
            return new ImageManager($this->getImageConfig($app));
        });

        $app->alias('image', 'Intervention\Image\ImageManager');
    }

    /**
     * Bootstrap imagecache
     *
     * @return void
     */
    protected function bootstrapImageCache()
    {
        $app = $this->app;
        $config = __DIR__.'/../../../../imagecache/src/config/config.php';

        $this->publishes([
            $config => config_path('imagecache.php')
        ]);

        // merge default config
        $this->mergeConfigFrom(
            $config,
            'imagecache'
        );

        // imagecache route
        if (is_string(config('imagecache.route'))) {

            $filename_pattern = '[ \w\\.\\/\\-\\@\(\)]+';

            // route to access template applied image file
            $app['router']->get(config('imagecache.route').'/{template}/{filename}', [
                'uses' => 'Intervention\Image\ImageCacheController@getResponse',
                'as' => 'imagecache'
            ])->where(['filename' => $filename_pattern]);
        }
    }

    /**
     * Return image configuration as array
     *
     * @param  Application $app
     * @return array
     */
    private function getImageConfig($app)
    {
        $config = $app['config']->get('image');

        if (is_null($config)) {
            return [];
        }

        return $config;
    }
}

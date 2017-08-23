<?php

namespace Intervention\Image\Commands;

use Closure;

class CircleCommand extends \Intervention\Image\Commands\AbstractCommand
{
    /**
     * Draw a circle centered on given image
     *
     * @param  \Intervention\Image\image $image
     * @return boolean
     */
    public function execute($image)
    {
        $diameter = $this->argument(0)->type('numeric')->required()->value();
        $x = $this->argument(1)->type('numeric')->required()->value();
        $y = $this->argument(2)->type('numeric')->required()->value();
        $callback = $this->argument(3)->type('closure')->value();

        $circle_classname = sprintf('\Intervention\Image\%s\Shapes\CircleShape',
            $image->getDriver()->getDriverName());

        $circle = new $circle_classname($diameter);

        if ($callback instanceof Closure) {
            $callback($circle);
        }

        $circle->applyToImage($image, $x, $y);

        return true;
    }
}

<?php

namespace Intervention\Image\Commands;

use Closure;

class RectangleCommand extends AbstractCommand
{
    /**
     * Draws rectangle on given image
     *
     * @param  \Intervention\Image\Image $image
     * @return boolean
     */
    public function execute($image)
    {
        $x1 = $this->argument(0)->type('numeric')->required()->value();
        $y1 = $this->argument(1)->type('numeric')->required()->value();
        $x2 = $this->argument(2)->type('numeric')->required()->value();
        $y2 = $this->argument(3)->type('numeric')->required()->value();
        $callback = $this->argument(4)->type('closure')->value();

        $rectangle_classname = sprintf('\Intervention\Image\%s\Shapes\RectangleShape',
            $image->getDriver()->getDriverName());

        $rectangle = new $rectangle_classname($x1, $y1, $x2, $y2);

        if ($callback instanceof Closure) {
            $callback($rectangle);
        }

        $rectangle->applyToImage($image, $x1, $y1);

        return true;
    }
}

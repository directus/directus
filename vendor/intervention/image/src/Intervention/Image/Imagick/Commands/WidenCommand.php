<?php

namespace Intervention\Image\Imagick\Commands;

class WidenCommand extends ResizeCommand
{
    /**
     * Resize image proportionally to given width
     *
     * @param  \Intervention\Image\Image $image
     * @return boolean
     */
    public function execute($image)
    {
        $width = $this->argument(0)->type('digit')->required()->value();
        $additionalConstraints = $this->argument(1)->type('closure')->value();

        $this->arguments[0] = $width;
        $this->arguments[1] = null;
        $this->arguments[2] = function ($constraint) use ($additionalConstraints) {
            $constraint->aspectRatio();
            if(is_callable($additionalConstraints)) 
                $additionalConstraints($constraint);
        };

        return parent::execute($image);
    }
}

<?php

namespace Intervention\Image;

use Closure;
use Intervention\Image\Exception\InvalidArgumentException;

class Size
{
    /**
     * Width
     *
     * @var int
     */
    public $width;

    /**
     * Height
     *
     * @var int
     */
    public $height;

    /**
     * Pivot point
     *
     * @var Point
     */
    public $pivot;

    /**
     * Creates a new Size instance
     *
     * @param int   $width
     * @param int   $height
     * @param Point $pivot
     */
    public function __construct($width = null, $height = null, Point $pivot = null)
    {
        $this->width = is_numeric($width) ? intval($width) : 1;
        $this->height = is_numeric($height) ? intval($height) : 1;
        $this->pivot = $pivot ? $pivot : new Point;
    }

    /**
     * Set the width and height absolutely
     *
     * @param int $width
     * @param int $height
     */
    public function set($width, $height)
    {
        $this->width = $width;
        $this->height = $height;
    }

    /**
     * Set current pivot point
     *
     * @param Point $point
     */
    public function setPivot(Point $point)
    {
        $this->pivot = $point;
    }

    /**
     * Get the current width
     *
     * @return int
     */
    public function getWidth()
    {
        return $this->width;
    }

    /**
     * Get the current height
     *
     * @return int
     */
    public function getHeight()
    {
        return $this->height;
    }

    /**
     * Calculate the current aspect ratio
     *
     * @return float
     */
    public function getRatio()
    {
        return $this->width / $this->height;
    }

    /**
     * Resize to desired width and/or height
     *
     * @param  int     $width
     * @param  int     $height
     * @param  Closure $callback
     * @return Size
     */
    public function resize($width, $height, Closure $callback = null)
    {
        if (is_null($width) && is_null($height)) {
            throw new InvalidArgumentException(
                "Width or height needs to be defined."
            );
        }

        // new size with dominant width
        $dominant_w_size = clone $this;
        $dominant_w_size->resizeHeight($height, $callback);
        $dominant_w_size->resizeWidth($width, $callback);

        // new size with dominant height
        $dominant_h_size = clone $this;
        $dominant_h_size->resizeWidth($width, $callback);
        $dominant_h_size->resizeHeight($height, $callback);

        // decide which size to use
        if ($dominant_h_size->fitsInto(new self($width, $height))) {
            $this->set($dominant_h_size->width, $dominant_h_size->height);
        } else {
            $this->set($dominant_w_size->width, $dominant_w_size->height);
        }

        return $this;
    }

    /**
     * Scale size according to given constraints
     *
     * @param  int     $width
     * @param  Closure $callback
     * @return Size
     */
    private function resizeWidth($width, Closure $callback = null)
    {
        $constraint = $this->getConstraint($callback);

        if ($constraint->isFixed(Constraint::UPSIZE)) {
            $max_width = $constraint->getSize()->getWidth();
            $max_height = $constraint->getSize()->getHeight();
        }

        if (is_numeric($width)) {

            if ($constraint->isFixed(Constraint::UPSIZE)) {
                $this->width = ($width > $max_width) ? $max_width : $width;
            } else {
                $this->width = $width;
            }

            if ($constraint->isFixed(Constraint::ASPECTRATIO)) {
                $h = max(1, intval(round($this->width / $constraint->getSize()->getRatio())));

                if ($constraint->isFixed(Constraint::UPSIZE)) {
                    $this->height = ($h > $max_height) ? $max_height : $h;
                } else {
                    $this->height = $h;
                }
            }
        }
    }

    /**
     * Scale size according to given constraints
     *
     * @param  int     $height
     * @param  Closure $callback
     * @return Size
     */
    private function resizeHeight($height, Closure $callback = null)
    {
        $constraint = $this->getConstraint($callback);

        if ($constraint->isFixed(Constraint::UPSIZE)) {
            $max_width = $constraint->getSize()->getWidth();
            $max_height = $constraint->getSize()->getHeight();
        }

        if (is_numeric($height)) {

            if ($constraint->isFixed(Constraint::UPSIZE)) {
                $this->height = ($height > $max_height) ? $max_height : $height;
            } else {
                $this->height = $height;
            }

            if ($constraint->isFixed(Constraint::ASPECTRATIO)) {
                $w = max(1, intval(round($this->height * $constraint->getSize()->getRatio())));

                if ($constraint->isFixed(Constraint::UPSIZE)) {
                    $this->width = ($w > $max_width) ? $max_width : $w;
                } else {
                    $this->width = $w;
                }
            }
        }
    }

    /**
     * Calculate the relative position to another Size
     * based on the pivot point settings of both sizes.
     *
     * @param  Size   $size
     * @return \Intervention\Image\Point
     */
    public function relativePosition(Size $size)
    {
        $x = $this->pivot->x - $size->pivot->x;
        $y = $this->pivot->y - $size->pivot->y;

        return new Point($x, $y);
    }

    /**
     * Resize given Size to best fitting size of current size.
     *
     * @param  Size   $size
     * @return \Intervention\Image\Size
     */
    public function fit(Size $size, $position = 'center')
    {
        // create size with auto height
        $auto_height = clone $size;

        $auto_height->resize($this->width, null, function ($constraint) {
            $constraint->aspectRatio();
        });

        // decide which version to use
        if ($auto_height->fitsInto($this)) {

            $size = $auto_height;

        } else {

            // create size with auto width
            $auto_width = clone $size;

            $auto_width->resize(null, $this->height, function ($constraint) {
                $constraint->aspectRatio();
            });

            $size = $auto_width;
        }

        $this->align($position);
        $size->align($position);
        $size->setPivot($this->relativePosition($size));

        return $size;
    }

    /**
     * Checks if given size fits into current size
     *
     * @param  Size   $size
     * @return boolean
     */
    public function fitsInto(Size $size)
    {
        return ($this->width <= $size->width) && ($this->height <= $size->height);
    }

    /**
     * Aligns current size's pivot point to given position
     * and moves point automatically by offset.
     *
     * @param  string  $position
     * @param  int     $offset_x
     * @param  int     $offset_y
     * @return \Intervention\Image\Size
     */
    public function align($position, $offset_x = 0, $offset_y = 0)
    {
        switch (strtolower($position)) {

            case 'top':
            case 'top-center':
            case 'top-middle':
            case 'center-top':
            case 'middle-top':
                $x = intval($this->width / 2);
                $y = 0 + $offset_y;
                break;

            case 'top-right':
            case 'right-top':
                $x = $this->width - $offset_x;
                $y = 0 + $offset_y;
                break;

            case 'left':
            case 'left-center':
            case 'left-middle':
            case 'center-left':
            case 'middle-left':
                $x = 0 + $offset_x;
                $y = intval($this->height / 2);
                break;

            case 'right':
            case 'right-center':
            case 'right-middle':
            case 'center-right':
            case 'middle-right':
                $x = $this->width - $offset_x;
                $y = intval($this->height / 2);
                break;

            case 'bottom-left':
            case 'left-bottom':
                $x = 0 + $offset_x;
                $y = $this->height - $offset_y;
                break;

            case 'bottom':
            case 'bottom-center':
            case 'bottom-middle':
            case 'center-bottom':
            case 'middle-bottom':
                $x = intval($this->width / 2);
                $y = $this->height - $offset_y;
                break;

            case 'bottom-right':
            case 'right-bottom':
                $x = $this->width - $offset_x;
                $y = $this->height - $offset_y;
                break;

            case 'center':
            case 'middle':
            case 'center-center':
            case 'middle-middle':
                $x = intval($this->width / 2);
                $y = intval($this->height / 2);
                break;

            default:
            case 'top-left':
            case 'left-top':
                $x = 0 + $offset_x;
                $y = 0 + $offset_y;
                break;
        }

        $this->pivot->setPosition($x, $y);

        return $this;
    }

    /**
     * Runs constraints on current size
     *
     * @param  Closure $callback
     * @return \Intervention\Image\Constraint
     */
    private function getConstraint(Closure $callback = null)
    {
        $constraint = new Constraint(clone $this);

        if (is_callable($callback)) {
            $callback($constraint);
        }

        return $constraint;
    }
}

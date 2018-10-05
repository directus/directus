<?php

namespace Intervention\Image\Gd;

use Intervention\Image\Image;

class Font extends \Intervention\Image\AbstractFont
{
    /**
     * Get font size in points
     *
     * @return int
     */
    protected function getPointSize()
    {
        return intval(ceil($this->size * 0.75));
    }

    /**
     * Filter function to access internal integer font values
     *
     * @return int
     */
    private function getInternalFont()
    {
        $internalfont = is_null($this->file) ? 1 : $this->file;
        $internalfont = is_numeric($internalfont) ? $internalfont : false;

        if ( ! in_array($internalfont, [1, 2, 3, 4, 5])) {
            throw new \Intervention\Image\Exception\NotSupportedException(
                sprintf('Internal GD font (%s) not available. Use only 1-5.', $internalfont)
            );
        }

        return intval($internalfont);
    }

    /**
     * Get width of an internal font character
     *
     * @return int
     */
    private function getInternalFontWidth()
    {
        return $this->getInternalFont() + 4;
    }

    /**
     * Get height of an internal font character
     *
     * @return int
     */
    private function getInternalFontHeight()
    {
        switch ($this->getInternalFont()) {
            case 1:
                return 8;

            case 2:
                return 14;

            case 3:
                return 14;

            case 4:
                return 16;

            case 5:
                return 16;
        }
    }

    /**
     * Calculates bounding box of current font setting
     *
     * @return Array
     */
    public function getBoxSize()
    {
        $box = [];

        if ($this->hasApplicableFontFile()) {

            // get bounding box with angle 0
            $box = imagettfbbox($this->getPointSize(), 0, $this->file, $this->text);

            // rotate points manually
            if ($this->angle != 0) {

                $angle = pi() * 2 - $this->angle * pi() * 2 / 360;

                for ($i=0; $i<4; $i++) {
                    $x = $box[$i * 2];
                    $y = $box[$i * 2 + 1];
                    $box[$i * 2] = cos($angle) * $x - sin($angle) * $y;
                    $box[$i * 2 + 1] = sin($angle) * $x + cos($angle) * $y;
                }
            }

            $box['width'] = intval(abs($box[4] - $box[0]));
            $box['height'] = intval(abs($box[5] - $box[1]));

        } else {

            // get current internal font size
            $width = $this->getInternalFontWidth();
            $height = $this->getInternalFontHeight();

            if (strlen($this->text) == 0) {
                // no text -> no boxsize
                $box['width'] = 0;
                $box['height'] = 0;
            } else {
                // calculate boxsize
                $box['width'] = strlen($this->text) * $width;
                $box['height'] = $height;
            }
        }

        return $box;
    }

    /**
     * Draws font to given image at given position
     *
     * @param  Image   $image
     * @param  int     $posx
     * @param  int     $posy
     * @return void
     */
    public function applyToImage(Image $image, $posx = 0, $posy = 0)
    {
        // parse text color
        $color = new Color($this->color);

        if ($this->hasApplicableFontFile()) {

            if ($this->angle != 0 || is_string($this->align) || is_string($this->valign)) {

                $box = $this->getBoxSize();

                $align = is_null($this->align) ? 'left' : strtolower($this->align);
                $valign = is_null($this->valign) ? 'bottom' : strtolower($this->valign);

                // correction on position depending on v/h alignment
                switch ($align.'-'.$valign) {

                    case 'center-top':
                        $posx = $posx - round(($box[6]+$box[4])/2);
                        $posy = $posy - round(($box[7]+$box[5])/2);
                        break;

                    case 'right-top':
                        $posx = $posx - $box[4];
                        $posy = $posy - $box[5];
                        break;

                    case 'left-top':
                        $posx = $posx - $box[6];
                        $posy = $posy - $box[7];
                        break;

                    case 'center-center':
                    case 'center-middle':
                        $posx = $posx - round(($box[0]+$box[4])/2);
                        $posy = $posy - round(($box[1]+$box[5])/2);
                        break;

                    case 'right-center':
                    case 'right-middle':
                        $posx = $posx - round(($box[2]+$box[4])/2);
                        $posy = $posy - round(($box[3]+$box[5])/2);
                        break;

                    case 'left-center':
                    case 'left-middle':
                        $posx = $posx - round(($box[0]+$box[6])/2);
                        $posy = $posy - round(($box[1]+$box[7])/2);
                        break;

                    case 'center-bottom':
                        $posx = $posx - round(($box[0]+$box[2])/2);
                        $posy = $posy - round(($box[1]+$box[3])/2);
                        break;

                    case 'right-bottom':
                        $posx = $posx - $box[2];
                        $posy = $posy - $box[3];
                        break;

                    case 'left-bottom':
                        $posx = $posx - $box[0];
                        $posy = $posy - $box[1];
                        break;
                }
            }

            // enable alphablending for imagettftext
            imagealphablending($image->getCore(), true);

            // draw ttf text
            imagettftext($image->getCore(), $this->getPointSize(), $this->angle, $posx, $posy, $color->getInt(), $this->file, $this->text);

        } else {

            // get box size
            $box = $this->getBoxSize();
            $width = $box['width'];
            $height = $box['height'];

            // internal font specific position corrections
            if ($this->getInternalFont() == 1) {
                $top_correction = 1;
                $bottom_correction = 2;
            } elseif ($this->getInternalFont() == 3) {
                $top_correction = 2;
                $bottom_correction = 4;
            } else {
                $top_correction = 3;
                $bottom_correction = 4;
            }

            // x-position corrections for horizontal alignment
            switch (strtolower($this->align)) {
                case 'center':
                    $posx = ceil($posx - ($width / 2));
                    break;

                case 'right':
                    $posx = ceil($posx - $width) + 1;
                    break;
            }

            // y-position corrections for vertical alignment
            switch (strtolower($this->valign)) {
                case 'center':
                case 'middle':
                    $posy = ceil($posy - ($height / 2));
                    break;

                case 'top':
                    $posy = ceil($posy - $top_correction);
                    break;

                default:
                case 'bottom':
                    $posy = round($posy - $height + $bottom_correction);
                    break;
            }

            // draw text
            imagestring($image->getCore(), $this->getInternalFont(), $posx, $posy, $this->text, $color->getInt());
        }
    }
}

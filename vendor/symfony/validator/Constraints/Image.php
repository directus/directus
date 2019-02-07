<?php

/*
 * This file is part of the Symfony package.
 *
 * (c) Fabien Potencier <fabien@symfony.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace Symfony\Component\Validator\Constraints;

/**
 * @Annotation
 * @Target({"PROPERTY", "METHOD", "ANNOTATION"})
 *
 * @author Benjamin Dulau <benjamin.dulau@gmail.com>
 * @author Bernhard Schussek <bschussek@gmail.com>
 */
class Image extends File
{
    const SIZE_NOT_DETECTED_ERROR = '6d55c3f4-e58e-4fe3-91ee-74b492199956';
    const TOO_WIDE_ERROR = '7f87163d-878f-47f5-99ba-a8eb723a1ab2';
    const TOO_NARROW_ERROR = '9afbd561-4f90-4a27-be62-1780fc43604a';
    const TOO_HIGH_ERROR = '7efae81c-4877-47ba-aa65-d01ccb0d4645';
    const TOO_LOW_ERROR = 'aef0cb6a-c07f-4894-bc08-1781420d7b4c';
    const TOO_FEW_PIXEL_ERROR = '1b06b97d-ae48-474e-978f-038a74854c43';
    const TOO_MANY_PIXEL_ERROR = 'ee0804e8-44db-4eac-9775-be91aaf72ce1';
    const RATIO_TOO_BIG_ERROR = '70cafca6-168f-41c9-8c8c-4e47a52be643';
    const RATIO_TOO_SMALL_ERROR = '59b8c6ef-bcf2-4ceb-afff-4642ed92f12e';
    const SQUARE_NOT_ALLOWED_ERROR = '5d41425b-facb-47f7-a55a-de9fbe45cb46';
    const LANDSCAPE_NOT_ALLOWED_ERROR = '6f895685-7cf2-4d65-b3da-9029c5581d88';
    const PORTRAIT_NOT_ALLOWED_ERROR = '65608156-77da-4c79-a88c-02ef6d18c782';
    const CORRUPTED_IMAGE_ERROR = '5d4163f3-648f-4e39-87fd-cc5ea7aad2d1';

    // Include the mapping from the base class

    protected static $errorNames = [
        self::NOT_FOUND_ERROR => 'NOT_FOUND_ERROR',
        self::NOT_READABLE_ERROR => 'NOT_READABLE_ERROR',
        self::EMPTY_ERROR => 'EMPTY_ERROR',
        self::TOO_LARGE_ERROR => 'TOO_LARGE_ERROR',
        self::INVALID_MIME_TYPE_ERROR => 'INVALID_MIME_TYPE_ERROR',
        self::SIZE_NOT_DETECTED_ERROR => 'SIZE_NOT_DETECTED_ERROR',
        self::TOO_WIDE_ERROR => 'TOO_WIDE_ERROR',
        self::TOO_NARROW_ERROR => 'TOO_NARROW_ERROR',
        self::TOO_HIGH_ERROR => 'TOO_HIGH_ERROR',
        self::TOO_LOW_ERROR => 'TOO_LOW_ERROR',
        self::TOO_FEW_PIXEL_ERROR => 'TOO_FEW_PIXEL_ERROR',
        self::TOO_MANY_PIXEL_ERROR => 'TOO_MANY_PIXEL_ERROR',
        self::RATIO_TOO_BIG_ERROR => 'RATIO_TOO_BIG_ERROR',
        self::RATIO_TOO_SMALL_ERROR => 'RATIO_TOO_SMALL_ERROR',
        self::SQUARE_NOT_ALLOWED_ERROR => 'SQUARE_NOT_ALLOWED_ERROR',
        self::LANDSCAPE_NOT_ALLOWED_ERROR => 'LANDSCAPE_NOT_ALLOWED_ERROR',
        self::PORTRAIT_NOT_ALLOWED_ERROR => 'PORTRAIT_NOT_ALLOWED_ERROR',
        self::CORRUPTED_IMAGE_ERROR => 'CORRUPTED_IMAGE_ERROR',
    ];

    public $mimeTypes = 'image/*';
    public $minWidth;
    public $maxWidth;
    public $maxHeight;
    public $minHeight;
    public $maxRatio;
    public $minRatio;
    public $minPixels;
    public $maxPixels;
    public $allowSquare = true;
    public $allowLandscape = true;
    public $allowPortrait = true;
    public $detectCorrupted = false;

    // The constant for a wrong MIME type is taken from the parent class.
    public $mimeTypesMessage = 'This file is not a valid image.';
    public $sizeNotDetectedMessage = 'The size of the image could not be detected.';
    public $maxWidthMessage = 'The image width is too big ({{ width }}px). Allowed maximum width is {{ max_width }}px.';
    public $minWidthMessage = 'The image width is too small ({{ width }}px). Minimum width expected is {{ min_width }}px.';
    public $maxHeightMessage = 'The image height is too big ({{ height }}px). Allowed maximum height is {{ max_height }}px.';
    public $minHeightMessage = 'The image height is too small ({{ height }}px). Minimum height expected is {{ min_height }}px.';
    public $minPixelsMessage = 'The image has too few pixels ({{ pixels }} pixels). Minimum amount expected is {{ min_pixels }} pixels.';
    public $maxPixelsMessage = 'The image has too many pixels ({{ pixels }} pixels). Maximum amount expected is {{ max_pixels }} pixels.';
    public $maxRatioMessage = 'The image ratio is too big ({{ ratio }}). Allowed maximum ratio is {{ max_ratio }}.';
    public $minRatioMessage = 'The image ratio is too small ({{ ratio }}). Minimum ratio expected is {{ min_ratio }}.';
    public $allowSquareMessage = 'The image is square ({{ width }}x{{ height }}px). Square images are not allowed.';
    public $allowLandscapeMessage = 'The image is landscape oriented ({{ width }}x{{ height }}px). Landscape oriented images are not allowed.';
    public $allowPortraitMessage = 'The image is portrait oriented ({{ width }}x{{ height }}px). Portrait oriented images are not allowed.';
    public $corruptedMessage = 'The image file is corrupted.';
}

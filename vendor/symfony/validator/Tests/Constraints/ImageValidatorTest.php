<?php

/*
 * This file is part of the Symfony package.
 *
 * (c) Fabien Potencier <fabien@symfony.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace Symfony\Component\Validator\Tests\Constraints;

use Symfony\Component\Validator\Constraints\Image;
use Symfony\Component\Validator\Constraints\ImageValidator;
use Symfony\Component\Validator\Test\ConstraintValidatorTestCase;

/**
 * @requires extension fileinfo
 */
class ImageValidatorTest extends ConstraintValidatorTestCase
{
    protected $context;

    /**
     * @var ImageValidator
     */
    protected $validator;

    protected $path;
    protected $image;
    protected $imageLandscape;
    protected $imagePortrait;
    protected $image4By3;
    protected $imageCorrupted;

    protected function createValidator()
    {
        return new ImageValidator();
    }

    protected function setUp()
    {
        parent::setUp();

        $this->image = __DIR__.'/Fixtures/test.gif';
        $this->imageLandscape = __DIR__.'/Fixtures/test_landscape.gif';
        $this->imagePortrait = __DIR__.'/Fixtures/test_portrait.gif';
        $this->image4By3 = __DIR__.'/Fixtures/test_4by3.gif';
        $this->imageCorrupted = __DIR__.'/Fixtures/test_corrupted.gif';
    }

    public function testNullIsValid()
    {
        $this->validator->validate(null, new Image());

        $this->assertNoViolation();
    }

    public function testEmptyStringIsValid()
    {
        $this->validator->validate('', new Image());

        $this->assertNoViolation();
    }

    public function testValidImage()
    {
        $this->validator->validate($this->image, new Image());

        $this->assertNoViolation();
    }

    public function testFileNotFound()
    {
        // Check that the logic from FileValidator still works
        $constraint = new Image([
            'notFoundMessage' => 'myMessage',
        ]);

        $this->validator->validate('foobar', $constraint);

        $this->buildViolation('myMessage')
            ->setParameter('{{ file }}', '"foobar"')
            ->setCode(Image::NOT_FOUND_ERROR)
            ->assertRaised();
    }

    public function testValidSize()
    {
        $constraint = new Image([
            'minWidth' => 1,
            'maxWidth' => 2,
            'minHeight' => 1,
            'maxHeight' => 2,
        ]);

        $this->validator->validate($this->image, $constraint);

        $this->assertNoViolation();
    }

    public function testWidthTooSmall()
    {
        $constraint = new Image([
            'minWidth' => 3,
            'minWidthMessage' => 'myMessage',
        ]);

        $this->validator->validate($this->image, $constraint);

        $this->buildViolation('myMessage')
            ->setParameter('{{ width }}', '2')
            ->setParameter('{{ min_width }}', '3')
            ->setCode(Image::TOO_NARROW_ERROR)
            ->assertRaised();
    }

    public function testWidthTooBig()
    {
        $constraint = new Image([
            'maxWidth' => 1,
            'maxWidthMessage' => 'myMessage',
        ]);

        $this->validator->validate($this->image, $constraint);

        $this->buildViolation('myMessage')
            ->setParameter('{{ width }}', '2')
            ->setParameter('{{ max_width }}', '1')
            ->setCode(Image::TOO_WIDE_ERROR)
            ->assertRaised();
    }

    public function testHeightTooSmall()
    {
        $constraint = new Image([
            'minHeight' => 3,
            'minHeightMessage' => 'myMessage',
        ]);

        $this->validator->validate($this->image, $constraint);

        $this->buildViolation('myMessage')
            ->setParameter('{{ height }}', '2')
            ->setParameter('{{ min_height }}', '3')
            ->setCode(Image::TOO_LOW_ERROR)
            ->assertRaised();
    }

    public function testHeightTooBig()
    {
        $constraint = new Image([
            'maxHeight' => 1,
            'maxHeightMessage' => 'myMessage',
        ]);

        $this->validator->validate($this->image, $constraint);

        $this->buildViolation('myMessage')
            ->setParameter('{{ height }}', '2')
            ->setParameter('{{ max_height }}', '1')
            ->setCode(Image::TOO_HIGH_ERROR)
            ->assertRaised();
    }

    public function testPixelsTooFew()
    {
        $constraint = new Image([
            'minPixels' => 5,
            'minPixelsMessage' => 'myMessage',
        ]);

        $this->validator->validate($this->image, $constraint);

        $this->buildViolation('myMessage')
            ->setParameter('{{ pixels }}', '4')
            ->setParameter('{{ min_pixels }}', '5')
            ->setParameter('{{ height }}', '2')
            ->setParameter('{{ width }}', '2')
            ->setCode(Image::TOO_FEW_PIXEL_ERROR)
            ->assertRaised();
    }

    public function testPixelsTooMany()
    {
        $constraint = new Image([
            'maxPixels' => 3,
            'maxPixelsMessage' => 'myMessage',
        ]);

        $this->validator->validate($this->image, $constraint);

        $this->buildViolation('myMessage')
            ->setParameter('{{ pixels }}', '4')
            ->setParameter('{{ max_pixels }}', '3')
            ->setParameter('{{ height }}', '2')
            ->setParameter('{{ width }}', '2')
            ->setCode(Image::TOO_MANY_PIXEL_ERROR)
            ->assertRaised();
    }

    public function testInvalidMinWidth()
    {
        $this->expectException('Symfony\Component\Validator\Exception\ConstraintDefinitionException');
        $constraint = new Image([
            'minWidth' => '1abc',
        ]);

        $this->validator->validate($this->image, $constraint);
    }

    public function testInvalidMaxWidth()
    {
        $this->expectException('Symfony\Component\Validator\Exception\ConstraintDefinitionException');
        $constraint = new Image([
            'maxWidth' => '1abc',
        ]);

        $this->validator->validate($this->image, $constraint);
    }

    public function testInvalidMinHeight()
    {
        $this->expectException('Symfony\Component\Validator\Exception\ConstraintDefinitionException');
        $constraint = new Image([
            'minHeight' => '1abc',
        ]);

        $this->validator->validate($this->image, $constraint);
    }

    public function testInvalidMaxHeight()
    {
        $this->expectException('Symfony\Component\Validator\Exception\ConstraintDefinitionException');
        $constraint = new Image([
            'maxHeight' => '1abc',
        ]);

        $this->validator->validate($this->image, $constraint);
    }

    public function testInvalidMinPixels()
    {
        $this->expectException('Symfony\Component\Validator\Exception\ConstraintDefinitionException');
        $constraint = new Image([
            'minPixels' => '1abc',
        ]);

        $this->validator->validate($this->image, $constraint);
    }

    public function testInvalidMaxPixels()
    {
        $this->expectException('Symfony\Component\Validator\Exception\ConstraintDefinitionException');
        $constraint = new Image([
            'maxPixels' => '1abc',
        ]);

        $this->validator->validate($this->image, $constraint);
    }

    public function testRatioTooSmall()
    {
        $constraint = new Image([
            'minRatio' => 2,
            'minRatioMessage' => 'myMessage',
        ]);

        $this->validator->validate($this->image, $constraint);

        $this->buildViolation('myMessage')
            ->setParameter('{{ ratio }}', 1)
            ->setParameter('{{ min_ratio }}', 2)
            ->setCode(Image::RATIO_TOO_SMALL_ERROR)
            ->assertRaised();
    }

    public function testRatioTooBig()
    {
        $constraint = new Image([
            'maxRatio' => 0.5,
            'maxRatioMessage' => 'myMessage',
        ]);

        $this->validator->validate($this->image, $constraint);

        $this->buildViolation('myMessage')
            ->setParameter('{{ ratio }}', 1)
            ->setParameter('{{ max_ratio }}', 0.5)
            ->setCode(Image::RATIO_TOO_BIG_ERROR)
            ->assertRaised();
    }

    public function testMaxRatioUsesTwoDecimalsOnly()
    {
        $constraint = new Image([
            'maxRatio' => 1.33,
        ]);

        $this->validator->validate($this->image4By3, $constraint);

        $this->assertNoViolation();
    }

    public function testInvalidMinRatio()
    {
        $this->expectException('Symfony\Component\Validator\Exception\ConstraintDefinitionException');
        $constraint = new Image([
            'minRatio' => '1abc',
        ]);

        $this->validator->validate($this->image, $constraint);
    }

    public function testInvalidMaxRatio()
    {
        $this->expectException('Symfony\Component\Validator\Exception\ConstraintDefinitionException');
        $constraint = new Image([
            'maxRatio' => '1abc',
        ]);

        $this->validator->validate($this->image, $constraint);
    }

    public function testSquareNotAllowed()
    {
        $constraint = new Image([
            'allowSquare' => false,
            'allowSquareMessage' => 'myMessage',
        ]);

        $this->validator->validate($this->image, $constraint);

        $this->buildViolation('myMessage')
            ->setParameter('{{ width }}', 2)
            ->setParameter('{{ height }}', 2)
            ->setCode(Image::SQUARE_NOT_ALLOWED_ERROR)
            ->assertRaised();
    }

    public function testLandscapeNotAllowed()
    {
        $constraint = new Image([
            'allowLandscape' => false,
            'allowLandscapeMessage' => 'myMessage',
        ]);

        $this->validator->validate($this->imageLandscape, $constraint);

        $this->buildViolation('myMessage')
            ->setParameter('{{ width }}', 2)
            ->setParameter('{{ height }}', 1)
            ->setCode(Image::LANDSCAPE_NOT_ALLOWED_ERROR)
            ->assertRaised();
    }

    public function testPortraitNotAllowed()
    {
        $constraint = new Image([
            'allowPortrait' => false,
            'allowPortraitMessage' => 'myMessage',
        ]);

        $this->validator->validate($this->imagePortrait, $constraint);

        $this->buildViolation('myMessage')
            ->setParameter('{{ width }}', 1)
            ->setParameter('{{ height }}', 2)
            ->setCode(Image::PORTRAIT_NOT_ALLOWED_ERROR)
            ->assertRaised();
    }

    public function testCorrupted()
    {
        if (!\function_exists('imagecreatefromstring')) {
            $this->markTestSkipped('This test require GD extension');
        }

        $constraint = new Image([
            'detectCorrupted' => true,
            'corruptedMessage' => 'myMessage',
        ]);

        $this->validator->validate($this->image, $constraint);

        $this->assertNoViolation();

        $this->validator->validate($this->imageCorrupted, $constraint);

        $this->buildViolation('myMessage')
            ->setCode(Image::CORRUPTED_IMAGE_ERROR)
            ->assertRaised();
    }
}

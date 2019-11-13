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

use Symfony\Component\Intl\Util\IntlTestHelper;
use Symfony\Component\Validator\Constraints\Language;
use Symfony\Component\Validator\Constraints\LanguageValidator;
use Symfony\Component\Validator\Test\ConstraintValidatorTestCase;

class LanguageValidatorTest extends ConstraintValidatorTestCase
{
    private $defaultLocale;

    protected function setUp()
    {
        parent::setUp();

        $this->defaultLocale = \Locale::getDefault();
    }

    protected function tearDown()
    {
        parent::tearDown();

        \Locale::setDefault($this->defaultLocale);
    }

    protected function createValidator()
    {
        return new LanguageValidator();
    }

    public function testNullIsValid()
    {
        $this->validator->validate(null, new Language());

        $this->assertNoViolation();
    }

    public function testEmptyStringIsValid()
    {
        $this->validator->validate('', new Language());

        $this->assertNoViolation();
    }

    public function testExpectsStringCompatibleType()
    {
        $this->expectException('Symfony\Component\Validator\Exception\UnexpectedTypeException');
        $this->validator->validate(new \stdClass(), new Language());
    }

    /**
     * @dataProvider getValidLanguages
     */
    public function testValidLanguages($language)
    {
        $this->validator->validate($language, new Language());

        $this->assertNoViolation();
    }

    public function getValidLanguages()
    {
        return [
            ['en'],
            ['my'],
        ];
    }

    /**
     * @dataProvider getInvalidLanguages
     */
    public function testInvalidLanguages($language)
    {
        $constraint = new Language([
            'message' => 'myMessage',
        ]);

        $this->validator->validate($language, $constraint);

        $this->buildViolation('myMessage')
            ->setParameter('{{ value }}', '"'.$language.'"')
            ->setCode(Language::NO_SUCH_LANGUAGE_ERROR)
            ->assertRaised();
    }

    public function getInvalidLanguages()
    {
        return [
            ['EN'],
            ['foobar'],
        ];
    }

    public function testValidateUsingCountrySpecificLocale()
    {
        IntlTestHelper::requireFullIntl($this, false);

        \Locale::setDefault('fr_FR');
        $existingLanguage = 'en';

        $this->validator->validate($existingLanguage, new Language([
            'message' => 'aMessage',
        ]));

        $this->assertNoViolation();
    }
}

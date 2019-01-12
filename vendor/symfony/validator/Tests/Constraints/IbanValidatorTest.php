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

use Symfony\Component\Validator\Constraints\Iban;
use Symfony\Component\Validator\Constraints\IbanValidator;
use Symfony\Component\Validator\Test\ConstraintValidatorTestCase;

class IbanValidatorTest extends ConstraintValidatorTestCase
{
    protected function createValidator()
    {
        return new IbanValidator();
    }

    public function testNullIsValid()
    {
        $this->validator->validate(null, new Iban());

        $this->assertNoViolation();
    }

    public function testEmptyStringIsValid()
    {
        $this->validator->validate('', new Iban());

        $this->assertNoViolation();
    }

    /**
     * @dataProvider getValidIbans
     */
    public function testValidIbans($iban)
    {
        $this->validator->validate($iban, new Iban());

        $this->assertNoViolation();
    }

    public function getValidIbans()
    {
        return array(
            array('CH9300762011623852957'), // Switzerland without spaces
            array('CH93  0076 2011 6238 5295 7'), // Switzerland with multiple spaces

            // Country list
            // http://www.rbs.co.uk/corporate/international/g0/guide-to-international-business/regulatory-information/iban/iban-example.ashx

            array('AL47 2121 1009 0000 0002 3569 8741'), //Albania
            array('AD12 0001 2030 2003 5910 0100'), //Andorra
            array('AT61 1904 3002 3457 3201'), //Austria
            array('AZ21 NABZ 0000 0000 1370 1000 1944'), //Azerbaijan
            array('BH67 BMAG 0000 1299 1234 56'), //Bahrain
            array('BE62 5100 0754 7061'), //Belgium
            array('BA39 1290 0794 0102 8494'), //Bosnia and Herzegovina
            array('BG80 BNBG 9661 1020 3456 78'), //Bulgaria
            array('BY 13 NBRB 3600 900000002Z00AB00'), //Belarus
            array('BY13 NBRB 3600 900000002Z00AB00'), //Belarus
            array('BY22NB23324232T78YR7823HR32U'), //Belarus
            array('HR12 1001 0051 8630 0016 0'), //Croatia
            array('CY17 0020 0128 0000 0012 0052 7600'), //Cyprus
            array('CZ65 0800 0000 1920 0014 5399'), //Czech Republic
            array('DK50 0040 0440 1162 43'), //Denmark
            array('EE38 2200 2210 2014 5685'), //Estonia
            array('FO97 5432 0388 8999 44'), //Faroe Islands
            array('FI21 1234 5600 0007 85'), //Finland
            array('FR14 2004 1010 0505 0001 3M02 606'), //France
            array('GE29 NB00 0000 0101 9049 17'), //Georgia
            array('DE89 3704 0044 0532 0130 00'), //Germany
            array('GI75 NWBK 0000 0000 7099 453'), //Gibraltar
            array('GR16 0110 1250 0000 0001 2300 695'), //Greece
            array('GL56 0444 9876 5432 10'), //Greenland
            array('HU42 1177 3016 1111 1018 0000 0000'), //Hungary
            array('IS14 0159 2600 7654 5510 7303 39'), //Iceland
            array('IE29 AIBK 9311 5212 3456 78'), //Ireland
            array('IL62 0108 0000 0009 9999 999'), //Israel
            array('IT40 S054 2811 1010 0000 0123 456'), //Italy
            array('LV80 BANK 0000 4351 9500 1'), //Latvia
            array('LB62 0999 0000 0001 0019 0122 9114'), //Lebanon
            array('LI21 0881 0000 2324 013A A'), //Liechtenstein
            array('LT12 1000 0111 0100 1000'), //Lithuania
            array('LU28 0019 4006 4475 0000'), //Luxembourg
            array('MK072 5012 0000 0589 84'), //Macedonia
            array('MT84 MALT 0110 0001 2345 MTLC AST0 01S'), //Malta
            array('MU17 BOMM 0101 1010 3030 0200 000M UR'), //Mauritius
            array('MD24 AG00 0225 1000 1310 4168'), //Moldova
            array('MC93 2005 2222 1001 1223 3M44 555'), //Monaco
            array('ME25 5050 0001 2345 6789 51'), //Montenegro
            array('NL39 RABO 0300 0652 64'), //Netherlands
            array('NO93 8601 1117 947'), //Norway
            array('PK36 SCBL 0000 0011 2345 6702'), //Pakistan
            array('PL60 1020 1026 0000 0422 7020 1111'), //Poland
            array('PT50 0002 0123 1234 5678 9015 4'), //Portugal
            array('RO49 AAAA 1B31 0075 9384 0000'), //Romania
            array('SM86 U032 2509 8000 0000 0270 100'), //San Marino
            array('SA03 8000 0000 6080 1016 7519'), //Saudi Arabia
            array('RS35 2600 0560 1001 6113 79'), //Serbia
            array('SK31 1200 0000 1987 4263 7541'), //Slovak Republic
            array('SI56 1910 0000 0123 438'), //Slovenia
            array('ES80 2310 0001 1800 0001 2345'), //Spain
            array('SE35 5000 0000 0549 1000 0003'), //Sweden
            array('CH93 0076 2011 6238 5295 7'), //Switzerland
            array('TN59 1000 6035 1835 9847 8831'), //Tunisia
            array('TR33 0006 1005 1978 6457 8413 26'), //Turkey
            array('AE07 0331 2345 6789 0123 456'), //UAE
            array('GB12 CPBK 0892 9965 0449 91'), //United Kingdom

            //Extended country list
            //http://www.nordea.com/Our+services/International+products+and+services/Cash+Management/IBAN+countries/908462.html
            // https://www.swift.com/sites/default/files/resources/iban_registry.pdf
            array('AO06000600000100037131174'), //Angola
            array('AZ21NABZ00000000137010001944'), //Azerbaijan
            array('BH29BMAG1299123456BH00'), //Bahrain
            array('BJ11B00610100400271101192591'), //Benin
            array('BR9700360305000010009795493P1'), // Brazil
            array('BR1800000000141455123924100C2'), // Brazil
            array('VG96VPVG0000012345678901'), //British Virgin Islands
            array('BF1030134020015400945000643'), //Burkina Faso
            array('BI43201011067444'), //Burundi
            array('CM2110003001000500000605306'), //Cameroon
            array('CV64000300004547069110176'), //Cape Verde
            array('FR7630007000110009970004942'), //Central African Republic
            array('CG5230011000202151234567890'), //Congo
            array('CR05015202001026284066'), //Costa Rica
            array('DO28BAGR00000001212453611324'), //Dominican Republic
            array('GT82TRAJ01020000001210029690'), //Guatemala
            array('IR580540105180021273113007'), //Iran
            array('IL620108000000099999999'), //Israel
            array('CI05A00060174100178530011852'), //Ivory Coast
            array('JO94CBJO0010000000000131000302'), // Jordan
            array('KZ176010251000042993'), //Kazakhstan
            array('KW74NBOK0000000000001000372151'), //Kuwait
            array('LB30099900000001001925579115'), //Lebanon
            array('MG4600005030010101914016056'), //Madagascar
            array('ML03D00890170001002120000447'), //Mali
            array('MR1300012000010000002037372'), //Mauritania
            array('MU17BOMM0101101030300200000MUR'), //Mauritius
            array('MZ59000100000011834194157'), //Mozambique
            array('PS92PALS000000000400123456702'), //Palestinian Territory
            array('QA58DOHB00001234567890ABCDEFG'), //Qatar
            array('XK051212012345678906'), //Republic of Kosovo
            array('PT50000200000163099310355'), //Sao Tome and Principe
            array('SA0380000000608010167519'), //Saudi Arabia
            array('SN12K00100152000025690007542'), //Senegal
            array('TL380080012345678910157'), //Timor-Leste
            array('TN5914207207100707129648'), //Tunisia
            array('TR330006100519786457841326'), //Turkey
            array('UA213223130000026007233566001'), //Ukraine
            array('AE260211000000230064016'), //United Arab Emirates
            array('VA59001123000012345678'), //Vatican City State
        );
    }

    /**
     * @dataProvider getIbansWithInvalidFormat
     */
    public function testIbansWithInvalidFormat($iban)
    {
        $this->assertViolationRaised($iban, Iban::INVALID_FORMAT_ERROR);
    }

    public function getIbansWithInvalidFormat()
    {
        return array(
            array('AL47 2121 1009 0000 0002 3569 874'), //Albania
            array('AD12 0001 2030 2003 5910 010'), //Andorra
            array('AT61 1904 3002 3457 320'), //Austria
            array('AZ21 NABZ 0000 0000 1370 1000 194'), //Azerbaijan
            array('AZ21 N1BZ 0000 0000 1370 1000 1944'), //Azerbaijan
            array('BH67 BMAG 0000 1299 1234 5'), //Bahrain
            array('BH67 B2AG 0000 1299 1234 56'), //Bahrain
            array('BE62 5100 0754 7061 2'), //Belgium
            array('BA39 1290 0794 0102 8494 4'), //Bosnia and Herzegovina
            array('BG80 BNBG 9661 1020 3456 7'), //Bulgaria
            array('BG80 B2BG 9661 1020 3456 78'), //Bulgaria
            array('BY 13 NBRB 3600 900000002Z00AB001'), //Belarus
            array('BY 13 NBRB 3600 900000002Z00AB0'), //Belarus
            array('BYRO NBRB 3600 900000002Z00AB0'), //Belarus
            array('BY 13 3600 NBRB 900000002Z00AB05'), //Belarus
            array('HR12 1001 0051 8630 0016 01'), //Croatia
            array('CY17 0020 0128 0000 0012 0052 7600 1'), //Cyprus
            array('CZ65 0800 0000 1920 0014 5399 1'), //Czech Republic
            array('DK50 0040 0440 1162 431'), //Denmark
            array('EE38 2200 2210 2014 5685 1'), //Estonia
            array('FO97 5432 0388 8999 441'), //Faroe Islands
            array('FI21 1234 5600 0007 851'), //Finland
            array('FR14 2004 1010 0505 0001 3M02 6061'), //France
            array('GE29 NB00 0000 0101 9049 171'), //Georgia
            array('DE89 3704 0044 0532 0130 001'), //Germany
            array('GI75 NWBK 0000 0000 7099 4531'), //Gibraltar
            array('GR16 0110 1250 0000 0001 2300 6951'), //Greece
            array('GL56 0444 9876 5432 101'), //Greenland
            array('HU42 1177 3016 1111 1018 0000 0000 1'), //Hungary
            array('IS14 0159 2600 7654 5510 7303 391'), //Iceland
            array('IE29 AIBK 9311 5212 3456 781'), //Ireland
            array('IL62 0108 0000 0009 9999 9991'), //Israel
            array('IT40 S054 2811 1010 0000 0123 4561'), //Italy
            array('LV80 BANK 0000 4351 9500 11'), //Latvia
            array('LB62 0999 0000 0001 0019 0122 9114 1'), //Lebanon
            array('LI21 0881 0000 2324 013A A1'), //Liechtenstein
            array('LT12 1000 0111 0100 1000 1'), //Lithuania
            array('LU28 0019 4006 4475 0000 1'), //Luxembourg
            array('MK072 5012 0000 0589 84 1'), //Macedonia
            array('MT84 MALT 0110 0001 2345 MTLC AST0 01SA'), //Malta
            array('MU17 BOMM 0101 1010 3030 0200 000M URA'), //Mauritius
            array('MD24 AG00 0225 1000 1310 4168 1'), //Moldova
            array('MC93 2005 2222 1001 1223 3M44 5551'), //Monaco
            array('ME25 5050 0001 2345 6789 511'), //Montenegro
            array('NL39 RABO 0300 0652 641'), //Netherlands
            array('NO93 8601 1117 9471'), //Norway
            array('PK36 SCBL 0000 0011 2345 6702 1'), //Pakistan
            array('PL60 1020 1026 0000 0422 7020 1111 1'), //Poland
            array('PT50 0002 0123 1234 5678 9015 41'), //Portugal
            array('RO49 AAAA 1B31 0075 9384 0000 1'), //Romania
            array('SM86 U032 2509 8000 0000 0270 1001'), //San Marino
            array('SA03 8000 0000 6080 1016 7519 1'), //Saudi Arabia
            array('RS35 2600 0560 1001 6113 791'), //Serbia
            array('SK31 1200 0000 1987 4263 7541 1'), //Slovak Republic
            array('SI56 1910 0000 0123 4381'), //Slovenia
            array('ES80 2310 0001 1800 0001 2345 1'), //Spain
            array('SE35 5000 0000 0549 1000 0003 1'), //Sweden
            array('CH93 0076 2011 6238 5295 71'), //Switzerland
            array('TN59 1000 6035 1835 9847 8831 1'), //Tunisia
            array('TR33 0006 1005 1978 6457 8413 261'), //Turkey
            array('AE07 0331 2345 6789 0123 4561'), //UAE
            array('GB12 CPBK 0892 9965 0449 911'), //United Kingdom

            //Extended country list
            array('AO060006000001000371311741'), //Angola
            array('AZ21NABZ000000001370100019441'), //Azerbaijan
            array('BH29BMAG1299123456BH001'), //Bahrain
            array('BJ11B006101004002711011925911'), //Benin
            array('BR9700360305000010009795493P11'), // Brazil
            array('BR1800000000141455123924100C21'), // Brazil
            array('VG96VPVG00000123456789011'), //British Virgin Islands
            array('BF10301340200154009450006431'), //Burkina Faso
            array('BI432010110674441'), //Burundi
            array('CM21100030010005000006053061'), //Cameroon
            array('CV640003000045470691101761'), //Cape Verde
            array('FR76300070001100099700049421'), //Central African Republic
            array('CG52300110002021512345678901'), //Congo
            array('CR05152020010262840661'), //Costa Rica
            array('CR0515202001026284066'), //Costa Rica
            array('DO28BAGR000000012124536113241'), //Dominican Republic
            array('GT82TRAJ010200000012100296901'), //Guatemala
            array('IR5805401051800212731130071'), //Iran
            array('IL6201080000000999999991'), //Israel
            array('CI05A000601741001785300118521'), //Ivory Coast
            array('JO94CBJO00100000000001310003021'), // Jordan
            array('KZ1760102510000429931'), //Kazakhstan
            array('KW74NBOK00000000000010003721511'), //Kuwait
            array('LB300999000000010019255791151'), //Lebanon
            array('MG46000050300101019140160561'), //Madagascar
            array('ML03D008901700010021200004471'), //Mali
            array('MR13000120000100000020373721'), //Mauritania
            array('MU17BOMM0101101030300200000MUR1'), //Mauritius
            array('MZ590001000000118341941571'), //Mozambique
            array('PS92PALS0000000004001234567021'), //Palestinian Territory
            array('QA58DOHB00001234567890ABCDEFG1'), //Qatar
            array('XK0512120123456789061'), //Republic of Kosovo
            array('PT500002000001630993103551'), //Sao Tome and Principe
            array('SA03800000006080101675191'), //Saudi Arabia
            array('SN12K001001520000256900075421'), //Senegal
            array('TL3800800123456789101571'), //Timor-Leste
            array('TN59142072071007071296481'), //Tunisia
            array('TR3300061005197864578413261'), //Turkey
            array('UA21AAAA1300000260072335660012'), //Ukraine
            array('AE2602110000002300640161'), //United Arab Emirates
            array('VA590011230000123456781'), //Vatican City State
        );
    }

    /**
     * @dataProvider getIbansWithValidFormatButIncorrectChecksum
     */
    public function testIbansWithValidFormatButIncorrectChecksum($iban)
    {
        $this->assertViolationRaised($iban, Iban::CHECKSUM_FAILED_ERROR);
    }

    public function getIbansWithValidFormatButIncorrectChecksum()
    {
        return array(
            array('AL47 2121 1009 0000 0002 3569 8742'), //Albania
            array('AD12 0001 2030 2003 5910 0101'), //Andorra
            array('AT61 1904 3002 3457 3202'), //Austria
            array('AZ21 NABZ 0000 0000 1370 1000 1945'), //Azerbaijan
            array('BH67 BMAG 0000 1299 1234 57'), //Bahrain
            array('BE62 5100 0754 7062'), //Belgium
            array('BA39 1290 0794 0102 8495'), //Bosnia and Herzegovina
            array('BG80 BNBG 9661 1020 3456 79'), //Bulgaria
            array('BY90 NBRB 3600 900000002Z00AB00'), //Belarus
            array('HR12 1001 0051 8630 0016 1'), //Croatia
            array('CY17 0020 0128 0000 0012 0052 7601'), //Cyprus
            array('CZ65 0800 0000 1920 0014 5398'), //Czech Republic
            array('DK50 0040 0440 1162 44'), //Denmark
            array('EE38 2200 2210 2014 5684'), //Estonia
            array('FO97 5432 0388 8999 43'), //Faroe Islands
            array('FI21 1234 5600 0007 84'), //Finland
            array('FR14 2004 1010 0505 0001 3M02 605'), //France
            array('GE29 NB00 0000 0101 9049 16'), //Georgia
            array('DE89 3704 0044 0532 0130 01'), //Germany
            array('GI75 NWBK 0000 0000 7099 452'), //Gibraltar
            array('GR16 0110 1250 0000 0001 2300 694'), //Greece
            array('GL56 0444 9876 5432 11'), //Greenland
            array('HU42 1177 3016 1111 1018 0000 0001'), //Hungary
            array('IS14 0159 2600 7654 5510 7303 38'), //Iceland
            array('IE29 AIBK 9311 5212 3456 79'), //Ireland
            array('IL62 0108 0000 0009 9999 998'), //Israel
            array('IT40 S054 2811 1010 0000 0123 457'), //Italy
            array('LV80 BANK 0000 4351 9500 2'), //Latvia
            array('LB62 0999 0000 0001 0019 0122 9115'), //Lebanon
            array('LI21 0881 0000 2324 013A B'), //Liechtenstein
            array('LT12 1000 0111 0100 1001'), //Lithuania
            array('LU28 0019 4006 4475 0001'), //Luxembourg
            array('MK072 5012 0000 0589 85'), //Macedonia
            array('MT84 MALT 0110 0001 2345 MTLC AST0 01T'), //Malta
            array('MU17 BOMM 0101 1010 3030 0200 000M UP'), //Mauritius
            array('MD24 AG00 0225 1000 1310 4169'), //Moldova
            array('MC93 2005 2222 1001 1223 3M44 554'), //Monaco
            array('ME25 5050 0001 2345 6789 52'), //Montenegro
            array('NL39 RABO 0300 0652 65'), //Netherlands
            array('NO93 8601 1117 948'), //Norway
            array('PK36 SCBL 0000 0011 2345 6703'), //Pakistan
            array('PL60 1020 1026 0000 0422 7020 1112'), //Poland
            array('PT50 0002 0123 1234 5678 9015 5'), //Portugal
            array('RO49 AAAA 1B31 0075 9384 0001'), //Romania
            array('SM86 U032 2509 8000 0000 0270 101'), //San Marino
            array('SA03 8000 0000 6080 1016 7518'), //Saudi Arabia
            array('RS35 2600 0560 1001 6113 78'), //Serbia
            array('SK31 1200 0000 1987 4263 7542'), //Slovak Republic
            array('SI56 1910 0000 0123 439'), //Slovenia
            array('ES80 2310 0001 1800 0001 2346'), //Spain
            array('SE35 5000 0000 0549 1000 0004'), //Sweden
            array('CH93 0076 2011 6238 5295 8'), //Switzerland
            array('TN59 1000 6035 1835 9847 8832'), //Tunisia
            array('TR33 0006 1005 1978 6457 8413 27'), //Turkey
            array('AE07 0331 2345 6789 0123 457'), //UAE
            array('GB12 CPBK 0892 9965 0449 92'), //United Kingdom

            //Extended country list
            array('AO06000600000100037131175'), //Angola
            array('AZ21NABZ00000000137010001945'), //Azerbaijan
            array('BH29BMAG1299123456BH01'), //Bahrain
            array('BJ11B00610100400271101192592'), //Benin
            array('BR9700360305000010009795493P2'), // Brazil
            array('BR1800000000141455123924100C3'), // Brazil
            array('VG96VPVG0000012345678902'), //British Virgin Islands
            array('BF1030134020015400945000644'), //Burkina Faso
            array('BI43201011067445'), //Burundi
            array('CM2110003001000500000605307'), //Cameroon
            array('CV64000300004547069110177'), //Cape Verde
            array('FR7630007000110009970004943'), //Central African Republic
            array('CG5230011000202151234567891'), //Congo
            array('CR96042332432534543564'), //Costa Rica
            array('DO28BAGR00000001212453611325'), //Dominican Republic
            array('GT82TRAJ01020000001210029691'), //Guatemala
            array('IR580540105180021273113008'), //Iran
            array('IL620108000000099999998'), //Israel
            array('CI05A00060174100178530011853'), //Ivory Coast
            array('JO94CBJO0010000000000131000303'), // Jordan
            array('KZ176010251000042994'), //Kazakhstan
            array('KW74NBOK0000000000001000372152'), //Kuwait
            array('LB30099900000001001925579116'), //Lebanon
            array('MG4600005030010101914016057'), //Madagascar
            array('ML03D00890170001002120000448'), //Mali
            array('MR1300012000010000002037373'), //Mauritania
            array('MU17BOMM0101101030300200000MUP'), //Mauritius
            array('MZ59000100000011834194158'), //Mozambique
            array('PS92PALS000000000400123456703'), //Palestinian Territory
            array('QA58DOHB00001234567890ABCDEFH'), //Qatar
            array('XK051212012345678907'), //Republic of Kosovo
            array('PT50000200000163099310356'), //Sao Tome and Principe
            array('SA0380000000608010167518'), //Saudi Arabia
            array('SN12K00100152000025690007543'), //Senegal
            array('TL380080012345678910158'), //Timor-Leste
            array('TN5914207207100707129649'), //Tunisia
            array('TR330006100519786457841327'), //Turkey
            array('UA213223130000026007233566002'), //Ukraine
            array('AE260211000000230064017'), //United Arab Emirates
            array('VA59001123000012345671'), //Vatican City State
        );
    }

    /**
     * @dataProvider getUnsupportedCountryCodes
     */
    public function testIbansWithUnsupportedCountryCode($countryCode)
    {
        $this->assertViolationRaised($countryCode.'260211000000230064016', Iban::NOT_SUPPORTED_COUNTRY_CODE_ERROR);
    }

    public function getUnsupportedCountryCodes()
    {
        return array(
            array('AG'),
            array('AI'),
            array('AQ'),
            array('AS'),
            array('AW'),
        );
    }

    public function testIbansWithInvalidCharacters()
    {
        $this->assertViolationRaised('CH930076201162385295]', Iban::INVALID_CHARACTERS_ERROR);
    }

    /**
     * @dataProvider getIbansWithInvalidCountryCode
     */
    public function testIbansWithInvalidCountryCode($iban)
    {
        $this->assertViolationRaised($iban, Iban::INVALID_COUNTRY_CODE_ERROR);
    }

    public function getIbansWithInvalidCountryCode()
    {
        return array(
            array('0750447346'),
            array('2X0750447346'),
            array('A20750447346'),
        );
    }

    private function assertViolationRaised($iban, $code)
    {
        $constraint = new Iban(array(
            'message' => 'myMessage',
        ));

        $this->validator->validate($iban, $constraint);

        $this->buildViolation('myMessage')
            ->setParameter('{{ value }}', '"'.$iban.'"')
            ->setCode($code)
            ->assertRaised();
    }
}

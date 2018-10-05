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

use Symfony\Component\HttpFoundation\File\File as FileObject;
use Symfony\Component\HttpFoundation\File\UploadedFile;
use Symfony\Component\Validator\Constraint;
use Symfony\Component\Validator\ConstraintValidator;
use Symfony\Component\Validator\Exception\UnexpectedTypeException;

/**
 * @author Bernhard Schussek <bschussek@gmail.com>
 */
class FileValidator extends ConstraintValidator
{
    const KB_BYTES = 1000;
    const MB_BYTES = 1000000;
    const KIB_BYTES = 1024;
    const MIB_BYTES = 1048576;

    private static $suffices = array(
        1 => 'bytes',
        self::KB_BYTES => 'kB',
        self::MB_BYTES => 'MB',
        self::KIB_BYTES => 'KiB',
        self::MIB_BYTES => 'MiB',
    );

    /**
     * {@inheritdoc}
     */
    public function validate($value, Constraint $constraint)
    {
        if (!$constraint instanceof File) {
            throw new UnexpectedTypeException($constraint, __NAMESPACE__.'\File');
        }

        if (null === $value || '' === $value) {
            return;
        }

        if ($value instanceof UploadedFile && !$value->isValid()) {
            switch ($value->getError()) {
                case UPLOAD_ERR_INI_SIZE:
                    $iniLimitSize = UploadedFile::getMaxFilesize();
                    if ($constraint->maxSize && $constraint->maxSize < $iniLimitSize) {
                        $limitInBytes = $constraint->maxSize;
                        $binaryFormat = $constraint->binaryFormat;
                    } else {
                        $limitInBytes = $iniLimitSize;
                        $binaryFormat = null === $constraint->binaryFormat ? true : $constraint->binaryFormat;
                    }

                    list($sizeAsString, $limitAsString, $suffix) = $this->factorizeSizes(0, $limitInBytes, $binaryFormat);
                    $this->context->buildViolation($constraint->uploadIniSizeErrorMessage)
                        ->setParameter('{{ limit }}', $limitAsString)
                        ->setParameter('{{ suffix }}', $suffix)
                        ->setCode(UPLOAD_ERR_INI_SIZE)
                        ->addViolation();

                    return;
                case UPLOAD_ERR_FORM_SIZE:
                    $this->context->buildViolation($constraint->uploadFormSizeErrorMessage)
                        ->setCode(UPLOAD_ERR_FORM_SIZE)
                        ->addViolation();

                    return;
                case UPLOAD_ERR_PARTIAL:
                    $this->context->buildViolation($constraint->uploadPartialErrorMessage)
                        ->setCode(UPLOAD_ERR_PARTIAL)
                        ->addViolation();

                    return;
                case UPLOAD_ERR_NO_FILE:
                    $this->context->buildViolation($constraint->uploadNoFileErrorMessage)
                        ->setCode(UPLOAD_ERR_NO_FILE)
                        ->addViolation();

                    return;
                case UPLOAD_ERR_NO_TMP_DIR:
                    $this->context->buildViolation($constraint->uploadNoTmpDirErrorMessage)
                        ->setCode(UPLOAD_ERR_NO_TMP_DIR)
                        ->addViolation();

                    return;
                case UPLOAD_ERR_CANT_WRITE:
                    $this->context->buildViolation($constraint->uploadCantWriteErrorMessage)
                        ->setCode(UPLOAD_ERR_CANT_WRITE)
                        ->addViolation();

                    return;
                case UPLOAD_ERR_EXTENSION:
                    $this->context->buildViolation($constraint->uploadExtensionErrorMessage)
                        ->setCode(UPLOAD_ERR_EXTENSION)
                        ->addViolation();

                    return;
                default:
                    $this->context->buildViolation($constraint->uploadErrorMessage)
                        ->setCode($value->getError())
                        ->addViolation();

                    return;
            }
        }

        if (!is_scalar($value) && !$value instanceof FileObject && !(\is_object($value) && method_exists($value, '__toString'))) {
            throw new UnexpectedTypeException($value, 'string');
        }

        $path = $value instanceof FileObject ? $value->getPathname() : (string) $value;

        if (!is_file($path)) {
            $this->context->buildViolation($constraint->notFoundMessage)
                ->setParameter('{{ file }}', $this->formatValue($path))
                ->setCode(File::NOT_FOUND_ERROR)
                ->addViolation();

            return;
        }

        if (!is_readable($path)) {
            $this->context->buildViolation($constraint->notReadableMessage)
                ->setParameter('{{ file }}', $this->formatValue($path))
                ->setCode(File::NOT_READABLE_ERROR)
                ->addViolation();

            return;
        }

        $sizeInBytes = filesize($path);

        if (0 === $sizeInBytes) {
            $this->context->buildViolation($constraint->disallowEmptyMessage)
                ->setParameter('{{ file }}', $this->formatValue($path))
                ->setCode(File::EMPTY_ERROR)
                ->addViolation();

            return;
        }

        if ($constraint->maxSize) {
            $limitInBytes = $constraint->maxSize;

            if ($sizeInBytes > $limitInBytes) {
                list($sizeAsString, $limitAsString, $suffix) = $this->factorizeSizes($sizeInBytes, $limitInBytes, $constraint->binaryFormat);
                $this->context->buildViolation($constraint->maxSizeMessage)
                    ->setParameter('{{ file }}', $this->formatValue($path))
                    ->setParameter('{{ size }}', $sizeAsString)
                    ->setParameter('{{ limit }}', $limitAsString)
                    ->setParameter('{{ suffix }}', $suffix)
                    ->setCode(File::TOO_LARGE_ERROR)
                    ->addViolation();

                return;
            }
        }

        if ($constraint->mimeTypes) {
            if (!$value instanceof FileObject) {
                $value = new FileObject($value);
            }

            $mimeTypes = (array) $constraint->mimeTypes;
            $mime = $value->getMimeType();

            foreach ($mimeTypes as $mimeType) {
                if ($mimeType === $mime) {
                    return;
                }

                if ($discrete = strstr($mimeType, '/*', true)) {
                    if (strstr($mime, '/', true) === $discrete) {
                        return;
                    }
                }
            }

            $this->context->buildViolation($constraint->mimeTypesMessage)
                ->setParameter('{{ file }}', $this->formatValue($path))
                ->setParameter('{{ type }}', $this->formatValue($mime))
                ->setParameter('{{ types }}', $this->formatValues($mimeTypes))
                ->setCode(File::INVALID_MIME_TYPE_ERROR)
                ->addViolation();
        }
    }

    private static function moreDecimalsThan($double, $numberOfDecimals)
    {
        return \strlen((string) $double) > \strlen(round($double, $numberOfDecimals));
    }

    /**
     * Convert the limit to the smallest possible number
     * (i.e. try "MB", then "kB", then "bytes").
     */
    private function factorizeSizes($size, $limit, $binaryFormat)
    {
        if ($binaryFormat) {
            $coef = self::MIB_BYTES;
            $coefFactor = self::KIB_BYTES;
        } else {
            $coef = self::MB_BYTES;
            $coefFactor = self::KB_BYTES;
        }

        $limitAsString = (string) ($limit / $coef);

        // Restrict the limit to 2 decimals (without rounding! we
        // need the precise value)
        while (self::moreDecimalsThan($limitAsString, 2)) {
            $coef /= $coefFactor;
            $limitAsString = (string) ($limit / $coef);
        }

        // Convert size to the same measure, but round to 2 decimals
        $sizeAsString = (string) round($size / $coef, 2);

        // If the size and limit produce the same string output
        // (due to rounding), reduce the coefficient
        while ($sizeAsString === $limitAsString) {
            $coef /= $coefFactor;
            $limitAsString = (string) ($limit / $coef);
            $sizeAsString = (string) round($size / $coef, 2);
        }

        return array($sizeAsString, $limitAsString, self::$suffices[$coef]);
    }
}

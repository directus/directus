import Color from 'color';
import { hexToHsluv, hsluvToHex } from 'hsluv';
import { clamp } from 'lodash';

// RGB values to gamma-encoded linear values
// Courtesy of (Myndex) https://stackoverflow.com/a/56678483/3630431
function sRGBtoLin(colorChannel: number) {
	// Send this function a decimal sRGB gamma encoded color value
	// between 0.0 and 1.0, and it returns a linearized value.
	if (colorChannel <= 0.04045) {
		return colorChannel / 12.92;
	} else {
		return Math.pow((colorChannel + 0.055) / 1.055, 2.4);
	}
}

// Luminance values to percieved lightness
// Courtesy of (Myndex) https://stackoverflow.com/a/56678483/3630431
function YtoLstar(Y: number) {
	if (Y <= 216 / 24389) {
		return Y * (24389 / 27);
	} else {
		return Math.pow(Y, 1 / 3) * 116 - 16;
	}
}

/**
 * Returns value 0 - 1, representing the specific color's sensitivity to changes in
 * perceptual luminosity (i.e. the L* in L*A*B*). Result loosely models the perceived
 * difference for each percent of increase. Not exactly a contrast calculation, but
 * similar in nature.
 *
 * @param r RGB red channel: 0 - 255
 * @param g RGB green channel: 0 - 255
 * @param b RGB blue channel: 0 - 255
 */
function normalizedLumSensitivity(r: number, g: number, b: number) {
	const coR = 0.2126729;
	const coG = 0.7151522;
	const coB = 0.072175;

	const lumR = sRGBtoLin(r / 255) * coR;
	const lumG = sRGBtoLin(g / 255) * coG;
	const lumB = sRGBtoLin(b / 255) * coB;

	return YtoLstar(lumR + lumG + lumB) / 100;
}

/**
 * @param baseColor        Source color
 * @param darken           If true, luminance will decrease. If false, it will increase.
 * @param targetDifference Target luminance shift
 * @returns {string}       Hex color string
 */
export function generateAccent(baseColor: string, darken = true, targetDifference = 5.76) {
	// Ensure we're using the same base color (The hsluv package converts 3 and 4 character hex incorrectly)
	const baseColorObj = Color(baseColor);

	// RGB array for calculating a less-than-accurate approximation of luminance
	const baseInRGB = baseColorObj.rgb().array();

	const [baseR, baseG, baseB] = baseInRGB;

	// Human-friendly, perceptual implementation of HSL
	const baseInHSLuv = hexToHsluv(baseColorObj.hex());

	const requiredShift = targetDifference / normalizedLumSensitivity(baseR, baseG, baseB);

	baseInHSLuv[2] -= requiredShift * (darken ? 1 : -1);

	/**
	 * Shift hue of accent colors whose base hue falls within the range of 260˚-355˚.
	 * Shift amount is between 0˚ & 15˚ forward. The shift increases exponentially,
	 * relative to the strength of the RGB red channel.
	 */
	if (baseInHSLuv[0] > 260 && baseInHSLuv[0] < 355) {
		const linearRedChannel = sRGBtoLin(baseInRGB[0] / 255);
		baseInHSLuv[0] += Math.pow(linearRedChannel, 2) * 15;
	}

	return hsluvToHex(baseInHSLuv);
}

/**
 * @param baseColor       Source color
 * @param backgroundColor Background color
 * @param weight          Amount of base color to mix into background
 * @param targetLumShift  Number -100 to 100, representing target shift in luminosity
 *                        of output color, relative to background color.
 * @returns {string}      Hex color string
 */
export function generateSubtle(baseColor: string, backgroundColor: string, weight = 0.1, targetLumShift = -5) {
	// If no difference, return
	if (baseColor === backgroundColor) return baseColor;

	// Ensure we're using the same background color (The hsluv package converts 3 and 4 character hex incorrectly)
	const bgColorObj = Color(backgroundColor);

	/**
	 * Lab isn't quite as nice perceptually as HSLuv, however, it's easier to work with
	 * using the tools available in Color. As well, since we're typically mixing background
	 * colors on either side of the spectrum (very light or very dark), the perceptual aspect
	 * isn't quite as important as the accent color, which frequently approximates in
	 * the mid ranges.
	 */
	const baseInLab = Color(baseColor).lab();
	const bgInLab = bgColorObj.lab();

	const mixAtWght = bgInLab.mix(baseInLab, weight);

	/**
	 * Now that we have the mix color, we need to adjust the luminosity to
	 * match the target shift, as accurately as possible.
	 */

	/**
	 * Convert to HSLuv to maintain perceptual luminosity, without compromising
	 * hue and saturation when we shift the luminosity.
	 */
	const mixInHSLuv = hexToHsluv(mixAtWght.hex());
	const bgInHSLuv = hexToHsluv(bgColorObj.hex());

	const bgLum = bgInHSLuv[2];

	const maxLumShift = 100 - bgLum;
	const minLumShift = bgLum * -1;

	const lumShift = clamp(targetLumShift, minLumShift, maxLumShift);

	const targetLum = bgLum + lumShift;

	mixInHSLuv[2] = targetLum;

	const newColor = hsluvToHex(mixInHSLuv);

	return newColor;
}

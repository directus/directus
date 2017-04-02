define([], function() {

  /**
   * Color object factory
   * @param {String|Array} color
   * @param {String} type hex | rgb | hsl
   * @returns {Object|Boolean} Color object or false if invalid value
   *
   * Usage:
   * Color('333', 'rgb'); // false
   * Color('000', 'hex').toRGB(); // [0, 0, 0]
   * Color([25, 70, 17], 'hsl').toHEX(); // 4A260D
   */
  function Color(color, type) {
    var me = arguments.callee;

    if(!(this instanceof me)) {
      if (!color || !type) return false;
      if (!isValid(color, type)) return false;
      return new me(arguments[0], arguments[1]);
    } else {
      this.rgb = convertToRgb(color, type);
      this.hsl = convertRgbtoHsl(this.rgb);
      this.hex = convertRgbtoHex(this.rgb);
    }
  }

  // Validation functionality
  // ---------------------------------------------------------------------------

  /**
   * Check if color is valid based on type
   * @param  {String|Array}  color
   * @param  {String}  type  hex | rgb | hsl
   * @return {Boolean}
   */
  function isValid(color, type) {
    var validate;
    switch(type) {
      case 'hex':
        validate = isValidHex;
        break;
      case 'rgb':
        validate = isValidRgb;
        break;
      case 'hsl':
        validate = isValidHSL;
        break;
    }
    return validate(color);
  }

  /**
   * Validates hex value
   * @param  {String} color hex color value
   * @return {Boolean}
   */
  function isValidHex(color) {
    if(!color || typeof color !== 'string') return false;

    // Validate hex values
    if(color.substring(0, 1) === '#') color = color.substring(1);

    return [3, 4, 6, 8].some(testColor);

    function testColor(chars) {
      var regex = new RegExp('^[0-9A-F]{' + chars + '}$', 'i');
      return regex.test(color)
    }
  }

  /**
   * Validates RGB(a) value
   * @param  {Array} [r, g, b, (a)]
   * @return {Boolean}
   */
  function isValidRgb(color) {
    if (!Array.isArray(color)) return false;
    if (!color.every(isNumber)) return false;

    var alpha = color[3] || 1;

    var regex = /\b(1?[0-9]{1,2}|2[0-4][0-9]|25[0-5])\b/;
    if(
      regex.test(color[0]) &&
      regex.test(color[1]) &&
      regex.test(color[2]) &&
      alpha >= 0 && alpha <= 1
    ) return true;

    return false;
  }

  /**
   * Validates HSL(a)
   * @param  {Array} color [h, s, l, (a)]
   * @return {Boolean}
   */
  function isValidHSL(color) {
    if (!Array.isArray(color)) return false;
    if (!color.every(isNumber)) return false;

    var alpha = color[3] || 1;

    if(
      color[0] >= 0 && color[0] <= 360 &&
      color[1] >= 0 && color[1] <= 100 &&
      color[2] >= 0 && color[2] <= 100 &&
      alpha >= 0 && alpha <= 1
    ) return true;

    return false;
  }

  // Conversion functionality
  // ---------------------------------------------------------------------------

  /**
   * Converts hex or hsl value to rgb
   * @param  {Array|String} color
   * @param  {String} type hex | hsl
   * @return {Array} rgb color
   */
  function convertToRgb(color, type) {
    if (type === 'rgb') return color;

    if (type === 'hex') return convertHexToRgb(color);
    if (type === 'hsl') return convertHslToRgb(color);
  }

  /**
   * Converts hex value (without #) to rgb(a) object
   * @param  {String} hex 3, 6 or 8 digit hex (without #)
   * @return {Object} rgba values
   */
  function convertHexToRgb(hex) {
    var rgba = [];
    var alphaValue;

    // Convert length === 3 to length === 6
    if(hex.length === 3) {
      var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
      hex = hex.replace(shorthandRegex, function(m, r, g, b) {
        return r + r + g + g + b + b;
      });
    }

    // Convert length === 4 to length === 8
    if(hex.length === 4) {
      var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])([a-f\d])$/i;
      hex = hex.replace(shorthandRegex, function(m, r, g, b, a) {
        return r + r + g + g + b + b + a + a;
      });
    }

    // Save alpha value to object and remove last two characters (alpha)
    if(hex.length === 8) {
      alphaValue = convertRange(parseInt(hex.substring(hex.length - 2), 16), { min: 0, max: 255 }, { min: 0, max: 1 });
      hex = hex.substring(0, hex.length - 2);
    }

    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    rgba[0] = parseInt(result[1], 16);
    rgba[1] = parseInt(result[2], 16);
    rgba[2] = parseInt(result[3], 16);

    if (alphaValue) {
      rgba[3] = alphaValue;
    }
    return rgba;
  }

  /**
   * Convert HSL color to RGB
   * @param  {Array} color
   * @return {Array} RGB color
   */
  function convertHslToRgb(color) {
    // Convert HSL ranges to [0-1]
    h = convertRange(color[0], { min: 0, max: 360 }, { min: 0, max: 1 });
    s = color[1] / 100;
    l = color[2] / 100;

    if(s === 0) {
      r = g = b = l;
    } else {
      var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      var p = 2 * l - q;
      r = hueToRgb(p, q, h + 1 / 3);
      g = hueToRgb(p, q, h);
      b = hueToRgb(p, q, h - 1 / 3);
    }

    var output = [
      Math.round(r * 255),
      Math.round(g * 255),
      Math.round(b * 255)
    ];

    if (color[3]) output.push(color[3]);

    return output;
  }

  /**
   * Converts RGB color to Hex representation
   * @param  {Array} color [r, g, b, (a)]
   * @return {String} hex color
   */
  function convertRgbtoHex(color) {
    var hexValue = toHex(color[0]) + toHex(color[1]) + toHex(color[2]);

    if(color[3] !== undefined) {
      var a = Math.round(convertRange(color[3], { min: 0, max: 1 }, { min: 0, max: 255 }));
      hexValue += toHex(a);
    }

    return hexValue;

    function toHex(c) {
      var hex = c.toString(16);
      return hex.length == 1 ? '0' + hex : hex;
    }
  }

  /**
   * Converts RGB to HSL
   * @param  {Array} color [r, g, b, (a)]
   * @return {Array} color [h, s, l, (a)]
   */
  function convertRgbtoHsl(color) {
    var r = color[0] / 255;
    var g = color[1] / 255;
    var b = color[2] / 255;

    var max = Math.max(r, g, b);
    var min = Math.min(r, g, b);

    var hue;
    var saturation;
    var lightness = (max + min) / 2;

    if(max === min) {
      hue = saturation = 0;
    } else {
      var delta = max - min;
      saturation = lightness > 0.5 ? delta / (2 - max - min) : delta / (max + min);
      switch(max) {
        case r:
          hue = (g - b) / delta + (g < b ? 6 : 0);
          break;
        case g:
          hue = (b - r) / delta + 2;
          break;
        case b:
          hue = (r - g) / delta + 4;
          break;
      }

      hue = hue / 6;
    }

    var output = [
      Math.round(convertRange(hue, { min: 0, max: 1 }, { min: 0, max: 360 })),
      Math.round(saturation * 100),
      Math.round(lightness * 100),
    ];

    if (color[3]) output.push(color[3]);

    return output;
  }

  // Utilities
  // ---------------------------------------------------------------------------

  /**
   * Checks if value is number
   * @param  {*} value
   * @return {Boolean}
   */
  function isNumber(value) {
    return typeof value === 'number';
  }

  /**
  * Convert value from one range to another
  * @param {Number} value value to convert
  * @param {Object} oldRange min, max of values range
  * @param {Object} newRange min, max of desired range
  * @return {Number} value converted to other range
  */
  function convertRange(value, oldRange, newRange) {
    return ((value - oldRange.min) * (newRange.max - newRange.min)) / (oldRange.max - oldRange.min) + newRange.min;
  }

  /**
   * Convert Hue to RGB value
   */
  function hueToRgb(p, q, hue) {
    if(hue < 0) hue += 1;
    if(hue > 1) hue -= 1;
    if(hue < 1 / 6) return p + (q - p) * 6 * hue;
    if(hue < 1 / 2) return q;
    if(hue < 2 / 3) return p + (q - p) * (2 / 3 - hue) * 6;
    return p;
  }

  return Color;
});

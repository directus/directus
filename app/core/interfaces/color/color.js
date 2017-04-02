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
      this.color = color;
    }
  }

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
        validate = isValidRGB;
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

    switch(color.length) {
      case 3: return /^[0-9A-F]{3}$/i.test(color);
      case 6: return /^[0-9A-F]{6}$/i.test(color);
      case 8: return /^[0-9A-F]{8}$/i.test(color);
      default: return false;
    }

    return false;
  }

  /**
   * Validates RGB(a) value
   * @param  {Array} [r, g, b, (a)]
   * @return {Boolean}
   */
  function isValidRGB(color) {
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

  /**
   * Checks if value is number
   * @param  {*} value
   * @return {Boolean}
   */
  function isNumber(value) {
    return typeof value === 'number';
  }

  return Color;
});

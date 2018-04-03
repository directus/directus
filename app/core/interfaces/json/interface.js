define(['core/UIView'], function (UIView) {
  return UIView.extend({
    template: 'json/input',
    events: {
      'keydown textarea': 'process',
      'keyup textarea': 'onKeyUp',
      'input textarea': 'onInputChange',
      'click .interface_json_example': 'fillWithExample'
    },
    change: 0,
    lastValue: '',
    onKeyUp: function (event) {
      this.updateValue(event.currentTarget.value);
    },
    onInputChange: function (event) {
      this.updateValue(event.currentTarget.value);
    },
    process: function (event) {
      var textarea = event.target;

      this.change = textarea.value.length - this.lastValue.length;
      var caret = textarea.selectionStart;

      var code = event.keyCode;
      var value = textarea.value;
      var before = value.substr(0, caret);
      var after = value.substr(caret);
      var lastChar = before.trim().slice(-1);
      var nextChar = after.substr(0, 1);

      // Enter key
      if (Number(code) === 13) {
        var previousLine = this.getPreviousLine(before);
        var indents = this.isIndented(previousLine);

        var more = nextChar === '}' ? -1 : 0;

        if (lastChar === '{' || lastChar === '[') {
          more = nextChar === '}' || nextChar === ']' ? 0 : 1;
          this.addIndent(before, after, indents + more);
        }

        if (indents + more > 0) {
          this.addIndent(before, after, indents + more);
        }

        event.preventDefault();
        return false;
      }

      // ] or } key
      if (Number(code) === 221) {
        this.removeIndent(before, after);
      }
    },

    updateValue: function (newValue) {
      this.validate(newValue);
      this.model.set(this.name, newValue);
    },

    validate: function (value) {
      var target = this.$('#' + this.name).get(0);

      if (!value || !target) {
        return;
      }

      if (value.length === 0) {
        return target.classList.remove('invalid');
      }

      var success = true;

      try {
        JSON.parse(value);
      } catch (err) {
        success = false;
      }

      if (success) {
        target.classList.remove('invalid');
      } else {
        target.classList.add('invalid');
      }
    },

    getPreviousLine: function (before) {
      var textarea = this.$('textarea')[0];
      var lines = textarea.value.split(/\n/g);
      var line = before.trimRight().split(/\n/g).length - 1;

      return lines[line] || '';
    },

    isIndented: function (line) {
      var indent = this.options.settings.get('indent');
      var regex = new RegExp('^(' + indent + '+)', 'g');
      var match = line.match(regex);

      return (match && match[0].length / indent.length) || 0;
    },

    addIndent: function (before, after, num) {
      var textarea = this.$('textarea')[0];
      var indent = this.options.settings.get('indent');

      if (!num) {
        return;
      }

      textarea.value = before + '\n' + indent.repeat(num) + after;
      this.lastValue = before + '\n' + indent.repeat(num) + after;
      textarea.selectionStart = this.lastValue.length - after.length;
      textarea.selectionEnd = this.lastValue.length - after.length;
    },

    removeIndent: function (before, after) {
      var textarea = this.$('textarea')[0];
      var indent = this.options.settings.get('indent');
      var remove = before.slice(before.length - indent.length, before.length);

      if (remove !== indent) {
        return;
      }

      textarea.value = before.slice(0, -indent.length) + after;
      this.lastValue = before.slice(0, -indent.length) + after;
      textarea.selectionStart = before.length - indent.length;
      textarea.selectionEnd = before.length - indent.length;
    },

    fillWithExample: function (event) {
      var textarea = this.$('textarea')[0];

      var value = JSON.stringify({
        value1: 'Option One',
        value2: 'Option Two',
        value3: 'Option Three'
      }, null, '   ');

      textarea.value = value;

      event.preventDefault();

      this.model.set(this.name, value);

      return false;
    },

    serialize: function () {
      // Beautify JSON
      var value;

      if (this.options.value) {
        try {
          value = JSON.stringify(JSON.parse(this.options.value), null, this.options.settings.get('indent'));
        } catch (err) {
          value = this.options.value;
        }
      }

      return {
        value: value,
        name: this.options.name,
        rows: this.options.settings.get('rows'),
        placeholder: this.options.settings.get('placeholder'),
        readOnly: this.options.settings.get('read_only') || !this.options.canWrite
      };
    },

    afterRender: function () {
      this.validate(this.model.get(this.name));
    }
  });
});

define(['core/UIView'], function (UIView) {
  return UIView.extend({
    template: 'json/input',
    events: {
      'keydown textarea': 'process',
      'keyup textarea': 'validate'
    },
    change: 0,
    lastValue: '',
    process: function (event) {
      var textarea = event.target;

      this.change = textarea.value.length - this.lastValue.length;

      var caret = textarea.selectionStart;
      var added = this.change > 0 && textarea.value.substr(caret - this.change, this.change) || '';
      var removed = this.change < 0 && this.lastValue.substr(caret, -this.change) || '';

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

    validate: function (event) {
      // Set changed flag
      this.model.set(this.name, event.target.value);

      var textarea = event.target;
      var value = textarea.value;
      if (value.length === 0) {
        return this.clearError();
      }

      this.validateJSON(value)
        .then(this.clearError)
        .catch(this.showError);
    },

    getPreviousLine: function (before) {
      var textarea = this.$('textarea')[0];
      var lines = textarea.value.split(/\n/g);
      var line = before.trimRight().split(/\n/g).length - 1;
      return lines[line] || '';
    },

    isIndented: function (line) {
      var indent = this.options.settings.get('indent');
      var textarea = this.$('textarea')[0];
      var regex = new RegExp('^(' + indent + '+)', 'g');
      var match = line.match(regex);
      return match && match[0].length / indent.length || 0;
    },

    addIndent: function (before, after, num) {
      var textarea = this.$('textarea')[0];
      var indent = this.options.settings.get('indent');

      if (!num) {
        return;
      }

      textarea.value = this.lastValue = before + '\n' + indent.repeat(num) + after;
      textarea.selectionStart = textarea.selectionEnd = this.lastValue.length - after.length;
    },

    removeIndent: function (before, after) {
      var textarea = this.$('textarea')[0];
      var indent = this.options.settings.get('indent');

      var remove = before.slice(before.length - indent.length, before.length);
      if (remove !== indent) {
        return;
      }

      textarea.value = this.lastValue = before.slice(0, -indent.length) + after;
      textarea.selectionStart = textarea.selectionEnd = before.length - indent.length;
    },

    validateJSON: function (string) {
      return new Promise(function (resolve, reject) {
        try {
          JSON.parse(string);
          resolve();
        } catch (err) {
          reject(err);
        }
      });
    },

    clearError: function () {
      var textarea = this.$('textarea')[0];
      textarea.classList.remove('invalid');
    },

    showError: function () {
      var textarea = this.$('textarea')[0];
      textarea.classList.add('invalid');
    },

    serialize: function () {
      // Beautify JSON
      var value;
      if (this.options.value) {
        try {
          value = JSON.stringify(JSON.parse(this.options.value), null, this.options.settings.get('indent'));
        } catch (error) {
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
    }
  });
});

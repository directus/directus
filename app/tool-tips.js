define([
  "app",
  "backbone"
], function(app, Backbone) {

  "use strict";

  var tipManager;

  // Default Error View
  var ToolTip = Backbone.Layout.extend({

        showDetails: false,

        el: '#tool-tips',

        template: 'tool-tips',

        afterRender: function() {
          tipManager.init();
        }

     });

     tipManager = (function() {
        var tipsOn = false,
            tipPointerClass = 'tool-tip-pointer',
            positions = {
                top: 'top',
                bottom: 'bottom',
                left: 'left',
                right: 'right'
            },
            $helpButton,
            $toolTips,
            $elementsToToggle;

        function initToolTips() {
            //$helpButton = $helpButton || $(".global-help");
            $toolTips = $("[data-tool-tip-for]");
            $elementsToToggle = $('[data-tool-tip-toggle-class]');

            //console.log('init called');

            $toolTips.each(function(index, value) {
                var $toolTip = $(this),
                    toolSelector = $toolTip.data("tool-tip-for"),
                    $ttTarget = $(toolSelector),
                    $pointer;

                $toolTip.append('<span class="' + tipPointerClass + '"></span>');
                $pointer = $toolTip.find('.' + tipPointerClass);
                setPosition($toolTip);
                setPointerSize($pointer, $toolTip);
                $toolTip.data("nudge-x") || $toolTip.data("nudge-x", 0);
                $toolTip.data("nudge-y") || $toolTip.data("nudge-y", 0);
                $toolTip.data("offset-x") || $toolTip.data("offset-x", 0);
                $toolTip.data("offset-y") || $toolTip.data("offset-y", 0);
                $toolTip.data("width") ? $toolTip.width($toolTip.data("width")) : null;
                $toolTip.data("height") ? $toolTip.width($toolTip.data("height")) : null;
                offsetPointer($pointer, $toolTip);

                // Use IIFE to capture $ttTarget
                (function() {
                  var tipTimer;

                  $(document).on("mouseenter", $ttTarget.selector,  function() {
                      tipTimer = setTimeout(function() {
                        //console.log($ttTarget.selector);
                          positionToolTip($ttTarget.selector, $toolTip);
                          $toolTip.show();
                      }, 500);
                  }).on("mouseleave click", $ttTarget.selector, function() {
                      clearTimeout(tipTimer);
                      $toolTip.hide();
                  });
                })();

            });
        }

        function setPointerSize($pointer, $toolTip) {
            var borderWidths = $pointer.css(['border-top-width', 'border-right-width', 'border-bottom-width', 'border-left-width']),
                widthArray = [
                parseInt(borderWidths['border-top-width'], 10), parseInt(borderWidths['border-right-width'], 10), parseInt(borderWidths['border-bottom-width'], 10), parseInt(borderWidths['border-left-width'], 10)];
            $toolTip.data('tool-tip-pointer-size', Math.max(widthArray[0], widthArray[1], widthArray[2], widthArray[3]));
        }

        function setPosition($toolTip) {
            var position = positions.bottom;
            if ($toolTip.hasClass(positions.top)) {
                position = positions.top;
            }
            if ($toolTip.hasClass(positions.left)) {
                position = positions.left;
            }
            if ($toolTip.hasClass(positions.right)) {
                position = positions.right;
            }
            $toolTip.data('tool-tip-position', position);
            $toolTip.addClass(position);
            //return positions.bottom;
        }

        function offsetPointer($pointer, $toolTip) {
            if ($toolTip.data("offset-x")) {
                $pointer.css('margin-left', parseInt($pointer.css('margin-left'), 10) - $toolTip.data("offset-x"));
            }
            if ($toolTip.data("offset-y")) {
                $pointer.css('margin-top', parseInt($pointer.css('margin-top'), 10) - $toolTip.data("offset-y"));
            }
        }

        function positionToolTip(ttTarget, $toolTip) {
            var elementOffset, cssOptions, toolTipPointerSize;
            //console.log($ttTarget, $toolTip);
            var $ttTarget = _.isString(ttTarget) ? $(ttTarget) : ttTarget;

            function horizontalCenter() {
                return (($ttTarget.outerWidth() - $toolTip.outerWidth()) / 2) + elementOffset.left + $toolTip.data("offset-x");
            }

            function verticalCenter() {
                return (($ttTarget.outerHeight() - $toolTip.outerHeight()) / 2) + elementOffset.top + $toolTip.data("offset-y");
            }
            if ($ttTarget.length > 0) {
                elementOffset = $ttTarget.offset();
                cssOptions = {
                    position: $toolTip.data("fixed") ? "fixed" : "",
                    zIndex: $toolTip.data("fixed") ? "100" : ""
                };
                toolTipPointerSize = $toolTip.data('tool-tip-pointer-size');
                if ($toolTip.data("fixed")) {
                    elementOffset.top -= $window.scrollTop();
                }
                switch ($toolTip.data('tool-tip-position')) {
                case positions.top:
                    cssOptions.top = elementOffset.top - $toolTip.outerHeight() - toolTipPointerSize;
                    cssOptions.left = horizontalCenter();
                    break;
                case positions.bottom:
                    cssOptions.top = elementOffset.top + $ttTarget.outerHeight() + toolTipPointerSize;
                    cssOptions.left = horizontalCenter();
                    break;
                case positions.left:
                    cssOptions.top = verticalCenter();
                    cssOptions.left = elementOffset.left - $toolTip.outerWidth() - toolTipPointerSize;
                    break;
                case positions.right:
                    cssOptions.top = verticalCenter();
                    cssOptions.left = elementOffset.left + $ttTarget.outerWidth() + toolTipPointerSize;
                    break;
                }
                cssOptions.top += $toolTip.data("nudge-y");
                cssOptions.left += $toolTip.data("nudge-x");
                $toolTip.css(cssOptions);
            } else {
                $toolTip.hide();
            }
        }

        return {
          init: initToolTips
        };
    })();

    return ToolTip;
});
//   @extraLightGrey: #f4f4f4; // Extra Light Gray – previously #fbfbfb
//   @lightGrey: #ececec; // Light Grey
//   @mediumGrey: #bbbbbb; // Medium Grey
//   @darkGrey: #999999; // Dark Grey
//   @extraDarkGrey: #333333; // Extra Dark Grey

//   @fieldColor: lighten(@lightGrey, 2%);

//   @tableHoverYellow: #fffddd;

//   // Actions
//   @addColor: #7ac943;
//   @editColor: #3fa9f5;
//   @deleteColor: #c1272d;
//   @messageColor: #a63c96;
//   @attachColor: #ff7bac;
//   @loginColor: #5b5b5b;
//   @errorColor: #fbb03b;
//   @systemColor: #fdcd30;

//   @openFont: 'Open Sans', sans-serif;
$.noty.themes.directus = {
    name    : 'directus',
    helpers : {},
    modal   : {
        css: {
            position       : 'fixed',
            width          : '100%',
            height         : '100%',
            backgroundColor: '#000',
            zIndex         : 10000,
            opacity        : 0.6,
            display        : 'none',
            left           : 0,
            top            : 0
        }
    },
    style   : function() {

        this.$bar.css({
            overflow    : 'hidden',
            margin      : '4px 0',
            borderRadius: '0',
            width       : '60%',
            border      : '0px solid #fff'
        });

        this.$message.css({
            fontSize  : '14px',
            lineHeight: '16px',
            textAlign : 'center',
            padding   : '10px',
            width     : 'auto',
            position  : 'relative'
        });

        this.$closeButton.css({
            position  : 'absolute',
            top       : 4, right: 4,
            width     : 10, height: 10,
            background: "url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAQAAAAnOwc2AAAAxUlEQVR4AR3MPUoDURSA0e++uSkkOxC3IAOWNtaCIDaChfgXBMEZbQRByxCwk+BasgQRZLSYoLgDQbARxry8nyumPcVRKDfd0Aa8AsgDv1zp6pYd5jWOwhvebRTbzNNEw5BSsIpsj/kurQBnmk7sIFcCF5yyZPDRG6trQhujXYosaFoc+2f1MJ89uc76IND6F9BvlXUdpb6xwD2+4q3me3bysiHvtLYrUJto7PD/ve7LNHxSg/woN2kSz4txasBdhyiz3ugPGetTjm3XRokAAAAASUVORK5CYII=)",
            display   : 'none',
            cursor    : 'pointer'
        });

        this.$buttons.css({
            padding        : 4,
            textAlign      : 'right',
            //borderTop      : '1px solid #ccc',
            backgroundColor: '#fff'
        });

        this.$buttons.find('button').css({
            marginLeft: 5
        });

        this.$buttons.find('button:first').css({
            marginLeft: 0
        });

        this.$bar.on({
            mouseenter: function() {
                $(this).find('.noty_close').stop().fadeTo('normal', 1);
            },
            mouseleave: function() {
                $(this).find('.noty_close').stop().fadeTo('normal', 0);
            }
        });

        switch(this.options.layout.name) {
            case 'top':
                this.$bar.css({
                    borderBottom: '2px solid #eee',
                    borderLeft  : '2px solid #eee',
                    borderRight : '2px solid #eee',
                    borderTop   : '2px solid #eee',
                    boxShadow   : "0 2px 4px rgba(0, 0, 0, 0.1)"
                });
                break;
            case 'topCenter':
            case 'center':
            case 'bottomCenter':
            case 'inline':
                this.$bar.css({
                    border   : '1px solid #eee',
                    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)"
                });
                this.$message.css({fontSize: '13px', textAlign: 'center'});
                break;
            case 'topLeft':
            case 'topRight':
            case 'bottomLeft':
            case 'bottomRight':
            case 'centerLeft':
            case 'centerRight':
                this.$bar.css({
                    border   : '1px solid #eee',
                    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)"
                });
                this.$message.css({fontSize: '13px', textAlign: 'left'});
                break;
            case 'bottom':
                this.$bar.css({
                    borderTop   : '2px solid #eee',
                    borderLeft  : '2px solid #eee',
                    borderRight : '2px solid #eee',
                    borderBottom: '2px solid #eee',
                    boxShadow   : "0 -2px 4px rgba(0, 0, 0, 0.1)"
                });
                break;
            default:
                this.$bar.css({
                    border   : '2px solid #eee',
                    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)"
                });
                break;
        }

        switch(this.options.type) {
            case 'alert':
            case 'notification':
                this.$bar.css({backgroundColor: '#333333', borderColor: '#333333', color: '#FFF', borderBottom: '3px solid #212121'});
                break;
            case 'warning':
                this.$bar.css({backgroundColor: '#fbb03b', borderColor: '#fbb03b', color: '#FFF', borderBottom: '3px solid #e69005'});
                //this.$buttons.css({borderTop: '1px solid #FFC237'});
                break;
            case 'error':
                this.$bar.css({backgroundColor: '#c1272d', borderColor: '#c1272d', color: '#FFF', borderBottom: '3px solid #981f23'});
                //this.$message.css({fontWeight: 'bold'});
                //this.$buttons.css({borderTop: '1px solid darkred'});
                break;
            case 'information':
                this.$bar.css({backgroundColor: '#78C5E7', borderColor: '#78C5E7', color: '#FFF', borderBottom: '3px solid #3badd6'});
                //this.$buttons.css({borderTop: '1px solid #0B90C4'});
                break;
            case 'success':
                this.$bar.css({backgroundColor: '#7ac943', borderColor: '#7ac943', color: '#FFF', borderBottom: '3px solid #62a930'});
                //this.$buttons.css({borderTop: '1px solid #50C24E'});
                break;
            default:
                this.$bar.css({backgroundColor: '#FFF', borderColor: '#CCC', color: '#444', borderBottom: '3px solid #981f23'});
                break;
        }
    },
    callback: {
        onShow : function() {

        },
        onClose: function() {

        }
    }
};
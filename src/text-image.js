(function () {
    var pre = document.createElement('pre'),
        canvas = document.createElement('canvas'),
        context = canvas.getContext('2d'),
        _style = {
            font: 'Sans-serif',
            align: 'left',
            color: '#000000',
            size: 16,
            background: '#FFFFFF',
            stroke: 0,
            strokeColor: '#FFFFFF',
            lineHeight: '1.2em',
            bold: false,
            italic: false,
            padding: 20,
            paddingTop: null,
            paddingRight: null,
            paddingBottom: null,
            paddingLeft: null,
            wordWrap: true,
            maxWidth: 600
        },
        preStyle = ';padding: 0; display: block; position: fixed; top: 100%; overflow: hidden;',
        fn;

    window.TextImage = function (style) {
        if (!(this instanceof TextImage)) {
            return new TextImage(style);
        }
        this.setStyle(style);
        return this;
    }

    fn = window.TextImage.prototype;

    fn.setStyle = function (style) {
        this.style = style || {};
        for (var key in _style) {
            // Use hasOwnProperty and check for undefined to allow null values
            if (!this.style.hasOwnProperty(key) || this.style[key] === undefined) {
                this.style[key] = _style[key];
            }
        }
        this._style = 'font: ';
        if (this.style.italic) {
            this._style += 'italic ';
        }
        if (this.style.bold) {
            this._style += 'bold ';
        }
        this._style += this.style.size + 'pt ' + this.style.font + ';';
        this._style += 'line-height:' + this.style.lineHeight + ';';
        this._style += 'text-align: ' + this.style.align + ';';
        this._style += 'color: ' + this.style.color + ';';
        this._style += 'background-color: ' + this.style.background + ';';
        this._style += preStyle;
        return this;
    }

    fn.toDataURL = function (message) {
        if (message) {
            convert.call(this, message);
        }
        return canvas.toDataURL();
    }

    fn.toImage = function (message, callback) {
        convert.call(this, message);
        var img = new Image();
        if (callback) {
            img.onload = callback;
        }
        img.src = canvas.toDataURL();
        return img;
    }

    function getPadding(style) {
        return {
            top: style.paddingTop !== null ? style.paddingTop : style.padding,
            right: style.paddingRight !== null ? style.paddingRight : style.padding,
            bottom: style.paddingBottom !== null ? style.paddingBottom : style.padding,
            left: style.paddingLeft !== null ? style.paddingLeft : style.padding
        };
    }

    function wrapText(context, text, maxWidth) {
        var words = text.split(' ');
        var lines = [];
        var currentLine = '';

        for (var i = 0; i < words.length; i++) {
            var word = words[i];
            var testLine = currentLine + (currentLine ? ' ' : '') + word;
            var metrics = context.measureText(testLine);

            if (metrics.width > maxWidth && currentLine) {
                lines.push(currentLine);
                currentLine = word;
            } else {
                currentLine = testLine;
            }
        }

        if (currentLine) {
            lines.push(currentLine);
        }

        return lines;
    }

    function convert(message) {
        message = String(message);

        // Build context font string first (needed for text measurement)
        var context_font = '';
        if (this.style.italic) {
            context_font += 'italic ';
        }
        if (this.style.bold) {
            context_font += 'bold ';
        }
        context_font += this.style.size + 'pt ' + this.style.font;
        context.font = context_font;

        // Get padding values
        var pad = getPadding(this.style);

        // Calculate text area width (maxWidth is total image width including padding)
        var textAreaWidth = this.style.wordWrap && this.style.maxWidth
            ? this.style.maxWidth - pad.left - pad.right
            : null;

        // Process lines - split by newlines first, then optionally word wrap
        var rawLines = message.split('\n');
        var lines = [];

        if (this.style.wordWrap && textAreaWidth) {
            rawLines.forEach(function (line) {
                if (line === '') {
                    lines.push('');
                } else {
                    var wrapped = wrapText(context, line, textAreaWidth);
                    wrapped.forEach(function (wrappedLine) {
                        lines.push(wrappedLine);
                    });
                }
            }.bind(this));
        } else {
            lines = rawLines;
        }

        // Measure text dimensions
        pre.innerText = lines.join('\n');
        pre.setAttribute('style', this._style);
        document.body.append(pre);

        var x = this.style.stroke,
            y = pre.offsetHeight / lines.length,
            base = y * 0.25;

        // Calculate canvas dimensions - maxWidth is total width when word wrap enabled
        var contentWidth = this.style.wordWrap && this.style.maxWidth 
            ? this.style.maxWidth - pad.left - pad.right
            : pre.offsetWidth;
        canvas.width = contentWidth + (x * 2) + pad.left + pad.right;
        canvas.height = pre.offsetHeight + pad.top + pad.bottom;

        context.clearRect(0, 0, canvas.width, canvas.height);
        context.fillStyle = this.style.background;
        context.beginPath();
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.fill();

        // Reset font after canvas resize (canvas resize clears context state)
        context.font = context_font;
        context.textAlign = this.style.align;
        context.lineWidth = this.style.stroke;
        context.strokeStyle = this.style.strokeColor;
        context.fillStyle = this.style.color;

        // Calculate x position based on alignment
        switch (context.textAlign) {
            case 'center':
                x = pad.left + (canvas.width - pad.left - pad.right) / 2;
                break;
            case 'right':
                x = canvas.width - pad.right - this.style.stroke;
                break;
            default: // left
                x = pad.left + this.style.stroke;
                break;
        }

        // Draw text lines with padding offset
        lines.forEach(function (line, i) {
            var yPos = pad.top + y * (i + 1) - base;
            if (this.style.stroke) {
                context.strokeText(line, x, yPos);
            }
            context.fillText(line, x, yPos);
        }.bind(this));

        document.body.removeChild(pre);
    }
})();

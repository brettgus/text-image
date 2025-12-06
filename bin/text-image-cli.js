#!/usr/bin/env node

const { createCanvas, GlobalFonts } = require('@napi-rs/canvas');
const { program } = require('commander');
const fs = require('fs');
const path = require('path');

// Default style configuration
const defaultStyle = {
    font: 'sans-serif',
    align: 'left',
    color: '#000000',
    size: 16,
    background: '#FFFFFF',
    stroke: 0,
    strokeColor: '#FFFFFF',
    lineHeight: 1.2,
    bold: false,
    italic: false,
    padding: 20,
    paddingTop: null,
    paddingRight: null,
    paddingBottom: null,
    paddingLeft: null,
    wordWrap: true,
    maxWidth: 600
};

function getPadding(style) {
    return {
        top: style.paddingTop !== null ? style.paddingTop : style.padding,
        right: style.paddingRight !== null ? style.paddingRight : style.padding,
        bottom: style.paddingBottom !== null ? style.paddingBottom : style.padding,
        left: style.paddingLeft !== null ? style.paddingLeft : style.padding
    };
}

function wrapText(context, text, maxWidth) {
    const words = text.split(' ');
    const lines = [];
    let currentLine = '';

    // Helper to break a single word that's too long
    function breakWord(word) {
        const brokenLines = [];
        let remaining = word;
        
        while (remaining.length > 0) {
            let fit = '';
            for (let i = 1; i <= remaining.length; i++) {
                const test = remaining.substring(0, i);
                if (context.measureText(test).width > maxWidth) {
                    // Use previous fit, or at least 1 char
                    fit = fit || remaining.substring(0, 1);
                    break;
                }
                fit = test;
            }
            if (fit === remaining) {
                brokenLines.push(remaining);
                break;
            }
            brokenLines.push(fit);
            remaining = remaining.substring(fit.length);
        }
        return brokenLines;
    }

    for (let i = 0; i < words.length; i++) {
        const word = words[i];
        
        // Check if single word is too wide
        if (context.measureText(word).width > maxWidth) {
            // Push current line first if not empty
            if (currentLine) {
                lines.push(currentLine);
                currentLine = '';
            }
            // Break the long word into pieces
            const brokenParts = breakWord(word);
            // Add all but last to lines
            for (let j = 0; j < brokenParts.length - 1; j++) {
                lines.push(brokenParts[j]);
            }
            // Last part becomes current line
            currentLine = brokenParts[brokenParts.length - 1];
            continue;
        }
        
        const testLine = currentLine + (currentLine ? ' ' : '') + word;
        const metrics = context.measureText(testLine);

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

function textToImage(message, style = {}) {
    // Merge with defaults
    const opts = { ...defaultStyle, ...style };
    
    // Build font string
    let fontString = '';
    if (opts.italic) fontString += 'italic ';
    if (opts.bold) fontString += 'bold ';
    fontString += `${opts.size}pt ${opts.font}`;

    // Create temporary canvas for text measurement
    const tempCanvas = createCanvas(1, 1);
    const tempCtx = tempCanvas.getContext('2d');
    tempCtx.font = fontString;

    // Get padding values
    const pad = getPadding(opts);

    // Calculate text area width
    const textAreaWidth = opts.wordWrap && opts.maxWidth
        ? opts.maxWidth - pad.left - pad.right
        : null;

    // Process lines - split by newlines first, then optionally word wrap
    const rawLines = message.split('\n');
    let lines = [];

    if (opts.wordWrap && textAreaWidth) {
        rawLines.forEach(line => {
            if (line === '') {
                lines.push('');
            } else {
                const wrapped = wrapText(tempCtx, line, textAreaWidth);
                wrapped.forEach(wrappedLine => lines.push(wrappedLine));
            }
        });
    } else {
        lines = rawLines;
    }

    // Calculate dimensions
    const lineHeight = opts.size * opts.lineHeight;
    
    // Measure max line width
    let maxLineWidth = 0;
    lines.forEach(line => {
        const metrics = tempCtx.measureText(line);
        if (metrics.width > maxLineWidth) {
            maxLineWidth = metrics.width;
        }
    });

    const contentWidth = opts.wordWrap && opts.maxWidth
        ? opts.maxWidth - pad.left - pad.right
        : maxLineWidth;

    const canvasWidth = contentWidth + (opts.stroke * 2) + pad.left + pad.right;
    const canvasHeight = (lineHeight * lines.length) + pad.top + pad.bottom;

    // Create actual canvas
    const canvas = createCanvas(canvasWidth, canvasHeight);
    const ctx = canvas.getContext('2d');

    // Draw background
    ctx.fillStyle = opts.background;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Set text styles
    ctx.font = fontString;
    ctx.textAlign = opts.align;
    ctx.lineWidth = opts.stroke;
    ctx.strokeStyle = opts.strokeColor;
    ctx.fillStyle = opts.color;
    ctx.textBaseline = 'top';

    // Calculate x position based on alignment
    let x;
    switch (opts.align) {
        case 'center':
            x = pad.left + (canvasWidth - pad.left - pad.right) / 2;
            break;
        case 'right':
            x = canvasWidth - pad.right - opts.stroke;
            break;
        default: // left
            x = pad.left + opts.stroke;
            break;
    }

    // Draw text lines
    lines.forEach((line, i) => {
        const y = pad.top + (lineHeight * i);
        if (opts.stroke) {
            ctx.strokeText(line, x, y);
        }
        ctx.fillText(line, x, y);
    });

    return canvas;
}

// CLI Setup
program
    .name('text-image')
    .description('Convert text to image from the command line')
    .version('0.7.0')
    .argument('[text]', 'Text to convert (use quotes for multi-word text, \\n for newlines)')
    .option('-o, --output <file>', 'Output file path', 'output.png')
    .option('-f, --font <name>', 'Font family', defaultStyle.font)
    .option('-s, --size <number>', 'Font size in points', (v) => parseInt(v, 10), defaultStyle.size)
    .option('-c, --color <hex>', 'Text color (hex)', defaultStyle.color)
    .option('-b, --background <hex>', 'Background color (hex)', defaultStyle.background)
    .option('-w, --max-width <number>', 'Maximum width in pixels', (v) => parseInt(v, 10), defaultStyle.maxWidth)
    .option('-p, --padding <number>', 'Padding in pixels', (v) => parseInt(v, 10), defaultStyle.padding)
    .option('-a, --align <alignment>', 'Text alignment (left, center, right)', defaultStyle.align)
    .option('--bold', 'Bold text', defaultStyle.bold)
    .option('--italic', 'Italic text', defaultStyle.italic)
    .option('--no-word-wrap', 'Disable word wrapping')
    .option('--stroke <number>', 'Stroke width', (v) => parseInt(v, 10), defaultStyle.stroke)
    .option('--stroke-color <hex>', 'Stroke color (hex)', defaultStyle.strokeColor)
    .option('--line-height <number>', 'Line height multiplier', (v) => parseFloat(v), defaultStyle.lineHeight)
    .option('--stdin', 'Read text from stdin instead of argument')
    .action(async (text, options) => {
        try {
            let inputText = text;

            // Handle stdin input
            if (options.stdin) {
                inputText = await readStdin();
            }

            // Validate we have text
            if (!inputText) {
                console.error('Error: Please provide text as an argument or use --stdin');
                process.exit(1);
            }

            // Process escape sequences for newlines
            inputText = inputText.replace(/\\n/g, '\n');

            // Build style object, filtering out undefined values
            const style = {};
            if (options.font !== undefined) style.font = options.font;
            if (options.size !== undefined) style.size = options.size;
            if (options.color !== undefined) style.color = options.color;
            if (options.background !== undefined) style.background = options.background;
            if (options.maxWidth !== undefined) style.maxWidth = options.maxWidth;
            if (options.padding !== undefined) style.padding = options.padding;
            if (options.align !== undefined) style.align = options.align;
            if (options.bold !== undefined) style.bold = options.bold;
            if (options.italic !== undefined) style.italic = options.italic;
            if (options.wordWrap !== undefined) style.wordWrap = options.wordWrap;
            if (options.stroke !== undefined) style.stroke = options.stroke;
            if (options.strokeColor !== undefined) style.strokeColor = options.strokeColor;
            if (options.lineHeight !== undefined) style.lineHeight = options.lineHeight;

            const canvas = textToImage(inputText, style);
            
            // Determine output format
            const outputPath = options.output;
            const ext = path.extname(outputPath).toLowerCase();
            
            let buffer;
            if (ext === '.jpg' || ext === '.jpeg') {
                buffer = canvas.toBuffer('image/jpeg');
            } else {
                buffer = canvas.toBuffer('image/png');
            }

            fs.writeFileSync(outputPath, Buffer.from(buffer));
            console.log(`✓ Image saved to: ${outputPath}`);
            console.log(`  Dimensions: ${canvas.width}x${canvas.height}px`);
        } catch (error) {
            console.error('Error:', error.message);
            process.exit(1);
        }
    });

function readStdin() {
    return new Promise((resolve, reject) => {
        let data = '';
        process.stdin.setEncoding('utf8');
        process.stdin.on('readable', () => {
            let chunk;
            while ((chunk = process.stdin.read()) !== null) {
                data += chunk;
            }
        });
        process.stdin.on('end', () => resolve(data.trim()));
        process.stdin.on('error', reject);
    });
}

program.parse();


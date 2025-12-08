var textImage,
    form,
    textarea,
    imageDisplay,
    imageDownload,
    filenameInput,
    advancedToggle,
    advancedContent;

function generateFilename(text) {
    var words = text.trim().split(/\s+/).slice(0, 4).join('-');
    return words.replace(/[^a-zA-Z0-9\-_]/g, '').substring(0, 50) || 'text-image';
}

function rgbaToHex(rgba) {
    var match = rgba.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (match) {
        var r = parseInt(match[1]).toString(16).padStart(2, '0');
        var g = parseInt(match[2]).toString(16).padStart(2, '0');
        var b = parseInt(match[3]).toString(16).padStart(2, '0');
        return '#' + r + g + b;
    }
    return '#000000';
}

function hexToRgba(hex) {
    var r = parseInt(hex.slice(1, 3), 16);
    var g = parseInt(hex.slice(3, 5), 16);
    var b = parseInt(hex.slice(5, 7), 16);
    return 'rgba(' + r + ', ' + g + ', ' + b + ', 1)';
}

function isTransparent(rgba) {
    return rgba === 'rgba(0, 0, 0, 0)';
}

function setColorValue(targetName, colorValue) {
    var hiddenInput = form.querySelector('input[name="' + targetName + '"]');
    if (hiddenInput) {
        hiddenInput.value = colorValue;
    }
    
    // Update swatch active states in the dropdown
    var dropdown = form.querySelector('.color-dropdown[data-target="' + targetName + '"]');
    if (dropdown) {
        dropdown.querySelectorAll('.swatch').forEach(function(swatch) {
            swatch.classList.remove('active');
            if (swatch.getAttribute('data-color') === colorValue) {
                swatch.classList.add('active');
            }
        });
        
        // Update the preview button
        var preview = dropdown.querySelector('.color-preview');
        if (preview) {
            if (isTransparent(colorValue)) {
                preview.style.background = '';
                preview.classList.add('transparent');
            } else {
                preview.classList.remove('transparent');
                preview.style.background = rgbaToHex(colorValue);
            }
        }
    }
    
    updateImage();
}

function initColorDropdowns() {
    // Toggle dropdown visibility
    form.querySelectorAll('.color-dropdown-btn').forEach(function(btn) {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            var dropdown = this.closest('.color-dropdown');
            var panel = dropdown.querySelector('.color-dropdown-panel');
            
            // Close all other dropdowns
            form.querySelectorAll('.color-dropdown-panel.show').forEach(function(p) {
                if (p !== panel) p.classList.remove('show');
            });
            
            panel.classList.toggle('show');
        });
    });
    
    // Handle swatch clicks (exclude custom swatches)
    form.querySelectorAll('.color-dropdown .swatch:not(.custom-swatch)').forEach(function(swatch) {
        swatch.addEventListener('click', function(e) {
            e.preventDefault();
            var dropdown = this.closest('.color-dropdown');
            var targetName = dropdown.getAttribute('data-target');
            var colorValue = this.getAttribute('data-color');
            
            setColorValue(targetName, colorValue);
            
            // Close dropdown
            dropdown.querySelector('.color-dropdown-panel').classList.remove('show');
        });
    });
    
    // Close dropdowns when clicking outside
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.color-dropdown')) {
            form.querySelectorAll('.color-dropdown-panel.show').forEach(function(panel) {
                panel.classList.remove('show');
            });
        }
    });
    
    // Handle custom color picker
    form.querySelectorAll('.custom-color-input').forEach(function(input) {
        input.addEventListener('input', function() {
            var dropdown = this.closest('.color-dropdown');
            var targetName = dropdown.getAttribute('data-target');
            var colorValue = hexToRgba(this.value);
            setColorValue(targetName, colorValue);
        });
        
        input.addEventListener('change', function() {
            var dropdown = this.closest('.color-dropdown');
            dropdown.querySelector('.color-dropdown-panel').classList.remove('show');
        });
    });
}

function initToggleButtons() {
    form.querySelectorAll('.toggle-btn').forEach(function(btn) {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            var targetName = this.getAttribute('data-target');
            var hiddenInput = form.querySelector('input[name="' + targetName + '"]');
            
            this.classList.toggle('active');
            hiddenInput.value = this.classList.contains('active') ? 'true' : 'false';
            
            updateImage();
        });
    });
}

function initAlignButtons() {
    form.querySelectorAll('.align-btn').forEach(function(btn) {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            var alignValue = this.getAttribute('data-align');
            var hiddenInput = form.querySelector('input[name="font-align"]');
            
            // Remove active from all align buttons
            form.querySelectorAll('.align-btn').forEach(function(b) {
                b.classList.remove('active');
            });
            
            this.classList.add('active');
            hiddenInput.value = alignValue;
            
            updateImage();
        });
    });
}

function initAdvancedToggle() {
    advancedToggle = document.querySelector('.advanced-toggle');
    advancedContent = document.querySelector('.advanced-content');
    
    if (advancedToggle && advancedContent) {
        advancedToggle.addEventListener('click', function() {
            this.classList.toggle('open');
            advancedContent.classList.toggle('show');
        });
    }
}

function initWordWrapToggle() {
    var wordWrapCheckbox = form.querySelector('input[name="word-wrap"]');
    var widthGroup = form.querySelector('.width-group');
    
    function updateWidthState() {
        if (wordWrapCheckbox.checked) {
            widthGroup.classList.remove('disabled');
        } else {
            widthGroup.classList.add('disabled');
        }
    }
    
    wordWrapCheckbox.addEventListener('change', updateWidthState);
    updateWidthState(); // Set initial state
}

function autoResizeTextarea() {
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
}

// Default settings
var defaultSettings = {
    fontFamily: "FontAwesome,'Helvetica Neue',Helvetica,Arial,sans-serif",
    fontSize: '16',
    bold: 'false',
    italic: 'false',
    fontAlign: 'left',
    fontColor: 'rgba(0, 0, 0, 1)',
    backgroundColor: 'rgba(255, 255, 255, 1)',
    padding: '20',
    wordWrap: true,
    maxWidth: '600',
    lineHeight: '1.2',
    lineHeightUnit: 'em',
    stroke: '0',
    strokeColor: 'rgba(255, 255, 255, 1)',
    paddingTop: '',
    paddingRight: '',
    paddingBottom: '',
    paddingLeft: ''
};

// Share link functions
var URL_WARNING_LENGTH = 2000;

function getShareableURL() {
    var settings = {
        fontFamily: form.querySelector('select[name="font-family"]').value,
        fontSize: form.querySelector('input[name="font-size"]').value,
        bold: form.querySelector('input[name="bold"]').value,
        italic: form.querySelector('input[name="italic"]').value,
        fontAlign: form.querySelector('input[name="font-align"]').value,
        fontColor: form.querySelector('input[name="font-color"]').value,
        backgroundColor: form.querySelector('input[name="background-color"]').value,
        padding: form.querySelector('input[name="padding"]').value,
        wordWrap: form.querySelector('input[name="word-wrap"]').checked,
        maxWidth: form.querySelector('input[name="max-width"]').value,
        lineHeight: form.querySelector('input[name="line-height"]').value,
        lineHeightUnit: form.querySelector('select[name="line-height-unit"]').value,
        stroke: form.querySelector('input[name="stroke"]').value,
        strokeColor: form.querySelector('input[name="stroke-color"]').value,
        paddingTop: form.querySelector('input[name="padding-top"]').value,
        paddingRight: form.querySelector('input[name="padding-right"]').value,
        paddingBottom: form.querySelector('input[name="padding-bottom"]').value,
        paddingLeft: form.querySelector('input[name="padding-left"]').value,
        text: textarea.value
    };
    
    // Use LZ-String compression for shorter URLs
    var compressed = LZString.compressToEncodedURIComponent(JSON.stringify(settings));
    var url = window.location.origin + window.location.pathname + '?c=' + compressed;
    return url;
}

function loadSettingsFromURL() {
    var params = new URLSearchParams(window.location.search);
    var compressed = params.get('c');
    
    if (!compressed) return false;
    
    try {
        var settings = JSON.parse(LZString.decompressFromEncodedURIComponent(compressed));
        applySettings(settings);
        if (settings.text !== undefined) {
            textarea.value = settings.text;
        }
        return true;
    } catch (e) {
        console.error('Failed to load settings from URL', e);
        return false;
    }
}

function copyShareLink() {
    var url = getShareableURL();
    var shareBtn = form.querySelector('.share-btn');
    var originalText = shareBtn.textContent;
    
    // Check URL length and warn if too long
    if (url.length > URL_WARNING_LENGTH) {
        var proceed = confirm(
            'Warning: The share URL is ' + url.length + ' characters long.\n\n' +
            'Very long URLs may not work correctly in all browsers or when shared on some platforms.\n\n' +
            'Consider using shorter text for more reliable sharing.\n\n' +
            'Copy anyway?'
        );
        if (!proceed) return;
    }
    
    navigator.clipboard.writeText(url).then(function() {
        shareBtn.textContent = 'Copied!';
        shareBtn.classList.add('copied');
        setTimeout(function() {
            shareBtn.textContent = originalText;
            shareBtn.classList.remove('copied');
        }, 2000);
    }).catch(function() {
        // Fallback for older browsers
        var input = document.createElement('input');
        input.value = url;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
        
        shareBtn.textContent = 'Copied!';
        shareBtn.classList.add('copied');
        setTimeout(function() {
            shareBtn.textContent = originalText;
            shareBtn.classList.remove('copied');
        }, 2000);
    });
}

function saveSettingsToCookie() {
    var settings = {
        fontFamily: form.querySelector('select[name="font-family"]').value,
        fontSize: form.querySelector('input[name="font-size"]').value,
        bold: form.querySelector('input[name="bold"]').value,
        italic: form.querySelector('input[name="italic"]').value,
        fontAlign: form.querySelector('input[name="font-align"]').value,
        fontColor: form.querySelector('input[name="font-color"]').value,
        backgroundColor: form.querySelector('input[name="background-color"]').value,
        padding: form.querySelector('input[name="padding"]').value,
        wordWrap: form.querySelector('input[name="word-wrap"]').checked,
        maxWidth: form.querySelector('input[name="max-width"]').value,
        lineHeight: form.querySelector('input[name="line-height"]').value,
        lineHeightUnit: form.querySelector('select[name="line-height-unit"]').value,
        stroke: form.querySelector('input[name="stroke"]').value,
        strokeColor: form.querySelector('input[name="stroke-color"]').value,
        paddingTop: form.querySelector('input[name="padding-top"]').value,
        paddingRight: form.querySelector('input[name="padding-right"]').value,
        paddingBottom: form.querySelector('input[name="padding-bottom"]').value,
        paddingLeft: form.querySelector('input[name="padding-left"]').value
    };
    document.cookie = 'textImageSettings=' + encodeURIComponent(JSON.stringify(settings)) + ';max-age=31536000;path=/';
}

function getCookie(name) {
    var match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match ? decodeURIComponent(match[2]) : null;
}

function loadSettingsFromCookie() {
    var cookieValue = getCookie('textImageSettings');
    if (!cookieValue) return;
    
    try {
        var settings = JSON.parse(cookieValue);
        applySettings(settings);
    } catch (e) {
        console.error('Failed to load settings from cookie', e);
    }
}

function applySettings(settings) {
    // Font family
    form.querySelector('select[name="font-family"]').value = settings.fontFamily;
    
    // Font size
    form.querySelector('input[name="font-size"]').value = settings.fontSize;
    
    // Bold
    form.querySelector('input[name="bold"]').value = settings.bold;
    var boldBtn = form.querySelector('.toggle-btn[data-target="bold"]');
    if (settings.bold === 'true') {
        boldBtn.classList.add('active');
    } else {
        boldBtn.classList.remove('active');
    }
    
    // Italic
    form.querySelector('input[name="italic"]').value = settings.italic;
    var italicBtn = form.querySelector('.toggle-btn[data-target="italic"]');
    if (settings.italic === 'true') {
        italicBtn.classList.add('active');
    } else {
        italicBtn.classList.remove('active');
    }
    
    // Align
    form.querySelector('input[name="font-align"]').value = settings.fontAlign;
    form.querySelectorAll('.align-btn').forEach(function(btn) {
        btn.classList.remove('active');
        if (btn.getAttribute('data-align') === settings.fontAlign) {
            btn.classList.add('active');
        }
    });
    
    // Colors (use setColorValue to update UI)
    setColorValueSilent('font-color', settings.fontColor);
    setColorValueSilent('background-color', settings.backgroundColor);
    setColorValueSilent('stroke-color', settings.strokeColor);
    
    // Layout
    form.querySelector('input[name="padding"]').value = settings.padding;
    form.querySelector('input[name="word-wrap"]').checked = settings.wordWrap;
    form.querySelector('input[name="max-width"]').value = settings.maxWidth;
    
    // Advanced
    form.querySelector('input[name="line-height"]').value = settings.lineHeight;
    form.querySelector('select[name="line-height-unit"]').value = settings.lineHeightUnit;
    form.querySelector('input[name="stroke"]').value = settings.stroke;
    form.querySelector('input[name="padding-top"]').value = settings.paddingTop;
    form.querySelector('input[name="padding-right"]').value = settings.paddingRight;
    form.querySelector('input[name="padding-bottom"]').value = settings.paddingBottom;
    form.querySelector('input[name="padding-left"]').value = settings.paddingLeft;
}

// Set color without triggering updateImage
function setColorValueSilent(targetName, colorValue) {
    var hiddenInput = form.querySelector('input[name="' + targetName + '"]');
    if (hiddenInput) {
        hiddenInput.value = colorValue;
    }
    
    var dropdown = form.querySelector('.color-dropdown[data-target="' + targetName + '"]');
    if (dropdown) {
        dropdown.querySelectorAll('.swatch').forEach(function(swatch) {
            swatch.classList.remove('active');
            if (swatch.getAttribute('data-color') === colorValue) {
                swatch.classList.add('active');
            }
        });
        
        var preview = dropdown.querySelector('.color-preview');
        if (preview) {
            if (isTransparent(colorValue)) {
                preview.style.background = '';
                preview.classList.add('transparent');
            } else {
                preview.classList.remove('transparent');
                preview.style.background = rgbaToHex(colorValue);
            }
        }
    }
}

function resetToDefaults() {
    // Clear cookie
    document.cookie = 'textImageSettings=;max-age=0;path=/';
    
    // Apply default settings
    applySettings(defaultSettings);
    
    // Update width disabled state
    var wordWrapCheckbox = form.querySelector('input[name="word-wrap"]');
    var widthGroup = form.querySelector('.width-group');
    if (wordWrapCheckbox.checked) {
        widthGroup.classList.remove('disabled');
    } else {
        widthGroup.classList.add('disabled');
    }
    
    // Update image
    updateImage();
}

function init() {
    textImage = TextImage();
    form = document.querySelector('form');
    textarea = form.querySelector('textarea[name="image-text"]');
    imageDisplay = form.querySelector('.image-display');
    imageDownload = form.querySelector('.image-download');
    filenameInput = form.querySelector('input[name="filename"]');
    
    // Initialize components
    initColorDropdowns();
    initToggleButtons();
    initAlignButtons();
    initAdvancedToggle();
    initWordWrapToggle();
    
    // Load from URL params (priority) or cookie
    if (!loadSettingsFromURL()) {
        loadSettingsFromCookie();
    }
    
    // Share button handler
    var shareBtn = form.querySelector('.share-btn');
    if (shareBtn) {
        shareBtn.addEventListener('click', function(e) {
            e.preventDefault();
            copyShareLink();
        });
    }
    
    // Reset button handler
    var resetBtn = form.querySelector('.reset-btn');
    if (resetBtn) {
        resetBtn.addEventListener('click', function(e) {
            e.preventDefault();
            resetToDefaults();
        });
    }
    
    // Event listeners
    form.addEventListener('change', updateImage, false);
    textarea.addEventListener('keyup', updateImage, false);
    textarea.addEventListener('input', autoResizeTextarea, false);
    filenameInput.addEventListener('keyup', updateImage, false);
    filenameInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            imageDownload.click();
        }
    });
    
    // Initial auto-resize
    autoResizeTextarea();
    
    // Update width state after loading settings
    var wordWrapCheckbox = form.querySelector('input[name="word-wrap"]');
    var widthGroup = form.querySelector('.width-group');
    if (wordWrapCheckbox.checked) {
        widthGroup.classList.remove('disabled');
    } else {
        widthGroup.classList.add('disabled');
    }
    
    updateImage();
}

function updateImage() {
    var paddingTopVal = form.querySelector('input[name="padding-top"]').value,
        paddingRightVal = form.querySelector('input[name="padding-right"]').value,
        paddingBottomVal = form.querySelector('input[name="padding-bottom"]').value,
        paddingLeftVal = form.querySelector('input[name="padding-left"]').value,
        boldInput = form.querySelector('input[name="bold"]'),
        italicInput = form.querySelector('input[name="italic"]'),
        style = {
            font: form.querySelector('select[name="font-family"]').value,
            align: form.querySelector('input[name="font-align"]').value,
            color: form.querySelector('input[name="font-color"]').value,
            size: parseInt(form.querySelector('input[name="font-size"]').value),
            background: form.querySelector('input[name="background-color"]').value,
            stroke: parseInt(form.querySelector('input[name="stroke"]').value),
            strokeColor: form.querySelector('input[name="stroke-color"]').value,
            lineHeight: form.querySelector('input[name="line-height"]').value +
                form.querySelector('select[name="line-height-unit"]').value,
            bold: boldInput.value === 'true',
            italic: italicInput.value === 'true',
            wordWrap: form.querySelector('input[name="word-wrap"]').checked,
            maxWidth: parseInt(form.querySelector('input[name="max-width"]').value),
            padding: parseInt(form.querySelector('input[name="padding"]').value),
            paddingTop: paddingTopVal !== '' ? parseInt(paddingTopVal) : null,
            paddingRight: paddingRightVal !== '' ? parseInt(paddingRightVal) : null,
            paddingBottom: paddingBottomVal !== '' ? parseInt(paddingBottomVal) : null,
            paddingLeft: paddingLeftVal !== '' ? parseInt(paddingLeftVal) : null
        },
        message = textarea.value;
    
    if (!message) {
        imageDisplay.innerHTML = '<p>Preview will appear here</p>';
        return;
    }
    
    textImage.setStyle(style);
    
    textImage.toImage(message, function () {
        imageDisplay.innerHTML = this.outerHTML;
        imageDownload.href = this.src;
        
        // Set download filename
        var customFilename = filenameInput.value.trim();
        var filename = customFilename || generateFilename(message);
        imageDownload.setAttribute('download', filename + '.png');
    });
    
    // Save settings to cookie
    saveSettingsToCookie();
}

window.addEventListener('load', init, false);

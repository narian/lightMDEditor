/**
 * jQuery lightMDEditor plugin v1.0.0
 * http://github.com/narian/lightMDEditor
 * 
 * 
 * require markdown.js from evilstreak repository
 * https://github.com/evilstreak/markdown-js
 * 
 * 
 * @copyright 2015 Nick Voyloshnikov, http://narian.ru/
 * @license Released under MIT license
 */
(function($) {
    $.fn.lightMDE = function(options) {
        var settings =  $.extend({}, { 
            $container: $(this),
            prefix: 'lightMDE',             // prefix for css classes
            customButtons: {},              // cutsom buttons for nav panel
            textareaName: 'content',        // default name for textarea
            preview: true,                  // instant preview
            enableHTMLBtns: false,          // enable html in buttons
        }, options);

        var tagsLib = {
            'b':        {tagHTML:'b',       tagClass:'fa fa-bold',              tagType:'binary',   mdS:'__',   mdE:'__'},
            'i':        {tagHTML:'i',       tagClass:'fa fa-italic',            tagType:'binary',   mdS:'*',    mdE:'*'},
            's':        {tagHTML:'s',       tagClass:'fa fa-strikethrough',     tagType:'binary',   mdS:'~~',   mdE:'~~'},
            'a':        {tagHTML:'a',       tagClass:'fa fa-link',              tagType:'binary',   mdS:'[',    mdE:'](%LINK_HERE%)'},

            'img':      {tagHTML:'img',     tagClass:'fa fa-picture-o',         tagType:'binary', mdS:'![%ALT_TEXT%](', mdE:' "%TITLE_TEXT%")'},
            'quote':    {tagHTML:'quote',   tagClass:'fa fa-quote-left',        tagType:'unary',  mdS:'> '},
            'list':     {tagHTML:'list',    tagClass:'fa fa-list',              tagType:'unary',  mdS:' - '},
        };

        var editor = {
            
            /**
             * entry point for plugin
             */
            init: function() {
                if(settings.$container.length==0) {
                    return;
                }

                if(settings.customButtons.length > 0) {
                    tagsLib = $.extend({}, tagsLib, settings.customButtons);
                }

                settings.$container.html( this.generatorEditorLayout() );
                this.DOMEvents();

                if( $('.js-lightmde-area').val().length > 0 ) {
                    this.updatePreview();
                }
            },


            /**
             * connect events
             */
            DOMEvents: function() {
                var self = this;

                $('.' + settings.prefix+"__icons a").click(function(e){
                    e.preventDefault();
                });

                $('.' + settings.prefix+"__icons a").on('mousedown', function(e){
                    e.preventDefault();

                    var tag = $(this).attr('data-tag');                     // get tag name
                    var text = self.getSelectedString();                    // get selected string from extarea
                    text = self.getMdText(text, tag);                       // update text to markdown

                    if(text !== false) {
                        self.replaceSelectedText(text);                     // replace old one in textarea
                    }
                });

                // change preview on change textarea
                $('.js-lightmde-area').on('keyup', function(){
                    self.updatePreview();
                });

                // hide or show preview
                $('.js-lightmde-preview-btn').click(function(e){
                    e.preventDefault;

                    self.hideShowPreview();
                });
            },


            /**
             * update preview div from value of textarea
             */
            updatePreview: function() {
                var $preview = $('.js-lightmde-preview');
                if(settings.preview==true) {
                    var md2html = markdown.toHTML( $('.js-lightmde-area').val() );
                    $preview.html(md2html).removeClass(settings.prefix+'__preview--hidden');
                } else {
                    if(!$preview.hasClass(settings.prefix+'__preview--hidden')) {
                        $preview.addClass(settings.prefix+'__preview--hidden');
                    }
                }
            },


            /**
             * get selected range object
             * @return object {rangeObj:'range object', rangeType:"gs"(for not ie)|"cr"(for ie) }
             */
            getSelectedRange: function() {
                if (typeof window.getSelection !== 'undefined') {
                    return { rangeObject: window.getSelection(), rangeType:'gs' };
                } else {
                    return { rangeObject: document.selection.createRange(), rangeType:'cr' };
                }
            },


            /**
             * get string for range object
             * @return (string) selected string
             */
            getSelectedString: function() {
                var rangeObj = this.getSelectedRange();

                if(rangeObj.rangeType=='gs') {
                    return rangeObj.rangeObject.toString();
                }

                return rangeObj.rangeObject.text;
            },


            /**
             * update selected text to selected tag name
             * @param (string) selected string
             * @param (string) tag name
             * @return (string) updated string
             */
            getMdText: function(selection, tagName) {
                if(tagName==null) {
                    return false;
                }

                var out = '';
                if(typeof tagsLib[tagName].tagType==='undefined') {
                    console.error('Tag type "' + tagName + '" is not defined.');
                    return false;
                }
                if(tagsLib[tagName].tagType=='unary') {
                    var splitted = selection.split("\n");
                    for(var i=0; i<splitted.length; i++) {
                        out += tagsLib[tagName].mdS + splitted[i] + "\n";
                    }
                }

                if(tagsLib[tagName].tagType=='binary') {
                    out += tagsLib[tagName].mdS;
                    out += selection;
                    out += tagsLib[tagName].mdE;    
                }
                
                return out;
            },


            /**
             * get start and end position of selected text
             * get from here: http://stackoverflow.com/questions/3964710/replacing-selected-text-in-the-textarea
             * @param (object) selected object - textarea
             * @return (object) {start, end} - positions
             */
            getInputSelection: function(el) {
                var start = 0, end = 0; 
                var normalizedValue, range,
                    textInputRange, len, endRange;
                if (typeof el.selectionStart == "number" && typeof el.selectionEnd == "number") {
                    start = el.selectionStart;
                    end = el.selectionEnd;
                } else {
                    range = document.selection.createRange();

                    if (range && range.parentElement() == el) {
                        len = el.value.length;
                        normalizedValue = el.value.replace(/\r\n/g, "\n");

                        // Create a working TextRange that lives only in the input
                        textInputRange = el.createTextRange();
                        textInputRange.moveToBookmark(range.getBookmark());

                        // Check if the start and end of the selection are at the very end
                        // of the input, since moveStart/moveEnd doesn't return what we want
                        // in those cases
                        endRange = el.createTextRange();
                        endRange.collapse(false);

                        if (textInputRange.compareEndPoints("StartToEnd", endRange) > -1) {
                            start = end = len;
                        } else {
                            start = -textInputRange.moveStart("character", -len);
                            start += normalizedValue.slice(0, start).split("\n").length - 1;

                            if (textInputRange.compareEndPoints("EndToEnd", endRange) > -1) {
                                end = len;
                            } else {
                                end = -textInputRange.moveEnd("character", -len);
                                end += normalizedValue.slice(0, end).split("\n").length - 1;
                            }
                        }
                    }
                }

                return {
                    start: start,
                    end: end
                };
            },


            /**
             * try to find id in element, if it doesn't - it creates id
             * @param (object) jQuery element
             * @return (string) element identifier
             */
            getIdOfContainerOrMakeIt: function($jElement) {
                var id = $jElement.attr('id');
                if(typeof id === "undefined" || id == "") {
                    id = Date.now();
                    $jElement.attr('id', id);
                }

                return id;
            },


            /**
             * finds textarea in current container and replacimg selected text with new one
             * then updating preview
             * @param (string) text with markdown
             */
            replaceSelectedText: function(text) {
                var $area = settings.$container.find('.js-lightmde-area');
                var id = this.getIdOfContainerOrMakeIt($area);
                var el = document.getElementById( id );

                var sel = this.getInputSelection(el), val = el.value;
                el.value = val.slice(0, sel.start) + text + val.slice(sel.end);

                this.updatePreview();
            },


            /**
             * hide or show preview block
             */
            hideShowPreview: function() {
                settings.preview = (settings.preview==true) ? false : true;
                this.updatePreview();
            },


            /**
             * creates full layout for editor in selected container
             */
            generatorEditorLayout: function() {
                var layout = '<div class="'+settings.prefix+'__icons">'

                $.each(tagsLib, function(index, value) {
                    var classItem = (typeof value.tagClass !== 'undefined' && value.tagClass!='') ? 'class="' + value.tagClass + '"' : '';
                    var HTMLItem =  (settings.enableHTMLBtns!=false && typeof value.tagHTML !== 'undefined' && value.tagHTML!='') ? value.tagHTML : '';

                    layout += '<a href="" data-tag="' + index + '" ' + classItem + '>' + HTMLItem + '</a>' + "\n";
                }); 

                layout += '<a href="" class="'+settings.prefix+'__preview-btn js-lightmde-preview-btn">Hide/Show preview</a>';
                
                layout += '</div>'
                    + '<textarea class="'+settings.prefix+'__area js-lightmde-area" name="'+settings.textareaName+'">Well, it\'s kinda test here.\n\nLet\'s add paragraphs.\n\n__Make text bold.__\n\n> Quote someone\n\nAnd add a [link](http://stackoverflow.com/questions/3964710/replacing-selected-text-in-the-textarea)</textarea>'
                    + '<div class="'+settings.prefix+'__preview '+settings.prefix+'__preview--hidden js-lightmde-preview"></div>';

                return layout;
            }
        };

        editor.init();
    };
})(jQuery);
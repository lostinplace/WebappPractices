function initialize() {
  'use strict';
  var $documentBody=$(document).find('body');

  var codemirrorify = function(container) {
    var $container = $(container || document),
      codeblocks = container.find('.code'),
      hiddenScripts  = [],
      cleanupScripts = [],
      inEditor = false;

    // Seek out and cache all hidden scripts
    $("script[type=codemirror]").each(function() {
      hiddenScripts.push({
        selector: $(this).attr('data-selector'),
        src: this.innerHTML
      });
    });
    
    // Seek out and cache all cleanup scripts
    $("script[type=\"codemirror/cleanup\"]").each(function() {
      cleanupScripts.push({
        selector: $(this).attr('data-selector'),
        src: this.innerHTML
      });
    });

    // go through all code blocks
    $.each(codeblocks, function(i, codeblock) {
      // if codeblock hasn't been codemirrorified yet
      if (!codeblock.hasAttribute('data-codemirrorified')) {

        // initialize defaults.
        var $codeblock = $(codeblock),
          editor = null,
          options = { 
            mode : $codeblock.attr('data-mode') || 'javascript',
            theme : $codeblock.attr('data-theme') || 'default',
            lineNumbers : true,
            indentUnit : 1,
            indentWithTabs : false,
            onFocus : function(e) {
              inEditor = true;
            },
            onBlur : function(e) {
              inEditor = false;
            }
          };

        // if this is a textarea just use the codemirror shorthand.
        if (codeblock.nodeName.toUpperCase() === "TEXTAREA") {
          editor = CodeMirror.fromTextArea(codeblock[0], options);
        } else {
          // else codemirror the element's content and attach to element parent. 
          var parent  = $codeblock.parent()[0];
          $codeblock.hide();
          editor = CodeMirror(parent, 
            $.extend(options, {
              value : codeblock.html()
            })
          );
        }

        // mark that this code block has been codemirrored.
        $codeblock.prop('data-codemirrorified',true);

        $(editor).on('keydown', function(e) {
          e.stopPropagation();
        });

        if ($codeblock.hasClass('runnable')) {
          // make the code runnable
          var wrapper = editor.getWrapperElement(),
            $wrapper = $(wrapper),
            controlGroupString=
              '<div class="code-controls">'
              +'<button name="run">Run</button>'
              +'<button name="clear">Clear</button>'
              +'</div>',
            $controlGroup = $(controlGroupString)
              .prependTo($wrapper),
            output = $('<div class="codemirror-result"></div>')
              .appendTo($wrapper.parent());
          
          $controlGroup.on('click','button[name="clear"]',function(event){
            output.html('');
          };

          $controlGroup.on('click','button[name="run"]',function(event){
            var real_console_log = console.log,
              sandboxString = 
                '<iframe style="display:none"></iframe>',
              $sandbox=$(sandboxString)
                .appendTo($documentBody),
              sandBoxMarkup = '<script>'+
                'var MSIE/*@cc_on =1@*/;'+ // sniff
                'console={ log: parent.console.log };' +
                'parent.sandbox=MSIE?this:{eval:function(s){return eval(s)}}</script>',
              globals = $codeblock.attr("data-globals")
                .split(",");

            $.each(exposeGlobals, function(prop, val) {
                val = $.trim(val);
                sandbox[0].contentWindow[val] = window[val];
              });

            frames[frames.length - 1].document.write(sandBoxMarkup);

            console.log = function() {
              var messages = [];
              // Convert all arguments to Strings (Objects will be JSONified).
              for (var i = 0; i < arguments.length; i++) {
                var value = arguments[i];
                messages.push(typeof(value) == 'object' ? JSON.stringify(value) : String(value));
              }
              var msg = messages.join(" ");
              if (output.html() !== "") {
                output.append("<br />" + msg);
              } else {
                output.html(msg);
              }
            };
          });

          button.click(function(editor, output){
            return function(event) {

              // save the default logging behavior.
              var real_console_log = console.log;
              
              // save the default logging behavior.
              // Following Dean Edward's fantastic sandbox code:
              // http://dean.edwards.name/weblog/2006/11/sandbox/+evaluating+js+in+an+iframe
              // create an iframe sandbox for this element.
              var iframe = $("<iframe>")
                .css("display", "none")
                .appendTo($d.find('body'));

              // Overwrite the default log behavior to pipe to an output element.

              // Overwrite the default log behavior to pipe to an output element.
              

              var sandBoxMarkup = "<script>"+
                "var MSIE/*@cc_on =1@*/;"+ // sniff
                "console={ log: parent.console.log };" +
                "parent.sandbox=MSIE?this:{eval:function(s){return eval(s)}}<\/script>";

              var exposeGlobals;
              if (exposeGlobals = $(codeblock).attr("globals")) {
                exposeGlobals = exposeGlobals.split(",");

                $.each(exposeGlobals, function(prop, val) {
                  val = $.trim(val);
                  iframe[0].contentWindow[val] = window[val];
                });
              }

              // write a script into the <iframe> and create the sandbox
              frames[frames.length - 1].document.write(sandBoxMarkup);

              var combinedSource = "";

              // Prepend all setup scripts
              $.each(hiddenScripts, function() {
                if ($(codeblock).is(this.selector)) {
                  combinedSource += this.src + "\n";
                }
              });
              
              combinedSource += editor.getValue();
              
              // Append all cleanup scripts
              $.each(cleanupScripts, function() {
                if ($(codeblock).is(this.selector)) {
                  combinedSource = combinedSource + this.src + "\n";
                }
              });

              // eval in the sandbox.
              sandbox.eval(combinedSource);

              // get rid of the frame. New Frame for every context.
              iframe.remove();
              
              // set the old logging behavior back.
              console.log = real_console_log;
            }
          }(editor, output));
        }
      }
    });
  };

  $d.bind('deck.init', function() {
    
    // codemirrorify current and next slide, since we're in the beginning.
    codemirrorify($.deck('getSlide', 0));
    codemirrorify($.deck('getSlide', 1));
  });

  $d.bind('deck.change', function(event, from, to) {
    var $slides    = $["deck"]('getSlides');
    // codemirrorify previous slide
    if (to > 0) {
      codemirrorify($.deck('getSlide', to - 1));
    } 
    
    // codemirrorify current slide
    codemirrorify($.deck('getSlide', to));

    // codemirrorify next slide
    if (to+1 < $slides.length) {
      codemirrorify($.deck('getSlide', to + 1));
    }
  });
}




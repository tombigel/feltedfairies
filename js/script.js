window.Fairy = {};

/**
 * Simple Router,
 * handles 2 levels of path  and one hash: example.com/section/page#hash
 * @constructor
 */
Fairy.Router = function() {
    var path = window.location.pathname;
    path = path.replace(/^\/|\/$/g, '');
    var pathList = path.split('/');
    var hash = window.location.hash;

    this.page = function() {
        return (pathList.length > 0) ? pathList[pathList.length - 1] : ''
    };

    this.section = function() {
        return (pathList.length > 1) ? pathList[0] : ''
    };

    this.hash = function() {
        return hash;
    }
};

/**
 * Simple template compiler (based on Handlebars.js)
 * @param templateSource
 * The source file for the template - any text based file with html content (same origin)
 * @param contextSource
 * A json file with the template context strings
 * @param targetNode
 * The target element
 * @param page
 * The page passed from the router
 * TODO: Add section support
 * @constructor
 */
Fairy.Template = function(templateSource, contextSource, targetNode, page) {
    var pages;
    var template, compiled_template;
    var json, xhr;
    var $target = $(targetNode);

    if (!templateSource) {
        log('Missing template URL');
        return;
    }
    if (!$target) {
        log('Missing target DOM node');
        return;
    }

    json = $.getJSON(contextSource);
    json.error(function(data) {
        log('Can\'t load context file', data.responseText);
    });

    xhr = $.get(templateSource);
    xhr.error(function(data) {
        log('Can\'t load template file', data.responseText);
    });

    function compile(xhrResponse, jsonResponse) {
        pages = jsonResponse[0];
        template = Handlebars.compile(xhrResponse[0]);
        if (!page || !pages[page]) {
            page = 'default';
        }
        var context = pages[page];
        compiled_template = template(context);
    }

    $.when(xhr, json).then(compile);

    this.render = function(callback, callbackArgs) {
        $.when(xhr, json).then(function() {
            if (!$target || !compiled_template) {
                log('Template was not initialized correctly', $target, compiled_template);
                return;
            }
            $target.html(compiled_template);
            if (callback){
                callback.apply(window, callbackArgs);
            }
        });
    };
};

/**
 * Handle fairy details form
 * @constructor
 */
Fairy.Details = function() {
    var form, name, place, message, certificate;

    function hideMessage() {
        message.fadeOut();
    }

    this.submit = function() {
        var nameVal = name.val();
        var placeVal = place.val();
        if (nameVal && placeVal) {
            $('.fairy-name').text(nameVal);
            $('.fairy-place').text(placeVal);
            form.fadeOut(function(){
                certificate.fadeIn();
            });
        }
        else {
            message.fadeIn();
            name.one('keydown', hideMessage);
            place.one('keydown', hideMessage);
        }
        return false;
    };

    this.init = function() {
        form = $('#fairy-details');
        name = $('#form-name');
        place = $('#form-place');
        message = $('#form-message');
        certificate = $('#fairy-certificate');
        form.on('submit', this.submit);
        certificate.hide();
    };
};

$(document).ready(function() {
    var route = new Fairy.Router();
    var template = new Fairy.Template(
        'templates/fairy-template.html',
        'templates/fairy-pages.json',
        '.main',
        route.page()
    );

    template.render(onRender);

    function onRender(){
        if (document.forms['fairy-details']) {
            var fairyDetails = new Fairy.Details();
            fairyDetails.init();
        }
    }
});


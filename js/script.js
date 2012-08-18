window.Fairy = {};

/**
 * Simple Router,
 * handles 2 levels of path and one hash: example.com/section/page#hash
 * @constructor
 */
Fairy.Router = function () {
    var path, pathList, hash;
    path = window.location.pathname.replace(/^\/|\/$/g, '');

    pathList = path.split('/');

    hash = window.location.hash;

    this.page = function () {
        return (pathList.length > 0) ? pathList[pathList.length - 1] : ''
    };

    this.section = function () {
        return (pathList.length > 1) ? pathList[0] : ''
    };

    this.hash = function () {
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
Fairy.Template = function (dataSource, targetNode, page) {
    var pages;
    var compiled;
    var xhr_json, xhr_template;
    var loadTemplate, compileTemplate;
    var $target;

    $target = $(targetNode);
    page = page || 'default';

    loadTemplate = function (jsonResponse) {
        var template;

        pages = jsonResponse;
        if (!pages[page]) {
            page = 'default';
        }

        template = pages[page].template;
        xhr_template = $.get(template);
        xhr_template.success(compileTemplate);
        xhr_template.error(function (data) {
            log('Can\'t load template file', data.responseText);
        });

    };

    compileTemplate = function (xhrResponse) {
        var template, context, compiled_context;
        template = Handlebars.compile(xhrResponse);

        context = pages[page].context;
        compiled_context = template(context);
        compiled.resolve(compiled_context);
    };

    compiled = $.Deferred();

    if (!dataSource) {
        log('Missing data URL');
        return;
    }
    if (!$target) {
        log('Missing target DOM node');
        return;
    }

    xhr_json = $.getJSON(dataSource);
    xhr_json.success(loadTemplate);
    xhr_json.error(function (data) {
        log('Can\'t load json data file', data.responseText);
    });


    this.render = function (callback, callbackArgs) {
        var render = function (compiled_template) {
            if (!$target || !compiled_template) {
                log('Template was not initialized correctly', $target, compiled_template);
                return;
            }
            $target.html(compiled_template);
            if (callback) {
                callback.apply(window, callbackArgs);
            }
        };
        $.when(compiled).then(render);
    };
};

/**
 * Handle fairy details form
 * @constructor
 */
Fairy.Details = function () {
    var form, name, place, message, certificate;

    var hideMessage = function (callback) {
        message.fadeOut(callback);
    };

    var hideForm = function (callback) {
        form.fadeOut(callback);
    };

    var showCertificate = function (callback) {
        certificate.fadeIn(callback);
    };

    this.submit = function () {
        var nameVal = name.val();
        var placeVal = place.val();
        if (nameVal && placeVal) {

            $('.fairy-name').text(nameVal);
            $('.fairy-place').text(placeVal);

            hideForm(showCertificate);
        }
        else {
            message.fadeIn();
            name.one('keydown', hideMessage);
            place.one('keydown', hideMessage);
        }
        return false;
    };

    this.init = function () {
        form = $('#fairy-details');
        name = $('#form-name');
        place = $('#form-place');
        message = $('#form-message');
        certificate = $('#fairy-certificate');
        form.on('submit', this.submit);
        certificate.hide();
    };
};

(function (){
    var route = new Fairy.Router();
    var template = new Fairy.Template(
        'templates/fairy-pages.json',
        '.main',
        route.page()
    );
    function onRender() {
        if (document.forms['fairy-details']) {
            var fairyDetails = new Fairy.Details();
            fairyDetails.init();
        }
    }
    $(document).ready(function () {
        template.render(onRender);
    });
}());



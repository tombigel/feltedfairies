window.Fairy = {};

/**
 * Simple read only router,
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
 * Like Router, handles 2 levels of path and one hash: example.com/section/page#hash
 * @param dataSource
 * The source json file for the site structure
 * file structure:
 * {
 *     "section": { // <-- Optional
 *         "page": {
 *             "template": "/template/file.html" // <-- the template html file to load for this page
 *             "context" : { // <-- Optional: A list of Handlebars variables
 *                 "vaiable" : "content"
 *                 ...
 *             }
 *             ...
 *         }
 *         ...
 *     }
 * }
 * @param targetNode
 * The target element
 * @param page
 * The page passed from the router
 * @param section
 * The optional section of the page
 * @param hash
 * TODO: Handle hash
 * @constructor
 */
Fairy.Template = function (dataSource, targetNode, page, section) {
    var section_pages;
    var compiled;
    var xhr_json, xhr_template;
    var loadTemplate, compileTemplate;
    var $target;

    $target = $(targetNode);
    page = page || 'default';
    section = section || '';

    /**
     * Handles the loading of the template corresponding to the current page
     * @param jsonResponse
     */
    loadTemplate = function (jsonResponse) {
        var template;

        if (section && jsonResponse[section]){
            section_pages = jsonResponse[section];
        }
        else {
            section_pages = jsonResponse;
        }

        if (!section_pages[page]) {
            page = 'default';
        }

        template = section_pages[page].template;
        if (!template){
            log('Wrong json structure, missing "template" in ', page, section_pages);
        }
        xhr_template = $.get(template);
        xhr_template.success(compileTemplate);
        xhr_template.error(function (data) {
            log('Can\'t load template file', data.responseText);
        });

    };

    /**
     * Handles the compilation of the template loaded with loadTemplate
     * Defines a jQuery.Deferred() object to notify compilation.
     * @param xhrResponse
     */
    compileTemplate = function (xhrResponse) {
        var template, context, compiled_context;
        template = Handlebars.compile(xhrResponse);

        context = section_pages[page].context;
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

    /**
     * The API function to render a template of a page
     * waits for the Deferred object from compileTemplate to resolve
     * @param callback
     * An optional callback to run after render
     * @param callbackArgs
     * Optional argument Array for the callback
     */
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
        route.page(),
        route.section()
    );

    /**
     * If the page contains a '#fairy-details' form, init the Details object.
     */
    function onRender() {
        if (document.forms['fairy-details']) {
            var fairyDetails = new Fairy.Details();
            fairyDetails.init();
        }
    }
    $(document).ready(function () {
        template.render(onRender, null);
    });
}());



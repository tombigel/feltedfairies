window.Template = function (source, target, params) {
    if (!source) {
        log('Missing template URL');
        return;
    }
    var $target = $(target);
    if (!$target) {
        log('Missing target DOM node');
        return;
    }
    var compiled_template = '';
    var action = (params && params.action);
    var pages = {
        default:{
            class :'love',
            header:'פיית האהבה',
            text  :'לפני שנים רבות ביער קסום, בין עצים גבוהים ופרפרים צבעוניים,נולדה פיה קטנה, פיית האהבה.<br />\
            אמא ואבא של הפיה הביטו בה והחליטו מיד ששמה יהיה אהבה.<br />\
            הם ידעו שהיא תשמור על מי שישמור עליה ושהיא תעניק תחושת חום וביטחון לכל הסובבים אותה ותפזר אהבה גדולה לאוהביה.'
        },
        love   :{
            class :'love',
            header:'פיית האהבה',
            text  :'טקסט על פית האהבה'
        },
        dreams :{
            class :'dreams',
            header:'פיית החלומות',
            text  :'טקסט על פית החלומות'
        },
        wishes :{
            class :'wishes',
            header:'פיית המשאלות',
            text  :'טקסט על פית המשאלות'
        }
    };

    var xhr = $.get(source);
    xhr.error(function () {
        log('Can\'t load template file');
    });
    xhr.success(function (data) {
        var template = Handlebars.compile(data);

        if (!action || !pages[action]) {
            action = 'default';
        }

        var page = pages[action];
        compiled_template = template(page);
    });

    this.render = function () {
        xhr.success(function () {
            if (!$target || !compiled_template) {
                log('Template was not initialized correctly');
                return;
            }
            $target.html(compiled_template);
        });

    };

};

$(document).ready(function () {
    var page = window.location.pathname.replace(/^\/|\/$/g, '');
    page = page.split('/');
    var route = {
        action: (page.length > 0) ? page[page.length - 1] : ''
    };
    var template = new Template('templates/fairy-template.html', '.main', route);
    template.render();
});


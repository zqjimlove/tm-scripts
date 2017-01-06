// ==UserScript==
// @name         v2ex comment dialog
// @namespace    http://inwoo.me/
// @version      103
// @description  显示对话列表
// @author       inwoo
// @match        http*://*.v2ex.com/t/*
// @grant        none
// @require      https://cdn.staticfile.org/jquery/3.1.1/jquery.min.js
// @updateURL    https://cdn.rawgit.com/zqjimlove/tm-scripts/master/dist/v2ex-comment-dialog.js
// ==/UserScript==

declare var $: any;

(function() {
    let commentMap = {};
    let $main = $('#Main');

    /**
     * Find all comment cells
     */
    function findAllComment(_$main = $main, inject = true) {
        _$main.find('.box:eq(1)').find('a.dark').each((i, a) => {
            let href: String = a.href;
            let $cell = $(a).parents('.cell');
            let userId = href.substr(href.lastIndexOf('/') + 1);
            if (!commentMap[userId]) {
                commentMap[userId] = [];
            }
            commentMap[userId].push($cell);
            inject && injectShowDialogLink($cell)
        });
    }

    function injectShowDialogLink($cell) {
        let inject = false;
        $cell.find('.reply_content a').each((i, a: Element) => {
            let href = a.getAttribute('href');
            if (href.indexOf('/member/') === 0) {
                inject = true;
                return false;
            }
        });

        if (inject) {
            let $showDialogElement = $('<a class="show-commments-dialog" href="javascript:;">显示对话</a>');
            $showDialogElement.css({
                marginLeft: '10px'
            });
            $showDialogElement.on('click', () => {
                showDialog($cell);
            });
            $showDialogElement.insertAfter($cell.find('.fade:last'));

        }
    }

    function getLinkCommentCells($cell, userLinkedArr = []) {
        let cells = [];
        let commentId = parseInt($cell[0].id.substr(2));
        $cell.find('.reply_content a').each((i, a: Element) => {
            let href = a.getAttribute('href');
            if (href.indexOf('/member/') === 0) {
                let userId = href.substr(href.lastIndexOf('/') + 1);
                if (userLinkedArr.indexOf(userId) > -1) return true;
                (<Array<any>>commentMap[userId]).forEach(($e) => {
                    let id = parseInt($e[0].id.substr(2));
                    if (id < commentId) {
                        cells.push($e);
                    }
                })
                cells = cells.concat();
                userLinkedArr.push(userId)
            }
        });
        cells.forEach((cell) => {
            cells = cells.concat(getLinkCommentCells(cell, userLinkedArr));
        })
        return cells;
    }

    function showDialog(self) {
        function hideDialog() {
            $('body').css('overflowY', '');
            $container.remove();
        }

        let cells = getLinkCommentCells(self);
        let $container = $('<div />');
        let $overlay = $('<div />');
        $overlay.css({
            position: "fixed",
            background: "rgba(0,0,0,.8)",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0
        });
        $overlay.on('click', () => { hideDialog() });

        let $dialog = $('<div />');
        let $dialogInner = $('<div />');
        let $closeBtn = $('<span>&times; 关闭</span>');
        $dialog.css({
            position: "fixed",
            top: '50%',
            left: '50%',
            width: '60%',
            maxWidth: '720px',
            minWidth: '500px',
            zIndex: 100,
            transform: 'translate(-50%, -50%)'
        });

        $closeBtn.css({
            color: "#fff",
            cursor: 'pointer'
        });

        $closeBtn.on('click', () => {
            hideDialog()
        }).appendTo($dialog);

        $dialogInner.css({
            overflowY: 'auto',
            background: "#fff",
            maxHeight: (window.innerHeight * .75) + 'px'
        }).appendTo($dialog);

        if (cells.indexOf(self) < 0) {
            cells.push(self);
        }

        cells.sort((a, b) => {
            return parseInt(a[0].id.substr(2)) - parseInt(b[0].id.substr(2));
        })

        cells.forEach((e) => {
            $(e).clone().appendTo($dialogInner);
        });
        $dialog.find('.show-commments-dialog').hide();

        $('body').css('overflowY', 'hidden');
        $container.append($overlay);
        $container.append($dialog);
        $container.appendTo(document.body);
    }


    function main() {
        let hasPage = $('.page_input').length > 0
        if (hasPage) {
            let curPage = parseInt($('.page_input:first').val());
            for (let i = curPage - 1; i > 0; i--) {
                $.get({
                    url: `${location.pathname}?p=${i}`,
                    async: false,
                    success: function(res) {
                        findAllComment($(res).find('#Main'), false);
                    }
                });
            }
            findAllComment();
        } else {
            findAllComment();
        }
    };

    main();
})();
// ==UserScript==
// @name         v2ex comment dialog
// @namespace    http://inwoo.me/
// @version      0.0.1
// @description  显示对话列表
// @author       inwoo
// @match        http*://*.v2ex.com/t/*
// @grant        none
// @require      https://cdn.staticfile.org/jquery/3.1.1/jquery.min.js
// ==/UserScript==

declare var $: any;

(function() {
    let commentMap = {};
    let $main = $('#Main');

    /**
     * Find all comment cells
     */
    function findAllComment() {
        $main.find('.box:eq(1)').find('a.dark').each((i, a) => {
            let href: String = a.href;
            let $cell = $(a).parents('.cell');
            let userId = href.substr(href.lastIndexOf('/') + 1);
            if (!commentMap[userId]) {
                commentMap[userId] = [];
            }
            commentMap[userId].push($cell);
            injectShowDialogLink($cell)
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
            $showDialogElement.insertAfter($cell.find('.fade'));

        }


        // if (cells.length > 0) {

        //     ((_cells) => {
        //         $showDialogElement.on('click', () => {
        //             showDialog(_cells, $cell);
        //         });
        //     })(cells)

        //     // $cell.find('.fade').insertAfter($showDialogElement);
        // }
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
            left: '20%',
            right: '20%',
            transform: 'translate3d(0,-50%,0)'
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
            maxHeight: (window.screen.height * .75) + 'px'
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

    findAllComment();

})();
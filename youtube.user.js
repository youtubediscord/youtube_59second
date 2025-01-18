// ==UserScript==
// @name         YouTube Watch to Embed Redirect (Improved Click Detection)
// @namespace    http://your-namespace.com
// @version      1.0
// @description  Redirect YouTube watch links to embed links, including clicks on thumbnails and avatars
// @author       You
// @match        https://www.youtube.com/*
// @grant        GM_openInTab
// @run-at       document-idle
// ==/UserScript==

(function () {
    'use strict';

    const LINK_PROCESSED_ATTR = 'data-yt-redirect-processed';

    // Функция для обработки текущего URL
    function handleCurrentPage() {
        const url = new URL(window.location.href);

        // Проверяем, является ли это страницей просмотра видео
        if (url.pathname === '/watch' && url.searchParams.has('v')) {
            const videoId = url.searchParams.get('v');
            const timeParam = url.searchParams.get('t'); // Время начала
            const embedUrl = `https://www.youtube.com/embed/${videoId}${timeParam ? `?start=${parseTimeParam(timeParam)}` : ''}`;
            window.location.replace(embedUrl);
        }
    }

    // Функция для преобразования параметра времени
    function parseTimeParam(timeParam) {
        if (!timeParam) return 0;

        const match = timeParam.match(/(\d+)s/); // Только секунды
        return match ? parseInt(match[1], 10) : 0;
    }

    // Функция для обработки клика на любом элементе
    function handleDocumentClick(event) {
        let target = event.target;

        // Ищем ближайший родительский <a> элемент
        while (target && target.tagName !== 'A') {
            target = target.parentNode;
        }

        if (target && target.href && target.href.includes('/watch')) {
            event.preventDefault();
            event.stopImmediatePropagation();

            const url = new URL(target.href);
            const videoId = url.searchParams.get('v');
            const timeParam = url.searchParams.get('t');
            if (videoId) {
                const embedUrl = `https://www.youtube.com/embed/${videoId}${timeParam ? `?start=${parseTimeParam(timeParam)}` : ''}`;
                GM_openInTab(embedUrl, { active: true });
            }
        }
    }

    // Функция для обработки всех существующих ссылок
    function processExistingLinks() {
        const links = document.querySelectorAll('a[href*="/watch"]:not([data-yt-redirect-processed])');
        links.forEach(link => {
            link.setAttribute(LINK_PROCESSED_ATTR, 'true');
        });
    }

    // Наблюдатель для динамических изменений DOM
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'childList') {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === 1) { // Проверяем, что это элемент
                        const links = node.querySelectorAll('a[href*="/watch"]:not([data-yt-redirect-processed])');
                        links.forEach(link => link.setAttribute(LINK_PROCESSED_ATTR, 'true'));
                    }
                });
            }
        });
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true,
    });

    // Отслеживание изменений URL через popstate
    window.addEventListener('popstate', handleCurrentPage);

    // Обработка кликов на документе
    document.addEventListener('click', handleDocumentClick, true);

    // Обработка текущей страницы при загрузке
    handleCurrentPage();
    processExistingLinks();
})();

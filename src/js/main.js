import './polyfill/classList'

import reqwest from 'reqwest'
import bowser from 'ded/bowser'
import doT from 'olado/doT'
import share from './lib/share'
import throttle from './lib/throttle'
import scrollTo from './lib/scrollTo'

import Map from './components/map'

import mainHTML from './text/main.html!text'
import chaptersHTML from './text/chapters.html!text'

const dataURL = (bowser.msie && bowser.version < 10 ? '//' : 'https://') +
    'interactive.guim.co.uk/docsdata/1CJjV9nYeubICVCyK8EUOuFiNwMfSgIKmzIRT0N0gFo0.json';

var templateFn = doT.template(chaptersHTML);

function app(el, data, map) {
    el.querySelector('.js-chapters').innerHTML = templateFn(data);
    var chaptersEl = el.querySelector('.js-chapter-list');
    var chapterEls = [].slice.apply(el.querySelectorAll('.js-chapter'));

    var circlesEl = el.querySelector('.js-chapter-circles');
    circlesEl.innerHTML = chapterEls.map(() => '<li class="paris-circles__circle"></li>').join('');

    var currentEl = document.createElement('li');
    currentEl.className = 'paris-circles__current';
    circlesEl.appendChild(currentEl);

    data.chapters.unshift({
        'center': data.furniture.initialCenter,
        'zoom': data.furniture.initialZoom,
        'features': data.chapters[0].features
    });

    function go(chapterNo) {
        var chapterEl = chapterEls[chapterNo];
        var chapter = data.chapters[chapterNo];

        el.querySelector('.is-current').classList.remove('is-current');
        chapterEl.classList.add('is-current');
        currentEl.style.left = (chapterNo * 13) + 'px'

        map.go(chapter);

        scrollTo(chaptersEl.scrollTop, chapterEl.offsetTop, y => chaptersEl.scrollTop = y);
    }

    chapterEls.forEach((chapterEl, chapterNo) => {
        if (chapterNo > 0) {
            chapterEl.querySelector('.js-prev').addEventListener('click', () => go(chapterNo - 1));
        }
        if (chapterNo < chapterEls.length - 1) {
            chapterEl.querySelector('.js-next').addEventListener('click', () => go(chapterNo + 1));
        }
    });

    var shareFn = share(data.furniture.headline, data.furniture.shortURL, data.furniture.hashtag);
    [].slice.apply(el.querySelectorAll('.interactive-share')).forEach(shareEl => {
        var network = shareEl.getAttribute('data-network');
        shareEl.addEventListener('click', () => shareFn(network));
    });

    var lastChapterNo = 0;
    chaptersEl.addEventListener('scroll', throttle(() => {
        var scrollTop = chaptersEl.scrollTop;
        var chapterNo = 0;
        while (chapterEls[chapterNo].offsetTop - 60 < scrollTop) chapterNo++;
        chapterNo = Math.max(0, chapterNo - 1);
        if (lastChapterNo !== chapterNo) {
            lastChapterNo = chapterNo;
            map.go(data.chapters[chapterNo]);
        }
    }));

    map.go(data.chapters[0]);
    map.invalidateSize();
}

export function init(el, context, config, mediator) {
    el.innerHTML = mainHTML;

    var offset = guardian.api !== undefined ? 48 : (48+30);
    function setContainerSize() {
        el.style.height = (window.innerHeight - offset) + 'px';
    }
    window.addEventListener('resize', throttle(setContainerSize, 100));
    setContainerSize();

    var map = new Map(el.querySelector('.js-map'), config);

    reqwest({
        'url': dataURL,
        'type': 'json',
        'crossOrigin': true,
        'success': resp => {
            resp.chapters.forEach(chapter => {
                chapter.copy = chapter.copy.replace(/[\r\n]+/g, '\n').trim().split('\n')
                    .map(para => {
                        if (para.indexOf('img@') === 0) {
                            var parts = para.slice(4).split(' ');
                            return '<img src="' + parts[0] + '" /><span class="interactive-caption">' + parts.slice(1).join(' ') + '</span>';
                        }
                        return para;
                    });
            });
            app(el, resp, map);
        }
    });
}

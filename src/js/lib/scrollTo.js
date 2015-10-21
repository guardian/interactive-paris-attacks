const interval = 15, total = 300;

var rAF = window.requestAnimationFrame || (cb => setTimeout(cb, 16));

export default function scrollTo(start, end, cb) {
    var distance = end - start;
    var elapsed = 0;

    rAF(function scrollHandler() {
        var t = elapsed / total;
        cb(Math.floor(start + distance * t * (2 - t)));
        if (elapsed < total) {
            elapsed += interval;
            rAF(scrollHandler);
        }
    });

    return end;
};


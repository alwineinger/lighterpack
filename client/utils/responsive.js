import Vue from 'vue';

const mediaQueries = {
    compactViewport: '(max-width: 900px)',
    narrowViewport: '(max-width: 820px)',
    coarsePointer: '(pointer: coarse)',
    noHover: '(hover: none)',
    landscape: '(orientation: landscape)',
};

const mqlKeys = Object.keys(mediaQueries);
const mqls = {};

mqlKeys.forEach((key) => {
    if (typeof window !== 'undefined' && window.matchMedia) {
        mqls[key] = window.matchMedia(mediaQueries[key]);
    }
});

const state = Vue.observable({
    width: typeof window !== 'undefined' ? window.innerWidth : 1024,
    height: typeof window !== 'undefined' ? window.innerHeight : 768,
    isCompactViewport: false,
    isNarrowViewport: false,
    isCoarsePointer: false,
    hasNoHover: false,
    isLandscape: false,
});

function updateState() {
    state.width = typeof window !== 'undefined' ? window.innerWidth : state.width;
    state.height = typeof window !== 'undefined' ? window.innerHeight : state.height;
    state.isCompactViewport = !!(mqls.compactViewport && mqls.compactViewport.matches);
    state.isNarrowViewport = !!(mqls.narrowViewport && mqls.narrowViewport.matches);
    state.isCoarsePointer = !!(mqls.coarsePointer && mqls.coarsePointer.matches);
    state.hasNoHover = !!(mqls.noHover && mqls.noHover.matches);
    state.isLandscape = !!(mqls.landscape && mqls.landscape.matches);
}

function addMediaListener(mql, listener) {
    if (!mql) {
        return;
    }
    if (mql.addEventListener) {
        mql.addEventListener('change', listener);
    } else if (mql.addListener) {
        mql.addListener(listener);
    }
}

function removeMediaListener(mql, listener) {
    if (!mql) {
        return;
    }
    if (mql.removeEventListener) {
        mql.removeEventListener('change', listener);
    } else if (mql.removeListener) {
        mql.removeListener(listener);
    }
}

let subscriberCount = 0;

export function getResponsiveState() {
    return state;
}

export function subscribeResponsiveState() {
    if (typeof window === 'undefined') {
        return () => {};
    }

    subscriberCount += 1;
    if (subscriberCount === 1) {
        updateState();
        window.addEventListener('resize', updateState);
        mqlKeys.forEach((key) => {
            addMediaListener(mqls[key], updateState);
        });
    }

    return () => {
        subscriberCount = Math.max(0, subscriberCount - 1);
        if (subscriberCount === 0) {
            window.removeEventListener('resize', updateState);
            mqlKeys.forEach((key) => {
                removeMediaListener(mqls[key], updateState);
            });
        }
    };
}

updateState();

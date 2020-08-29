// Ponyfill based on code from
// https://github.com/WICG/visual-viewport/blob/gh-pages/polyfill/visualViewport.js
// This is hacky but necessary in order to get the innerWidth/Height without
// page scale applied reliably.
function updateUnscaledDimensions () {
    if (!ponyfillHelper.iframeDummy) {
        const iframe = document.createElement('iframe');
        iframe.style.position='absolute';
        iframe.style.width='100%';
        iframe.style.height='100%';
        iframe.style.left='0px';
        iframe.style.top='0px';
        iframe.style.border='0';
        iframe.style.visibility='hidden';
        iframe.style.zIndex='-1';
        iframe.srcdoc = '<!DOCTYPE html><html><body style=\'margin:0px; padding:0px\'></body></html>';
  
        document.body.appendChild(iframe);
        ponyfillHelper.iframeDummy = iframe;
    }
  
    const iframe = ponyfillHelper.iframeDummy;
  
    let documentRect = document.documentElement.getBoundingClientRect();
    let iframeBody = iframe.contentDocument.body;
    iframeBody.style.width = documentRect.width + 'px';
    iframeBody.style.height = documentRect.height + 'px';
  
    // Hide overflow temporarily so that the iframe size isn't shrunk by
    // scrollbars.
    let prevDocumentOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';
  
    let iframeWindow = ponyfillHelper.iframeDummy.contentWindow;
    ponyfillHelper.unscaledInnerWidth = iframeWindow.innerWidth;
    ponyfillHelper.unscaledInnerHeight = iframeWindow.innerHeight;
  
    document.documentElement.style.overflow = prevDocumentOverflow;
}
  
function fireScrollEvent () {
    let listeners = ponyfillHelper.scrollEventListeners;
    for (let i = 0; i < listeners.length; i++)
        listeners[i]();
}
  
function fireResizeEvent () {
    let listeners = ponyfillHelper.resizeEventListeners;
    for (let i = 0; i < listeners.length; i++)
        listeners[i]();
}
  
function updateViewportChanged () {
    let scrollChanged =
        ponyfillHelper.offsetLeftSinceLastChange != ponyfillVisualViewport.offsetLeft ||
        ponyfillHelper.offsetTopSinceLastChange != ponyfillVisualViewport.offsetTop;

    let sizeChanged =
        ponyfillHelper.widthSinceLastChange != ponyfillVisualViewport.width ||
        ponyfillHelper.heightSinceLastChange != ponyfillVisualViewport.height ||
        ponyfillHelper.scaleSinceLastChange != ponyfillVisualViewport.scale;

    ponyfillHelper.offsetLeftSinceLastChange = ponyfillVisualViewport.offsetLeft;
    ponyfillHelper.offsetTopSinceLastChange = ponyfillVisualViewport.offsetTop;
    ponyfillHelper.widthSinceLastChange = ponyfillVisualViewport.width;
    ponyfillHelper.heightSinceLastChange = ponyfillVisualViewport.height;
    ponyfillHelper.scaleSinceLastChange = ponyfillVisualViewport.scale;

    if (scrollChanged)
        fireScrollEvent();

    if (sizeChanged)
        fireResizeEvent();

    setTimeout(updateViewportChanged, 500);
}
  
function registerChangeHandlers () {
    window.addEventListener('scroll', updateViewportChanged, {'passive': true});
    window.addEventListener('resize', updateViewportChanged, {'passive': true});
    window.addEventListener('resize', updateUnscaledDimensions, {'passive': true});
}

let isChrome = navigator.userAgent.indexOf('Chrome') > -1;
let isSafari = navigator.userAgent.indexOf('Safari') > -1;
let isIEEdge = navigator.userAgent.indexOf('Edge') > -1;

if (isChrome && isSafari)
    isSafari = false;

let ponyfillHelper = { }, ponyfillVisualViewport = { };
let ponyfillWasSetup = false;


export default function getVisualViewport () {
    if (window.visualViewport) {
        return window.visualViewport;
    } else {
        if (!ponyfillWasSetup) {
            let layoutDummy = document.createElement('div');
            layoutDummy.style.width = '100%';
            layoutDummy.style.height = '100%';
            if (isSafari) {
                layoutDummy.style.position = 'fixed';
            } else {
                layoutDummy.style.position = 'absolute';
            }
            layoutDummy.style.left = '0px';
            layoutDummy.style.top = '0px';
            layoutDummy.style.visibility = 'hidden';
        
            ponyfillHelper = {
                'offsetLeftSinceLastChange': null,
                'offsetTopSinceLastChange': null,
                'widthSinceLastChange': null,
                'heightSinceLastChange': null,
                'scaleSinceLastChange': null,
                'scrollEventListeners': [],
                'resizeEventListeners': [],
                'layoutDummy': layoutDummy,
                'iframeDummy': null,
                'unscaledInnerWidth': 0,
                'unscaledInnerHeight': 0
            };
        
            registerChangeHandlers();

            // TODO: Need to wait for <body> to be loaded but this is probably
            // later than needed.
            //window.addEventListener('load', function () {

                updateUnscaledDimensions();
                document.body.appendChild(layoutDummy);
        
                ponyfillVisualViewport = {
                    get offsetLeft () {
                        if (isSafari) {
                        // Note: Safari's getBoundingClientRect left/top is wrong when pinch-zoomed requiring this "unscaling".
                            return window.scrollX - (layoutDummy.getBoundingClientRect().left * this.scale + window.scrollX * this.scale);
                        } else {
                            return window.scrollX + layoutDummy.getBoundingClientRect().left;
                        }
                    },
                    get offsetTop () {
                        if (isSafari) {
                            // Note: Safari's getBoundingClientRect left/top is wrong when pinch-zoomed requiring this "unscaling".
                            return window.scrollY - (layoutDummy.getBoundingClientRect().top * this.scale + window.scrollY * this.scale);
                        } else {
                            return window.scrollY + layoutDummy.getBoundingClientRect().top;
                        }
                    },
                    get width () {
                        let clientWidth = document.documentElement.clientWidth;
                        if (isIEEdge) {
                            // If there's no scrollbar before pinch-zooming, Edge will add
                            // a non-layout-affecting overlay scrollbar. This won't be
                            // reflected in documentElement.clientWidth so we need to
                            // manually subtract it out.
                            if (document.documentElement.clientWidth == ponyfillHelper.unscaledInnerWidth
                                && this.scale > 1) {
                                let oldWidth = document.documentElement.clientWidth;
                                let prevHeight = layoutDummy.style.height;
                                // Lengthen the dummy to add a layout vertical scrollbar.
                                layoutDummy.style.height = '200%';
                                let scrollbarWidth = oldWidth - document.documentElement.clientWidth;
                                layoutDummy.style.width = prevHeight;
                                clientWidth -= scrollbarWidth;
                            }
                        }
                        return clientWidth / this.scale;
                    },
                    get height () {
                        let clientHeight = document.documentElement.clientHeight;
                        if (isIEEdge) {
                            // If there's no scrollbar before pinch-zooming, Edge will add
                            // a non-layout-affecting overlay scrollbar. This won't be
                            // reflected in documentElement.clientHeight so we need to
                            // manually subtract it out.
                            if (document.documentElement.clientHeight == ponyfillHelper.unscaledInnerHeight
                                && this.scale > 1) {
                                let oldHeight = document.documentElement.clientHeight;
                                let prevWidth = layoutDummy.style.width;
                                // Widen the dummy to add a layout horizontal scrollbar.
                                layoutDummy.style.width = '200%';
                                let scrollbarHeight = oldHeight - document.documentElement.clientHeight;
                                layoutDummy.style.width = prevWidth;
                                clientHeight -= scrollbarHeight;
                            }
                        }
                        return clientHeight / this.scale;
                    },
                    get scale () {
                        return ponyfillHelper.unscaledInnerWidth / window.innerWidth;
                    },
                    get pageLeft () {
                        return window.scrollX;
                    },
                    get pageTop () {
                        return window.scrollY;
                    },
                    'addEventListener': function (name, func) {
                        // TODO: Match event listener semantics. i.e. can't add the same callback twice.
                        if (name === 'scroll')
                            ponyfillHelper.scrollEventListeners.push(func);
                        else if (name === 'resize')
                            ponyfillHelper.resizeEventListeners.push(func);
                    }
                };

            //});

            ponyfillWasSetup = true;
        }


        return ponyfillVisualViewport;
    }
}

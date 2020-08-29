let supports; // cache the result for performance

// feature detect if the browser supports passive event listeners
// https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener
export default function supportsPassiveEvents () {
    if (supports !== undefined)
        return supports;

    supports = false;
    try {
        const options = Object.defineProperty({}, 'passive', {
            get: function () {
                supports = true;
                return supports;
            }
        });

        window.addEventListener('test', options, options);
        window.removeEventListener('test', options, options);
    } catch (err) {
        supports = false;
    }

    return supports;
}

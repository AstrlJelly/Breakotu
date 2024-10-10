// basic clamp, seems to be the best method as of now
function clamp(val, min, max) {
    return Math.max(min, Math.min(val, max));
}

// Easing functions
// linear interpolation!
function lerp(t, start, end) {
    return start + ((end - start) * t);
}

function easeInCubic(t, s, e) {
    return lerp(Math.pow(t, 3), s, e);
}

function easeOutCubic(t, start, end) {
    return lerp(1 - Math.pow(1 - t, 3), start, end);
}

// does not work as of now
// function easeInOutCubic(t, start, end) {
//     return (t < 0.5 ? easeInCubic : easeOutCubic)(t - 0.5, start, end);
// }
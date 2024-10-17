// basic clamp, seems to be the best method as of now
function clamp(val: number, min: number, max: number) {
    return Math.max(min, Math.min(val, max));
}

function radiansToDegrees(radians: number) {
    return radians * (180 / Math.PI);
}

function degreesToRadians(degrees: number) {
    return degrees * (Math.PI / 180);
}

function rotatePointAboutPosition(
    vector: Vector,
    rotVector: Vector,
    angle: number
) {
    let x = vector.x,
        y = vector.y;
    let rotX = rotVector.x,
        rotY = rotVector.y;
    return new Vector(
        (x - rotX) * Math.cos(angle) - (y - rotY) * Math.sin(angle) + rotX,
        (x - rotX) * Math.sin(angle) + (y - rotY) * Math.cos(angle) + rotY
    );
}

// Easing functions
// linear interpolation!
function lerp(t: number, start: number, end: number) {
    return start + (end - start) * t;
}

function easeInCubic(t: number, s: number, e: number) {
    return lerp(Math.pow(t, 3), s, e);
}

function easeOutCubic(t: number, start: number, end: number) {
    return lerp(1 - Math.pow(1 - t, 3), start, end);
}

// does not work as of now
// function easeInOutCubic(t, start, end) {
//     return (t < 0.5 ? easeInCubic : easeOutCubic)(t - 0.5, start, end);
// }

// Constants for HTML
const __CANVAS = document.querySelector("canvas");
const __CTX = __CANVAS?.getContext("2d");
// workaround so that canvas and ctx can be verifiably not null
if (!__CANVAS || !__CTX) {
    throw Error(
        !__CANVAS
            ? "Canvas was null! Are you sure you have a canvas in the currently loaded HTML?"
            : "What the hell. getContext() can be null? It was null."
    );
}

const CANVAS: HTMLCanvasElement = __CANVAS;
const CTX: CanvasRenderingContext2D = __CTX;

// const OCANVAS = CANVAS.transferControlToOffscreen();
// const OCTX = OCANVAS.getContext("2d");

// const worker = new Worker("offscreenCanvas.js");
// worker.postMessage({ canvas: OCANVAS }, [OCANVAS]);

type OtuMouseEvent = (this: HTMLCanvasElement, ev: MouseEvent) => any;

class Vector {
    x: number;
    y: number;
    z: number;
    constructor(x = 0, y = 0, z = 0) {
        this.x = x || 0;
        this.y = y || 0;
        this.z = z || 0;
    }
    add(mod: Vector | number) {
        if (mod instanceof Vector) {
            this.x += mod.x || 0;
            this.y += mod.y || 0;
            this.z += mod.z || 0;
        } else {
            this.x += mod || 0;
            this.y += mod || 0;
            this.z += mod || 0;
        }
        return this;
    }
    subtract(mod: Vector) {
        this.add(-mod);
        return this;
    }
    multiply(mod: Vector | number) {
        if (mod instanceof Vector) {
            this.x *= mod.x || 0;
            this.y *= mod.y || 0;
            this.z *= mod.z || 0;
        } else {
            this.x *= mod || 0;
            this.y *= mod || 0;
            this.z *= mod || 0;
        }
        return this;
    }
    // divide(mod : Vector | number) {
    //     this.multiply(1 / mod);
    //     return this;
    // }
    clone() {
        return new Vector(this.x, this.y, this.z);
    }
    normalize() {
        const magnitude = this.magnitude();
        if (magnitude !== 0) {
            this.multiply(1 / magnitude);
        }
        return this;
    }
    magnitude() {
        const x = this.x;
        const y = this.y;
        const z = this.z;
        return Math.sqrt(x * x + y * y + z * z);
    }
    heading() {
        return radiansToDegrees(Math.atan2(this.y, this.x));
    }
    setHeading(heading: number) {
        const magnitude = this.magnitude();
        const radians = degreesToRadians(heading);
        this.x = magnitude * Math.cos(radians);
        this.y = magnitude * Math.sin(radians);
        return this;
    }
    rotate(angle: number) {
        this.setHeading(this.heading() + angle);
        return this;
    }
    dot(vector: Vector) {
        return this.x * vector.x + this.y * vector.y + this.z * vector.z;
    }
    cross(v: Vector) {
        const x = this.y * v.z - this.z * v.y;
        const y = this.z * v.x - this.x * v.z;
        const z = this.x * v.y - this.y * v.x;
        return new Vector(x, y, z);
    }
    angleBetween(vector: Vector) {
        let angle = Math.acos(
            this.dot(vector) / (this.magnitude() * vector.magnitude())
        );
        angle = angle * Math.sign(this.cross(vector).z || 1);
        return radiansToDegrees(angle);
    }
    array() {
        return [this.x, this.y, this.z];
    }
}

//#region GameObjects
class GameObject {
    static #thingID: number;
    static DEGREES: number;

    // gameobject vars
    #alive: boolean;
    #id: number;
    // #type: string;
    #debug: boolean;

    // pos/scale vars
    #x: number;
    #y: number;
    #size: Vector;
    // #height: number;
    // #width: number;
    bounds: { left: number; right: number; top: number; bottom: number } | null;
    anchor: Vector;
    lineWidth: number;
    filled: boolean;

    // color
    #hasBorder: boolean;
    #rotation: number;
    #color: string;
    opacity: number;
    stroke: string;
    focused: boolean;
    _layer: number;
    _lastCalculatedBoundsID: number;
    _sortInvalidated: boolean;
    // _boundsInvalidated: boolean;
    _invalidationDependants: GameObject[];
    constructor(width: number = 0, height: number = 0) {
        // this.#type = "Thing";
        this.#id = GameObject.#thingID++;
        this.#debug = false;
        this.#alive = true;

        this.#x = 0;
        this.#y = 0;
        this.#size = new Vector(width, height);
        // this.#height = 0;
        // this.#width = 0;
        this.bounds = null;
        this._updateBounds();
        this.anchor = new Vector(0.5, 0.5);
        console.log(this.anchor.x);
        this.lineWidth = 2;
        this.filled = true;
    
        this.#color = "#000000";
        this.opacity = 1;
        this.stroke = "#000000";
        this.#hasBorder = false;
        this.focused = false;
        this.#rotation = 0;
        this._layer = 1;
        this._lastCalculatedBoundsID = 0;
        this._sortInvalidated = true;
        // this._boundsInvalidated = true;
        this._invalidationDependants = [];
    }
    add() {
        ALL_GAMEOBJECTS.set(this.#id, this);
    }
    remove() {
        ALL_GAMEOBJECTS.delete(this.#id);
    }

    set layer(newLayer) {
        this._sortInvalidated = true;
        this._layer = newLayer;
    }
    get layer() {
        return this._layer;
    }
    set width(width) {
        this.#size.x = width;
        this._invalidateBounds();
    }
    get width() {
        return this.#size.x;
    }
    set height(height) {
        this.#size.y = height;
        this._invalidateBounds();
    }
    get height() {
        return this.#size.y;
    }
    set rotation(rotation) {
        this.#rotation = rotation;
        this._invalidateBounds();
    }
    get rotation() {
        return this.#rotation;
    }
    getX() {
        return this.x;
    }
    getY() {
        return this.y;
    }
    set x(x) {
        this.#x = x;
        this._invalidateBounds();
    }
    get x() {
        return this.#x;
    }
    set y(y) {
        this.#y = y;
        this._invalidateBounds();
    }
    get y() {
        return this.#y;
    }
    get id() {
        return this.#id;
    }
    setFilled(filled: boolean) {
        this.filled = filled;
    }
    isFilled() {
        return this.filled;
    }
    setHasBorder(hasBorder: boolean) {
        this.#hasBorder = hasBorder;
    }
    getHasBorder() {
        return this.#hasBorder;
    }
    setOpacity(opacity: number) {
        this.opacity = opacity;
    }
    setPosition(x: number, y: number) {
        if (!isFinite(x)) {
            throw new TypeError(
                "Invalid value for x-coordinate. Make sure you are passing finite numbers to `setPosition(x, y)`. Did you forget the parentheses in `getWidth()` or `getHeight()`? Or did you perform a calculation on a variable that is not a number?"
            );
        }
        if (!isFinite(y)) {
            throw new TypeError(
                "Invalid value for y-coordinate. Make sure you are passing finite numbers to `setPosition(x, y)`. Did you forget the parentheses in `getWidth()` or `getHeight()`? Or did you perform a calculation on a variable that is not a number?"
            );
        }
        this.x = x;
        this.y = y;
    }
    setRotation(degrees: number, angleUnit: number | undefined = undefined) {
        if (!isFinite(degrees)) {
            throw new TypeError(
                "Invalid value for degrees. Make sure you are passing finite numbers to `setRotation(degrees, angleUnit)`. Did you perform a calculation on a variable that is not a number?"
            );
        }
        if (!angleUnit) {
            angleUnit = GameObject.DEGREES;
        }
        if (!isFinite(angleUnit)) {
            throw new TypeError(
                "Invalid value for `angleUnit`. Make sure you are passing finite numbers to `setRotation(degrees, angleUnit)`."
            );
        }
        if (angleUnit === GameObject.DEGREES) {
            this.#rotation = (degrees * Math.PI) / 180;
        } else {
            this.#rotation = degrees;
        }
    }
    rotate(degrees: number, angleUnit: number) {
        if (!isFinite(degrees)) {
            throw new TypeError(
                "Invalid value for degrees. Make sure you are passing finite numbers to `rotate(degrees, angleUnit)`. Did you perform a calculation on a variable that is not a number?"
            );
        }
        if (!angleUnit) {
            angleUnit = GameObject.DEGREES;
        }
        if (!isFinite(angleUnit)) {
            throw new TypeError(
                "Invalid value for `angleUnit`. Make sure you are passing finite numbers to `rotate(degrees, angleUnit)`."
            );
        }
        if (angleUnit == GameObject.DEGREES) {
            this.rotation += degreesToRadians(degrees);
        } else {
            this.rotation += degrees;
        }
        this._invalidateBounds();
    }
    setColor(color: string) {
        if (color === void 0) {
            throw new TypeError("Invalid color");
        }
        this.#color = color;
    }
    getColor() {
        return this.#color;
    }
    setBorderColor(color: string) {
        if (color === void 0) {
            throw new TypeError("Invalid color.");
        }
        this.stroke = color;
        this.#hasBorder = true;
    }
    getBorderColor() {
        return this.stroke;
    }
    setBorderWidth(width: number) {
        if (!isFinite(width)) {
            throw new Error(
                "Invalid value for border width. Make sure you are passing a finite number to `setBorderWidth(width)`."
            );
        }
        this.lineWidth = width;
        this.#hasBorder = width != 0;
    }
    getBorderWidth() {
        return this.lineWidth;
    }
    move(dx: number, dy: number) {
        if (!isFinite(dx)) {
            throw new TypeError(
                "Invalid number passed for `dx`. Make sure you are passing finite numbers to `move(dx, dy)`."
            );
        }
        if (!isFinite(dy)) {
            throw new TypeError(
                "Invalid number passed for `dy`. Make sure you are passing finite numbers to `move(dx, dy)`."
            );
        }
        this.x += dx;
        this.y += dy;
    }
    draw(context2: CanvasRenderingContext2D, subclassDraw: Function | null = null) {
        context2.save();
        this.anchor = new Vector(0.5, 0.5);
        if (this.#hasBorder) {
            context2.strokeStyle = this.stroke.toString();
            context2.lineWidth = this.lineWidth;
        }
        if (this.focused) {
            context2.shadowColor = "#0066ff";
            context2.shadowBlur = 20;
        }
        if (this.filled) {
            context2.fillStyle = this.#color.toString();
        }
        context2.globalAlpha = this.opacity;
        const anchorX = this.width * this.anchor.x;
        const anchorY = this.height * this.anchor.y;
        const drawX = this.x - anchorX;
        const drawY = this.y - anchorY;
        context2.translate(drawX, drawY);
        if (this.rotation) {
            context2.translate(this.width / 2, this.height / 2);
            context2.rotate(this.rotation);
            context2.translate(-this.width / 2, -this.height / 2);
        }
        subclassDraw == null ? void 0 : subclassDraw();
        if (this.filled) {
            context2.fill();
        }
        if (this.#hasBorder) {
            context2.stroke();
        }
        if (this.#debug) {
            context2.beginPath();
            context2.arc(anchorX, anchorY, 3, 0, 2 * Math.PI);
            context2.closePath();
            context2.fillStyle = "red";
            context2.strokeStyle = "red";
            context2.fill();
            const bounds = this.getBounds()!;
            context2.translate(-drawX, -drawY);
            context2.strokeRect(
                bounds.left,
                bounds.top,
                bounds.right - bounds.left,
                bounds.bottom - bounds.top
            );
        }
        context2.restore();
    }
    focus() {
        this.focused = true;
    }
    unfocus() {
        this.focused = false;
    }
    describe() {
        return `A ${typeof(this)} at ${this.x}, ${this.y}. Colored: ${
            this.#color
        }.`;
    }
    containsPoint(vector: Vector) {
        let newPoint = vector;
        if (this.rotation) {
            const anchorX = this.width * this.anchor.x;
            const anchorY = this.height * this.anchor.y;
            const rotX = this.x - anchorX + this.width / 2;
            const rotY = this.y - anchorY + this.height / 2;
            newPoint = rotatePointAboutPosition(
                new Vector(this.x, this.y),
                new Vector(rotX, rotY),
                -this.rotation
            );
        }
        return this._containsPoint(newPoint.x, newPoint.y);
    }
    _containsPoint(x: any, y: any) {
        throw new Error("Method not implemented.");
    }
    setAnchor(anchor: Vector) {
        this.anchor = anchor;
        this._invalidateBounds();
    }
    getAnchor() {
        return this.anchor;
    }
    getBounds(): typeof this.bounds {
        if (this._boundsInvalidated()) {
            this._updateBounds();
        }
        return this.bounds;
    }
    _invalidateBounds() {
        this.bounds = null;
        this._invalidationDependants.forEach((element) => {
            element._invalidateBounds();
        });
    }
    _boundsInvalidated() {
        return this.bounds == null;
    }
    _updateBounds() {
        this.anchor = new Vector(0.5, 0.5);
        let left = Math.ceil(this.x - this.anchor.x * this.width);
        let right = Math.ceil(this.x + (1 - this.anchor.x) * this.width);
        let top = Math.ceil(this.y - this.anchor.y * this.height);
        let bottom = Math.ceil(this.y + (1 - this.anchor.y) * this.height);
        this.bounds = {
            left,
            right,
            top,
            bottom,
        };
        this._lastCalculatedBoundsID++;
        // this._boundsInvalidated = false;
    }
}

class Rectangle extends GameObject {
    constructor(width: number, height: number) {
        super(width, height);
        // this.#width = width;
        // this.#height = height;
    }
}

class Circle extends GameObject {
    #radius : number;

    constructor(radius: number) {
        super();
        this.#radius = radius;
    }

    set radius(radius : number) {
        this.#radius = radius;
    }
    get radius() : number {
        return this.#radius;
    }
}
//#endregion

const ALL_GAMEOBJECTS : Map<number, GameObject> = new Map<number, GameObject>();

function initEngine() {
    drawRectangle(50, 50, 50, 50);
    mainLoop();
}

function mainLoop() {
    iterateFunc(ALL_GAMEOBJECTS.values(), (go : GameObject) => {
        console.log(go.describe());
        go.draw(CTX);
    });
    requestAnimationFrame(mainLoop);
}

function getWidth() {
    return CANVAS.width;
}

function getHeight() {
    return CANVAS.height;
}

// // use a set to basically use functions as a key and value
// // an object as a key is... weird. but it works extremely well.
// // it allows for O(1) adding and removal
// // it maybe doesn't really matter, but it's cool!!
// const MOUSE_CLICK_METHODS = new Set<Function>();
// CANVAS.addEventListener("click", () => MOUSE_CLICK_METHODS.forEach(v => v()), false);

// // return func so that you can create the func inside the function call
// function addMouseClickMethod(func : Function) {
//     MOUSE_CLICK_METHODS.add(func);
//     return func;
// }

// function removeMouseClickMethod(func : Function) {
//     return MOUSE_CLICK_METHODS.delete(func);
// }

//#region mouse event
// return func so that you can create the func inside the function call
function addMouseClickMethod(func: OtuMouseEvent) {
    CANVAS.addEventListener("click", func, false);
    return func;
}

function removeMouseClickMethod(func: OtuMouseEvent) {
    return CANVAS.removeEventListener("click", func, false);
    // return MOUSE_CLICK_METHODS.delete(func);
}

function addMouseMoveMethod(func: OtuMouseEvent) {
    CANVAS.addEventListener("mousemove", func, false);
    return func;
}

function removeMouseMoveMethod(func: OtuMouseEvent) {
    return CANVAS.removeEventListener("mousemove", func, false);
    // return MOUSE_CLICK_METHODS.delete(func);
}
//#endregion

//#region sfx
const allSfxNames = {
    // "break_brick": "b7d1f6a0601098bc880fde49d791738f",
    break_brick: "2bf5829b077f520d6b57e390c3a9d78d",
    // "scream_short": "2bf5829b077f520d6b57e390c3a9d78d",
    scream:      "6e39d7fec9c7dfa7e621192c2294239f",
    bounce:      "ff57354c2646847faf94034145d6a23a",
    power1:      "9de78ce7bbe673cefa342b7a4fa0aa76",
    power2:      "77c5bc78c11bdf2c77ef16d9b648de02",
};

const allSfx = new Map(
    Object.entries(allSfxNames).map((kv) => [
        kv[0],
        new Audio("https://codehs.com/uploads/" + kv[1]),
    ])
);

function playOneShot(sfxName: string) {
    let sfx = allSfx.get(sfxName);
    if (sfx) {
        // restart sfx, then play it. acts as a oneshot
        sfx.pause();
        sfx.currentTime = 0;
        sfx.play();
    } else {
        console.error(sfxName + " is not a valid sfx!");
    }
}

function* iterateFunc<T>(iterator: IterableIterator<T>, mapping: Function) {
    for (let i of iterator) {
        yield mapping(i);
    }
}

//#endregion



// gameobject helper functions
// draws a circle in a single liner, and returns the circle object.
function drawCircle(rad = 0, x = 0, y = 0, color = "black"): Circle {
    let circ = new Circle(rad);
    drawObject(circ, x, y, color);
    return circ;
}

// draws a rectangle in a single liner, and returns the rectangle object.
function drawRectangle(width = 0, height = 0, x = 0, y = 0, color = "black" /*, centerAnchor = true*/): Rectangle {
    let rect = new Rectangle(width, height);
    drawObject(rect, x, y, color);
    return rect;
}

// // draws a line in a single liner (lol), and returns the line object.
// function drawLine(sX = 0, sY = 0, eX = 0, eY = 0) {
//     let line = new Line(sX, sY, eX, eY);
//     add(line);
//     return line;
// }

// common calls for generic canvas objects, put into one function
function drawObject(obj : GameObject, x : number, y : number, color : string) {
    obj.setPosition(x, y);
    obj.setColor(color);
    obj.add();
}

drawRectangle(50, 50, 50, 50, "green");
initEngine();
// Constants for UI
const UI_BACKGROUND = "gray";
const UI_HEIGHT = 80;

// Constants for bricks
const NUM_ROWS = 8;
const NUM_BRICKS_PER_ROW = 10;

const BRICK_TOP_OFFSET = 10;
const BRICK_SPACING = 2;
const SPACE_FOR_BRICKS = getWidth() - (NUM_BRICKS_PER_ROW + 1) * BRICK_SPACING;
const BRICK_WIDTH = SPACE_FOR_BRICKS / NUM_BRICKS_PER_ROW;
const BRICK_HEIGHT = 15;
const BRICK_COLORS = [
    "red", "orange", "green", "blue"
]

// Constants for ball and paddle
const PADDLE_WIDTH = 80;
const PADDLE_HEIGHT = 10;
const PADDLE_OFFSET = 10;

const BALL_RADIUS = 10;
const BALL_COLOR = "gray";
const BALL_BORDER_COLOR = "black";

const BOUNCE_LENIENCY = 20;
const MAX_BOUNCE_CHANGE = 80;
const MAX_BOUNCE_ANGLE = 60;

// Constants for game
const SIDE_BUFFER = 50 + 1;
const BACKGROUND_COLOR = "white";
const FRAME_DELAY = 1000 / 60;
const START_LIVES = 3;

let allBricks = [];

// let ball = null;
let balls = [];

let paddle = null;
let paddleVel = 0;

const CANVAS = document.querySelector('canvas');
const CTX = CANVAS.getContext("2d");

function main() {
    drawRectangle(
        getWidth() + SIDE_BUFFER * 2, getHeight() + SIDE_BUFFER,
        -SIDE_BUFFER, -SIDE_BUFFER,
        BACKGROUND_COLOR
    );
	initBricks();
    initPaddle();
    // initBall(new Vector(getWidth() / 2 - 20, getHeight() / 2));
    // initBall(new Vector(getWidth() / 2 + 20, getHeight() / 2));
    initBall();
    initUI();
    mouseMoveMethod(onMouseMove);
    setTimer(decayPaddleVel, FRAME_DELAY);
}

function initBricks() {
    let brickColorIndexMult = BRICK_COLORS.length / NUM_ROWS;
    allBricks = [];
    for (let y = 0; y < NUM_ROWS; y++) { // vertical
        for (let x = 0; x < NUM_BRICKS_PER_ROW; x++) { // horizontal
            let brick = drawRectangle(
                BRICK_WIDTH, BRICK_HEIGHT,
                BRICK_SPACING + (BRICK_WIDTH + BRICK_SPACING) * x,
                BRICK_SPACING + (BRICK_HEIGHT + BRICK_SPACING) * y,
                BRICK_COLORS[Math.floor(y * brickColorIndexMult)]
            );
            allBricks.push(brick);
        }
    }
}

function initPaddle() {
    paddle = drawRectangle(
        PADDLE_WIDTH, PADDLE_HEIGHT,
        getWidth() / 2, getHeight() - PADDLE_OFFSET - PADDLE_HEIGHT - UI_HEIGHT
    );
}

// resetPos : Vector
function initBall(resetPos) {
    let circle = drawCircle(BALL_RADIUS, 0, 0, BALL_COLOR);
    // circle.setBorderColor(BALL_BORDER_COLOR);
    // circle.setBorderWidth(2);
    let ball = new BreakoutBall(circle, resetPos);
    ball.reset();
    balls.push(ball);
    // setTimeout(() => {
    //     setBallVelToPaddle();
    //     setTimer(() => ball.move(), FRAME_DELAY);
    // }, 1000);
}

function initUI() {
    drawRectangle(
        getWidth() + SIDE_BUFFER * 2, UI_HEIGHT + SIDE_BUFFER * 2,
        -SIDE_BUFFER, getHeight() - UI_HEIGHT,
        UI_BACKGROUND
    );
}

function breakBrick(brick) {
    playOneShot("break_brick");
    shakeScreen(150, 10)
    remove(brick);
}

function onMouseMove(e) {
    let x = e.getX(), y = e.getY();
    movePaddleFromMouse(x);
}

function movePaddleFromMouse(x) {
    let prevX = paddle.getX();
    paddle.setPosition(
        clamp(x - (paddle.getWidth() / 2), 0, getWidth() - paddle.getWidth()),
        getHeight() - PADDLE_OFFSET - PADDLE_HEIGHT - UI_HEIGHT
    );
    paddleVel /= 2;
    paddleVel += prevX - paddle.getX();
}

function decayPaddleVel() {
    paddleVel /= 1.5;
}

function setBallVelToPaddle(ball) {
    ball.vel.x = -1 * (ball.x - paddle.getX() - (paddle.getWidth() / 2));
    ball.vel.y = -1 * (ball.y - paddle.getY() - (paddle.getHeight() / 2));
    // ball.normalizeVel();
}

let stopShakeTimeout = 0;
let screenShakeMag = 0;

function shakeScreen(ms = 500, mag = 5) {
    // if there's a screen shake already going on, remove it first
    if (stopShakeTimeout) {
        clearTimeout(stopShakeTimeout);
        stopShakeTimeout = 0;
    }
    // make sure the magnitude doesn't get to the 
    // point of going past the screen buffer space
    screenShakeMag = clamp(mag, 0, SIDE_BUFFER - 1);
    setTimer(moveScreenRandomly, FRAME_DELAY);
    stopShakeTimeout = setTimeout(() => {
        stopTimer(moveScreenRandomly);
        CTX.resetTransform();
    }, ms);
}

function moveScreenRandomly(mag = 5) {
    // move the x and y offset between -0.5 and 0.5
    // then multiply it by the magnitude. 
    CTX.setTransform(
        1, 0, 0, 1,
        (0.5 - Math.random()) * mag,
        (0.5 - Math.random()) * mag
    );
}

const allSfxNames = {
    // "break_brick": "b7d1f6a0601098bc880fde49d791738f",
    "break_brick": "2bf5829b077f520d6b57e390c3a9d78d",
    // "scream_short": "2bf5829b077f520d6b57e390c3a9d78d",
    "scream":      "6e39d7fec9c7dfa7e621192c2294239f",
    "bounce":      "ff57354c2646847faf94034145d6a23a",
    "power1":      "9de78ce7bbe673cefa342b7a4fa0aa76",
    "power2":      "77c5bc78c11bdf2c77ef16d9b648de02",
};

const allSfx = new Map(
    Object.entries(allSfxNames).map(
        (kv) => [ kv[0], new Audio("https://codehs.com/uploads/" + kv[1]) ]
    ),
);

function playOneShot(sfxName) {
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

// use a set to basically use functions as a key and value
// an object as a key is... weird. but it works extremely well.
// it allows for O(1) adding and removal
// it maybe doesn't really matter, but it's cool!!
const MOUSE_CLICK_METHODS = new Set();
mouseClickMethod(() => MOUSE_CLICK_METHODS.forEach(v => v()));

// return func so that you can create the func inside the function call
function addMouseClickMethod(func) {
    MOUSE_CLICK_METHODS.add(func);
    return func;
}

function removeMouseClickMethod(func) {
    return MOUSE_CLICK_METHODS.delete(func);
}

// draws a circle in a single liner, and returns the circle object.
function drawCircle(rad = 0, x = 0, y = 0, color = "black") {
    let circ = new Circle(rad);
    drawObject(circ, x, y, color);
    return circ;
}

// draws a rectangle in a single liner, and returns the rectangle object.
function drawRectangle(width = 0, height = 0, x = 0, y = 0, color = "black"/*, centerAnchor = true*/) {
    let rect = new Rectangle(width, height);
    drawObject(rect, x, y, color);
    return rect;
}

// common calls for generic canvas objects, put into one function
function drawObject(obj, x, y, color) {
    obj.setPosition(x, y);
    obj.color = color;
    add(obj);
}

// draws a line in a single liner (lol), and returns the line object.
function drawLine(sX = 0, sY = 0, eX = 0, eY = 0) {
    let line = new Line(sX, sY, eX, eY);
    add(line);
    return line;
}


main();
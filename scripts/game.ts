// import { BreakoutBall } from "./breakoutBall";

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
const BRICK_COLORS = ["red", "orange", "green", "blue"];

// Constants for ball and paddle
const PADDLE_WIDTH = 80;
const PADDLE_HEIGHT = 10;
const PADDLE_OFFSET = 10;

const BALL_RADIUS = 10;
const BALL_COLOR = "gray";
const BALL_BORDER_COLOR = "black";

// Constants for game
const SIDE_BUFFER = 50 + 1;
const BACKGROUND_COLOR = "white";

let allBricks: Rectangle[] = [];

let balls: BreakoutBall[] = [];

let paddle: Rectangle; // = null;
let paddleVel = 0;

function init() {
    // init();
    drawRectangle(
        getWidth() + SIDE_BUFFER * 2,
        getHeight() + SIDE_BUFFER,
        -SIDE_BUFFER,
        -SIDE_BUFFER,
        BACKGROUND_COLOR
    );
    initBricks();
    initPaddle();
    // initBall(new Vector(getWidth() / 2 - 20, getHeight() / 2));
    // initBall(new Vector(getWidth() / 2 + 20, getHeight() / 2));
    initBall();
    initUI();
    addMouseMoveMethod(onMouseMove);
    setInterval(decayPaddleVel, FRAME_DELAY);
}

function initBricks() {
    let brickColorIndexMult = BRICK_COLORS.length / NUM_ROWS;
    allBricks = [];
    for (let y = 0; y < NUM_ROWS; y++) {
        // vertical
        for (let x = 0; x < NUM_BRICKS_PER_ROW; x++) {
            // horizontal
            let brick = drawRectangle(
                BRICK_WIDTH,
                BRICK_HEIGHT,
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
        PADDLE_WIDTH,
        PADDLE_HEIGHT,
        getWidth() / 2,
        getHeight() - PADDLE_OFFSET - PADDLE_HEIGHT - UI_HEIGHT
    );
}

// resetPos : Vector
function initBall(resetPos: Vector | undefined = undefined) {
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
        getWidth() + SIDE_BUFFER * 2,
        UI_HEIGHT + SIDE_BUFFER * 2,
        -SIDE_BUFFER,
        getHeight() - UI_HEIGHT,
        UI_BACKGROUND
    );
}

function breakBrick(brick : Rectangle) {
    playOneShot("break_brick");
    shakeScreen(150, 10);
    brick.remove();
}

function onMouseMove(e : MouseEvent) {
    let x = e.x, y = e.y;
    movePaddleFromMouse(x);
}

function movePaddleFromMouse(x : number) {
    let prevX = paddle.getX();
    paddle.setPosition(
        clamp(x - paddle.width / 2, 0, getWidth() - paddle.width),
        getHeight() - PADDLE_OFFSET - PADDLE_HEIGHT - UI_HEIGHT
    );
    paddleVel /= 2;
    paddleVel += prevX - paddle.getX();
}

function decayPaddleVel() {
    paddleVel /= 1.5;
}

function setBallVelToPaddle(ball: BreakoutBall) {
    ball.vel.x = -1 * (ball.x - paddle.getX() - paddle.width / 2);
    ball.vel.y = -1 * (ball.y - paddle.getY() - paddle.height / 2);
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
    let handle = setInterval(moveScreenRandomly, FRAME_DELAY);
    stopShakeTimeout = setTimeout(() => {
        clearInterval(handle);
        CTX.resetTransform();
    }, ms);
}

function moveScreenRandomly(mag = 5) {
    // move the x and y offset between -0.5 and 0.5
    // then multiply it by the magnitude.
    CTX.setTransform(
        1, 0, 0, 1, (0.5 - Math.random()) * mag, (0.5 - Math.random()) * mag
    );
}

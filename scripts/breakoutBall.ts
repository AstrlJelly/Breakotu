enum BallState {
    DEFAULT = 0,
    BIG = 1,
    FAST = 2,
    SLOW = 4,
}

class BreakoutBall {
    ball: Circle;
    resetPosition: Vector;
    vel: Vector;
    speed: number;

    // allows for animation of the ball, like returning to the center
    collisionsEnabled = true;
    movementEnabled = false;

    // currently only used to let the ball go through the paddle
    // when bouncing from somewhere that isn't the top of it
    canBounce = true;

    // shorthands
    get x() {
        return this.ball.getX();
    }
    get y() {
        return this.ball.getY();
    }

    // returns the character of the axis bounced. not the best?
    // overall this entire function could just be better
    hasCollidedWithRect(rect: Rectangle) {
        let cx = this.ball.x,
            cy = this.ball.y;
        let rx = rect.getX(),
            ry = rect.getY();
        let rw = rect.getWidth(),
            rh = rect.getHeight();

        let checkX = cx,
            checkY = cy;
        if (cx < rx) {
            // left edge
            checkX = rx;
            // collision.x = -1;
        } else if (cx > rx + rw) {
            // right edge
            checkX = rx + rw;
            // collision.x = 1;
        }

        if (cy < ry) {
            // top edge
            checkY = ry;
            // collision.y = -1;
        } else if (cy > ry + rh) {
            // bottom edge
            checkY = ry + rh;
            // collision.y = 1;
        }
        let distX = cx - checkX;
        let distY = cy - checkY;
        let distance = Math.sqrt(distX * distX + distY * distY);
        if (distance <= this.ball.getRadius()) {
            // return collision;
            return new Vector(distX, distY);
        }
        return null;
    }

    // use hasCollidedWithRect on a bunch of different things
    // should DEFINITELY do some fuzzy search thing for optimization
    checkAllCollisions(vector: Vector | undefined = undefined) {
        if (!this.collisionsEnabled) return;
        let ballX = vector?.x ?? this.x;
        let ballY = vector?.y ?? this.y;
        let ballRad = this.ball.getRadius();
        if (ballY - ballRad > getHeight() - UI_HEIGHT) {
            this.moveBallToCenter();
            return true;
        }
        for (let i = 0; i < allBricks.length; i++) {
            let collision = this.hasCollidedWithRect(allBricks[i]);
            if (collision) {
                breakBrick(allBricks[i]);
                // TODO: fix this
                // bounces weirdly sometimes; im pretty sure it's because
                // the ball is going right, but overshoots and is technically
                // on the right side, so it still reverses the velocity
                // attempted fixes in order of when they were made, don't seem to work?
                if (collision.x) {
                    // if ((collision.x < 0 && this.vel.x > 0) || (collision.x > 0 && this.vel.x < 0)) {
                    this.vel.x *= -1;
                }
                if (collision.y) {
                    // if ((collision.y < 0 && this.vel.y > 0) || (collision.y > 0 && this.vel.y < 0)) {
                    this.vel.y *= -1;
                }
                // if (collision.x > collision.y) {
                //     this.vel.x *= -1;
                // } else {
                //     this.vel.y *= -1;
                // }
                allBricks.splice(i, 1);
                break;
            }
        }
        if (this.canBounce && ballY - BOUNCE_LENIENCY < paddle.getY()) {
            let collision = this.hasCollidedWithRect(paddle);
            if (collision) {
                this.canBounce = false;
                playOneShot("bounce");
                this.vel.y *= -1;
                let degrees =
                    Math.atan2(this.vel.y, this.vel.x) * (180 / Math.PI);
                let ballNormalizedX =
                    (ballX - paddle.getX()) / paddle.getWidth();
                degrees += MAX_BOUNCE_CHANGE * -(0.5 - ballNormalizedX);
                // -180 is left, 0 is right, -90 is straight up
                degrees = clamp(
                    degrees,
                    -180 + (90 - MAX_BOUNCE_ANGLE),
                    -(90 - MAX_BOUNCE_ANGLE)
                );
                console.log("degrees : " + degrees);
                let radians = degrees * (Math.PI / 180);
                this.vel.x = Math.cos(radians);
                this.vel.y = Math.sin(radians);
                return true;
            }
        } else {
            this.canBounce = ballY + ballRad < paddle.getY();
        }
        // TODO: fix this. these wall collision functions might not work!!
        // if the ball can't get out of the side in time,
        // it'll get stuck switching between velocities
        if (ballX - ballRad < 0 || ballX + ballRad > getWidth()) {
            this.vel.x *= -1;
            return true;
        }
        if (ballY - ballRad < 0) {
            this.vel.y *= -1;
            return true;
        }
        return false;
    }
    move() {
        if (!this.movementEnabled) return;
        this.normalizeVel();
        this.checkAllCollisions();
        // this.normalizeVel();
        let moveX = FRAME_DELAY * this.speed * this.vel.x;
        let moveY = FRAME_DELAY * this.speed * this.vel.y;
        this.ball.move(moveX, moveY);
        // for (let i = 0; i < 4; i++) {
        //     this.checkAllCollisions();
        //     this.ball.move(moveX / 4, moveY / 4);
        // }
    }
    normalizeVel() {
        // let magnitude = Math.sqrt(Math.pow(this.vel.x, 2) + Math.pow(this.vel.y, 2));
        // this.vel.x /= magnitude;
        // this.vel.y /= magnitude;
        this.vel.normalize();
    }
    reset() {
        let root = this;
        root.ball.setPosition(root.resetPosition.x, root.resetPosition.y);
        root.movementEnabled = false;
        // let handle = addMouseClickMethod(() => {
        //     setBallVelToPaddle();
        //     root.movementEnabled = true;
        //     removeMouseClickMethod(handle);
        // })
        let onClick = addMouseClickMethod(() => {
            setBallVelToPaddle(root);
            root.movementEnabled = true;
            removeMouseClickMethod(onClick);
        });
    }
    moveBallToCenter() {
        this.collisionsEnabled = false;
        this.movementEnabled = false;
        let root = this;
        let time = 0;
        let startX = this.x,
            startY = this.y;
        let endX = this.resetPosition.x,
            endY = this.resetPosition.y;

        let interval = setInterval(() => {
            if (time >= 1) {
                // end, clean up
                root.ball.setPosition(endX, endY);
                root.collisionsEnabled = true;
                root.movementEnabled = true;
                root.reset();
                clearInterval(interval);
            }
            let newX = easeOutCubic(time, startX, endX);
            let newY = easeOutCubic(time, startY, endY);
            root.ball.setPosition(newX, newY);
            time += FRAME_DELAY / 1000;
        }, FRAME_DELAY);
    }
    constructor(ball: Circle, resetPos: Vector | undefined) {
        this.ball = ball;
        this.resetPosition =
            resetPos ?? new Vector(getWidth() / 2, getHeight() / 2);
        this.speed = 0.5;
        this.vel = new Vector(0, 0);
        // {
        //     x: 0,
        //     y: 0,
        // };
        let root = this;
        setInterval(() => root.move(), FRAME_DELAY);
    }
}

class particle {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.r = 20;
        this.alpha = 255;
    }
    update() {
        this.r += 3;
        this.alpha -= 5;
    }
    die() {
        if (this.alpha <= 0) {
            return true;
        }
        else {
            return false;
        }
    }
    display() {
        ellipseMode(CENTER);
        noFill();
        strokeWeight(3);
        stroke(255, this.alpha);
        ellipse(this.x, this.y, this.r);
    }
}
function draw() {
    if (tutorial) {
        // console.log(width, height);
        push();
        translate(width, 0);
        scale(-1, 1);
        image(video, 0, 0, tutorialVideoWidth, tutorialVideoHeight);
        pop();
        if (tutorialAnimation) {
            noFill();
            stroke(255);
            strokeWeight(4);
            ellipse(tutorialVideoWidth/5, tutorialVideoHeight - ellipseY, 50);
            ellipse(4*tutorialVideoWidth/5, tutorialVideoHeight - ellipseY, 50);
            ellipseY += ellipseVelocity;
            if (ellipseY <= -25 || ellipseY >= tutorialVideoHeight * 0.8) {
                ellipseVelocity *= -1;
            }
        }
        if (counter % 100 == 0) {
            tutorialBreathCount++;
            document.getElementById('tutorialBreathCounter').innerHTML = "Breath Count: " + tutorialBreathCount;
        }
    }
    if (pose && startBreathing) {
        push();
        translate(width,0);
        scale(-1, 1);
        image(video, 0, 0, videoWidth, videoHeight);
        pop();
        if (pose.rightWrist.y >= height && pose.leftWrist.y >= height) {
            if (!inhaleComplete) {
                breathStart = true;
                breathBeginTimer = millis();
            }
            if (inhaleComplete) {
                inhaleComplete = false;
                breathEndTimer = millis();
                breathTimerDifference = breathEndTimer - breathBeginTimer;

                if (breathTimerDifference >= 2500) {
                    console.log(breathTimerDifference);
                    breathRates.push(breathTimerDifference);
                    sessionBreathCount += mindfulnessAidMultiplier;
                    individualBreathCount += mindfulnessAidMultiplier;
                    universalBreathCount += mindfulnessAidMultiplier;

                    if (breathRates) {
                        let breathRateAverage = 0;
                        let breathRatesTotal = 0;
                        for (i = 0; i < breathRates.length; i++) {
                            breathRatesTotal += breathRates[i];
                        }
                        breathRateAverage = floor(breathRatesTotal/breathRates.length);
                        
                        if (standardActivated) {
                            if (breathTimerDifference <= breathRateAverage + standard && breathTimerDifference >= breathRateAverage - standard) {
                                sessionBreathCount += fidelityBonus * mindfulnessAidMultiplier;
                                individualBreathCount += fidelityBonus * mindfulnessAidMultiplier;
                                universalBreathCount += fidelityBonus * mindfulnessAidMultiplier;
                            }
                        }
                        document.getElementById('averageReadout').innerHTML = breathRateAverage;
                        document.getElementById('lastBreathReadout').innerHTML = breathTimerDifference;
                    }

                    // Update document
                    updateBreaths();

                    // EMIT user specific object to server
                    let newBreaths = individualBreathCount - lastBreathCount;

                    // console.log(newBreaths);
                    socket.emit('msg', newBreaths);
                    lastBreathCount = individualBreathCount;
                } else {
                    tooFast();
                }
            }
        }
        if (breathStart && pose.rightWrist.y <= pose.rightShoulder.y && pose.leftWrist.y <= pose.leftShoulder.y) {
            inhaleComplete = true;
            breathStart = false;
        }
        runGraphics();
        runUpgrades();
        growDisplay();
    }
    counter++;
    endBettingMinigame();
    bettingTimeout();
}

function runUpgrades() {
    // console.log("Upgrade Points: ", upgradePoints);
    if (individualBreathCount >= upgradeIntervals[upgradeCounter]) {
        upgradeCounter++;
        upgradePoints++;
        let message = "New upgrade available. Next upgrade at " + upgradeIntervals[upgradeCounter] + " breaths. Upgrade Points: " + upgradePoints;
        newMessage(message);
    }
    if (upgradePoints > 0) {
        upgradeAvailable = true;
    } else {
        upgradeAvailable = false;
    }
}

function growDisplay() {
    if (individualBreathCount >= growDisplayIntervals[growDisplayCounter]) {
        for (i = 0; i < growDisplayIntervals.length; i++) {
            if (growDisplayCounter == i) {
                document.getElementById(displayComponentIds[i]).style.visibility = "visible";
                let message = displayComponentIds[i] + " added. Keep up the good work.";
                newMessage(message);
            }
        }
        if (growDisplayCounter == 3) {
            document.getElementById('breathCounts').style.display = "flex";
            document.getElementById('justBreathCount').style.display = "none";
            leaderboardReadout = true;
            loadLeaderboard();
        }
        if (growDisplayCounter == 5) {
            for (i = 0; i < mandalas.length; i++) {
                mandalas[i].children[0].style.display = "flex";
            }
            for (i = 0; i < plants.length; i++) {
                plants[i].children[0].style.display = "flex";
            }
        }
        growDisplayCounter++;
        console.log(growDisplayCounter)
    }
}


function runAutoBreathers() {
    if (autoActivated) {
        let offset = 0;
        for (i = 0; i < autoCounter; i++) {
            setTimeout(() => {
                individualBreathCount += 1;
                sessionBreathCount += 1;
                universalBreathCount += 1;
                updateBreaths();
            }, 100 + offset);
            offset += 100;
            // console.log(offset);
        }
    }
}

function runGraphics() {
    if (prettyHandsDraw == true){
        particles.push(new particle(width - pose.rightWrist.x, pose.rightWrist.y));
        particles.push(new particle(width - pose.leftWrist.x, pose.leftWrist.y));
        for (i = 0; i < particles.length; i++){
            particles[i].update();
            particles[i].display();
            if (particles[i].die()) {
                particles.shift();
            }
        }
    }
    if (counter % 1000 == 0){
        randomQuoteChoice = Math.floor(Math.random() * quoteData.length);
    }
    if (motivationalQuotesDraw == true) {
        if (quoteData){
            let author = quoteData[randomQuoteChoice].author;
            let quote = quoteData[randomQuoteChoice].text;
            if (author) {
                stroke(0);
                strokeWeight(1);
                fill(255);
                textSize(18);
                textAlign(CENTER);
                text(author, width - pose.nose.x, pose.nose.y - 50);
                text(quote, width - pose.nose.x, pose.nose.y - 100);
            }
            if (!author) {
                stroke(0);
                strokeWeight(1);
                fill(255);
                textSize(18);
                textAlign(CENTER);
                text(quote, width - pose.nose.x, pose.nose.y - 100);
            }
        }
    }
    if (counter % 5 == 0) {
        if (black) {
            document.getElementsByClassName('inhaleExhaleTitle')[0].style.color = "red";
            document.getElementsByClassName('inhaleExhaleTitle')[1].style.color = "red";
        } else {
            document.getElementsByClassName('inhaleExhaleTitle')[0].style.color = "black"; 
            document.getElementsByClassName('inhaleExhaleTitle')[1].style.color = "black"; 
        }
        black = !black;
    }
}

function tooFast() {
    document.getElementById('individualBreathCount').innerHTML = "TOO FAST!!!";
    document.getElementById('justBreathCount').innerHTML = "TOO FAST!!!";
    document.getElementById('individualBreathCount').style.fontSize = "xx-large";
    document.getElementById('universalBreathCount').style.visibility = "hidden";
    document.getElementById('sessionBreathCount').style.visibility = "hidden";
    audio.pause();
    warningAudio.play();
    let message = "You are not being mindful enough.";
    newMessage(message);
}

function updateBreaths() {
    document.getElementById('sessionBreathCount').innerHTML = "Session Breath Count: " + sessionBreathCount;
    document.getElementById('universalBreathCount').innerHTML = "Universal Breath Count: " + universalBreathCount;
    document.getElementById('individualBreathCount').innerHTML = "Individual Breath Count: " + individualBreathCount;
    document.getElementById('justBreathCount').innerHTML = "Breath Count: " + individualBreathCount;
}

function addBreaths() {
    individualBreathCount += 20000;
    sessionBreathCount += 20000;
    updateBreaths();
}
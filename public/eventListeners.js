document.getElementById('mindfulnessStandardButton').addEventListener('click', function() {
    if (upgradeAvailable) {
        console.log('Standard Chosen');
        standardActivated = true;
        if (standard > 50) {
            standard -= 50;
                if (standardActivated) {
                    document.getElementById('mindfulnessStandardReadout').innerHTML = "+/- " + standard;
                }
            fidelityBonus += 5;
            upgradePoints -= 1;
            let message = "Mindfulness Standard raised. Upgrade Points: " + upgradePoints;
            newMessage(message);
            document.getElementById('consistencyBonusReadout').innerHTML = fidelityBonus;
        }
    } else {
        console.log('no points')
        let message = "No upgrade points available."
        newMessage(message);
    }
});

document.getElementById('mindfulnessAidsButton').addEventListener('click', function() {
    if (upgradeAvailable) {
        console.log('Aid Chosen');
        aidCounter++;
        if (aidCounter < 4) {
            upgradePoints -= 1;
            document.getElementById('mindfulnessAidsReadout').innerHTML = aidCounter + "/3";
            if (aidCounter == 1) {
                prettyHandsDraw = true;
                mindfulnessAidMultiplier = 2;
                let message = "Pretty Hands added. All manual breaths now worth double. Upgrade Points: " + upgradePoints;
                newMessage(message);
            }
            if (aidCounter == 2) {
                motivationalQuotesDraw = true;
                mindfulnessAidMultiplier = 3;
                let message = "Motivational Quotes added. All manual breaths now worth triple. Upgrade Points: " + upgradePoints;
                newMessage(message);
            }
            if (aidCounter == 3) {
                document.getElementById("body").style.color = "ivory";
                document.getElementById("body").style.backgroundImage = "url('download.jpg')";
                document.getElementById("body").style.backgroundRepeat = "no-repeat";
                document.getElementById("body").style.backgroundSize = "cover";
                mindfulnessAidMultiplier = 4;
                let message = "Serene Scenery added. All manual breaths now worth quadruple. Upgrade Points: " + upgradePoints;
                newMessage(message);
            }
        }
        document.getElementById('BPBReadout').innerHTML = 1 * mindfulnessAidMultiplier;
    } else {
        console.log('no points')
    }
});

document.getElementById('autoBreatherButton').addEventListener('click', function() {
    if (individualBreathCount >= lastABCost) {
        console.log('Autobreather Chosen');
        individualBreathCount -= lastABCost;
        autoCounter++;
        autoActivated = true;
        let costCoefficient = 0;
        costCoefficient += 2 + (0.2 * autoCounter);
        let newABCost = floor(lastABCost * costCoefficient);
        document.getElementById('autoCost').innerHTML = "Cost: " + newABCost + " Breaths";
        lastABCost = newABCost;
        let message = "Auto Breather added.";
        newMessage(message);
        document.getElementById('autoBreatherReadout').innerHTML = autoCounter;
        let autoBreathsPerSecond = round(autoCounter/(2/autoBreatherProfMultiplier), 2);
        document.getElementById('autoBPSReadout').innerHTML = autoBreathsPerSecond;
    } else {
        let message = "Insufficient Breaths";
        newMessage(message);
    }
});

document.getElementById('autoBreatherProfButton').addEventListener('click', function() {
    if (individualBreathCount >= lastABProfCost) {
        console.log('Proficiency Chosen');
        individualBreathCount -= lastABProfCost;
        autoBreatherProfMultiplier++;
        let newABProfCost = lastABProfCost * 10;
        document.getElementById('autoProfCost').innerHTML = "Cost: " + newABProfCost + " Breaths";
        lastABProfCost = newABProfCost;
        setInterval(() => { runAutoBreathers(); }, (2500/autoBreatherProfMultiplier));
        let message = "Auto Breather proficiency increased. Upgrade Points: " + upgradePoints;
        newMessage(message);
        document.getElementById('autoBreatherProfReadout').innerHTML = "x" + autoBreatherProfMultiplier;
        let autoBreathsPerSecond = round(autoCounter/(2/autoBreatherProfMultiplier), 2);
        document.getElementById('autoBPSReadout').innerHTML = autoBreathsPerSecond;
    } else {
        let message = "Insufficient Breaths";
        newMessage(message);
    }
});

warningAudio.addEventListener('ended', () => {
    // console.log('warningAudio done');
    updateBreaths();
    document.getElementById('universalBreathCount').style.visibility = "visible";
    document.getElementById('sessionBreathCount').style.visibility = "visible";
    document.getElementById('individualBreathCount').style.fontSize = "larger";
    newSong();
});

document.getElementById('bettingButton').addEventListener('click', () => {
    let wager = document.getElementById('bettingInput').value;
    if (isNaN(wager) == false && wager <= individualBreathCount && wager != "") {
        if (!wagerSent) {
            wagerSent = true;
            challengeAccepted = false;
            bettingTimeoutStart = millis();
            document.getElementById('bettingInput').value = "";
            console.log(wager);
            individualBreathCount -= wager;
            updateBreaths();
            let userObject = {
                "name" : userName,
                "wager" : wager
            }
            socket.emit('bet', userObject);
            let message = "Challenge sent. Waiting for response...";
            newMessage(message);
            reimbursementValue = parseInt(wager);
        } else {
            let message = "You already have an outstanding challenge";
            newMessage(message);
        }
    } else {
        console.log("Invalid Input");
        let message = "Invalid input";
        newMessage(message);
    }
});

document.getElementById('runTutorialButton').addEventListener('click', () => {
    console.log('RUN TUTORIAL');
    startBreathing = false;
    document.getElementById('slide1Text').style.display = "flex";
    runTutorial();
    document.getElementById('runTutorialButton').style.display = "none";
    slideCounter = 1;
    shrinkDisplay();
    individualBreathCount = 0;
    sessionBreathCount = 0;
});
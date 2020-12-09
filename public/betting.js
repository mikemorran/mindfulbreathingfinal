function startBettingMinigame(challengeInfo) {
    upNext = 3;
    newSong();
    document.getElementById('mantraInputDisplay').style.display = "flex";
    document.getElementById('mantra').style.display = "flex";
    document.getElementById('mantraTitle').innerHTML = "MANTRA MANIA";
    document.getElementById('mantraDescription').innerHTML = "Copy As Many Mantras As Fast As You Can";
    if (challengeInfo.challenger1 == userName) {
        challenger1 = challengeInfo.challenger2
    } else {
        challenger1 = challengeInfo.challenger1
    }
    challengeWager = challengeInfo.wager;
    startBreathing = false;
    autoActivated = false;
    minigameStartTime = millis();
    console.log("Running game for:", challengeInfo);
    document.getElementById('mantraDiv').style.display = "flex";
    let randomMantraChoice = Math.floor(Math.random() * mantras.length);
    document.getElementById('mantra').innerHTML = mantras[randomMantraChoice];
    numberCorrect = 0;
    document.getElementById('mantraInputButton').addEventListener('click', () => {
        let userInput = document.getElementById('mantraInput').value;
        if (userInput == mantras[randomMantraChoice]) {
            numberCorrect++;
            document.getElementById('mantraInput').value = "";
            console.log("Number Correct:", numberCorrect);
            randomMantraChoice = Math.floor(Math.random() * mantras.length);
            document.getElementById('mantra').innerHTML = mantras[randomMantraChoice];
        } else {
            console.log("invalid input");
        }
    });

    // START CRAZY AUDIO
}

function endBettingMinigame() {
    let miniGameEndTime = millis();
    let timeDifference = miniGameEndTime - minigameStartTime;
    // console.log(startBreathing);
    if (timeDifference >= 30000 && !startBreathing) {
        startBreathing = true;
        autoActivated = true;
        console.log("minigame over");
        let userObject = {
            "challenger1" : challenger1,
            "challenger2" : userName,
            "challenger2Score" : numberCorrect,
            "challengeWager" : challengeWager
        }
        socket.emit('bettingOver', userObject);
    }
}

function bettingTimeout() {
    if (!challengeAccepted) {
        let bettingTimeoutEnd = millis();
        let bettingTimeoutDifference = bettingTimeoutEnd - bettingTimeoutStart;
        if (bettingTimeoutDifference >= 120000) {
            wagerSent = false;
            challengeAccepted = true;
            socket.emit('bettingTimeout', userName);
            let message = "Your previous challenge has expired. " + reimbursementValue + " breaths returned."
            newMessage(message);
            individualBreathCount += reimbursementValue;
            updateBreaths();
        }
    }
}
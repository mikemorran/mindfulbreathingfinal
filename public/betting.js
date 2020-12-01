function startBettingMinigame(challengeInfo) {
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
    minigameStartTime = counter;
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
    let timeDifference = counter - minigameStartTime;
    // console.log(startBreathing);
    if (timeDifference >= 1500 && !startBreathing) {
        startBreathing = true;
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
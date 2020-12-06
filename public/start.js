function setup() {
    initialFetches();
    // localStorage.removeItem("username");
    let storedUsername = localStorage.username;
    console.log(localStorage.username);
    videoWidth = document.getElementById('videoCaptureDiv').offsetWidth;
    videoHeight = document.getElementById('videoCaptureDiv').offsetHeight;
    console.log(videoWidth, videoHeight);
    Canvas = createCanvas(videoWidth, videoHeight);

    if (!storedUsername) {
        // RUN TUTORIAL HERE
        runTutorial();
    } else {
        console.log(storedUsername)
        userName = storedUsername;
        document.getElementById('runTutorialButton').style.display = "flex";
        beginningProtocols();
        startBreathing = true;
    }
    
    // Canvas and video setup
    video = createCapture(VIDEO, () => {
        console.log('user video captured');
    });
    video.hide();

    // Initialize poseNet
    poseNet = ml5.poseNet(video, () => {
        console.log('Model Ready');
    });
    poseNet.on('pose', (poses) => {
        if (poses.length > 0) {
            pose = poses[0].pose;
        }
    });

    setupSockets();
}

function setupSockets() {
    socket.on('msg', function(newIncomingBreaths) {
        universalBreathCount += newIncomingBreaths;
        updateBreaths();
    });
    socket.on('bet', function(bet) {
        console.log(bet);
        let challengeFeedDiv = document.getElementById('challengeFeedDiv');
        let challengeDisplay = document.createElement("div");
        challengeDisplay.id = "ChallengeDisplay" + bet.name;
        challengeFeedDiv.appendChild(challengeDisplay);
        let challengeSpan = document.createElement("span");
        challengeSpan.innerHTML = bet.wager + " breaths from " + bet.name.bold() + "&nbsp";
        challengeDisplay.appendChild(challengeSpan);
        let challengeButton = document.createElement("button");
        challengeButton.innerHTML = "GO!";
        challengeDisplay.appendChild(challengeButton);
        challengeButton.addEventListener('click', () => {
            let buttonPressed = false;
            if (bet.wager < individualBreathCount && !buttonPressed) {
                let challengeObject = {
                    "challenger1" : userName,
                    "challenger2" : bet.name,
                    "wager" : bet.wager
                }
                socket.emit('challengeAccepted', challengeObject);
                buttonPressed = true;
                individualBreathCount -= bet.wager;
                updateBreaths();
            } else {
                console.log("Insufficient Breaths For This Challenge");
            }
        });
    });
    socket.on('challengeAccepted', function(challengeObject) {
        console.log(challengeObject);
        challengeAccepted = true;
        try { 
            document.getElementById('ChallengeDisplay' + challengeObject.challenger2).style.display = "none";
        } catch {
            console.log('Your challenge has been accepted');
        }
        if (challengeObject.challenger1 == userName || challengeObject.challenger2 == userName){
            startBettingMinigame(challengeObject);
            console.log('starting game');
        }
    });
    socket.on('bettingOver', function(scoreObject) {
        document.getElementById('mantraInputDisplay').style.display = "none";
        document.getElementById('mantra').innerHTML = "";
        document.getElementById('mantraTitle').innerHTML = "TIME'S UP!!!";
        document.getElementById('mantraDescription').innerHTML = "";
        if (userName == scoreObject.challenger1) {
            let userReward = 0;
            if (numberCorrect > scoreObject.challenger2Score) {
                document.getElementById('mantraDescription').innerHTML = "You Won";
                document.getElementById('mantra').innerHTML = "Your Reward: " + (challengeWager * 2) + " breaths";
                userReward = scoreObject.challengeWager * 2;
            } else if (numberCorrect == scoreObject.challenger2Score) {
                document.getElementById('mantraDescription').innerHTML = "It's A Draw";
                document.getElementById('mantra').innerHTML = "Your Reward: The " + (challengeWager) + " breaths you wagered";
                userReward = scoreObject.challengeWager;
            } else if (numberCorrect < scoreObject.challenger2Score) {
                document.getElementById('mantraDescription').innerHTML = "You Lost";
                document.getElementById('mantra').innerHTML = "Your Reward: Absolutely Nothing";
            }
            let rewardButton = document.createElement("button");
            rewardButton.innerHTML = "Claim Reward";
            document.getElementById('mantraDisplay').appendChild(rewardButton);
            rewardButton.addEventListener('click', () => {
                individualBreathCount += parseInt(userReward);
                updateBreaths();
                rewardButton.remove();
                document.getElementById('mantraDiv').style.display = "none";
                wagerSent = false;
            });
        }
    });
    socket.on('bettingTimeout', function(timeoutUserName) {
        console.log("timeout from: ", timeoutUserName);
        document.getElementById('ChallengeDisplay' + timeoutUserName).style.display = "none";
    });
}

function initialFetches() {
    fetch("https://freesound.org/apiv2/search/text/?query=relaxing&token=vdWfnwlKlxbL6YJGxNHDPrxdzPAluoeNg0Kv5ii4")
    .then(response => response.json())
    .then(data2 => {
        console.log(data2);
        soundData = data2.results;
        console.log(soundData);
        newSong();
    });

    fetch("https://type.fit/api/quotes")
    .then(response => response.json())
    .then(data => {
        // console.log(data);
        quoteData = data;
    });
}

function runTutorial() {
    console.log(tutorialVideoWidth, tutorialVideoHeight);
    document.getElementById('tutorialDiv').style.display = "flex";
    document.getElementById('tutorialVideoCaptureDiv').style.display = "flex";
    Canvas.parent('tutorialVideoCaptureDiv');
    tutorialVideoWidth = document.getElementById('tutorialVideoCaptureDiv').offsetWidth;
    tutorialVideoHeight = document.getElementById('tutorialVideoCaptureDiv').offsetHeight;
    resizeCanvas(tutorialVideoWidth, tutorialVideoHeight);
    tutorial = true;
    document.getElementById('slide1Text').style.display = "flex";
    document.getElementById('nextButton').style.display = "flex";
    document.getElementById('nextButton').addEventListener('click', nextButton);
    document.getElementById('usernameInputButton').addEventListener('click', () => {
        userName = document.getElementById('usernameInput').value;
        console.log(userName);
        if (userName != "") {
            localStorage.username = userName;
            document.getElementById('usernameInput').value = "";
            beginningProtocols();
            startBreathing = true;
            tutorial = false;
            slideCounter = 1;
            document.getElementById('tutorialDiv').style.display = "none";
            document.getElementById('usernameInputButton').style.display = "none";
            document.getElementById('inputDisplay').style.display = "none";
            document.getElementById('slide5Text').style.display = "none";
            document.getElementById('runTutorialButton').style.display = "flex";
            document.getElementById('nextButton').removeEventListener('click', nextButton);
        }
    });
    window.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            if (!startBreathing) {
                userName = document.getElementById('usernameInput').value;
                console.log(userName);
                if (userName != "") {
                    localStorage.username = userName;
                    document.getElementById('usernameInput').value = "";
                    beginningProtocols();
                    startBreathing = true;
                    tutorial = false;
                    slideCounter = 1;
                    document.getElementById('tutorialDiv').style.display = "none";
                    document.getElementById('usernameInputButton').style.display = "none";
                    document.getElementById('inputDisplay').style.display = "none";
                    document.getElementById('slide5Text').style.display = "none";
                    document.getElementById('runTutorialButton').style.display = "flex";
                    document.getElementById('nextButton').removeEventListener('click', nextButton);
                }
            }
        }
    });
}

function nextButton() {
        slideCounter++;
        console.log(slideCounter);
        for (i = 2; i < 6; i++) {
            if (slideCounter == i) {
                document.getElementById("slide" + i + "Text").style.display = "flex";
                document.getElementById("slide" + (i-1) + "Text").style.display = "none";
            }
        }
        if (slideCounter >= 2) {
            document.getElementById('tutorialImage').style.display = "flex";
            document.getElementById('tutorialImage').style.width = tutorialVideoWidth + "px";
            document.getElementById('tutorialImage').style.height = tutorialVideoHeight + "px";
        }
        if (slideCounter >= 3) {
            document.getElementById('tutorialImage').style.display = "none";
            tutorialAnimation = true;
        }
        if (slideCounter >= 4) {
            tutorialAnimation = false;
            document.getElementById('tutorialVideoCaptureDiv').style.display = "none";
            document.getElementById('tutorialBreathCounter').innerHTML = "Breath Count: 0";
            tutorialBreathCount = 0;
            document.getElementById('tutorialBreathCounterDisplay').style.display = "flex";
            document.getElementById('tutorialBreathCounter').style.fontSize = "150%";
        }
        if (slideCounter >= 5) {
            document.getElementById('tutorialBreathCounterDisplay').style.display = "none";
            document.getElementById('nextButton').style.display = "none";
            document.getElementById('usernameInputButton').style.display = "flex";
            document.getElementById('inputDisplay').style.display = "flex";
        }
}

function beginningProtocols() {
    // let Canvas = createCanvas(videoWidth, videoHeight);
    resizeCanvas(videoWidth, videoHeight);
    Canvas.parent('videoCaptureDiv');

    // LOAD UNIVERSAL BREATH COUNT
    loadLeaderboard();

    // GET USER DATA
    getUserData();

    // SET INTERVALS FOR LEADERBOARD AND DATA POST
    setInterval(() => { loadLeaderboard(); }, 30000);
}



function getUserData() {
    console.log(userName);
    fetch('/getBreaths/' + userName)
    .then(response => response.json())
    .then(data => {
        // console.log(data);
        if (data.data[0]) {
            individualBreathCount = data.data[0].individualBreathBreathCount;
            for (i = 0; i < upgradeIntervals.length; i++) {
                if (individualBreathCount >= upgradeIntervals[i] && individualBreathCount <= upgradeIntervals[i+1]) {
                    upgradeCounter = i + 1;
                }
            }
            autoBreatherProfMultiplier = data.data[0].autoBreatherProfMultiplier;
            document.getElementById('autoBreatherProfReadout').innerHTML = "x" + autoBreatherProfMultiplier;
            if (autoBreatherProfMultiplier > 0) {
                lastABProfCost = 100 * (10 ** autoBreatherProfMultiplier);
                document.getElementById('autoProfCost').innerHTML = "Cost: " + lastABProfCost + " Breaths";
            }
            setInterval(() => { runAutoBreathers(); }, (2500/autoBreatherProfMultiplier));
            fidelityBonus = data.data[0].fidelityBonus;
            document.getElementById('consistencyBonusReadout').innerHTML = fidelityBonus;
            aidCounter = data.data[0].aidCounter;
            document.getElementById('mindfulnessAidsReadout').innerHTML = aidCounter + "/3";
            if (aidCounter >= 1) {
                prettyHandsDraw = true;
                mindfulnessAidMultiplier = 2;
            }
            if (aidCounter >= 2) {
                motivationalQuotesDraw = true;
                mindfulnessAidMultiplier = 3;
            }
            if (aidCounter >= 3) {
                document.getElementById("body").style.color = "ivory";
                document.getElementById("body").style.backgroundImage = "url('download.jpg')";
                document.getElementById("body").style.backgroundRepeat = "no-repeat";
                document.getElementById("body").style.backgroundSize = "cover";
                mindfulnessAidMultiplier = 4;
            }
            document.getElementById('BPBReadout').innerHTML = mindfulnessAidMultiplier;
            autoCounter = data.data[0].autoCounter;
            if (autoCounter > 0) {
                autoActivated = true;
                if (autoActivated) {
                    document.getElementById('autoBreatherReadout').innerHTML = autoCounter;
                    let autoBreathsPerSecond = round(autoCounter/(2/autoBreatherProfMultiplier), 2);
                    document.getElementById('autoBPSReadout').innerHTML = autoBreathsPerSecond;
                    let coefficient = 0.1;
                    for (i = 0; i < autoCounter; i++) {
                        lastABCost = lastABCost * (2 + coefficient);
                        coefficient += 0.1;
                    }
                    lastABCost = floor(lastABCost);
                    document.getElementById('autoCost').innerHTML = "Cost: " + lastABCost + " Breaths";
                }
            }
            standard = data.data[0].standard;
            if (standard < 24) {
                standardActivated = true;
                if (standardActivated) {
                    document.getElementById('mindfulnessStandardReadout').innerHTML = "+/- " + standard;
                }
            }
            upgradePoints = data.data[0].upgradePoints;
        }
        lastBreathCount = individualBreathCount;
        updateBreaths();
        growDisplayCounter = 0;
        let message = "Next upgrade at " + upgradeIntervals[upgradeCounter] + " breaths. Upgrade Points: " + upgradePoints;
        newMessage(message);
        setInterval(() => { postData(); }, 20000);
    });
}


function windowResized() {
    // console.log("window resized");
    videoWidth = document.getElementById('videoCaptureDiv').offsetWidth;
    videoHeight = document.getElementById('videoCaptureDiv').offsetHeight;
    tutorialVideoWidth = document.getElementById('tutorialVideoCaptureDiv').offsetWidth;
    tutorialVideoHeight = document.getElementById('tutorialVideoCaptureDiv').offsetHeight;
    if (tutorial) {
        resizeCanvas(tutorialVideoWidth, tutorialVideoHeight);
    } else {
        resizeCanvas(videoWidth, videoHeight);
    }
    
}
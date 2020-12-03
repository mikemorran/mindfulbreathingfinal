window.addEventListener('load', () => {
    // CHECK FOR AND HANDLE STORED USERNAME
    // localStorage.removeItem("username");
    let storedUsername = localStorage.username;
    console.log(localStorage.username);
    if (!storedUsername) {
        // RUN TUTORIAL HERE
        runTutorial();
    } else {
        // console.log(storedUsername)
        userName = storedUsername;
        beginningProtocols();
        startBreathing = true;
    }
});

function runTutorial() {
    document.getElementById('tutorialDiv').style.display = "flex";
    document.getElementById('usernameInputButton').addEventListener('click', () => {
        userName = document.getElementById('usernameInput').value;
        if (userName != "") {
            localStorage.username = userName;
            document.getElementById('usernameInput').value = "";
            beginningProtocols();
            startBreathing = true;
            document.getElementById('tutorialDiv').style.display = "none";
        }
    });
    window.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            if (!userName) {
                userName = document.getElementById('usernameInput').value;
                if (userName != "") {
                    localStorage.username = userName;
                    document.getElementById('usernameInput').value = "";
                    beginningProtocols();
                    startBreathing = true;
                    document.getElementById('tutorialDiv').style.display = "none";
                }
            }
        }
    });
}

function beginningProtocols() {
    // GET SOUND
    fetch("https://freesound.org/apiv2/search/text/?query=intense&token=vdWfnwlKlxbL6YJGxNHDPrxdzPAluoeNg0Kv5ii4")
    .then(response => response.json())
    .then(data => {
        soundData = data.results;
        console.log(soundData);
        newSong();
    });

    // GET QUOTES
    fetch("https://type.fit/api/quotes")
    .then(response => response.json())
    .then(data => {
        quoteData = data;
    });

    // LOAD UNIVERSAL BREATH COUNT
    loadLeaderboard();

    // GET USER DATA
    getUserData();

    // SET INTERVALS FOR LEADERBOARD AND DATA POST
    setInterval(() => { loadLeaderboard(); }, 30000);
}

function getUserData() {
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
        let message = "Next upgrade at " + upgradeIntervals[upgradeCounter] + " breaths. Upgrade Points: " + upgradePoints;
        newMessage(message);
        setInterval(() => { postData(); }, 20000);
    });
}

function setup() {
    // Canvas and video setup
    video = createCapture(VIDEO, () => {
        console.log('user video captured');
    });
    video.hide();
    videoWidth = document.getElementById('videoCaptureDiv').offsetWidth;
    videoHeight = document.getElementById('videoCaptureDiv').offsetHeight;
    let Canvas = createCanvas(videoWidth, videoHeight);
    Canvas.parent('videoCaptureDiv');

    // Initialize poseNet
    poseNet = ml5.poseNet(video, () => {
        console.log('Model Ready');
    });
    poseNet.on('pose', (poses) => {
        if (poses.length > 0) {
            pose = poses[0].pose;
        }
    });

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
                individualBreathCount += userReward;
                updateBreaths();
                rewardButton.remove();
                document.getElementById('mantraDiv').style.display = "none";
                wagerSent = false;
            });
        }
    });
}

function windowResized() {
    // console.log("window resized");
    videoWidth = document.getElementById('videoCaptureDiv').offsetWidth;
    videoHeight = document.getElementById('videoCaptureDiv').offsetHeight;
    resizeCanvas(videoWidth, videoHeight);
}
let video;
let audio = document.getElementById('soothingMusicAudio');
let warningAudio = document.getElementById('warningAudio');
let videoWidth;
let videoHeight;
let poseNet;
let pose;
let breathStart = false;
let inhaleComplete = false;
let counter = 0;
let breathBeginTimer;
let breathEndTimer;
let breathTimerDifference;
let breathRates = [];
let sessionBreathCount = 0;
let universalBreathCount = 0;
let individualBreathCount = 0;
let soundData;
let userName;
let mindfulnessAidMultiplier = 1;
let standardActivated = false;
let fidelityBonus = 0;
let lastBreathCount;
let upgradeIntervals = [16, 80, 240, 960, 2880, 7680, 23040, 69120, 161780, 322560, 645120, 1941360, 3882720, 7765220, 23296320, 38827700, 77654400, 155308800, 310617660, 621235200];
let upgradeCounter = 0;
let autoBreatherProfMultiplier = 1;
let aidCounter = 0;
let prettyHandsDraw = false;
let motivationalQuotesDraw = false;
let autoCounter = 0;
let autoActivated = false;
let standard = 24;
let quoteData;
let particles = [];
let randomQuoteChoice = 1;
let upgradeAvailable = false;
let upgradePoints = 0;
let startBreathing = false;
let mantras = ["I am love.", "Spread love and kindness.", "Get over yourself.", "I have time.", "Dream Big.", "Be Dangerous. But Be Kind.", "I am grounded and capable of making choices even when I am questioning.", "I am enough.", "I am here for a reason.", "I open my heart to the universe.", "It is coming from me, not at me.", "I change my thoughts; I change my world.", "Let go.", "Be where your feet are.", "Bring your awareness more fully into your body.", "Find the underbelly.", "Open more deeply and widely to your breath."]
let minigameStartTime;
let numberCorrect;
let challenger1;
let challengeWager;
let wagerSent = false;

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
            fetch("https://freesound.org/apiv2/search/text/?query=soothing&token=vdWfnwlKlxbL6YJGxNHDPrxdzPAluoeNg0Kv5ii4")
            .then(response => response.json())
            .then(data => {
                soundData = data.results;
                // console.log(soundData);
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
        setInterval(() => { postData(); }, 20000);
    });
}

function loadLeaderboard() {
    // console.log('leaderboard loaded');
    fetch('/getBreaths')
    .then(response => response.json())
    .then(data => {
        let individuals = [];
        let breathSum = 0;
        for (i = 0; i < data.data.length; i++) {
            breathSum += data.data[i].individualBreathBreathCount;
            individuals.push(data.data[i]); 
        }
        universalBreathCount = breathSum;
        individuals.sort(function(a, b) {
            return b.individualBreathBreathCount - a.individualBreathBreathCount;
        });
        for (i = 0; i < 10; i++) {
            if (individuals[i]) {
                let readout = document.getElementById('number' + (i+1) + "Readout");
                let marker = document.getElementById('number' + (i+1) + "Marker");
                readout.innerHTML = individuals[i].name.bold() + " with " + individuals[i].individualBreathBreathCount + " breaths";
                readout.style.visibility = "visible";
                marker.style.visibility = "visible";
            }
        }
        for (i = 0; i < individuals.length; i++) {
            if (individuals[i].name == userName) {
                let marker = document.getElementById('userRankMarker');
                let readout = document.getElementById('userRankReadout');
                marker.innerHTML = "#" + (i+1);
                readout.innerHTML = individuals[i].name.bold() + " with " + individuals[i].individualBreathBreathCount + " breaths";
            }
        }
    });
}

function newSong() {
    // console.log('new song');
    updateBreaths();
    randomSoundChoice = Math.floor(Math.random() * soundData.length);
    randomSoundId = soundData[randomSoundChoice].id;
    fetch("https://freesound.org/apiv2/sounds/" + randomSoundId + "/?token=vdWfnwlKlxbL6YJGxNHDPrxdzPAluoeNg0Kv5ii4")
    .then(response => response.json())
    .then(data => {
        mp3URL = data.previews['preview-hq-mp3'];
        audio.src = mp3URL;
        audio.play();
        audio.loop = true;
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

function windowResized() {
    // console.log("window resized");
    videoWidth = document.getElementById('videoCaptureDiv').offsetWidth;
    videoHeight = document.getElementById('videoCaptureDiv').offsetHeight;
    resizeCanvas(videoWidth, videoHeight);
}

function draw() {
    push();
    translate(width,0);
    scale(-1, 1);
    image(video, 0, 0, videoWidth, videoHeight);
    pop();
    if (pose && startBreathing) {
        if (pose.rightWrist.y >= height && pose.leftWrist.y >= height) {
            if (!inhaleComplete) {
                breathStart = true;
                breathBeginTimer = counter;
            }
            if (inhaleComplete) {
                inhaleComplete = false;
                breathEndTimer = counter;
                breathTimerDifference = breathEndTimer - breathBeginTimer;

                if (breathTimerDifference >= 75) {
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

                    // POST Data
                    // postData();

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
        runAutoBreathers();
        runUpgrades();
    }
    counter++;
    endBettingMinigame();
}

function runUpgrades() {
    console.log("Upgrade Points: ", upgradePoints);
    if (individualBreathCount >= upgradeIntervals[upgradeCounter]) {
        console.log(upgradePoints);
        console.log(upgradeCounter);
        upgradeCounter++;
        upgradePoints++;
    }
    if (upgradePoints > 0) {
        upgradeAvailable = true;
    } else {
        upgradeAvailable = false;
    }

    if (upgradeAvailable) {
        // CONSOLE NOTIFICATION
        // console.log('upgrade available');
    } else {
        // CONSOLE NOTIFICATION
        // console.log('upgrade not available');
    }
}

function runAutoBreathers() {
    if (autoActivated) {
        if (counter % (Math.floor(120/autoBreatherProfMultiplier)) == 0) {
            individualBreathCount += autoCounter;
            sessionBreathCount += autoCounter;
            universalBreathCount += autoCounter;
            updateBreaths();
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

function tooFast() {
    document.getElementById('individualBreathCount').innerHTML = "TOO FAST!!!";
    document.getElementById('individualBreathCount').style.fontSize = "xx-large";
    document.getElementById('universalBreathCount').style.visibility = "hidden";
    document.getElementById('sessionBreathCount').style.visibility = "hidden";
    audio.pause();
    warningAudio.play();
}

function updateBreaths() {
    document.getElementById('sessionBreathCount').innerHTML = "Session Breath Count: " + sessionBreathCount;
    document.getElementById('universalBreathCount').innerHTML = "Universal Breath Count: " + universalBreathCount;
    document.getElementById('individualBreathCount').innerHTML = "Individual Breath Count: " + individualBreathCount;
}

function postData() {
    // console.log("DATA SENT");
    let userObject = {
        "name" : userName,
        "individualBreathBreathCount" : individualBreathCount,
        "standard" : standard,
        "fidelityBonus" : fidelityBonus,
        "aidCounter" : aidCounter,
        "autoCounter" : autoCounter,
        "autoBreatherProfMultiplier" : autoBreatherProfMultiplier,
        "upgradePoints" : upgradePoints
    }
    let userJsonData = JSON.stringify(userObject);

    // POST user specific object to server
    fetch('/sendBreaths', {
        method : 'POST',
        headers : {
            "Content-type": "application/json"
        },
        body : userJsonData
    })
}

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

document.getElementById('mindfulnessStandardButton').addEventListener('click', function() {
    if (upgradeAvailable) {
        console.log('Standard Chosen');
        standardActivated = true;
        if (standard > 0) {
            standard -= 4;
                if (standardActivated) {
                    document.getElementById('mindfulnessStandardReadout').innerHTML = "+/- " + standard;
                }
            fidelityBonus += 5;
            upgradePoints -= 1;
            document.getElementById('consistencyBonusReadout').innerHTML = fidelityBonus;
        }
    } else {
        console.log('no points')
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
            }
            if (aidCounter == 2) {
                motivationalQuotesDraw = true;
                mindfulnessAidMultiplier = 3;
            }
            if (aidCounter == 3) {
                document.getElementById("body").style.color = "ivory";
                document.getElementById("body").style.backgroundImage = "url('download.jpg')";
                document.getElementById("body").style.backgroundRepeat = "no-repeat";
                document.getElementById("body").style.backgroundSize = "cover";
                mindfulnessAidMultiplier = 4;
            }
        }
        document.getElementById('BPBReadout').innerHTML = mindfulnessAidMultiplier;
    } else {
        console.log('no points')
    }
});

document.getElementById('autoBreatherButton').addEventListener('click', function() {
    if (upgradeAvailable){
        console.log('Autobreather Chosen');
        autoActivated = true;
        autoCounter++;
        upgradePoints -= 1;
        document.getElementById('autoBreatherReadout').innerHTML = autoCounter;
        let autoBreathsPerSecond = round(autoCounter/(2/autoBreatherProfMultiplier), 2);
        document.getElementById('autoBPSReadout').innerHTML = autoBreathsPerSecond;
    } else {
        console.log('no points')
    }
});

document.getElementById('autoBreatherProfButton').addEventListener('click', function() {
    if (upgradeAvailable) {
        console.log('Proficiency Chosen');
        autoBreatherProfMultiplier++;
        upgradePoints -= 1;
        document.getElementById('autoBreatherProfReadout').innerHTML = "x" + autoBreatherProfMultiplier;
        let autoBreathsPerSecond = round(autoCounter/(2/autoBreatherProfMultiplier), 2);
        document.getElementById('autoBPSReadout').innerHTML = autoBreathsPerSecond;
    } else {
        console.log('no points')
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
    if (isNaN(wager) == false && wager <= individualBreathCount && !wagerSent && wager != "") {
        wagerSent = true;
        document.getElementById('bettingInput').value = "";
        console.log(wager);
        individualBreathCount -= wager;
        updateBreaths();
        let userObject = {
            "name" : userName,
            "wager" : wager
        }
        socket.emit('bet', userObject);
    } else {
        console.log("Invalid Input");
    }
});

// function newMessage(message) {
//     document.
// }
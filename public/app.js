let video;
let poseNet;
let pose;
let breathStart = false;
let inhaleComplete = false;
let breathTimer;
let sessionBreathCount = 0;
let universalBreathCount = 0;
let individualBreathCount = 0;
let userName;
let userObject;
let userJsonData;
let counter = 0;
let breathBeginTimer;
let breathEndTimer;
let breathTimerDifference;
let breathRates = [];
let upgradeIntervals = [16, 80, 240, 960, 2880, 7680, 23040, 69120, 161780, 322560, 645120, 1941360, 3882720, 7765220, 23296320, 38827700, 77654400, 155308800, 310617660, 621235200];
let upgradeCounter = 0;
let upgradeAvailable = false;
let standardActivated = false;
let fidelityBonus = 0;
let standard = 24;
let aidCounter = 0;
let particles = [];
let prettyHandsDraw = false;
let motivationalQuotesDraw = false;
let quoteData;
let randomQuoteChoice = 1;
let mindfulnessAidMultiplier = 1;
let autoActivated = false;
let autoCounter = 0;
let autoBreatherProfMultiplier = 1;
let lastBreathCount;

window.addEventListener('load', function() {
    alert("Welcome to Mindful Breathing. To play, raise your palms face-up as you inhale and lower them faced down as you exhale. For best results, have most of your torso and head visible to the camera. Make sure to take long mindful breaths!")

    // GET all breath data from server
    fetch('/getBreaths')
    .then(response => response.json())
    .then(data => {
        // console.log(data);
        let individuals = [];
        for (i = 0; i < data.data.length; i++) {
            universalBreathCount += data.data[i].individualBreathBreathCount;
            individuals.push(data.data[i]); 
        }
        individuals.sort(function(a, b) {
            return b.individualBreathBreathCount - a.individualBreathBreathCount;
        });
        // console.log(individuals);
        for (i = 0; i < 5; i++) {
            let leaderboard = document.createElement("h5");
            leaderboard.innerHTML = "BREATHER: " + individuals[i].name + " BREATH COUNT: " + individuals[i].individualBreathBreathCount;
            document.getElementById("topBreathers").appendChild(leaderboard);
        }
        document.getElementById('uniBreath').innerHTML = "Universal Breath Count: " + universalBreathCount;
    });

    // Create user specific object
    userName = prompt('Enter Username');

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
            fidelityBonus = data.data[0].fidelityBonus;
            aidCounter = data.data[0].aidCounter;
            document.getElementById('addAidInfo').innerHTML = "Minfulness Aids " + aidCounter + "/3";
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
            autoCounter = data.data[0].autoCounter;
            if (autoCounter > 0) {
                autoActivated = true;
                if (autoActivated) {
                    document.getElementById('autoBreatherCount').innerHTML = "Number of Auto-Breathers = " + autoCounter;
                    let autoBreathsPerSecond = round(autoCounter/(2/autoBreatherProfMultiplier), 2);
                    document.getElementById('breathsPerSecond').innerHTML = "Automatic Breaths Per Second = " + autoBreathsPerSecond;
                }
            }
            standard = data.data[0].standard;
            if (standard < 24) {
                standardActivated = true;
                if (standardActivated) {
                    document.getElementById('raiseStandardInfo').innerHTML = "Mindfulness Standard +/- " + standard + " of Mindfulness Average";
                }
            }
        }
        lastBreathCount = individualBreathCount;
        document.getElementById('indivBreath').innerHTML = "Individual Breath Count: " + individualBreathCount;
        document.getElementById('sessionBreath').innerHTML = "Session Breath Count: " + sessionBreathCount;
    });

    fetch("https://type.fit/api/quotes")
    .then(response => response.json())
    .then(data => {
        // console.log(data);
        quoteData = data;
    });
});

function setup() {
    // Canvas and video setup
    let Canvas = createCanvas(640, 480);
    Canvas.parent('videoCapture');
    video = createCapture(VIDEO);
    video.hide();

    // Initialize poseNet
    poseNet = ml5.poseNet(video, modelLoaded);
    poseNet.on('pose', gotPoses);
    socket.on('msg', function(newIncomingBreaths) {
        universalBreathCount += newIncomingBreaths;
        document.getElementById('uniBreath').innerHTML = "Universal Breath Count: " + universalBreathCount;
    });
}

// poseNet model loading callback
function modelLoaded() {
    console.log("Model Ready!");
}

// poseNet engaging callback
function gotPoses(poses) {
    if (poses.length > 0) {
        pose = poses[0].pose;
    }
}

function draw() {
    image(video, 0, 0);
    if (pose) {
        // tooFast(pose.nose.x, pose.nose.y);
        if (pose.rightWrist.y >= height && pose.leftWrist.y >= height) {
            if (!inhaleComplete) {
                breathStart = true;
                breathBeginTimer = counter;
                // console.log('breath begin: ', breathBeginTimer);
            }
            if (inhaleComplete) {
                inhaleComplete = false;
                breathEndTimer = counter;
                // console.log('breath end: ', breathEndTimer);

                breathTimerDifference = breathEndTimer - breathBeginTimer;
                // console.log('breath difference: ', breathTimerDifference);

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

                        document.getElementById('mindfulnessAverage').innerHTML = "Mindfulness Average = " + breathRateAverage;
                        document.getElementById('lastBreath').innerHTML = "Last Breath = " + breathTimerDifference;
                    }

                    // Update document
                    document.getElementById('sessionBreath').innerHTML = "Session Breath Count: " + sessionBreathCount;
                    document.getElementById('uniBreath').innerHTML = "Universal Breath Count: " + universalBreathCount;
                    document.getElementById('indivBreath').innerHTML = "Individual Breath Count: " + individualBreathCount;

                    userObject = {
                        "name" : userName,
                        "individualBreathBreathCount" : individualBreathCount,
                        "standard" : standard,
                        "fidelityBonus" : fidelityBonus,
                        "aidCounter" : aidCounter,
                        "autoCounter" : autoCounter,
                        "autoBreatherProfMultiplier" : autoBreatherProfMultiplier
                    }
                    userJsonData = JSON.stringify(userObject);

                    // POST user specific object to server
                    fetch('/sendBreaths', {
                        method: 'POST',
                        headers: {
                            "Content-type": "application/json"
                        },
                        body : userJsonData
                    })

                    // EMIT user specific object to server
                    let newBreaths = individualBreathCount - lastBreathCount;
                    // console.log(newBreaths);
                    socket.emit('msg', newBreaths);
                    lastBreathCount = individualBreathCount;
                }   
                if (breathTimerDifference < 75) {
                    // console.log('TOO FAST');
                    document.getElementById('sessionBreath').innerHTML = "Session Breath Count: BE MORE MINDFUL";
                    document.getElementById('indivBreath').innerHTML = "Individual Breath Count: TOO FAST";
                    document.getElementById('lastBreath').innerHTML = "Last Breath = NOT MINDFUL ENOUGH";
                }
            }
        }
        if (breathStart && pose.rightWrist.y <= pose.rightShoulder.y && pose.leftWrist.y <= pose.leftShoulder.y) {
            inhaleComplete = true;
            breathStart = false;
        }
        if (prettyHandsDraw == true){
            particles.push(new particle(pose.rightWrist.x, pose.rightWrist.y));
            particles.push(new particle(pose.leftWrist.x, pose.leftWrist.y));
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
            // console.log(randomQuoteChoice);
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
                text(author, pose.nose.x, pose.nose.y - 50);
                text(quote, pose.nose.x, pose.nose.y - 100);
            }
            if (!author) {
                stroke(0);
                strokeWeight(1);
                fill(255);
                textSize(18);
                textAlign(CENTER);
                text(quote, pose.nose.x, pose.nose.y - 100);
            }
        }
        runButtons();
    }
    if (autoActivated) {
        if (counter % (Math.floor(120/autoBreatherProfMultiplier)) == 0) {
            // console.log('Auto Engaged');
            individualBreathCount += autoCounter;
            sessionBreathCount += autoCounter;
            universalBreathCount += autoCounter;
            document.getElementById('sessionBreath').innerHTML = "Session Breath Count: " + sessionBreathCount;
            document.getElementById('uniBreath').innerHTML = "Universal Breath Count: " + universalBreathCount;
            document.getElementById('indivBreath').innerHTML = "Individual Breath Count: " + individualBreathCount;
        }
    }

    if (individualBreathCount >= upgradeIntervals[upgradeCounter]) {
        upgradeCounter++;
        upgradeAvailable = true;
    }

    if (upgradeAvailable) {
        document.getElementById('consoleLog').innerHTML = "> Upgrade Available";
    } else {
        document.getElementById('consoleLog').innerHTML = "> Next upgrade at " + upgradeIntervals[upgradeCounter] + " breaths";
    }

    counter++;
    // console.log(counter);
    // console.log('autoActivated? ', autoActivated);
    // console.log('upgrade available? ' + upgradeAvailable);
    // console.log('next upgrade at ', upgradeIntervals[upgradeCounter]);
}

function runButtons() {
    document.getElementById('raiseStandard').addEventListener('click', function() {
        if (upgradeAvailable) {
            standardActivated = true;
            standard -= 4;
                if (standardActivated) {
                    document.getElementById('raiseStandardInfo').innerHTML = "Mindfulness Standard +/- " + standard + " of Mindfulness Average";
                }
            fidelityBonus += 5;
            upgradeAvailable = false;
        }
    });
    document.getElementById('addAid').addEventListener('click', function() {
        if (upgradeAvailable) {
            aidCounter++;
            if (aidCounter < 4) {
                upgradeAvailable = false;
                document.getElementById('addAidInfo').innerHTML = "Minfulness Aids " + aidCounter + "/3";
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
        }
    });
    document.getElementById('addAuto').addEventListener('click', function() {
        if (upgradeAvailable){
            autoActivated = true;
            autoCounter++;
            upgradeAvailable = false;
            document.getElementById('autoBreatherCount').innerHTML = "Number of Auto-Breathers = " + autoCounter;
            let autoBreathsPerSecond = round(autoCounter/(2/autoBreatherProfMultiplier), 2);
            document.getElementById('breathsPerSecond').innerHTML = "Automatic Breaths Per Second = " + autoBreathsPerSecond;
        }
    });
    document.getElementById('improveEfficiency').addEventListener('click', function() {
        if (upgradeAvailable) {
            autoBreatherProfMultiplier++;
            upgradeAvailable = false;
            let autoBreathsPerSecond = round(autoCounter/(2/autoBreatherProfMultiplier), 2);
            document.getElementById('breathsPerSecond').innerHTML = "Automatic Breaths Per Second = " + autoBreathsPerSecond;
        }
    });
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
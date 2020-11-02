let video;
let poseNet;
let pose;
let breathStart = false;
let inhaleComplete = false;
let sessionBreathCount = 0;
let universalBreathCount = 0;
let individualBreathCount = 0;
let userName;
let userDate;
let userObject
let userJsonData;
let dateCount = 0;
let firstUserBreathComplete = false;

window.addEventListener('load', function() {
    // Create user specific object
    userName = prompt('Enter Username');
    userDate = Date();
    userObject = {
        "name" : userName,
        "date" : userDate
    }
    userJsonData = JSON.stringify(userObject);

    fetch('/getBreaths/' + userName)
    .then(response => response.json())
    .then(data => {
        individualBreathCount = data.data.length;
        let date = "";
        let processedDate = "";
        dateCount = 0;
        for (i = 0; i < data.data.length; i++) {
            let rawDate = data.data[i].date;
            processedDate = rawDate.slice(0, 15);
            console.log(processedDate);
            if (date != processedDate) {
                date = processedDate;
                dateCount += 1;
            }
        }
        if (userDate = date) {
            firstUserBreathComplete = true;
        }
        document.getElementById('indivBreath').innerHTML = "Individual Breath Count: " + individualBreathCount + " over " + dateCount + " day(s)";
        document.getElementById('sessionBreath').innerHTML = "Session Breath Count: " + sessionBreathCount;
        console.log(data);
        console.log(dateCount);
    });

    // GET all breath data from server
    fetch('/getBreaths')
    .then(response => response.json())
    .then(data => {
        console.log(data);
        // Sift throught data, find all related to userName, get universal and individual breath counts, get individual number of days
        universalBreathCount = data.data.length;

        // Initial Document Update
        document.getElementById('uniBreath').innerHTML = "Universal Breath Count: " + universalBreathCount;
    });   
});

function setup() {
    // Canvas and video setup
    createCanvas(640, 480);
    video = createCapture(VIDEO)
    video.hide();

    // Initialize poseNet
    poseNet = ml5.poseNet(video, modelLoaded);
    poseNet.on('pose', gotPoses);
    socket.on('msg', function(userObject) {
        // console.log(userObject);
        universalBreathCount++;
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
        if (pose.rightWrist.y >= height && pose.leftWrist.y >= height) {
            if (!inhaleComplete) {
                breathStart = true;
            }
            if (inhaleComplete) {
                inhaleComplete = false;
                sessionBreathCount++;
                individualBreathCount++;
                universalBreathCount++;

                if (firstUserBreathComplete == false) {
                    dateCount += 1;
                    firstUserBreathComplete = true;
                }
                console.log(dateCount);
                console.log(firstUserBreathComplete);

                // Update document
                document.getElementById('sessionBreath').innerHTML = "Session Breath Count: " + sessionBreathCount;
                document.getElementById('uniBreath').innerHTML = "Universal Breath Count: " + universalBreathCount;
                document.getElementById('indivBreath').innerHTML = "Individual Breath Count: " + individualBreathCount + " over " + dateCount + " day(s)";

                // POST user specific object to server
                fetch('/sendBreaths', {
                    method: 'POST',
                    headers: {
                        "Content-type": "application/json"
                    },
                    body : userJsonData
                })

                // EMIT user specific object to server
                socket.emit('msg', userObject);
            }
        }
        if (breathStart && pose.rightWrist.y <= pose.rightShoulder.y && pose.leftWrist.y <= pose.leftShoulder.y) {
            inhaleComplete = true;
            breathStart = false;
        }
    }
}
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
                if (leaderboardReadout) {
                    readout.style.visibility = "visible";
                    marker.style.visibility = "visible";
                }
            }
        }
        for (i = 0; i < individuals.length; i++) {
            if (individuals[i].name == userName) {
                let marker = document.getElementById('userRankMarker');
                let readout = document.getElementById('userRankReadout');
                marker.innerHTML = "#" + (i+1);
                readout.innerHTML = individuals[i].name.bold() + " with " + individuals[i].individualBreathBreathCount + " breaths";
                if (leaderboardReadout) {
                    document.getElementById('userRankDisplay').style.visibility = "visible";
                }
            }
        }
    });
}

function newSong() {
    // console.log('new song');
    updateBreaths();
    randomSoundChoice = Math.floor(Math.random() * soundData.length);
    randomSoundId = soundData[randomSoundChoice].id;
    console.log(randomSoundId)
    fetch("https://freesound.org/apiv2/sounds/" + 155140 + "/?token=vdWfnwlKlxbL6YJGxNHDPrxdzPAluoeNg0Kv5ii4")
    .then(response => response.json())
    .then(data => {
        mp3URL = data.previews['preview-hq-mp3'];
        audio.src = mp3URL;
        audio.play();
        audio.loop = true;
    });
}
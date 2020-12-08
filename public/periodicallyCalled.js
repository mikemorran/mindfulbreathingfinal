function postData() {
    // console.log("DATA SENT");
    if (startBreathing) {
        let userObject = {
            "name" : userName,
            "individualBreathBreathCount" : individualBreathCount,
            "standard" : standard,
            "fidelityBonus" : fidelityBonus,
            "aidCounter" : aidCounter,
            "autoCounter" : autoCounter,
            "autoBreatherProfMultiplier" : autoBreatherProfMultiplier,
            "upgradePoints" : upgradePoints,
            "inhaleExhale" : inhaleExhale
        }
        let userJsonData = JSON.stringify(userObject);

        // POST user specific object to server
        fetch('/sendBreaths', {
            method : 'POST',
            headers : {
                "Content-type": "application/json"
            },
            body : userJsonData
        });
    }
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
    fetch("https://freesound.org/apiv2/sounds/" + soundIds[upNext] + "/?token=vdWfnwlKlxbL6YJGxNHDPrxdzPAluoeNg0Kv5ii4")
    .then(response => response.json())
    .then(data => {
        mp3URL = data.previews['preview-hq-mp3'];
        audio.src = mp3URL;
        audio.play();
        audio.loop = true;
    });
}

function shrinkDisplay() {
        for (i = 0; i < growDisplayIntervals.length; i++) {
            if (growDisplayCounter >= i) {
                document.getElementById(displayComponentIds[i]).style.visibility = "hidden"
            }
        }
        if (growDisplayCounter >= 3) {
            document.getElementById('breathCounts').style.display = "none";
            document.getElementById('justBreathCount').style.display = "flex";
        }
        if (growDisplayCounter >= 5) {
            for (i = 0; i < mandalas.length; i++) {
                mandalas[i].children[0].style.display = "none";
            }
            for (i = 0; i < plants.length; i++) {
                plants[i].children[0].style.display = "none";
            }
        }
        document.getElementById("body").style.color = "";
        document.getElementById("body").style.backgroundImage = "";
        document.getElementById("body").style.backgroundRepeat = "";
        document.getElementById("body").style.backgroundSize = "";
        motivationalQuotesDraw = false;
        prettyHandsDraw = false;
        for (i = 0; i < 10; i++) {
            let readout = document.getElementById('number' + (i+1) + "Readout");
            let marker = document.getElementById('number' + (i+1) + "Marker");
            readout.style.visibility = "hidden";
            marker.style.visibility = "hidden";
        }
        document.getElementById('userRankDisplay').style.visibility = "hidden";
        leaderboardReadout = false;
}

function newMessage(message) {
    let readOut = document.createElement("span");
    readOut.className = "readout";
    readOut.innerHTML = "> " + message;
    let consoleDiv = document.getElementById('Console');
    consoleDiv.appendChild(readOut);
}
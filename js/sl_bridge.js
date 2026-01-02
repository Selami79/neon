// Second Life Bridge Script for Hextris
// Handles player name detection and score submission

function getUrlParameter(name) {
    name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
    var regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
    var results = regex.exec(location.search);
    return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
}

document.addEventListener('DOMContentLoaded', function () {
    console.log("SL Bridge Loaded");

    // 1. Auto-fill Player Name
    var player = getUrlParameter('player');
    var usernameField = document.getElementById('username_field');
    var submitBtn = document.getElementById('submit_score_btn');
    var statusMsg = document.getElementById('submit_msg');

    if (player && usernameField) {
        usernameField.value = player;
        usernameField.disabled = true; // Lock it if it came from SL
        usernameField.style.opacity = "0.7";
    }

    function submitScore(name, score) {
        if (!name) {
            statusMsg.innerText = "ENTER NAME!";
            return;
        }
        statusMsg.innerText = "SENDING...";
        var slUrl = getUrlParameter('sl_url');

        if (slUrl) {
            fetch(slUrl, {
                method: 'POST',
                mode: 'no-cors',
                headers: { 'Content-Type': 'text/plain' },
                body: JSON.stringify({ name: name, score: score })
            })
                .then(function () {
                    statusMsg.innerText = "✅ SENT!";
                    if (submitBtn) submitBtn.disabled = true;
                })
                .catch(function (err) {
                    console.error(err);
                    statusMsg.innerText = "❌ ERROR";
                });
        } else {
            statusMsg.innerText = "NO SL CONNECTION";
        }
    }

    // 2. Handle Submission
    if (submitBtn) {
        submitBtn.addEventListener('click', function () {
            var name = usernameField.value;
            // Original game stores score in global 'score' variable? 
            // We need to check main.js. Usually 'score' is global.
            var currentScore = window.score || 0;

            // If game over, maybe grab from #cScore element text?
            var uiScore = parseInt(document.getElementById('cScore').innerText);
            if (!isNaN(uiScore) && uiScore > currentScore) currentScore = uiScore;

            submitScore(name, currentScore);
        });
    }

    // 3. Auto-Submit on Game Over if player is known
    window.autoSubmitScore = function () {
        if (player && player !== "") {
            var currentScore = window.score || 0;
            var uiScore = parseInt(document.getElementById('cScore').innerText);
            if (!isNaN(uiScore) && uiScore > currentScore) currentScore = uiScore;

            console.log("Auto-submitting for SL player:", player, "Score:", currentScore);
            submitScore(player, currentScore);
        }
    };
});

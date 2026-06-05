// Second Life Bridge Script for Hextris
// Handles player name detection, score submission, and keep-alive pings

function getUrlParameter(name) {
    name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
    var regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
    var results = regex.exec(location.search);
    return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
}

// SL mode: clear any saved mid-game state BEFORE the game initializes,
// so a previous session's score can't carry over into a new submission.
var SL_PLAYER = getUrlParameter('player');
if (SL_PLAYER) {
    try { localStorage.setItem('saveState', '{}'); } catch (e) { }
}

document.addEventListener('DOMContentLoaded', function () {
    console.log("SL Bridge Loaded");

    var player = SL_PLAYER;
    var usernameField = document.getElementById('username_field');
    var submitBtn = document.getElementById('submit_score_btn');
    var statusMsg = document.getElementById('submit_msg');
    var keepAliveTimer = null;

    // 1. Auto-fill Player Name
    if (player && usernameField) {
        usernameField.value = player;
        usernameField.disabled = true;
        // İsim zaten biliniyorsa giriş alanını gizle, sadece mesaj alanı kalsın
        var loginArea = document.getElementById('sl-login-area');
        if (loginArea) {
            usernameField.style.display = "none";
            if (submitBtn) submitBtn.style.display = "none";
            statusMsg.style.fontSize = "16px";
            statusMsg.style.color = "#ecf0f1";
            statusMsg.innerText = "PLAYER: " + player;
        }
    }

    // SL mode: keep the unload save-state hook from persisting mid-game state
    if (player) {
        window.exportSaveState = function () { return "{}"; };
    }

    // Image beacon: works even when fetch is unavailable/blocked in SL's
    // embedded browser (the LSL script accepts GET with ?data=<json>)
    function sendBeacon(slUrl, json) {
        var img = new Image();
        img.src = slUrl + (slUrl.indexOf('?') === -1 ? '?' : '&')
            + 'data=' + encodeURIComponent(json) + '&t=' + Date.now();
    }

    function sendToSL(payload, onSuccess, onError) {
        var slUrl = getUrlParameter('sl_url');
        if (!slUrl) {
            if (onError) onError();
            return;
        }
        var json = JSON.stringify(payload);
        if (window.fetch) {
            fetch(slUrl, {
                method: 'POST',
                mode: 'no-cors',
                headers: { 'Content-Type': 'text/plain' },
                body: json
            })
                .then(function () { if (onSuccess) onSuccess(); })
                .catch(function (err) {
                    console.error("fetch failed, using beacon fallback", err);
                    sendBeacon(slUrl, json);
                    if (onSuccess) onSuccess();
                });
        } else {
            sendBeacon(slUrl, json);
            if (onSuccess) onSuccess();
        }
    }

    // Keep-alive: refreshes the LSL safety timer during games longer than
    // its 3-minute timeout. score:0 means "still playing" to the LSL side.
    function startKeepAlive() {
        if (!player || keepAliveTimer) return;
        keepAliveTimer = setInterval(function () {
            if (window.gameState === 1) {
                sendToSL({ name: player, score: 0 });
            }
        }, 60000);
    }

    function stopKeepAlive() {
        if (keepAliveTimer) {
            clearInterval(keepAliveTimer);
            keepAliveTimer = null;
        }
    }

    startKeepAlive();

    function submitScore(name, score) {
        if (!name) {
            statusMsg.innerText = "ENTER NAME!";
            return;
        }
        statusMsg.innerText = "SENDING...";
        stopKeepAlive(); // final submission - don't extend the session anymore
        sendToSL({ name: name, score: score }, function () {
            statusMsg.innerText = "✅ SENT!";
            if (submitBtn) submitBtn.disabled = true;
        }, function () {
            statusMsg.innerText = "NO SL CONNECTION";
        });
    }

    function getCurrentScore() {
        var currentScore = window.score || 0;
        var uiScore = parseInt(document.getElementById('cScore').innerText);
        if (!isNaN(uiScore) && uiScore > currentScore) currentScore = uiScore;
        return currentScore;
    }

    // 2. Handle Submission
    if (submitBtn) {
        submitBtn.addEventListener('click', function () {
            submitScore(usernameField.value, getCurrentScore());
        });
    }

    // 3. Auto-Submit on Game Over if player is known
    window.autoSubmitScore = function () {
        if (player && player !== "") {
            var currentScore = getCurrentScore();
            console.log("Auto-submitting for SL player:", player, "Score:", currentScore);
            submitScore(player, currentScore);
        }
    };
});

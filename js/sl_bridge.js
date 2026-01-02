// Setup when page loads
window.onload = function () {
    const urlParams = new URLSearchParams(window.location.search);
    const player_name = urlParams.get('player');

    // DEBUG: Show URL parameters on screen to verify
    const sl_url = urlParams.get('sl_url');
    console.log("DEBUG: SL URL found:", sl_url);
    console.log("DEBUG: Player found:", player_name);

    if (player_name) {
        var input = document.getElementById('playerName');
        if (input) {
            input.value = player_name;
            input.readOnly = true;
            input.style.borderColor = "#0f0";
            input.style.color = "#0f0";
        }
    }
};

function submitToSL() {
    // Visual Debug Helper
    var debugDiv = document.getElementById('debugOutput');
    if (!debugDiv) {
        debugDiv = document.createElement('div');
        debugDiv.id = 'debugOutput';
        debugDiv.style.color = 'yellow';
        debugDiv.style.fontSize = '12px';
        debugDiv.style.marginTop = '10px';
        document.getElementById('slInputArea').appendChild(debugDiv);
    }
    debugDiv.innerHTML = "Status: Starting Submission...";

    var name = document.getElementById('playerName').value;
    if (!name) { alert("Please enter your name!"); return; }

    const urlParams = new URLSearchParams(window.location.search);
    const sl_url = urlParams.get('sl_url');

    debugDiv.innerHTML += "<br>URL: " + (sl_url ? "FOUND" : "MISSING");

    if (sl_url) {
        // Safe check for score existence
        var finalScore = (typeof score !== 'undefined') ? score : 0;

        var dataPayload = {
            "name": name,
            "score": finalScore
        };

        var jsonString = JSON.stringify(dataPayload);
        debugDiv.innerHTML += "<br>Payload: " + jsonString;

        fetch(sl_url, {
            method: 'POST',
            mode: 'no-cors', // CRITICAL FIX: Bypass CORS blocking
            cache: 'no-cache',
            headers: {
                'Content-Type': 'text/plain' // Use text/plain to avoid Preflight trigger
            },
            body: jsonString
        }).then(response => {
            // In no-cors mode, we cannot read the response status (it is opaque).
            // We assume success if the fetch promise resolves.
            var btn = document.querySelector("#slInputArea button");
            if (btn) {
                btn.innerHTML = "✅ SENT!";
                btn.style.background = "#0f0";
                btn.disabled = true;
            }
            debugDiv.innerHTML += "<br>Request Sent (no-cors)!";
        }).catch(error => {
            console.error("SL Error:", error);
            debugDiv.innerHTML += "<br>FETCH ERROR: " + error.message;
            alert("Connection Error:\n" + error.message);
        });
    } else {
        debugDiv.innerHTML += "<br>CRITICAL: No LSL URL found in address bar.";
        alert("Offline Mode: Score cannot be saved to SL. (Missing sl_url)");
    }
}

// HEXTRIS NEON - Always On Version
// Created by Gemini for Selami

string GAME_BASE_URL = "https://selami79.github.io/neon/splash.html"; 
string my_url = "";
integer SCREEN_FACE = 0; // Sabit Face 0
integer RESET_PRIM_LINK = -1; 
list highScores = []; 
integer MAX_SCORES = 10;

FindResetPrim() {
    integer i;
    integer prims = llGetNumberOfPrims();
    RESET_PRIM_LINK = -1;
    if(prims == 1) { if(llGetObjectName() == "reset") RESET_PRIM_LINK = 0; } 
    else { for(i=1; i<=prims; ++i) { if(llGetLinkName(i) == "reset") RESET_PRIM_LINK = i; } }
}

DisplayHighScores() {
    string text = "🏆 NEON HEX TOP 10 🏆\n\n";
    integer len = llGetListLength(highScores);
    integer i;
    for(i=0; i<len; i+=2) {
        text += (string)((i/2)+1) + ". " + llList2String(highScores, i+1) + " - " + llList2String(highScores, i) + "\n";
    }
    if(RESET_PRIM_LINK != -1) llSetLinkPrimitiveParamsFast(RESET_PRIM_LINK, [PRIM_TEXT, text, <0,1,1>, 1.0]);
}

integer hasPlayer = FALSE;

LoadGame(string playerName) {
    string final_url = GAME_BASE_URL + "?sl_url=" + llEscapeURL(my_url);
    if(playerName != "") {
        final_url += "&player=" + llEscapeURL(playerName);
        hasPlayer = TRUE;
    }
    
    integer i;
    for(i=0; i<6; ++i) { 
        llSetPrimMediaParams(i, [
            PRIM_MEDIA_AUTO_PLAY, TRUE,
            PRIM_MEDIA_CURRENT_URL, final_url,
            PRIM_MEDIA_HOME_URL, final_url,
            PRIM_MEDIA_HEIGHT_PIXELS, 1024,
            PRIM_MEDIA_WIDTH_PIXELS, 1024,
            PRIM_MEDIA_PERMS_CONTROL, PRIM_MEDIA_PERM_NONE,
            PRIM_MEDIA_PERMS_INTERACT, PRIM_MEDIA_PERM_ANYONE,
            PRIM_MEDIA_FIRST_CLICK_INTERACT, TRUE,
            PRIM_MEDIA_AUTO_SCALE, TRUE,
            PRIM_MEDIA_AUTO_ZOOM, TRUE  // AUTO ZOOM EKLENDI
        ]);
    }
    llOwnerSay("Oyun Yukleniyor: " + playerName);
}

default {
    state_entry() {
        FindResetPrim();
        llRequestSecureURL();
        llOwnerSay("Sistem Baslatildi. Reset Prim ID: " + (string)RESET_PRIM_LINK);
    }

    http_request(key id, string method, string body) {
        if (method == URL_REQUEST_GRANTED) {
            my_url = body;
            LoadGame(""); 
        } else if (method == "POST") {
            string name = llJsonGetValue(body, ["name"]);
            integer newScore = (integer)llJsonGetValue(body, ["score"]);
            
            if(name != JSON_INVALID) {
                // Find existing player score
                integer idx = llListFindList(highScores, [name]);
                if (idx != -1) {
                    // Player found, idx is position of name, score is at idx-1
                    integer oldScore = llList2Integer(highScores, idx - 1);
                    if (newScore > oldScore) {
                        // Update with higher score
                        highScores = llDeleteSubList(highScores, idx - 1, idx);
                        highScores += [newScore, name];
                    }
                } else {
                    // New player
                    highScores += [newScore, name];
                }
                
                // Sort by score (descending)
                highScores = llListSort(highScores, 2, FALSE);
                
                // Limit list size
                if(llGetListLength(highScores) > MAX_SCORES * 2) {
                    highScores = llList2List(highScores, 0, (MAX_SCORES * 2) - 1);
                }
                
                DisplayHighScores();
                llHTTPResponse(id, 200, "OK");
            }
        }
    }
    
    touch_start(integer n) {
        string linkName = llGetLinkName(llDetectedLinkNumber(0));
        
        if (llToLower(linkName) == "reset") {
             llOwnerSay("Resetleniyor...");
             llResetScript(); 
        } else if (!hasPlayer) {
             // Sadece ilk dokunusta ismi al ve yukle ki oyun bolunmesin
             string name = llDetectedName(0);
             LoadGame(name);
        }
    }
    
    on_rez(integer p) { llResetScript(); }
    changed(integer c) { if(c & (CHANGED_REGION | CHANGED_LINK)) llResetScript(); }
}

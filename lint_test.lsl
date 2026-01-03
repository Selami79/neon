string GAME_BASE_URL = "https://selami79.github.io/neon/index.html"; 
string STANDBY_TEXTURE = "d570bdfe-69a5-e500-bf13-31e36c093634"; 
string my_url = "";
integer SCREEN_LINK = -2; 
integer RESET_PRIM_LINK = -1; 
integer SCREEN_FACE = 0;
integer hasPlayer = FALSE;
integer MAX_SCORES = 10;
list highScores = []; 

FindPrims() {
    integer i;
    integer prims = llGetNumberOfPrims();
    SCREEN_LINK = -2; RESET_PRIM_LINK = -1;
    for(i=0; i<=prims; ++i) {
        string n = llStringTrim(llToLower(llGetLinkName(i)), STRING_TRIM);
        if(n == "ekran") SCREEN_LINK = i;
        else if(n == "reset") RESET_PRIM_LINK = i;
    }
}

DisplayHighScores() {
    string text = "🏆 TOP 10 🏆\n\n";
    integer len = llGetListLength(highScores);
    integer i;
    for(i=0; i<len; i+=2) {
        text += (string)((i/2)+1) + ". " + llList2String(highScores, i+1) + " - " + llList2String(highScores, i) + "\n";
    }
    if(RESET_PRIM_LINK != -1) llSetLinkPrimitiveParamsFast(RESET_PRIM_LINK, [PRIM_TEXT, text, <0,1,1>, 1.0]);
}

SetStandby() {
    hasPlayer = FALSE;
    if (SCREEN_LINK >= 0) {
        llClearLinkMedia(SCREEN_LINK, SCREEN_FACE);
        llSetLinkPrimitiveParamsFast(SCREEN_LINK, [PRIM_TEXTURE, SCREEN_FACE, STANDBY_TEXTURE, <1,1,0>, <0,0,0>, 0.0]);
    }
}

default {
    state_entry() {
        FindPrims();
        llRequestSecureURL();
        SetStandby();
        llOwnerSay("Sistem Hazır.");
    }

    http_request(key id, string method, string body) {
        if (method == URL_REQUEST_GRANTED) {
            my_url = body;
        } else if (method == "POST") {
            string name = llJsonGetValue(body, ["name"]);
            integer newScore = (integer)llJsonGetValue(body, ["score"]);
            if(name != JSON_INVALID) {
                integer idx = llListFindList(highScores, [name]);
                if (idx != -1) {
                    integer oldScore = llList2Integer(highScores, idx - 1);
                    if (newScore > oldScore) {
                        highScores = llDeleteSubList(highScores, idx - 1, idx);
                        highScores += [newScore, name];
                    }
                } else {
                    highScores += [newScore, name];
                }
                highScores = llListSort(highScores, 2, FALSE);
                if(llGetListLength(highScores) > MAX_SCORES * 2) highScores = llList2List(highScores, 0, (MAX_SCORES * 2) - 1);
                DisplayHighScores();
                llHTTPResponse(id, 200, "OK");
                llSleep(2.0); 
                SetStandby();
            }
        }
    }

    touch_start(integer n) {
        integer link = llDetectedLinkNumber(0);
        string name = llToLower(llGetLinkName(link));
        if (name == "reset") llResetScript();
        else if (link == SCREEN_LINK && !hasPlayer) {
            string user = llDetectedName(0);
            hasPlayer = TRUE;
            
            string url = GAME_BASE_URL + "?player=" + llEscapeURL(user) + "&sl_url=" + llEscapeURL(my_url) + "&v=" + (string)llGetUnixTime();
            llOwnerSay(user + " için oyun yükleniyor...");
            
            llSetLinkMedia(SCREEN_LINK, SCREEN_FACE, [
                PRIM_MEDIA_CURRENT_URL, url,
                PRIM_MEDIA_HOME_URL, url,
                PRIM_MEDIA_AUTO_PLAY, TRUE,
                PRIM_MEDIA_FIRST_CLICK_INTERACT, TRUE,
                PRIM_MEDIA_PERMS_INTERACT, PRIM_MEDIA_PERM_ANYONE,
                PRIM_MEDIA_AUTO_SCALE, TRUE,
                PRIM_MEDIA_AUTO_ZOOM, TRUE
            ]);
        }
    }
    
    on_rez(integer p) { llResetScript(); }
    changed(integer c) { if(c & CHANGED_REGION) llResetScript(); }
}
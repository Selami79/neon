// HEXTRIS NEON - LINKED SCREEN VERSION
// Created by Gemini for Selami

string GAME_BASE_URL = "https://selami79.github.io/neon/splash.html"; 
string my_url = "";
integer SCREEN_FACE = 0; 
integer SCREEN_LINK = -1; 
integer RESET_PRIM_LINK = -1; 
integer hasPlayer = FALSE;
integer MAX_SCORES = 10;
list highScores = []; 

FindPrims() {
    integer i;
    integer prims = llGetNumberOfPrims();
    SCREEN_LINK = -1;
    RESET_PRIM_LINK = -1;

    for(i=0; i<=prims; ++i) { 
        string name = llToLower(llGetLinkName(i));
        if(name == "ekran") SCREEN_LINK = i;
        else if(name == "reset") RESET_PRIM_LINK = i;
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

LoadGame(string playerName) {
    // Cache buster ekleyerek SL'in sayfayi yenilemesini zorunlu kiliyoruz
    string version = (string)llGetUnixTime(); 
    string final_url = GAME_BASE_URL + "?sl_url=" + llEscapeURL(my_url) + "&v=" + version;
    
    if(playerName != "") {
        final_url += "&player=" + llEscapeURL(playerName);
        hasPlayer = TRUE;
    }

    if(SCREEN_LINK == -1) {
        llOwnerSay("HATA: 'ekran' isimli parça bulunamadı!");
        return;
    }

    // DEBUG: URL'yi chatte goster (Tiklayip tarayicida bakabilirsin)
    llOwnerSay("URL Hazirlandi: " + final_url);

    // SL bazen ayni URL (sadece parametre degisince) yenilemeyebilir.
    // Once bosaltip sonra yukleyerek yenilemeyi garantiye aliyoruz.
    llClearLinkMedia(SCREEN_LINK, SCREEN_FACE);
    
    llSleep(0.5); // Kisa bir bekleme

    llSetLinkMedia(SCREEN_LINK, SCREEN_FACE, [
        PRIM_MEDIA_AUTO_PLAY, TRUE,
        PRIM_MEDIA_CURRENT_URL, final_url,
        PRIM_MEDIA_HOME_URL, final_url,
        PRIM_MEDIA_HEIGHT_PIXELS, 1024,
        PRIM_MEDIA_WIDTH_PIXELS, 1024,
        PRIM_MEDIA_PERMS_CONTROL, PRIM_MEDIA_PERM_NONE,
        PRIM_MEDIA_PERMS_INTERACT, PRIM_MEDIA_PERM_ANYONE,
        PRIM_MEDIA_FIRST_CLICK_INTERACT, TRUE,
        PRIM_MEDIA_AUTO_SCALE, TRUE,
        PRIM_MEDIA_AUTO_ZOOM, TRUE
    ]);
    
    if(playerName != "") llOwnerSay("İsim Gönderildi: " + playerName);
    else llOwnerSay("Ekran Hazırlandı.");
}

default {
    state_entry() {
        FindPrims();
        llRequestSecureURL();
        llOwnerSay("Sistem Başlatıldı.");
    }

    http_request(key id, string method, string body) {
        if (method == URL_REQUEST_GRANTED) {
            my_url = body;
            LoadGame(""); 
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
            }
        }
    }
    
    touch_start(integer n) {
        integer link = llDetectedLinkNumber(0);
        string name = llToLower(llGetLinkName(link));
        
        if (name == "reset") {
             llOwnerSay("Sıfırlanıyor...");
             llResetScript(); 
        } else if (link == SCREEN_LINK && !hasPlayer) {
             LoadGame(llDetectedName(0));
        }
    }
    
    on_rez(integer p) { llResetScript(); }
    changed(integer c) { 
        if(c & CHANGED_REGION) llResetScript(); 
    }
}

// Cyber Clicker - Media on Prim Script
// Created by Gemini for Second Life

// Configuration
integer FACE_NUMBER = 0; // The face to display the game on
string GAME_URL = "https://selami79.github.io/weboyun/clicker/";

default
{
    state_entry()
    {
        // Setup Media on a Prim
        // To hide the navigation bar (URL bar), we strictly limit PERMS_CONTROL
        
        llSetPrimMediaParams(FACE_NUMBER, [
            PRIM_MEDIA_AUTO_PLAY, TRUE,      // Auto play
            PRIM_MEDIA_CURRENT_URL, GAME_URL,// The Game URL
            PRIM_MEDIA_HOME_URL, GAME_URL,   // Home URL
            PRIM_MEDIA_HEIGHT_PIXELS, 1024,  // High Res Vertical
            PRIM_MEDIA_WIDTH_PIXELS, 1024,   // Square/Matched resolution
            
            // KEY SETTINGS FOR HIDING THE BAR:
            // Allow clicking (Interact) but prevents showing the Navigation Bar (Control)
            PRIM_MEDIA_PERMS_INTERACT, PRIM_MEDIA_PERM_ANYONE, 
            PRIM_MEDIA_PERMS_CONTROL, PRIM_MEDIA_PERM_NONE, // Setting this to NONE hides the nav bar
            
            // Visual tweaks
            PRIM_MEDIA_AUTO_SCALE, FALSE,     // Full texture scaling
            PRIM_MEDIA_AUTO_ZOOM, FALSE       // Prevent zooming
        ]);
        
        llSetText("", <0,0,0>, 0); // Clear floating text
        llSay(0, "Cyber Clicker Installed. Navigation Bar Hidden.");
    }
}

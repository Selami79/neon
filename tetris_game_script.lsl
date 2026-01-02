// Neon Tetris - Media on Prim Script
// Created by Gemini for Second Life

// Configuration
integer FACE_NUMBER = 0; // The face to display the game on (usually 0, 1, or 4 for a simple box)
string GAME_URL = "https://selami79.github.io/weboyun/"; // The URL of your GitHub Pages game

default
{
    state_entry()
    {
        // Set the media params for the specified face
        llSetPrimMediaParams(FACE_NUMBER, [
            PRIM_MEDIA_AUTO_PLAY, TRUE,      // Auto play the media
            PRIM_MEDIA_CURRENT_URL, GAME_URL,// Set the URL
            PRIM_MEDIA_HOME_URL, GAME_URL,   // Set home URL
            PRIM_MEDIA_HEIGHT_PIXELS, 1024,  // Higher resolution height
            PRIM_MEDIA_WIDTH_PIXELS, 512,    // Width (adjust aspect ratio to match phone/game)
            PRIM_MEDIA_PERMS_INTERACT, PRIM_MEDIA_PERM_ANYONE, // Allow anyone to interact
            PRIM_MEDIA_PERMS_CONTROL, PRIM_MEDIA_PERM_ANYONE   // Allow anyone to control
        ]);
        
        llSetText("Neon Tetris\nClick to Play!", <0.0, 1.0, 1.0>, 1.0);
        llSay(0, "Tetris Game Setup Complete! Click the screen to focus and play.");
    }

    touch_start(integer total_number)
    {
        // Optional: Reset URL on touch if needed, or just give instructions
        // llSay(0, "Use Arrow Keys to move (Click screen first to focus).");
    }
}

/*:
 * @plugindesc Gar_Map_Behaviour v1.1 - Camera Lock and Camera Centre Controls
 * @author Gar
 *
 * @help
 * ============================================================================
 * Gar_Map_Behaviour
 * ============================================================================
 *
 * This plugin allows you to take full control of the map camera.
 * You can lock the camera to a specific location, smoothly scroll to
 * a target position, centre the camera on a tile, and restore the
 * default player-following behaviour.
 *
 * | Command               | Coordinates represent       |
 * | --------------------- | --------------------------- |
 * | `LockMap X Y`         | Top-left corner of viewport |
 * | `SmoothLockMap X Y`   | Top-left corner of viewport |
 * | `CenterMap X Y`       | Centre of viewport          |
 * | `SmoothCenterMap X Y` | Centre of viewport          |
 * | `FollowEvent ID`             | Centre on moving event      |
 * | `SmoothFollowEvent ID Speed` | Smoothly follow event       |
 *
 * ============================================================================
 * COMMANDS
 * ============================================================================
 *
 * ---------------------------------------------------------------------------
 * LockMap X Y
 * ---------------------------------------------------------------------------
 * Locks the camera instantly to the specified map coordinates.
 * The player can still move, but the camera will remain fixed.
 *
 * Parameters:
 *   X - Tile X coordinate
 *   Y - Tile Y coordinate
 *
 * Example:
 *   LockMap 10 5
 *
 * Result:
 *   The camera is locked with tile (10,5) at the top-left corner
 *   of the screen.
 *
 * ---------------------------------------------------------------------------
 * SmoothLockMap X Y Speed
 * ---------------------------------------------------------------------------
 * Smoothly scrolls the camera to the specified coordinates and
 * then keeps it locked there.
 *
 * Parameters:
 *   X     - Tile X coordinate
 *   Y     - Tile Y coordinate
 *   Speed - Scroll speed (0.01 to 1.00 recommended)
 *
 * Example:
 *   SmoothLockMap 10 5 0.25
 *
 * Result:
 *   The camera smoothly moves to tile (10,5) before locking.
 *
 * ---------------------------------------------------------------------------
 * CenterMap X Y
 * ---------------------------------------------------------------------------
 * Instantly centres the camera on the specified tile.
 *
 * Parameters:
 *   X - Tile X coordinate
 *   Y - Tile Y coordinate
 *
 * Example:
 *   CenterMap 20 15
 *
 * Result:
 *   Tile (20,15) appears at the centre of the screen.
 *
 * ---------------------------------------------------------------------------
 * SmoothCenterMap X Y Speed
 * ---------------------------------------------------------------------------
 * Smoothly scrolls the camera until the specified tile reaches
 * the centre of the screen.
 *
 * Parameters:
 *   X     - Tile X coordinate
 *   Y     - Tile Y coordinate
 *   Speed - Scroll speed (0.01 to 1.00 recommended)
 *
 * Example:
 *   SmoothCenterMap 20 15 0.25
 *
 * Result:
 *   The camera smoothly pans to centre on tile (20,15).
 *
 * ---------------------------------------------------------------------------
 * UnlockMap
 * ------------------------------------
 * Restores normal player-following camera.
 *---------------------------------------------------------------------------
 * FollowEvent EventId
 * --------------------------------------------------------------
 * Locks the camera to an event and keeps that event centred on screen
 * while it moves.
 *
 * Parameters:
 *   EventId - Database ID of the event to follow
 *
 * Example:
 *   FollowEvent 5
 *
 * Result:
 *   The camera immediately centres on Event 5 and follows it as it
 *   moves around the map.
 *
 * ---------------------------------------------------------------------------
 * SmoothFollowEvent EventId Speed
 * ---------------------------------------------------------------------------
 * Smoothly follows a moving event. The camera pans after the event
 * instead of snapping instantly to its position.
 *
 * Parameters:
 *   EventId - Database ID of the event to follow
 *   Speed   - Scroll speed (0.01 to 1.00 recommended)
 *
 * Example:
 *   SmoothFollowEvent 5 0.15
 *
 * Result:
 *   The camera smoothly tracks Event 5, creating a cinematic
 *   scrolling effect for cutscenes and scripted sequences.
 * ============================================================================
 */

(function() {

    "use strict";

var cameraLocked = false;

var cameraX = 0;
var cameraY = 0;

var targetX = 0;
var targetY = 0;

var smoothScroll = false;
var smoothSpeed = 0.50;
var followEventId = 0;
var followEventSmooth = false;

    var _Game_Interpreter_pluginCommand =
        Game_Interpreter.prototype.pluginCommand;

    Game_Interpreter.prototype.pluginCommand = function(command, args) {

        _Game_Interpreter_pluginCommand.call(
            this,
            command,
            args
        );

        if (command === "LockMap") {

    targetX = Number(args[0] || 0);
    targetY = Number(args[1] || 0);

    cameraX = targetX;
    cameraY = targetY;

    smoothScroll = false;
    cameraLocked = true;

    $gameMap.setDisplayPos(
        cameraX,
        cameraY
    );
}
if (command === "SmoothLockMap") {

    targetX = Number(args[0] || 0);
    targetY = Number(args[1] || 0);

    smoothSpeed = Number(args[2] || 0.50);

    cameraX = $gameMap.displayX();
    cameraY = $gameMap.displayY();

    smoothScroll = true;
    cameraLocked = true;

}


        if (command === "CenterMap") {

    var x = Number(args[0] || 0);
    var y = Number(args[1] || 0);

    targetX = x - ($gameMap.screenTileX() / 2);
    targetY = y - ($gameMap.screenTileY() / 2);

    cameraX = targetX;
    cameraY = targetY;

    smoothScroll = false;
    cameraLocked = true;

}
if (command === "SmoothCenterMap") {

    var x = Number(args[0] || 0);
    var y = Number(args[1] || 0);

    smoothSpeed = Number(args[2] || 0.50);

    targetX = x - ($gameMap.screenTileX() / 2);
    targetY = y - ($gameMap.screenTileY() / 2);

cameraX = $gameMap.displayX();
cameraY = $gameMap.displayY();

smoothScroll = true;
cameraLocked = true;

}

if (command === "UnlockMap") {
    cameraLocked = false;
    followEventId = 0;
    followEventSmooth = false;
}

if (command === "SetScrollSpeed") {

    smoothSpeed = Number(args[0] || 0.50);

}

};

    // Prevent player movement from scrolling the map
    var _Game_Player_updateScroll =
        Game_Player.prototype.updateScroll;

    Game_Player.prototype.updateScroll = function(lastX, lastY) {

if (cameraLocked) {

    $gameMap.setDisplayPos(
        cameraX,
        cameraY
    );

    return;
}

        _Game_Player_updateScroll.call(
            this,
            lastX,
            lastY
        );

    };

    // Continuously force the camera position
    var _Scene_Map_update =
        Scene_Map.prototype.update;

    Scene_Map.prototype.update = function() {

        _Scene_Map_update.call(this);

        if (cameraLocked) {
    if (followEventId > 0) {
        var event = $gameMap.event(followEventId);

        if (event) {
            targetX =
                event.x - ($gameMap.screenTileX() / 2);

            targetY =
                event.y - ($gameMap.screenTileY() / 2);
        }
    }
    if (smoothScroll) {

        cameraX += (targetX - cameraX) * smoothSpeed;
        cameraY += (targetY - cameraY) * smoothSpeed;

        if (Math.abs(cameraX - targetX) < 0.01) {
            cameraX = targetX;
        }

        if (Math.abs(cameraY - targetY) < 0.01) {
            cameraY = targetY;
        }

    } else {

        cameraX = targetX;
        cameraY = targetY;

    }

    $gameMap.setDisplayPos(
        cameraX,
        cameraY
    );

}

    };

})();
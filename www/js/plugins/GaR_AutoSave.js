/*:
 * @plugindesc Autosave Slot 1 (Load Only)
 * @author You
 */

(function() {

    // Show "Autosave" instead of "File 1"
    var _drawFileId = Window_SavefileList.prototype.drawFileId;
    Window_SavefileList.prototype.drawFileId = function(id, x, y) {
        if (id === 1) {
            this.drawText("Autosave", x, y, 180);
        } else {
            _drawFileId.call(this, id, x, y);
        }
    };

    // Prevent manual saving to Slot 1
    var _isEnabled = Window_SavefileList.prototype.isEnabled;
    Window_SavefileList.prototype.isEnabled = function(savefileId) {
        if (SceneManager._scene instanceof Scene_Save && savefileId === 1) {
            return false;
        }
        return _isEnabled.call(this, savefileId);
    };

})();
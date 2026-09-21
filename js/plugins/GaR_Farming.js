(function() {

var STAGE1 = 60;
var STAGE2 = 120000;
var STAGE3 = 180000;

var _init = Game_System.prototype.initialize;
Game_System.prototype.initialize = function() {
    _init.call(this);
    this._farmPlots = {};
};

function key(mapId, eventId) {
    return mapId + "_" + eventId;
}

window.GaRFarm = {};

GaRFarm.plant = function(mapId, eventId) {
    $gameSystem._farmPlots[key(mapId, eventId)] = {
        planted: Date.now()
    };
};

GaRFarm.harvest = function(mapId, eventId) {
    delete $gameSystem._farmPlots[key(mapId, eventId)];
};

GaRFarm.stage = function(mapId, eventId) {

    var plot = $gameSystem._farmPlots[key(mapId, eventId)];

    if (!plot) {
        return 0;
    }

    var elapsed = Date.now() - plot.planted;

    if (elapsed >= STAGE3) return 3;
    if (elapsed >= STAGE2) return 2;
    if (elapsed >= STAGE1) return 1;

    return 0;
};

function isFarmPlot(event) {

    if (!event) return false;
    if (!event.event()) return false;

    return event.event().name.indexOf("FarmPlot") === 0;
}

function updatePlot(event) {

    if (!isFarmPlot(event)) return;

    var stage = GaRFarm.stage(
        $gameMap.mapId(),
        event.eventId()
    );

    event.setImage("FarmCrops", stage);
}

var _mapUpdate = Scene_Map.prototype.update;
Scene_Map.prototype.update = function() {

    _mapUpdate.call(this);

    this._farmTimer = this._farmTimer || 0;
    this._farmTimer++;

    if (this._farmTimer >= 60) {

        this._farmTimer = 0;

        $gameMap.events().forEach(function(event) {
            updatePlot(event);
        });
    }
};

var _pluginCommand =
    Game_Interpreter.prototype.pluginCommand;

Game_Interpreter.prototype.pluginCommand =
function(command, args) {

    _pluginCommand.call(this, command, args);

    if (command === "FarmPlant") {

        GaRFarm.plant(
            $gameMap.mapId(),
            this._eventId
        );

        updatePlot(
            $gameMap.event(this._eventId)
        );
    }

    if (command === "FarmHarvest") {

        GaRFarm.harvest(
            $gameMap.mapId(),
            this._eventId
        );

        updatePlot(
            $gameMap.event(this._eventId)
        );
    }

    if (command === "FarmStage") {

        var variableId = Number(args[0]);

        $gameVariables.setValue(
            variableId,
            GaRFarm.stage(
                $gameMap.mapId(),
                this._eventId
            )
        );
    }
};

})();
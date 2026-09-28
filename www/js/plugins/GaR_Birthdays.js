/*:
 * @plugindesc v2.0 Real Birthday Checker (Unlimited Birthdays)
 * @author You
 *
 * @param Birthdays
 * @type struct<Birthday>[]
 * @default []
 *
 * @help
 * Checks the real-world date whenever a map loads.
 *
 * If today's month/day matches a birthday entry,
 * that entry's switch is turned ON.
 *
 * Otherwise the switch is turned OFF.
 *
 * Example:
 * Hayley | August 4 | Switch 21
 * Kev    | September 6 | Switch 22
 * Chris  | November 19 | Switch 23
 */

/*~struct~Birthday:
 * @param Name
 * @type text
 * @default
 *
 * @param Day
 * @type number
 * @min 1
 * @max 31
 * @default 1
 *
 * @param Month
 * @type number
 * @min 1
 * @max 12
 * @default 1
 *
 * @param Switch
 * @type switch
 * @default 1
 */

(function() {

    var PLUGIN_NAME = "BirthdayChecker";
    var params = PluginManager.parameters(PLUGIN_NAME);

    function getBirthdays() {
        try {
            return JSON.parse(params["Birthdays"] || "[]")
                .map(function(entry) {
                    return JSON.parse(entry);
                });
        } catch (e) {
            console.error("BirthdayChecker: Failed to parse birthdays.");
            console.error(e);
            return [];
        }
    }

    function checkBirthdays() {

        var today = new Date();
        var currentMonth = today.getMonth() + 1;
        var currentDay = today.getDate();

        var birthdays = getBirthdays();

        birthdays.forEach(function(person) {

            var month = Number(person.Month);
            var day = Number(person.Day);
            var switchId = Number(person.Switch);

            if (switchId <= 0) return;

            var isBirthday =
                month === currentMonth &&
                day === currentDay;

            $gameSwitches.setValue(switchId, isBirthday);
        });
    }

    var _Scene_Map_start = Scene_Map.prototype.start;
    Scene_Map.prototype.start = function() {
        _Scene_Map_start.call(this);
        checkBirthdays();
    };

})();
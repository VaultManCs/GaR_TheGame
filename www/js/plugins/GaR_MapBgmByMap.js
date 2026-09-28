/*:
 * @target MV MZ
 * @plugindesc v2.1 Per-map/zone BGM selector (multi MapIds per config) + keep playing within zone (MV/MZ) - GaR_MapBgmByMap
 * @author You
 *
 * @param MapConfigs
 * @type struct<MapBgmConfig>[]
 * @default []
 * @desc One or more BGM configs. Each config can target multiple maps via MapIds.
 *
 * @param ContinueWithinSameConfig
 * @type boolean
 * @default true
 * @desc If true, moving between maps in the same config keeps the current BGM playing (no restart).
 *
 * @param AvoidRepeat
 * @type boolean
 * @default true
 * @desc If true, random mode avoids picking the same track twice in a row per config.
 *
 * @param StartBehaviour
 * @type select
 * @option Instant
 * @value instant
 * @option Fade In
 * @value fade
 * @default instant
 * @desc How BGM starts when entering a config (or switching to a different config).
 *
 * @param StartFadeSeconds
 * @type number
 * @min 0
 * @max 30
 * @decimals 1
 * @default 1.0
 *
 * @param StopBehaviourWhenChanging
 * @type select
 * @option Instant
 * @value instant
 * @option Fade Out
 * @value fade
 * @default instant
 * @desc How CURRENT BGM stops when switching to a different config.
 *
 * @param StopFadeSecondsWhenChanging
 * @type number
 * @min 0
 * @max 30
 * @decimals 1
 * @default 1.0
 *
 * @param UnconfiguredBehaviour
 * @type select
 * @option Do nothing (leave current BGM as-is)
 * @value keep
 * @option Stop BGM on unconfigured maps
 * @value stop
 * @option Fade out BGM on unconfigured maps
 * @value fade
 * @default keep
 * @desc What to do when entering a map that is NOT listed in any config.
 *
 * @param UnconfiguredFadeSeconds
 * @type number
 * @min 0
 * @max 30
 * @decimals 1
 * @default 1.0
 *
 * @param DefaultVolume
 * @type number
 * @min 0
 * @max 100
 * @default 90
 *
 * @param DefaultPitch
 * @type string
 * @default 100
 * @desc 50..150 (string to avoid MV/MZ param UI clamping issues).
 *
 * @param DefaultPan
 * @type string
 * @default 0
 * @desc -100..100 (string to avoid MV/MZ param UI clamping issues).
 *
 * @help
 * MULTI-MAP ZONES:
 * - Each MapConfigs entry can target multiple maps using MapIds (comma-separated).
 * - If ContinueWithinSameConfig = true, BGM continues when transferring between maps in the same entry.
 *
 * BGM LIST:
 * - Bgms is a comma-separated list from audio/bgm (no extensions).
 * - Mode:
 *    - random = pick a random track from the list (when starting / switching configs)
 *    - single = always play the first track in the list
 *
 * MV NOTE:
 * - MV doesn't show struct editors well. You can paste MapConfigs as a JSON array string.
 *
 * Example MV MapConfigs:
 * [
 *   {"MapIds":"3,4","Bgms":"Town1,Town2","Mode":"random","UseDefaultPitch":true,"UseDefaultPan":true},
 *   {"MapIds":"7","Bgms":"DungeonTheme","Mode":"single","UseDefaultPitch":false,"Pitch":100,"UseDefaultPan":false,"Pan":0}
 * ]
 *
 * Tip:
 * - To prevent map autoplay BGM fighting your zone music, set maps' Autoplay BGM to OFF
 *   for maps controlled by this plugin.
 *
 * Plugin Command (MZ only):
 * - RefreshConfigs  (re-reads plugin parameters and reapplies to the current map)
 */

/*~struct~MapBgmConfig:
 * @param MapIds
 * @type string
 * @default 1
 * @desc Comma-separated map IDs for this config (e.g. 3,4,7).
 *
 * @param Bgms
 * @type string
 * @default Theme1,Theme2
 * @desc Comma-separated BGM filenames (no extension) from audio/bgm.
 *
 * @param Mode
 * @type select
 * @option Random
 * @value random
 * @option Single (always first)
 * @value single
 * @default random
 *
 * @param UseDefaultVolume
 * @type boolean
 * @default true
 *
 * @param Volume
 * @type number
 * @min 0
 * @max 100
 * @default 90
 * @desc Used only if UseDefaultVolume is false.
 *
 * @param UseDefaultPitch
 * @type boolean
 * @default true
 *
 * @param Pitch
 * @type number
 * @min 50
 * @max 150
 * @default 100
 * @desc Used only if UseDefaultPitch is false.
 *
 * @param UseDefaultPan
 * @type boolean
 * @default true
 *
 * @param Pan
 * @type number
 * @min -100
 * @max 100
 * @default 0
 * @desc Used only if UseDefaultPan is false.
 */

(function() {
  "use strict";

  var PLUGIN_NAME = "GaR_MapBgmByMap";
  var params = PluginManager.parameters(PLUGIN_NAME);

  // ---------------- Helpers ----------------
  function asBool(v, dflt) {
    if (v === undefined || v === null || v === "") return !!dflt;
    return String(v).toLowerCase() === "true";
  }
  function asNum(v, dflt) {
    var n = Number(v);
    return Number.isFinite(n) ? n : dflt;
  }
  function asStr(v, dflt) {
    if (v === undefined || v === null) return String(dflt || "");
    var s = String(v);
    return s.length ? s : String(dflt || "");
  }
  function safeJsonParse(text, fallback) {
    try { return JSON.parse(text); } catch (e) { return fallback; }
  }
  function clamp(n, lo, hi) {
    return Math.max(lo, Math.min(hi, n));
  }
  function ms(sec) {
    return Math.max(0, Number(sec || 0)) * 1000;
  }
  function parseCsvNums(str) {
    return String(str || "")
      .split(",")
      .map(function(s){ return s.trim(); })
      .filter(Boolean)
      .map(function(s){ return Number(s); })
      .filter(function(n){ return Number.isFinite(n) && n > 0; });
  }

  // ---------------- Global params ----------------
  var CONTINUE_WITHIN = asBool(params.ContinueWithinSameConfig, true);
  var AVOID_REPEAT = asBool(params.AvoidRepeat, true);

  var START_BEHAVIOUR = asStr(params.StartBehaviour, "instant"); // instant|fade
  var START_FADE_SEC = asNum(params.StartFadeSeconds, 1.0);

  var STOP_CHANGE_BEHAVIOUR = asStr(params.StopBehaviourWhenChanging, "instant"); // instant|fade
  var STOP_CHANGE_FADE_SEC = asNum(params.StopFadeSecondsWhenChanging, 1.0);

  var UNCONFIG_BEHAVIOUR = asStr(params.UnconfiguredBehaviour, "keep"); // keep|stop|fade
  var UNCONFIG_FADE_SEC = asNum(params.UnconfiguredFadeSeconds, 1.0);

  var DEF_VOL = clamp(asNum(params.DefaultVolume, 90), 0, 100);
  var DEF_PITCH = clamp(Number(params.DefaultPitch || 100), 50, 150);
  var DEF_PAN = clamp(Number(params.DefaultPan || 0), -100, 100);

  // ---------------- Parse configs ----------------
  function normaliseConfig(raw, cfgIndex) {
    if (!raw) return null;

    // MZ: struct entry is JSON string. MV: may be object or JSON string.
    var obj = raw;
    if (typeof raw === "string") obj = safeJsonParse(raw, null);
    if (!obj) return null;

    // New field: MapIds. Fallback: MapId.
    var mapIdsCsv = asStr(obj.MapIds, "");
    if (!mapIdsCsv && obj.MapId !== undefined) mapIdsCsv = String(obj.MapId);

    var mapIds = parseCsvNums(mapIdsCsv);
    if (!mapIds.length) return null;

    var bgms = asStr(obj.Bgms, "")
      .split(",")
      .map(function(s){ return s.trim(); })
      .filter(Boolean);

    var mode = asStr(obj.Mode, "random").toLowerCase();
    if (mode !== "single") mode = "random";

    var useDefVol = asBool(obj.UseDefaultVolume, true);
    var useDefPitch = asBool(obj.UseDefaultPitch, true);
    var useDefPan = asBool(obj.UseDefaultPan, true);

    var vol = clamp(asNum(obj.Volume, DEF_VOL), 0, 100);
    var pitch = clamp(asNum(obj.Pitch, DEF_PITCH), 50, 150);
    var pan = clamp(asNum(obj.Pan, DEF_PAN), -100, 100);

    return {
      _id: "cfg_" + String(cfgIndex),
      mapIds: mapIds,
      bgms: bgms,
      mode: mode,
      volume: useDefVol ? DEF_VOL : vol,
      pitch: useDefPitch ? DEF_PITCH : pitch,
      pan: useDefPan ? DEF_PAN : pan
    };
  }

  function buildIndex() {
    var raw = params.MapConfigs;
    var arr;

    // MZ: array of JSON strings; MV: JSON array string paste
    if (Array.isArray(raw)) arr = raw;
    else if (typeof raw === "string") arr = safeJsonParse(raw, []);
    else arr = [];

    if (typeof arr === "string") arr = safeJsonParse(arr, []);
    if (!Array.isArray(arr)) arr = [];

    var byMap = Object.create(null);
    var byId = Object.create(null);

    arr.forEach(function(entry, i){
      var cfg = normaliseConfig(entry, i);
      if (!cfg) return;

      byId[cfg._id] = cfg;
      cfg.mapIds.forEach(function(mid){
        byMap[mid] = cfg; // last one wins if duplicated map ids
      });
    });

    return { byMap: byMap, byId: byId };
  }

  var INDEX = buildIndex();

  // per-config avoid-repeat memory
  function lastPickTable() {
    if (!$gameSystem) return null;
    if (!$gameSystem._garMapBgmLastPickCfg) $gameSystem._garMapBgmLastPickCfg = {};
    return $gameSystem._garMapBgmLastPickCfg;
  }

  function pickTrack(cfg) {
    if (!cfg || !cfg.bgms || !cfg.bgms.length) return "";

    if (cfg.mode === "single" || cfg.bgms.length === 1) return cfg.bgms[0];

    var list = cfg.bgms;
    var pick = list[Math.floor(Math.random() * list.length)];

    if (AVOID_REPEAT && list.length > 1) {
      var table = lastPickTable();
      var last = table ? table[cfg._id] : "";
      var guard = 20;
      while (pick === last && guard-- > 0) {
        pick = list[Math.floor(Math.random() * list.length)];
      }
      if (table) table[cfg._id] = pick;
    }

    return pick;
  }

  function stopInstant() {
    if (AudioManager && AudioManager.stopBgm) AudioManager.stopBgm();
  }

  function fadeOutThenStop(sec, after) {
    sec = Math.max(0, Number(sec || 0));
    if (AudioManager && AudioManager.fadeOutBgm && sec > 0) {
      AudioManager.fadeOutBgm(sec);
      setTimeout(function() {
        if (AudioManager && AudioManager.stopBgm) AudioManager.stopBgm();
        if (after) after();
      }, ms(sec));
    } else {
      stopInstant();
      if (after) after();
    }
  }

  function startFadeIfWanted() {
    if (START_BEHAVIOUR !== "fade") return;
    var sec = Math.max(0, Number(START_FADE_SEC || 0));
    if (AudioManager && AudioManager.fadeInBgm && sec > 0) AudioManager.fadeInBgm(sec);
  }

  function trackIsInCfg(cfg, name) {
    if (!cfg || !cfg.bgms || !cfg.bgms.length) return false;
    return cfg.bgms.indexOf(name) >= 0;
  }

  function playCfgBgm(cfg) {
    if (!cfg) return;
    var chosen = pickTrack(cfg);
    if (!chosen) return;

    // If already playing something from this config and ContinueWithinSameConfig is true,
    // keep it (prevents restart even if map autoplay tried something else).
    var curName = (AudioManager && AudioManager._currentBgm) ? AudioManager._currentBgm.name : "";
    if (CONTINUE_WITHIN && curName && trackIsInCfg(cfg, curName)) return;

    // Otherwise play the chosen track
    if (AudioManager && AudioManager.playBgm) {
      AudioManager.playBgm({
        name: chosen,
        volume: cfg.volume,
        pitch: cfg.pitch,
        pan: cfg.pan
      });
      startFadeIfWanted();
    }
  }

  // ---------------- Runtime state ----------------
  var State = {
    currentCfgId: ""
  };

  function applyForMap(mapId) {
    mapId = Number(mapId || 0);
    var cfg = INDEX.byMap[mapId] || null;

    if (!cfg) {
      State.currentCfgId = "";
      if (UNCONFIG_BEHAVIOUR === "stop") stopInstant();
      else if (UNCONFIG_BEHAVIOUR === "fade") fadeOutThenStop(UNCONFIG_FADE_SEC);
      // keep = do nothing
      return;
    }

    var curName = (AudioManager && AudioManager._currentBgm) ? AudioManager._currentBgm.name : "";

    // If still within same config group and something is playing, keep it.
    if (CONTINUE_WITHIN && State.currentCfgId === cfg._id && curName) {
      // If a map autoplay changed music to something not in the config, put it back to the zone’s rules.
      if (!trackIsInCfg(cfg, curName)) {
        playCfgBgm(cfg);
      }
      return;
    }

    // Switching to a different config group OR starting a config from silence
    var startNew = function() {
      State.currentCfgId = cfg._id;
      playCfgBgm(cfg);
    };

    if (State.currentCfgId && State.currentCfgId !== cfg._id) {
      if (STOP_CHANGE_BEHAVIOUR === "fade") fadeOutThenStop(STOP_CHANGE_FADE_SEC, startNew);
      else { stopInstant(); startNew(); }
    } else {
      // first time entering any config
      State.currentCfgId = cfg._id;
      playCfgBgm(cfg);
    }
  }

  // Hook map setup (runs on transfers)
  var _Game_Map_setup = Game_Map.prototype.setup;
  Game_Map.prototype.setup = function(mapId) {
    _Game_Map_setup.call(this, mapId);
    applyForMap(mapId);
  };

  // API
  window.GaR_MapBgmByMap = {
    refresh: function() {
      INDEX = buildIndex();
      if ($gameMap) applyForMap($gameMap.mapId());
    }
  };

  // MZ plugin command (safe in MV: registerCommand doesn't exist)
  if (PluginManager.registerCommand) {
    PluginManager.registerCommand(PLUGIN_NAME, "RefreshConfigs", function() {
      window.GaR_MapBgmByMap.refresh();
    });
  }

})();
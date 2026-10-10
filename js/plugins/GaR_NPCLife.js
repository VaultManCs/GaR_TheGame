/*:
 * @target MZ
 * @plugindesc v0.1 NPC Life Simulation System (Real World Clock) [GaR]
 * @author Chris & Copilot
 *
 * @param UseSystemClock
 * @text Use System Clock
 * @type boolean
 * @default true
 *
 * @param SimulateOffscreen
 * @text Simulate Offscreen NPCs
 * @type boolean
 * @default true
 *
 * @param DebugMode
 * @text Debug Mode
 * @type boolean
 * @default false
 *
 * @param NPCDatabase
 * @text NPC Database
 * @type struct<NPC>[]
 * @default []
 *
 * @help
 * ============================================================================
 * GaR_NPCLife
 * ============================================================================
 * NPC Life Simulation System
 *
 * Route Database:
 * Create route nodes used by NPCs for navigation.
 *
 * NPC Database:
 * Create NPCs and assign a starting route node.
 *
 * ============================================================================
 */
/*~struct~NPC:
 *
 * @param Id
 * @text NPC ID
 * @type text
 *
 * @param DisplayName
 * @text Display Name
 * @type text
 *
 * @param CurrentNode
 * @text Starting Route
 * @type text
 *
 * @param HomeNode
 * @text Home Route
 * @type text
 *
 * @param Importance
 * @text Importance
 * @type select
 * @option Background
 * @option Supporting
 * @option Major
 * @option Critical
 * @default Background
 *
 * @param TravelSpeed
 * @text Travel Speed
 * @type number
 * @min 1
 * @max 10
 * @default 1
 *
 */
/*
 * @help
 * ============================================================================
 * GaR_NPCLife.js
 * ============================================================================
 *
 * NPC scheduling system using the real-world system clock.
 *
 * Supported:
 * - Daily schedules
 * - Weekday overrides
 * - Date overrides
 * - Special events
 * - Importance levels
 * - Off-screen simulation
 *
 */

(() => {

const pluginName = "GaR_NPCLife";

const params = PluginManager.parameters(pluginName);

const SETTINGS = {
	
    useSystemClock: params.UseSystemClock === "true",
    simulateOffscreen: params.SimulateOffscreen === "true",
    debug: params.DebugMode === "true"
};
function debugLog(...args)
{
    if (SETTINGS.debug)
    {

    }
}
window.GaR_NPCLife =
    window.GaR_NPCLife || {};

GaR_NPCLife.routes = {};
GaR_NPCLife.schedules = {};
GaR_NPCLife.schedulesEnabled = true;
GaR_NPCLife.getRouteNode = function(id)
{
    return this.routes[id] || null;
};
GaR_NPCLife.validateRoutes = function()
{
    for (const id in this.routes)
    {
        const route = this.routes[id];

        if (!route.links)
        {
            continue;
        }

        for (const link of route.links)
        {
            if (!this.routes[link])
            {
                console.warn(
                    "[GaR_NPCLife] Missing route link:",
                    id,
                    "->",
                    link
                );
            }
        }
    }
};
GaR_NPCLife.debugRoute = function(npc)
{

};
const _Scene_Boot_create =
    Scene_Boot.prototype.create;

Scene_Boot.prototype.create =
function()
{
    _Scene_Boot_create.call(this);

    if (!GaR_NPCLife._loadingRoutes)
    {
        GaR_NPCLife._loadingRoutes = true;
        GaR_NPCLife.loadRoutes();
		GaR_NPCLife.loadSchedules();
    }
};
GaR_NPCLife.findRoute = function(startId, endId)
{
    if (startId === endId)
    {
        return [startId];
    }

    const queue =
    [
        [startId]
    ];

    const visited =
        new Set();

    visited.add(startId);

    while (queue.length > 0)
    {
        const path =
            queue.shift();

        const current =
            path[path.length - 1];

        const node =
            this.getRouteNode(current);

        if (!node)
        {
            continue;
        }
const links = node.links || [];
        for (const next of links)
        {
            if (visited.has(next))
            {
                continue;
            }

            const newPath =
                [...path, next];

            if (next === endId)
            {
                return newPath;
            }

            visited.add(next);

            queue.push(newPath);
        }
    }

    return [];
};

let npcData = [];

try
{
    const raw =
        params.NPCDatabase || "[]";

    npcData =
        JSON.parse(raw);

    if (!Array.isArray(npcData))
    {
        npcData =
            JSON.parse(npcData);
    }
}
catch(error)
{
    console.error(
        "[GaR_NPCLife] Failed to parse NPCDatabase",
        error
    );
}
GaR_NPCLife._routesLoaded = false;
GaR_NPCLife._schedulesLoaded = false;

class GaRNPC
{
    constructor(data)
    {
        this.controlMode = "schedule";
        this.questNode = null;
        this.partyMember = false;
		this.forceVisible = false;
		
        this.id =
            data.id ||
            data.Id ||
            "";

this.importance =
    data.importance ||
    data.Importance ||
    "Background";

this.currentNode =
    data.currentNode ||
    data.CurrentNode ||
    "";

this.destinationNode =
    this.currentNode;

this.homeNode =
    data.homeNode ||
    data.HomeNode ||
    this.currentNode;

this.travelSpeed =
    Number(
        data.travelSpeed ||
        data.TravelSpeed ||
        1
    );





const startNode =
    GaR_NPCLife.getRouteNode(
        this.currentNode
    );

if (startNode)
{
    this.currentMap =
        startNode.mapId;

    this.currentX =
        startNode.x;

    this.currentY =
        startNode.y;
}
else
{
    this.currentMap = 0;
    this.currentX = 0;
    this.currentY = 0;
}

        this.schedule =
            data.schedule || [];

        this.weekdayOverrides =
            data.weekdayOverrides || [];

        this.dateOverrides =
            data.dateOverrides || [];

        this.activeEvent = null;
		this.destinationMap = this.currentMap;
this.destinationX = this.currentX;
this.destinationY = this.currentY;
this.idleX = this.currentX;
this.idleY = this.currentY;

this.idleTargetX = null;
this.idleTargetY = null;
this.state = "idle";

this.route = [];
this.routeIndex = 0;
    }
}

class GaRNPCManager
{
    constructor()
    {
        this.npcs = {};
        this.specialEvents = {};
        this.lastMinute = -1;
    }

    setQuestControl(npcId)
    {
        const npc = this.getNPC(npcId);
        if (npc)
        {
            npc.controlMode = "quest";
        }
    }

    clearQuestControl(npcId)
    {
        const npc = this.getNPC(npcId);
        if (npc)
        {
            npc.controlMode = "schedule";
        }
    }

    setPartyMember(npcId)
    {
        const npc = this.getNPC(npcId);
        if (npc)
        {
            npc.controlMode = "party";
            npc.partyMember = true;
        }
    }

    removePartyMember(npcId)
    {
        const npc = this.getNPC(npcId);
        if (npc)
        {
            npc.controlMode = "schedule";
            npc.partyMember = false;
        }
    }
	assignSchedules()
{
    for (const npc of this.allNPCs())
    {
        const scheduleData =
            GaR_NPCLife.schedules[npc.id];

        if (scheduleData)
        {
            npc.schedule =
                scheduleData.daily || [];

            console.log(
                "Schedule assigned:",
                npc.id,
                npc.schedule
            );
        }
    }
}
setDestinationNode(
    npc,
    destinationId
	
)
{

    npc.destinationNode =
        destinationId;

    npc.route =
        GaR_NPCLife.findRoute(
            npc.currentNode,
            destinationId
        );




    npc.routeIndex = 0;

    npc.state = "travelling";

    if (SETTINGS.debug)
    {
        GaR_NPCLife.debugRoute(
            npc
        );
    }
}
followRoute(npc)
{
    if (
        !npc.route ||
        npc.route.length === 0
    )
    {
        return;
    }

    if (
        npc.routeIndex >=
        npc.route.length
    )
    {
        npc.state = "idle";

        return;
    }

    const targetNodeId =
        npc.route[npc.routeIndex];

    const targetNode =
        GaR_NPCLife.getRouteNode(
            targetNodeId
        );

    if (!targetNode)
    {
        return;
    }

    npc.destinationMap =
        targetNode.mapId;

    npc.destinationX =
        targetNode.x;

    npc.destinationY =
        targetNode.y;
}
hasReachedDestination(npc)
{
    return (
        npc.currentMap ===
        npc.destinationMap &&

        npc.currentX ===
        npc.destinationX &&

        npc.currentY ===
        npc.destinationY
    );
}
onNodeArrival(npc, nodeId)
{
    npc.idleX = npc.currentX;
    npc.idleY = npc.currentY;

    debugLog(
        npc.id,
        "arrived at",
        nodeId
    );
}
advanceRoute(npc)
{
	if (
    !npc.route ||
    npc.route.length === 0
)
{
    return;
}
    if (
        !this.hasReachedDestination(
            npc
        )
    )
    {
        return;
    }

    npc.currentNode =
        npc.route[
            npc.routeIndex
        ];

    npc.routeIndex++;

    if (
        npc.routeIndex >=
        npc.route.length
    )
    {
        npc.state = "idle";

        return;
    }

    const nextNode =
        GaR_NPCLife.getRouteNode(
            npc.route[
                npc.routeIndex
            ]
        );
		this.onNodeArrival(
    npc,
    npc.currentNode
);

    if (!nextNode)
    {
        return;
    }

    if (
        npc.currentMap !==
        nextNode.mapId
    )
    {
        npc.currentMap =
            nextNode.mapId;

        npc.currentX =
            nextNode.x;

        npc.currentY =
            nextNode.y;
    }

    this.followRoute(npc);
}
generateIdleTarget(npc)
{
    const radius = 3;

    npc.idleTargetX =
        npc.idleX +
        Math.floor(Math.random() * (radius * 2 + 1)) -
        radius;

    npc.idleTargetY =
        npc.idleY +
        Math.floor(Math.random() * (radius * 2 + 1)) -
        radius;


}
registerNPC(data)
{
    const npc = new GaRNPC(data);

    this.npcs[npc.id] = npc;

    debugLog(
        "Registered NPC:",
        npc.id
    );
}


    getNPC(id)
    {
        return this.npcs[id];
    }

    allNPCs()
    {
        return Object.values(this.npcs);
    }
updateSimulation()
{
    const now = new Date();

    const minute =
        now.getMinutes();

    if (minute !== this.lastMinute)
    {
        this.lastMinute = minute;

        this.updateSchedules();
    }

for (const npc of this.allNPCs())
{
    if (npc.state === "travelling")
    {
        this.followRoute(npc);
    }

    this.simulateNPC(npc);
    this.advanceRoute(npc);

    if (npc.state === "idle")
    {
        this.simulateIdle(npc);
    }
}
}
    getClock()
    {
        const now = new Date();

        return {
            year: now.getFullYear(),
            month: now.getMonth() + 1,
            day: now.getDate(),
            weekday: now.getDay(),
            hour: now.getHours(),
            minute: now.getMinutes()
        };
    }

    getTodayString()
    {
        const now = this.getClock();

        const dd =
            String(now.day).padStart(2,"0");

        const mm =
            String(now.month).padStart(2,"0");

        const yyyy =
            String(now.year);

        return {
            annual:
                `${dd}-${mm}`,
            exact:
                `${dd}-${mm}-${yyyy}`
        };
    }

    findDateOverride(npc)
    {
        const today =
            this.getTodayString();

        return npc.dateOverrides.find(
            override =>
                override.date === today.annual
                ||
                override.date === today.exact
        );
    }
	timeToMinutes(timeString)
{
    const parts = timeString.split(":");

    const hour = Number(parts[0]);
    const minute = Number(parts[1]);

return (hour * 60) + minute;
}
currentTimeMinutes()
{
    const now = this.getClock();

    return (now.hour * 60) + now.minute;
}
findWeekdayOverride(npc)
{
    const today =
        this.getClock().weekday;

    return npc.weekdayOverrides.find(
        override =>
            override.days.includes(today)
    );
}
getActiveSchedule(npc)
{
    const dateOverride =
        this.findDateOverride(npc);

    if (dateOverride)
    {
        return dateOverride.schedule;
    }

    const weekdayOverride =
        this.findWeekdayOverride(npc);

    if (weekdayOverride)
    {
        return weekdayOverride.schedule;
    }

    return npc.schedule;
}
findNpcEvent(npcId)
{
    return $gameMap.events().find(
        event =>
            event.garNpcId &&
            event.garNpcId() === npcId
    );
}
startEvent(eventId, eventData)
{
    this.specialEvents[eventId] = eventData;
}

stopEvent(eventId)
{
    delete this.specialEvents[eventId];
}
findActiveEventForNPC(npc)
{
    let winner = null;

    let highestPriority = -9999;

    for (const eventId in this.specialEvents)
    {
        const event =
            this.specialEvents[eventId];

        if (!event.npcs[npc.id])
        {
            continue;
        }

        if (event.priority > highestPriority)
        {
            highestPriority =
                event.priority;

            winner = event;
        }
    }

    return winner;
}

resolveCurrentScheduleNode(npc)
{
    const schedule =
        this.getActiveSchedule(npc);

    if (!schedule || schedule.length === 0)
    {
        return null;
    }

    const currentTime =
        this.currentTimeMinutes();

    let activeNode = schedule[0];

    for (const node of schedule)
    {
        const nodeTime =
            this.timeToMinutes(node.time);

        if (nodeTime <= currentTime)
        {
            activeNode = node;
        }
    }

    return activeNode;
}
applySchedule(npc)
{
	if (!GaR_NPCLife.schedulesEnabled)
    {
        return;
    }

    if (npc.controlMode !== "schedule")
    {
        return;
    }


    console.log(
        "Applying schedule:",
        npc.id,
        this.resolveCurrentScheduleNode(npc)
    );

    const activeEvent =
        this.findActiveEventForNPC(npc);

    if (activeEvent)
    {
        return;
    }

 const node =
    this.resolveCurrentScheduleNode(npc);

if (!node)
{
    return;
}



if (node.location)
{
    const routeNode =
        GaR_NPCLife.getRouteNode(
            node.location
        );

    if (!routeNode)
    {
        console.warn(
            "[GaR_NPCLife] Route not found:",
            node.location
        );

        return;
    }

if (
    npc.destinationNode !==
    node.location
)
{
    this.setDestinationNode(
        npc,
        node.location
    );
}
}
else
{
    npc.destinationMap =
        Number(node.mapId);

    npc.destinationX =
        Number(node.x);

    npc.destinationY =
        Number(node.y);
}
}

simulateNPC(npc)
{
    if (npc.controlMode === "party")
    {
        npc.currentMap = $gameMap.mapId();
        npc.destinationMap = $gameMap.mapId();
        npc.destinationX = $gamePlayer.x - 1;
        npc.destinationY = $gamePlayer.y;
    }

    if (npc.currentMap !== npc.destinationMap)
    {
        return;
    }

    if (npc.currentX < npc.destinationX)
    {
        npc.currentX = Math.min(
            npc.currentX + npc.travelSpeed,
            npc.destinationX
        );
    }
    else if (npc.currentX > npc.destinationX)
    {
        npc.currentX = Math.max(
            npc.currentX - npc.travelSpeed,
            npc.destinationX
        );
    }

    if (npc.currentY < npc.destinationY)
    {
        npc.currentY = Math.min(
            npc.currentY + npc.travelSpeed,
            npc.destinationY
        );
    }
    else if (npc.currentY > npc.destinationY)
    {
        npc.currentY = Math.max(
            npc.currentY - npc.travelSpeed,
            npc.destinationY
        );
    }
}
simulateIdle(npc)
{
    if (
        npc.idleTargetX === null ||
        npc.idleTargetY === null
    )
    {
        this.generateIdleTarget(npc);
    }

    if (npc.currentX < npc.idleTargetX)
    {
        npc.currentX++;
    }
    else if (npc.currentX > npc.idleTargetX)
    {
        npc.currentX--;
    }

    if (npc.currentY < npc.idleTargetY)
    {
        npc.currentY++;
    }
    else if (npc.currentY > npc.idleTargetY)
    {
        npc.currentY--;
    }

    if (
        npc.currentX === npc.idleTargetX &&
        npc.currentY === npc.idleTargetY
    )
    {
        if (Math.random() < 0.05)
        {
            this.generateIdleTarget(npc);
        }
    }
}
updateSchedules()
{
    for (const npc of this.allNPCs())
    {
        this.applySchedule(npc);

    }
}
}
window.GaR_NPCManager =
    new GaRNPCManager();
	GaR_NPCLife.loadSchedules = async function()
{
    try
    {
        const response =
            await fetch(
                "data/GaR_Schedules.json"
            );

        this.schedules =
            await response.json();

        this._schedulesLoaded = true;
    }
    catch(error)
    {
        console.error(error);
    }
};
GaR_NPCLife.loadRoutes = async function()
{
	
    try
    {
        const response =
            await fetch(
                "data/GaR_Routes.json"
            );

        this.routes =
            await response.json();

        this._routesLoaded = true;

npcData.forEach(entry =>
{
    const npc =
        typeof entry === "string"
            ? JSON.parse(entry)
            : entry;

    window.GaR_NPCManager
        .registerNPC(npc);
});

        this.validateRoutes();
    }
    catch(error)
    {
        console.error(error);
    }
};

const _Scene_Boot_isReady =
    Scene_Boot.prototype.isReady;

Scene_Boot.prototype.isReady =
function()
{
    if (!_Scene_Boot_isReady.call(this))
    {
        return false;
    }

const ready =
(
    GaR_NPCLife._routesLoaded &&
    GaR_NPCLife._schedulesLoaded
);

if (
    ready &&
    !GaR_NPCLife._assignedSchedules
)
{
    GaR_NPCLife._assignedSchedules = true;

    window.GaR_NPCManager.assignSchedules();
}

return ready;
};



/*--------------------------------------------------------------------
 * Save Support
 *------------------------------------------------------------------*/

const _DataManager_makeSaveContents =
    DataManager.makeSaveContents;

DataManager.makeSaveContents =
function()
{
    const contents =
        _DataManager_makeSaveContents.call(this);

    contents.GaR_NPCLife =
    {
        npcs:
        window.GaR_NPCManager.npcs,

        specialEvents:
        window.GaR_NPCManager.specialEvents
    };

    return contents;
};

const _DataManager_extractSaveContents =
    DataManager.extractSaveContents;

DataManager.extractSaveContents =
function(contents)
{
    _DataManager_extractSaveContents.call(
        this,
        contents
    );

    if (contents.GaR_NPCLife)
    {
        window.GaR_NPCManager.npcs =
            contents.GaR_NPCLife.npcs;

        window.GaR_NPCManager.specialEvents =
            contents.GaR_NPCLife.specialEvents;
    }
};

/*--------------------------------------------------------------------
 * Plugin Commands
 *------------------------------------------------------------------*/

PluginManager.registerCommand(
    pluginName,
    "RegisterNPC",
    args =>
    {
        try
        {
            const npcData =
                JSON.parse(args.data);

            window.GaR_NPCManager
                .registerNPC(npcData);
        }
        catch(e)
        {
            console.error(e);
        }
    }
);
Game_Event.prototype.garNpcId = function()
{
    const note = this.event().note || "";

    const match =
        note.match(/<NPC:(.+?)>/i);

    return match
        ? match[1]
        : null;
};
Game_Event.prototype.updateGaRNPC =
function()
{
    const npcId =
        this.garNpcId();

    if (!npcId)
    {
        return;
    }

    const npc =
        window.GaR_NPCManager.getNPC(npcId);

    if (!npc)
    {
        return;
    }

if (
    !npc.forceVisible &&
    npc.currentMap !== $gameMap.mapId()
)
{
    this.setTransparent(true);
    return;
}



this.setTransparent(false);

if (
    this.x !== npc.currentX ||
    this.y !== npc.currentY
)
{
    if (this.isMoving())
    {
        return;
    }

    const dir =
        this.findDirectionTo(
            npc.currentX,
            npc.currentY
        );

    if (dir > 0)
    {
        this.moveStraight(dir);
    }
}
};

    
const _Scene_Map_update =
    Scene_Map.prototype.update;

Scene_Map.prototype.update =
function()
{
    _Scene_Map_update.call(this);

    window.GaR_NPCManager.updateSimulation();

    for (const event of $gameMap.events())
    {
        if (event.updateGaRNPC)
        {
            event.updateGaRNPC();
        }
    }
};

})();
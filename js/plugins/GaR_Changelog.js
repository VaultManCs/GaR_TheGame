
//====================================================
// SOURCE: GaR_Credits_01_Header_Full.js
//====================================================

/*:
 * @plugindesc v1.0 GaR Credits System - Advanced Credits Plugin
 * @author GaR
 *
 * ============================================================================
 * GaR_Credits
 * ============================================================================
 *
 * A fully-featured credits system for RPG Maker MV.
 *
 * Features:
 * - TXT driven credits
 * - Rich text formatting
 * - Background playlists
 * - Background transitions
 * - Music playlists
 * - Embedded images
 * - Mobile support
 * - Title screen integration
 *
 *
 * ============================================================================
 * Plugin Parameters
 * ============================================================================
 *
 * @param Command Name
 * @type string
 * @default Changelog
 *
 * @param Changelog Text File
 * @type string
 * @default data/Changelog.txt
 *
 * @param Auto Return
 * @type boolean
 * @default true
 *
 * @param Allow Skip
 * @type boolean
 * @default true
 *
 * @param Scroll Speed
 * @type number
 * @default 1
 *
 * @param Fast Forward Enabled
 * @type boolean
 * @default true
 *
 * @param Fast Forward Multiplier
 * @type number
 * @default 4
 *
 * @param Default Font Size
 * @type number
 * @default 28
 *
 * @param Default Text Colour
 * @default #FFFFFF
 *
 * @param Background Images
 * @type struct<CreditBackground>[]
 * @default []
 *
 * @param Background Random Order
 * @type boolean
 * @default false
 *
 * @param Background Frame Duration
 * @type number
 * @default 300
 *
 * @param Background Transition
 * @type select
 * @option Fade
 * @option Crossfade
 * @option Slide Left
 * @option Slide Right
 * @option Slide Up
 * @option Slide Down
 * @default Crossfade
 *
 * @param Background Transition Duration
 * @type number
 * @default 60
 *
 * @param Music Playlist
 * @type struct<CreditMusic>[]
 * @default []
 *
 * @param Music Random Order
 * @type boolean
 * @default false
 *
 * @param Music Volume
 * @type number
 * @default 90
 *
 * @param Music Pitch
 * @type number
 * @default 100
 *
 * @param Music Pan
 * @type number
 * @default 0
 *
 * @param Default Image Scale
 * @type number
 * @default 100
 *
 * @help
 * ============================================================================
 * Help
 * ============================================================================
 *
 * Changelog are loaded from a TXT file.
 *
 * Supported Tags
 * ---------------------------------------------------------------------------
 *
 * Alignment
 * [left]
 * [center]
 * [right]
 *
 * Font Size
 * [size=32]
 *
 * Colour
 * [color=#FFFFFF]
 * [white]
 * [black]
 * [red]
 * [green]
 * [blue]
 * [yellow]
 * [silver]
 * [gold]
 *
 * Text Style
 * [bold]
 * [/bold]
 *
 * [italic]
 * [/italic]
 *
 * Spacing
 * [space=50]
 *
 * Horizontal Rule
 * [rule]
 *
 * Images
 * [image=Logo]
 *
 * Image Scale
 * [scale=50]
 *
 * Image Alignment
 * [imagealign=left]
 * [imagealign=center]
 * [imagealign=right]
 *
 * ---------------------------------------------------------------------------
 * Example
 * ---------------------------------------------------------------------------
 *
 * [center]
 * [size=48]
 * Grasping At Reality
 *
 * [space=50]
 *
 * [gold]
 * Lead Developer
 *
 * [bold]
 * Chris Scanlon
 * [/bold]
 *
 * [space=30]
 *
 * [italic]
 * Special Thanks
 * [/italic]
 *
 * [rule]
 *
 * [imagealign=center]
 * [image=Logo]
 */

/*~struct~CreditBackground:
 * @param Image
 * @type file
 * @dir img/pictures/
 * @default
 */

/*~struct~CreditMusic:
 * @param BGM
 * @type file
 * @dir audio/bgm/
 * @default
 */
  
/*~struct~"Read Guide"
 * @param Documentation
 * @desc Open the plugin JS file to view full formatting documentation.
 * @default See plugin header.
 */
 
//====================================================
// SOURCE: GaR_Changelog_02_Core.js
//====================================================

//=============================================================================
// GaR_Changelog_02_Core
// Module 02 - Core Bootstrap & Parameter Loader
//=============================================================================
(function(){
'use strict';

window.GaR_Changelog = window.GaR_Changelog || {};
var GC = window.GaR_Changelog;

GC.VERSION = '1.0';
GC.PLUGIN_NAME = 'GaR_Changelog';

var params = PluginManager.parameters(GC.PLUGIN_NAME);

function pBool(name, def){
    var v = params[name];
    if(v === undefined) return def;
    return String(v) === 'true';
}

function pNum(name, def){
    var v = Number(params[name]);
    return isNaN(v) ? def : v;
}

function pStr(name, def){
    var v = params[name];
    return v === undefined ? def : String(v);
}

function parseStructArray(raw){
    try {
        var arr = JSON.parse(raw || '[]');
        return arr.map(function(item){
            try { return JSON.parse(item); }
            catch(e){ return {}; }
        });
    } catch(e){
        return [];
    }
}

GC.Param = {};
GC.Param.commandName = pStr('Command Name','Changelog');
GC.Param.ChangelogFile = pStr('Changelog Text File','data/Changelog.txt');
GC.Param.autoReturn = pBool('Auto Return',true);
GC.Param.allowSkip = pBool('Allow Skip',true);
GC.Param.scrollSpeed = pNum('Scroll Speed',1);
GC.Param.fastForwardEnabled = pBool('Fast Forward Enabled',true);
GC.Param.fastForwardMultiplier = pNum('Fast Forward Multiplier',4);
GC.Param.defaultFontSize = pNum('Default Font Size',28);
GC.Param.defaultTextColour = pStr('Default Text Colour','#FFFFFF');
GC.Param.backgroundImages = parseStructArray(params['Background Images']);
GC.Param.backgroundRandom = pBool('Background Random Order',false);
GC.Param.backgroundFrameDuration = pNum('Background Frame Duration',300);
GC.Param.backgroundTransition = pStr('Background Transition','Crossfade');
GC.Param.backgroundTransitionDuration = pNum('Background Transition Duration',60);
GC.Param.musicPlaylist = parseStructArray(params['Music Playlist']);
GC.Param.musicRandom = pBool('Music Random Order',false);
GC.Param.musicVolume = pNum('Music Volume',90);
GC.Param.musicPitch = pNum('Music Pitch',100);
GC.Param.musicPan = pNum('Music Pan',0);
GC.Param.defaultImageScale = pNum('Default Image Scale',100);

function Scene_GaRChangelog(){
    this.initialize.apply(this, arguments);
}
window.Scene_GaRChangelog = Scene_GaRChangelog;

var _makeCommandList = Window_TitleCommand.prototype.makeCommandList;
Window_TitleCommand.prototype.makeCommandList = function(){
    _makeCommandList.call(this);
    this.addCommand(GC.Param.commandName,'garChangelog');
};

var _createCommandWindow = Scene_Title.prototype.createCommandWindow;
Scene_Title.prototype.createCommandWindow = function(){
    _createCommandWindow.call(this);
    this._commandWindow.setHandler('garChangelog', this.commandGaRChangelog.bind(this));
};

Scene_Title.prototype.commandGaRChangelog = function(){
    SceneManager.push(Scene_GaRChangelog);
};

console.log('GaR_Changelog_02_Core loaded');
})();

//====================================================
// SOURCE: GaR_Changelog_03_Scene.js
//====================================================

//=============================================================================
// GaR_Changelog_03_Scene
// Module 03 - Changelog Scene Framework
// Requires: 01_Header, 02_Core
//=============================================================================
(function(){
'use strict';

var GC = window.GaR_Changelog;

Scene_GaRChangelog.prototype = Object.create(Scene_Base.prototype);
Scene_GaRChangelog.prototype.constructor = Scene_GaRChangelog;

Scene_GaRChangelog.prototype.initialize = function(){
    Scene_Base.prototype.initialize.call(this);
    this._ChangelogLoaded = false;
    this._contentHeight = 0;
    this._scrollSpeed = GC.Param.scrollSpeed;
};

Scene_GaRChangelog.prototype.create = function(){

    Scene_Base.prototype.create.call(this);

    this.createRootLayer();

    this.createBackgroundLayer();

    this.createContentLayer();

    if (this.loadChangelogText) {
        this.loadChangelogText();
    }
};

Scene_GaRChangelog.prototype.start = function(){

    Scene_Base.prototype.start.call(this);

    this.startFadeIn(
        this.fadeSpeed(),
        false
    );

    if (
        this.startChangelogMusic
    ) {

        this.startChangelogMusic();
    }
};

Scene_GaRChangelog.prototype.createRootLayer = function(){
    this._rootSprite = new Sprite();
    this.addChild(this._rootSprite);
};

Scene_GaRChangelog.prototype.createBackgroundLayer =
function(){

    this._backgroundContainer =
        new Sprite();

    this._rootSprite.addChild(
        this._backgroundContainer
    );

    this._backgroundBlack =
        new ScreenSprite();

    this._backgroundBlack.setBlack();

    this._backgroundContainer.addChild(
        this._backgroundBlack
    );

    this._bgSpriteA =
        new Sprite();

    this._bgSpriteB =
        new Sprite();

    this._bgSpriteB.opacity =
        0;

    this._backgroundContainer
        .addChild(
            this._bgSpriteA
        );

    this._backgroundContainer
        .addChild(
            this._bgSpriteB
        );

    this._transitionActive =
        false;

    this._transitionTick =
        0;

    if (
        this.initializeBackgroundPlaylist
    ) {

        this.initializeBackgroundPlaylist();
    }
};

Scene_GaRChangelog.prototype.createContentLayer = function(){
  this._contentContainer =
    new Sprite();

this._rootSprite.addChild(
    this._contentContainer
);
this._contentContainer.y =
    Graphics.height + 64;

this._ChangelogBitmap =
    new Bitmap(Graphics.width, 4096);

this._ChangelogSprite =
    new Sprite(this._ChangelogBitmap);

this._contentContainer.addChild(
    this._ChangelogSprite
);
};
Scene_GaRChangelog.prototype.update = function(){

    Scene_Base.prototype.update.call(this);

    this.updateInput();
    this.updateScrolling();
    this.updateCompletion();

    if (this.updateBackgroundPlaylist) {
        this.updateBackgroundPlaylist();
    }

    if (this.updateBackgroundTransition) {
        this.updateBackgroundTransition();
    }
};

Scene_GaRChangelog.prototype.updateInput = function(){
    if(!GC.Param.allowSkip) return;

    if(Input.isTriggered('cancel')){
        this.exitChangelog();
    }

    if(TouchInput.isCancelled && TouchInput.isCancelled()){
        this.exitChangelog();
    }
};

Scene_GaRChangelog.prototype.currentScrollSpeed = function(){
    var speed = this._scrollSpeed;

    if(GC.Param.fastForwardEnabled){
        if(Input.isPressed('ok')){
            speed *= GC.Param.fastForwardMultiplier;
        }
    }

    return speed;
};

Scene_GaRChangelog.prototype.updateScrolling = function(){

    if(!this._ChangelogLoaded) return;

    this._contentContainer.y -=
        this.currentScrollSpeed();

};

Scene_GaRChangelog.prototype.updateCompletion = function(){

    if(!this._ChangelogLoaded) return;

    if(this._contentContainer.y + this._contentHeight < 0){

        this.onChangelogFinished();

    }
};

Scene_GaRChangelog.prototype.onChangelogFinished = function(){
    if(GC.Param.autoReturn){
        this.exitChangelog();
    }
};

Scene_GaRChangelog.prototype.exitChangelog = function(){

    AudioManager.stopBgm();

    SceneManager.pop();
};

Scene_GaRChangelog.prototype.setChangelogLoaded = function(height){
    this._contentHeight = height || 0;
    this._ChangelogLoaded = true;
};

console.log('GaR_Changelog_03_Scene loaded');
})();

//====================================================
// SOURCE: GaR_Changelog_04_TextLoader.js
//====================================================

//=============================================================================
// GaR_Changelog_04_TextLoader
// Module 04 - TXT Changelog Loader
// Requires: 01_Header, 02_Core, 03_Scene
//=============================================================================
(function(){
'use strict';

var GC = window.GaR_Changelog;
GC.Cache = GC.Cache || {};

Scene_GaRChangelog.prototype.loadChangelogText = function(){
    var file = GC.Param.ChangelogFile;

    if(GC.Cache[file]){
        this.onChangelogTextLoaded(GC.Cache[file]);
        return;
    }

    var xhr = new XMLHttpRequest();
    var self = this;

    xhr.open('GET', file);
    xhr.overrideMimeType('text/plain');

    xhr.onload = function(){
        if(xhr.status < 400 || xhr.status === 0){
            var text = xhr.responseText || '';
            GC.Cache[file] = text;
            self.onChangelogTextLoaded(text);
        } else {
            self.onChangelogTextError('Failed to load: ' + file);
        }
    };

    xhr.onerror = function(){
        self.onChangelogTextError('Cannot access: ' + file);
    };

    xhr.send();
};

Scene_GaRChangelog.prototype.onChangelogTextLoaded = function(text){
    this._rawChangelogText = text;
console.log("Changelog loaded");
console.log(text);
    if(this.parseChangelogText){
        this.parseChangelogText(text);
        return;
    }

    this.drawPlaceholderChangelog(text);
};

Scene_GaRChangelog.prototype.onChangelogTextError = function(message){
    this.drawPlaceholderChangelog(message);
};

Scene_GaRChangelog.prototype.drawPlaceholderChangelog = function(text){
    var bmp = this._ChangelogBitmap;

    bmp.clear();
    bmp.fontSize = GC.Param.defaultFontSize;

    var lines = String(text).split(/\r?\n/);
    var y = 0;

    for(var i=0;i<lines.length;i++){
        bmp.drawText(lines[i],0,y,Graphics.width,48,'center');
        y += 48;
    }

    this.setChangelogLoaded(y + 64);
};

GC.clearTextCache = function(){
    GC.Cache = {};
};

console.log('GaR_Changelog_04_TextLoader loaded');
})();

//====================================================
// SOURCE: GaR_Changelog_05_Parser.js
//====================================================

//=============================================================================
// GaR_Changelog_05_Parser
// Module 05 - Changelog Formatting Parser
// Requires: 01_Header, 02_Core, 03_Scene, 04_TextLoader
//=============================================================================
(function(){
'use strict';

var GC = window.GaR_Changelog;

GC.Parser = GC.Parser || {};

GC.Parser.Colours = {
    white:'#FFFFFF',
    black:'#000000',
    red:'#FF4444',
    green:'#44FF44',
    blue:'#4488FF',
    yellow:'#FFFF44',
    silver:'#C0C0C0',
    gold:'#FFD700'
};

GC.Parser.defaultStyle = function(){
    return {
        align:'center',
        size:GC.Param.defaultFontSize,
        color:GC.Param.defaultTextColour,
        bold:false,
        italic:false,
        imageScale:GC.Param.defaultImageScale,
        imageAlign:'center'
    };
};

Scene_GaRChangelog.prototype.parseChangelogText = function(text){

    var style = GC.Parser.defaultStyle();
    var result = [];
    var lines = String(text || '').split(/\r?\n/);

    for(var i=0;i<lines.length;i++){

        var line = lines[i].trim();
        var m;

        if(line.length === 0){
            result.push({type:'space', amount:style.size});
            continue;
        }

        if(line === '[left]'){ style.align='left'; continue; }
        if(line === '[center]'){ style.align='center'; continue; }
        if(line === '[right]'){ style.align='right'; continue; }

        m = line.match(/^\[size=(\d+)\]$/i);
        if(m){ style.size = Number(m[1]); continue; }

        m = line.match(/^\[color=(.*?)\]$/i);
        if(m){ style.color = m[1]; continue; }

        if(line === '[bold]'){ style.bold=true; continue; }
        if(line === '[/bold]'){ style.bold=false; continue; }

        if(line === '[italic]'){ style.italic=true; continue; }
        if(line === '[/italic]'){ style.italic=false; continue; }

        m = line.match(/^\[space=(\d+)\]$/i);
        if(m){
            result.push({type:'space', amount:Number(m[1])});
            continue;
        }

        if(line === '[rule]'){
            result.push({type:'rule'});
            continue;
        }

        m = line.match(/^\[scale=(\d+)\]$/i);
        if(m){ style.imageScale = Number(m[1]); continue; }

        m = line.match(/^\[imagealign=(left|center|right)\]$/i);
        if(m){ style.imageAlign = m[1]; continue; }

        m = line.match(/^\[image=(.*?)\]$/i);
        if(m){
            result.push({
                type:'image',
                image:m[1],
                style:JSON.parse(JSON.stringify(style))
            });
            continue;
        }

        var colourKey = line.replace('[','').replace(']','').toLowerCase();
        if(GC.Parser.Colours[colourKey]){
            style.color = GC.Parser.Colours[colourKey];
            continue;
        }

        result.push({
            type:'text',
            text:line,
            style:JSON.parse(JSON.stringify(style))
        });
    }

    this._parsedChangelog = result;
console.log(result);
    if(this.renderChangelog){
        this.renderChangelog();
    }
};

console.log('GaR_Changelog_05_Parser loaded');
})();

//====================================================
// SOURCE: GaR_Changelog_06_Renderer.js
//====================================================

//=============================================================================
// GaR_Changelog_06_Renderer
// Module 06 - Changelog Renderer
// Requires: 01_Header, 02_Core, 03_Scene, 04_TextLoader, 05_Parser
//=============================================================================
(function(){
'use strict';

var GC = window.GaR_Changelog;

Scene_GaRChangelog.prototype.clearRenderedImages = function(){
    this._creditImages = this._creditImages || [];
    while(this._creditImages.length){
        var s = this._creditImages.pop();
        if(s && s.parent){ s.parent.removeChild(s); }
    }
};
Bitmap.prototype._makeFontNameText =
    (function(original){

        return function(){

            var italic =
                this._fontItalic ?
                'Italic ' :
                '';

            return (
                italic +
                original.call(this)
            );

        };

    })(Bitmap.prototype._makeFontNameText);
Scene_GaRChangelog.prototype.renderImageEntry = function(entry, y){

    var sprite = new Sprite(
        ImageManager.loadPicture(entry.image)
    );

    var scale =
        (entry.style.imageScale || 100) / 100;

    sprite.scale.x = scale;
    sprite.scale.y = scale;

    sprite.y = y;

    switch(entry.style.imageAlign){

        case 'left':

            sprite.anchor.x = 0;
            sprite.x = 20;
            break;

        case 'right':

            sprite.anchor.x = 1;
            sprite.x = Graphics.width - 20;
            break;

        default:

            sprite.anchor.x = 0.5;
            sprite.x = Graphics.width / 2;
            break;
    }

    this._contentContainer.addChild(
        sprite
    );

    this._creditImages.push(
        sprite
    );

    return 500 * scale;
};

Scene_GaRChangelog.prototype.renderChangelog = function(){
console.log("renderChangelog called");
    this.clearRenderedImages();

    var bmp = this._ChangelogBitmap;
    bmp.clear();

    var data = this._parsedChangelog || [];
    var y = 0;

    for(var i=0;i<data.length;i++){

        var entry = data[i];

        if(entry.type === 'space'){
            y += entry.amount;
            continue;
        }

        if(entry.type === 'rule'){
            bmp.fillRect(100, y + 10, Graphics.width - 200, 2, '#FFFFFF');
            y += 30;
            continue;
        }

        if(entry.type === 'image'){
            y += this.renderImageEntry(entry, y);
            continue;
        }

if(entry.type === 'text'){

bmp.fontSize = entry.style.size;
bmp._fontItalic =
    entry.style.italic;
bmp.textColor = entry.style.color;

bmp._context.save();

var fontStyle = "";

if (entry.style.italic) {
    fontStyle += "italic ";
}

if (entry.style.bold) {
    fontStyle += "bold ";
}

bmp._context.font =
    fontStyle +
    bmp.fontSize +
    "px GameFont";

    var lineHeight = entry.style.size + 12;

    // Apply italic formatting
    if(entry.style.italic){
        bmp._context.save();
        bmp._context.font =
            "italic " +
            bmp.fontSize +
            "px GameFont";
    }

    // Simple bold effect
if(entry.style.bold){
console.log(
    entry.text,
    "italic =",
    entry.style.italic
);
    bmp.drawText(
        entry.text,
        1,
        y,
        Graphics.width,
        lineHeight,
        entry.style.align
    );
	bmp._context.restore();

    bmp.drawText(
        entry.text,
        2,
        y,
        Graphics.width,
        lineHeight,
        entry.style.align
    );bmp._fontItalic = false;
}

    bmp.drawText(
        entry.text,
        0,
        y,
        Graphics.width,
        lineHeight,
        entry.style.align
    );

    if(entry.style.italic){
        bmp._context.restore();
    }

    y += lineHeight;
}
    }

    this.setChangelogLoaded(y + 100);
};

console.log('GaR_Changelog_06_Renderer loaded');
})();

//====================================================
// SOURCE: GaR_Changelog_07_Backgrounds.js
//====================================================

//=============================================================================
// GaR_Changelog_07_Backgrounds
// Module 07 - Background Playlist System
// Requires: 01_Header, 02_Core, 03_Scene
//=============================================================================
(function(){
'use strict';

var GC = window.GaR_Changelog;

Scene_GaRChangelog.prototype.initializeBackgroundPlaylist = function(){

    this._bgTick = 0;
    this._bgIndex = 0;

    this._bgList = (GC.Param.backgroundImages || []).slice();

    if(GC.Param.backgroundRandom){
        this.shuffleBackgrounds(this._bgList);
    }

    if(this._bgList.length <= 0){
        return;
    }

    this.showBackground(0);
};

Scene_GaRChangelog.prototype.shuffleBackgrounds = function(list){

    for(var i=list.length-1;i>0;i--){
        var j=Math.floor(Math.random()*(i+1));
        var t=list[i];
        list[i]=list[j];
        list[j]=t;
    }

    return list;
};
Scene_GaRChangelog.prototype.fitBackgroundSprite =
function(sprite, bitmap){

    if (!bitmap) {
        return;
    }

    var scaleX =
        Graphics.width / bitmap.width;

    var scaleY =
        Graphics.height / bitmap.height;

    // Show entire image
    var scale =
        Math.min(scaleX, scaleY);

    sprite.scale.x = scale;
    sprite.scale.y = scale;

    sprite.x =
        (Graphics.width -
            bitmap.width * scale) / 2;

    sprite.y =
        (Graphics.height -
            bitmap.height * scale) / 2;
};
Scene_GaRChangelog.prototype.showBackground = function(index){

    var data = this._bgList[index];

    if(!data || !data.Image){
        return;
    }

    var bitmap =
    ImageManager.loadPicture(
        data.Image
    );

this._bgSpriteA.bitmap =
    bitmap;

bitmap.addLoadListener(function(){

    this.fitBackgroundSprite(
        this._bgSpriteA,
        bitmap
    );

}.bind(this));
};

Scene_GaRChangelog.prototype.updateBackgroundPlaylist = function(){

    if(!this._bgList || this._bgList.length <= 1){
        return;
    }

    this._bgTick++;

    if(this._bgTick < GC.Param.backgroundFrameDuration){
        return;
    }

    this._bgTick = 0;

    this._bgIndex++;

    if(this._bgIndex >= this._bgList.length){

        this._bgIndex = 0;

        if(GC.Param.backgroundRandom){
            this.shuffleBackgrounds(this._bgList);
        }
    }

    if(this.startBackgroundTransition){
        this.startBackgroundTransition(this._bgIndex);
    } else {
        this.showBackground(this._bgIndex);
    }
};

console.log('GaR_Changelog_07_Backgrounds loaded');
})();

//====================================================
// SOURCE: GaR_Changelog_08_Transitions.js
//====================================================

//=============================================================================
// GaR_Changelog_08_Transitions
// Module 08 - Background Transitions
// Requires: 01-07
//=============================================================================
(function(){
'use strict';

var GC = window.GaR_Changelog;

Scene_GaRChangelog.prototype.startBackgroundTransition = function(index){

    var data = this._bgList[index];
    if(!data || !data.Image){ return; }

    var bitmap =
    ImageManager.loadPicture(
        data.Image
    );

this._bgSpriteB.bitmap =
    bitmap;

bitmap.addLoadListener(function(){

    this.fitBackgroundSprite(
        this._bgSpriteB,
        bitmap
    );

}.bind(this));

this._bgSpriteB.opacity = 0;
this._transitionTick = 0;
this._transitionActive = true;
};


Scene_GaRChangelog.prototype.updateBackgroundTransition = function(){

    if(!this._transitionActive){ return; }

    this._transitionTick++;

    var duration = Math.max(1, GC.Param.backgroundTransitionDuration);
    var ratio = this._transitionTick / duration;
    if(ratio > 1){ ratio = 1; }

    var mode = GC.Param.backgroundTransition;

    if(mode === 'Fade' || mode === 'Crossfade'){
        this._bgSpriteB.opacity = Math.floor(ratio * 255);
        this._bgSpriteA.opacity = Math.floor((1-ratio) * 255);
    }
    else if(mode === 'Slide Left'){
        this._bgSpriteB.x = Graphics.width * (1-ratio);
        this._bgSpriteA.x = -Graphics.width * ratio;
        this._bgSpriteB.opacity = 255;
    }
    else if(mode === 'Slide Right'){
        this._bgSpriteB.x = -Graphics.width * (1-ratio);
        this._bgSpriteA.x = Graphics.width * ratio;
        this._bgSpriteB.opacity = 255;
    }
    else if(mode === 'Slide Up'){
        this._bgSpriteB.y = Graphics.height * (1-ratio);
        this._bgSpriteA.y = -Graphics.height * ratio;
        this._bgSpriteB.opacity = 255;
    }
    else if(mode === 'Slide Down'){
        this._bgSpriteB.y = -Graphics.height * (1-ratio);
        this._bgSpriteA.y = Graphics.height * ratio;
        this._bgSpriteB.opacity = 255;
    }

    if(this._transitionTick >= duration){
        this.finishBackgroundTransition();
    }
};

Scene_GaRChangelog.prototype.finishBackgroundTransition =
function(){

    this._bgSpriteA.bitmap =
        this._bgSpriteB.bitmap;

    this._bgSpriteA.scale.x =
        this._bgSpriteB.scale.x;

    this._bgSpriteA.scale.y =
        this._bgSpriteB.scale.y;

    this._bgSpriteA.x =
        this._bgSpriteB.x;

    this._bgSpriteA.y =
        this._bgSpriteB.y;

    this._bgSpriteA.opacity = 255;

    this._bgSpriteB.opacity = 0;

    this._transitionActive = false;
};

console.log('GaR_Changelog_08_Transitions loaded');
})();

//====================================================
// SOURCE: GaR_Changelog_09_Audio.js
//====================================================

//=============================================================================
// GaR_Changelog_09_Audio
// Module 09 - Music Playlist System
// Requires: 01-08
//=============================================================================
(function(){
'use strict';

var GC = window.GaR_Changelog;

Scene_GaRChangelog.prototype.startChangelogMusic = function(){

    this._musicIndex = 0;
    this._musicPlaylist = (GC.Param.musicPlaylist || []).slice();

    if(this._musicPlaylist.length <= 0){
        return;
    }

    if(GC.Param.musicRandom){
        for(var i=this._musicPlaylist.length-1;i>0;i--){
            var j=Math.floor(Math.random()*(i+1));
            var t=this._musicPlaylist[i];
            this._musicPlaylist[i]=this._musicPlaylist[j];
            this._musicPlaylist[j]=t;
        }
    }

    this.playMusicIndex(0);
};

Scene_GaRChangelog.prototype.playMusicIndex = function(index){

    var item = this._musicPlaylist[index];
    if(!item || !item.BGM){ return; }

    AudioManager.playBgm({
        name:item.BGM,
        volume:GC.Param.musicVolume,
        pitch:GC.Param.musicPitch,
        pan:GC.Param.musicPan
    });
};



console.log('GaR_Changelog_09_Audio loaded');
})();

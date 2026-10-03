/*:
 * @target MZ
 * @plugindesc Full-map screenshot on hotkey (test play only). Saves to img/pic. v1.0.0
 * @author BitQuest Studio
 *
 * @param Hotkey
 * @text Hotkey (Keyboard code)
 * @type string
 * @default Tab
 * @desc DOM KeyboardEvent.code to trigger capture. Default: Tab
 *
 * @param SaveDirectory
 * @text Save Directory
 * @type string
 * @default img/pictures
 * @desc Relative directory to save screenshots. Default: img/pictures
 *
 * @help MapScreenshot.js
 * - Press the configured hotkey (default: Tab) during TEST PLAY to save a full
 *   map screenshot to the configured folder (default: img/pictures).
 * - This plugin only works in test (Utils.isOptionValid('test')) and NW.js.
 * - No plugin commands.
 */

(() => {
  'use strict';

  const pluginName = 'MapScreenshot';
  const P = PluginManager.parameters(pluginName);
  const HOTKEY_CODE = String(P['Hotkey'] || 'Tab');
  const SAVE_DIR = String(P['SaveDirectory'] || 'img/pictures');

  const isTest = Utils.isNwjs() && Utils.isOptionValid('test');
  if (!isTest) {
    return;
  }

  const fs = require('fs');
  const path = require('path');
  


   // Ensure Tab is mapped in Input when using the default hotkey
   if (!Input.keyMapper[9]) Input.keyMapper[9] = 'tab';
 
  let requestCapture = false;

  // Listen for the desired DOM KeyboardEvent.code (e.g., "Tab")
  window.addEventListener('keydown', (ev) => {
     if (ev.code === HOTKEY_CODE && !ev.repeat) {
      ev.preventDefault();
      requestCapture = true;
    }
  });

  function ensureDirSync(dirPath) {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }

  function timestampString() {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const y = d.getFullYear();
    const m = pad(d.getMonth() + 1);
    const da = pad(d.getDate());
    const h = pad(d.getHours());
    const mi = pad(d.getMinutes());
    const s = pad(d.getSeconds());
    return `${y}${m}${da}_${h}${mi}${s}`;
  }

  function saveCanvasToFile(canvas, dir, fileName) {
    ensureDirSync(dir);
    const base64 = canvas.toDataURL('image/png').replace(/^data:image\/png;base64,/, '');
    const buffer = Buffer.from(base64, 'base64');
    const full = path.join(dir, fileName);
    fs.writeFileSync(full, buffer);
  }

  function takeFullMapScreenshot() {
    const scene = SceneManager._scene;
    if (!(scene instanceof Scene_Map)) {
      return;
    }

    const hiddenElements = [];
    for (const child of scene.children) {
      if (child === scene._spriteset) continue;
      if (child instanceof Window_Base || child.constructor.name.includes('Window')) {
        if (child.visible) {
          hiddenElements.push(child);
          child.visible = false;
        }
      }
    }
    
    const hiddenSpritesetChildren = [];
    if (scene._spriteset) {
      // Recursively hide any VariableBars HUD layers/sprites (robust against structure changes)
      const hideVBRecursive = (node) => {
        if (!node) return;
        const ctor = node.constructor && node.constructor.name ? String(node.constructor.name) : '';
        const isVB = ctor.includes('VB_') || ctor.includes('VariableBar') || node === scene._spriteset._vbBarLayer;
        if (isVB && node.visible) {
          hiddenSpritesetChildren.push(node);
          node.visible = false;
        }
        const children = node.children;
        if (children && children.length) {
          for (let i = 0; i < children.length; i++) {
            hideVBRecursive(children[i]);
          }
        }
      };
      hideVBRecursive(scene._spriteset);
    }

    const tw = $gameMap.tileWidth();
    const th = $gameMap.tileHeight();
    const mapW = $gameMap.width();
    const mapH = $gameMap.height();
    const mapPxW = mapW * tw;
    const mapPxH = mapH * th;

    const vpW = Graphics.width;
    const vpH = Graphics.height;
    const vpTilesW = vpW / tw;
    const vpTilesH = vpH / th;

    const cols = Math.max(1, Math.ceil(mapW / vpTilesW));
    const rows = Math.max(1, Math.ceil(mapH / vpTilesH));



    const finalCanvas = document.createElement('canvas');
    finalCanvas.width = mapPxW;
    finalCanvas.height = mapPxH;
    const ctx = finalCanvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;

    const origX = $gameMap._displayX;
    const origY = $gameMap._displayY;

    const app = Graphics.app;
    const view = app.view;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        // Ensure VB layers remain hidden even if rebuilt during scene updates
        if (scene._spriteset) {
          const hideVBRecursiveLoop = (node) => {
            if (!node) return;
            const ctor = node.constructor && node.constructor.name ? String(node.constructor.name) : '';
            const isVB = ctor.includes('VB_') || ctor.includes('VariableBar') || node === scene._spriteset._vbBarLayer;
            if (isVB && node.visible) {
              hiddenSpritesetChildren.push(node);
              node.visible = false;
            }
            const children = node.children;
            if (children && children.length) {
              for (let i = 0; i < children.length; i++) {
                hideVBRecursiveLoop(children[i]);
              }
            }
          };
          hideVBRecursiveLoop(scene._spriteset);
        }

        const camTileX = c * vpTilesW;
        const camTileXClamped = Math.min(mapW - vpTilesW, camTileX);
        const camTileY = r * vpTilesH;
        const camTileYClamped = Math.min(mapH - vpTilesH, camTileY);
        
        $gameMap.setDisplayPos(camTileXClamped, camTileYClamped);
        // Let the scene render logic update internal positions, then force-hide any VB layers again
        SceneManager.updateScene();
        if (scene._spriteset) {
          const rehideVB = (node) => {
            if (!node) return;
            const ctor = node.constructor && node.constructor.name ? String(node.constructor.name) : '';
            const isVB = ctor.includes('VB_') || ctor.includes('VariableBar') || node === scene._spriteset._vbBarLayer;
            if (isVB && node.visible) {
              hiddenSpritesetChildren.push(node);
              node.visible = false;
            }
            const children = node.children;
            if (children && children.length) {
              for (let i = 0; i < children.length; i++) rehideVB(children[i]);
            }
          };
          rehideVB(scene._spriteset);
        }
        app.render();

        const canvasX = c * vpW;
        const canvasY = r * vpH;
        
        const cropW = Math.min(vpW, mapPxW - canvasX);
        const cropH = Math.min(vpH, mapPxH - canvasY);
        // For the last col/row, grab the right/bottom part of the viewport so edges align
        const srcX = (c === cols - 1) ? (vpW - cropW) : 0;
        const srcY = (r === rows - 1) ? (vpH - cropH) : 0;
        
        ctx.drawImage(view, srcX, srcY, cropW, cropH, canvasX, canvasY, cropW, cropH);
      }
    }

    $gameMap.setDisplayPos(origX, origY);
    
    for (const elem of hiddenElements) {
      elem.visible = true;
    }
    
    for (const elem of hiddenSpritesetChildren) {
      elem.visible = true;
    }
    
    SceneManager.updateScene();

    const mapId = $gameMap.mapId();
    const fileName = `Map${String(mapId).padStart(3, '0')}_${timestampString()}.png`;
    saveCanvasToFile(finalCanvas, SAVE_DIR, fileName);
  }

  const _Scene_Map_update = Scene_Map.prototype.update;
  Scene_Map.prototype.update = function() {
    _Scene_Map_update.call(this);
    if (HOTKEY_CODE === 'Tab' && Input.isTriggered('tab')) {
      requestCapture = true;
    }
    if (requestCapture) {
      requestCapture = false;
      setTimeout(() => {
        try {
          takeFullMapScreenshot();
        } catch (e) {
          console.error('[MapScreenshot] Error:', e);
        }
      }, 100);
    }
  };
})();



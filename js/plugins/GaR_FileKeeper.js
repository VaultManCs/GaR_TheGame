/*:
 * @target MZ
 * @plugindesc GaR_FileKeeper v2.0 Asset scanner, manifest generator, missing/duplicate reports.
 * @author GaR
 *
 * @command RebuildManifest
 * @text Rebuild Manifest
 *
 * @help
 * Playtest only: scans js/plugins and data folders, generates:
 * data/GaR_FileKeeper.json
 * reports/GaR_FileKeeper_Report.txt
 */
(() => {
'use strict';
const fs = (Utils.isNwjs() ? require('fs') : null);
const path = (Utils.isNwjs() ? require('path') : null);
const FK = {};
window.GaR = window.GaR || {};
window.GaR.FileKeeper = FK;
FK.assets = new Set();
FK.dupes = new Map();
FK.exts = ['png','webp','jpg','jpeg','ogg','m4a','mp4','webm','ttf','otf','woff','woff2','json'];
FK.register = function(f){ if(!f) return; f=f.replace(/\\/g,'/'); this.assets.add(f); this.dupes.set(f,(this.dupes.get(f)||0)+1); };
FK.extract = function(text){ const re=/[A-Za-z0-9_./\-]+\.(png|webp|jpg|jpeg|ogg|m4a|mp4|webm|ttf|otf|woff2?|json)/gi; let m; while((m=re.exec(text))){ this.register(m[0]); } };
FK.scanFile=function(file){ try{ this.extract(fs.readFileSync(file,'utf8')); }catch(e){} };
FK.scanDir=function(dir){ if(!fs.existsSync(dir)) return; for(const e of fs.readdirSync(dir)){ const f=path.join(dir,e); const s=fs.statSync(f); if(s.isDirectory()) this.scanDir(f); else if(/\.(js|json)$/i.test(f)) this.scanFile(f); } };
FK.report=function(){ const miss=[]; const dup=[]; for(const a of this.assets){ if(!fs.existsSync(a)) miss.push(a); } for(const [k,v] of this.dupes){ if(v>1) dup.push(`${v}x ${k}`); }
 if(!fs.existsSync('reports')) fs.mkdirSync('reports',{recursive:true});
 fs.writeFileSync('data/GaR_FileKeeper.json',JSON.stringify({files:[...this.assets].sort()},null,2));
 fs.writeFileSync('reports/GaR_FileKeeper_Report.txt',`Assets: ${this.assets.size}\n\nMissing:\n${miss.join('\n')}\n\nDuplicates:\n${dup.join('\n')}`);
 };
 FK.rebuild=function(){ if(!Utils.isNwjs()) return; this.scanDir('js/plugins'); this.scanDir('data'); this.report(); console.log('GaR_FileKeeper rebuilt'); };
 if(Utils.isOptionValid('test')) { const _start=Scene_Boot.prototype.start; Scene_Boot.prototype.start=function(){ FK.rebuild(); _start.call(this); }; }
 PluginManager.registerCommand('GaR_FileKeeper','RebuildManifest',()=>FK.rebuild());
})();

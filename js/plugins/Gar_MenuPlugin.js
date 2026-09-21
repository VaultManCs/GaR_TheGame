/*:
 * @plugindesc v3.1 Gar Menu Plugin - Full Menu Editor for RPG Maker MV
 * @author Gar
 *
 * @param Show Item
 * @type boolean
 * @default true
 * @param Show Skill
 * @type boolean
 * @default true
 * @param Show Equip
 * @type boolean
 * @default true
 * @param Show Status
 * @type boolean
 * @default true
 * @param Show Formation
 * @type boolean
 * @default true
 * @param Show Options
 * @type boolean
 * @default true
 * @param Show Save
 * @type boolean
 * @default true
 * @param Show Game End
 * @type boolean
 * @default true
 *
 * @param Item Text
 * @default Inventory
 * @param Skill Text
 * @default Skills
 * @param Equip Text
 * @default Equipment
 * @param Status Text
 * @default Status
 * @param Formation Text
 * @default Formation
 * @param Options Text
 * @default Options
 * @param Save Text
 * @default Save
 * @param Game End Text
 * @default Quit
 *
 * @param Show Category Item
 * @type boolean
 * @default true
 * @param Show Category Weapon
 * @type boolean
 * @default true
 * @param Show Category Armor
 * @type boolean
 * @default true
 * @param Show Category Key Item
 * @type boolean
 * @default true
 *
 * @param Category Item Text
 * @default Items
 * @param Category Weapon Text
 * @default Weapons
 * @param Category Armor Text
 * @default Armour
 * @param Category Key Item Text
 * @default Quest Items
 *
 * @param Skip Category Window
 * @type boolean
 * @default false
 * @param Merge Categories
 * @type boolean
 * @default false
 *
 * @param Empty Merged Text
 * @default Your inventory is empty.
 * @param Empty Item Text
 * @default No items available.
 * @param Empty Weapon Text
 * @default No weapons available.
 * @param Empty Armor Text
 * @default No armour available.
 * @param Empty Key Item Text
 * @default No quest items available.
 *
 * @help
 * Runtime commands:
 * GarMenu Show Item
 * GarMenu Hide Item
 * GarMenu Enable Item
 * GarMenu Disable Item
 * GarMenu Rename Item Inventory
 * GarMenu ShowCategory Weapon
 * GarMenu HideCategory Weapon
 * GarMenu RenameCategory KeyItem Quest Items
 * GarMenu SkipCategories
 * GarMenu UseCategories
 * GarMenu MergeCategories
 * GarMenu SeparateCategories
 */
(function(){
'use strict';
var P=PluginManager.parameters('Gar_MenuPlugin');
function B(n,d){return String(P[n]||d)==='true';}
function S(n,d){return String(P[n]||d);}
function initGarMenu(){
 return {
 nodes:{
 item:{visible:B('Show Item',true),enabled:true,text:S('Item Text','Inventory')},
 skill:{visible:B('Show Skill',true),enabled:true,text:S('Skill Text','Skills')},
 equip:{visible:B('Show Equip',true),enabled:true,text:S('Equip Text','Equipment')},
 status:{visible:B('Show Status',true),enabled:true,text:S('Status Text','Status')},
 formation:{visible:B('Show Formation',true),enabled:true,text:S('Formation Text','Formation')},
 options:{visible:B('Show Options',true),enabled:true,text:S('Options Text','Options')},
 save:{visible:B('Show Save',true),enabled:true,text:S('Save Text','Save')},
 gameEnd:{visible:B('Show Game End',true),enabled:true,text:S('Game End Text','Quit')}
 },
 cats:{
 item:{visible:B('Show Category Item',true),text:S('Category Item Text','Items')},
 weapon:{visible:B('Show Category Weapon',true),text:S('Category Weapon Text','Weapons')},
 armor:{visible:B('Show Category Armor',true),text:S('Category Armor Text','Armour')},
 keyItem:{visible:B('Show Category Key Item',true),text:S('Category Key Item Text','Quest Items')}
 },
 skip:B('Skip Category Window',false),
 merge:B('Merge Categories',false)
 };
}
var _GS=Game_System.prototype.initialize;
Game_System.prototype.initialize=function(){_GS.call(this);this._garMenu=initGarMenu();};
function GM(){if(!$gameSystem._garMenu)$gameSystem._garMenu=initGarMenu();return $gameSystem._garMenu;}
var _PC=Game_Interpreter.prototype.pluginCommand;
Game_Interpreter.prototype.pluginCommand=function(cmd,args){_PC.call(this,cmd,args);if(cmd!=='GarMenu')return;var g=GM();var k=(args[1]||'').toLowerCase();switch(args[0]){case'Show':if(g.nodes[k])g.nodes[k].visible=true;break;case'Hide':if(g.nodes[k])g.nodes[k].visible=false;break;case'Enable':if(g.nodes[k])g.nodes[k].enabled=true;break;case'Disable':if(g.nodes[k])g.nodes[k].enabled=false;break;case'Rename':if(g.nodes[k])g.nodes[k].text=args.slice(2).join(' ');break;case'ShowCategory':if(g.cats[k])g.cats[k].visible=true;break;case'HideCategory':if(g.cats[k])g.cats[k].visible=false;break;case'RenameCategory':if(g.cats[k])g.cats[k].text=args.slice(2).join(' ');break;case'SkipCategories':g.skip=true;break;case'UseCategories':g.skip=false;break;case'MergeCategories':g.merge=true;break;case'SeparateCategories':g.merge=false;break;}};
Window_MenuCommand.prototype.addMainCommands=function(){var n=GM().nodes,e=this.areMainCommandsEnabled();['item','skill','equip','status'].forEach(function(k){if(n[k].visible)this.addCommand(n[k].text,k,e&&n[k].enabled);},this);};
Window_MenuCommand.prototype.addFormationCommand=function(){var n=GM().nodes.formation;if(n.visible)this.addCommand(n.text,'formation',n.enabled&&this.isFormationEnabled());};
Window_MenuCommand.prototype.addOptionsCommand=function(){var n=GM().nodes.options;if(n.visible)this.addCommand(n.text,'options',n.enabled);};
Window_MenuCommand.prototype.addSaveCommand=function(){var n=GM().nodes.save;if(n.visible)this.addCommand(n.text,'save',n.enabled&&this.isSaveEnabled());};
Window_MenuCommand.prototype.addGameEndCommand=function(){var n=GM().nodes.gameEnd;if(n.visible)this.addCommand(n.text,'gameEnd',n.enabled);};
Window_ItemCategory.prototype.makeCommandList=function(){var c=GM().cats;if(c.item.visible)this.addCommand(c.item.text,'item');if(c.weapon.visible)this.addCommand(c.weapon.text,'weapon');if(c.armor.visible)this.addCommand(c.armor.text,'armor');if(c.keyItem.visible)this.addCommand(c.keyItem.text,'keyItem');};
var _SI=Scene_Item.prototype.create;
Scene_Item.prototype.create=function(){_SI.call(this);if(GM().skip||GM().merge){this._categoryWindow.hide();this._categoryWindow.deactivate();this._itemWindow.setCategory('item');this._itemWindow.activate();this._itemWindow.setHandler('cancel',this.popScene.bind(this));}};
var _INC=Window_ItemList.prototype.includes;
Window_ItemList.prototype.includes=function(item){if(GM().merge)return item!==null;return _INC.call(this,item);};
var _DRAW=Window_ItemList.prototype.drawAllItems;
Window_ItemList.prototype.drawAllItems=function(){if(this.maxItems()===0){var txt='';if(GM().merge){txt=S('Empty Merged Text','Your inventory is empty.');}else{switch(this._category){case'weapon':txt=S('Empty Weapon Text','No weapons available.');break;case'armor':txt=S('Empty Armor Text','No armour available.');break;case'keyItem':txt=S('Empty Key Item Text','No quest items available.');break;default:txt=S('Empty Item Text','No items available.');}}this.drawText(txt,0,this.lineHeight()*2,this.contentsWidth(),'center');return;} _DRAW.call(this);};
})();
// ==UserScript==
// @name         Screeps Console Injector
// @namespace    https://screeps.com/
// @version      1.0
// @author       Adam Shumann, ags131
// @match        https://screeps.com/a/*
// @run-at       document-idle
// @grant        none
// @updateURL    https://github.com/ags131/screeps-console-helper/raw/master/src/consolehelper.screeps.user.js
// ==/UserScript==

function attachInterceptor() {
    let selectHistory = []
    let roomHistory = []
    if(!$('section.room').length) return setTimeout(attachInterceptor,100)
    let roomScope = angular.element($('section.room')).scope();
    let room = roomScope.Room;
    roomScope.$watch('Room.selectedObject',(n)=>{
     if(n && n._id){
         selectHistory.unshift(n._id)
         selectHistory = selectHistory.slice(0,5)
     }
    })
    roomScope.$watch('Room.roomName',(n)=>{
     if(n){
         roomHistory.unshift(n)
         roomHistory = roomHistory.slice(0,5)
     }
    })
    let oopen = XMLHttpRequest.prototype.open;
    let osend = XMLHttpRequest.prototype.send;
    XMLHttpRequest.prototype.open = function(method,url,async,user,password){
        this._method = method;
        this._url = url;
        return oopen.call(this,method,url,async,user,password);
    };
    XMLHttpRequest.prototype.send = function(data){
        //console.log(this._method,this._url)
        if(this._method == 'POST' && this._url.match(/user\/console/)){
           if(!roomHistory.length) roomHistory.push(room.roomName)
           if(!selectHistory.length && room.selectedObject) selectHistory.push(room.selectedObject._id)
           let d = JSON.parse(data);
           let orig = d.expression;
           let extra = ''
           for(let i=0;i<5;i++){
               let id = selectHistory[i] || ''
               extra += `let \$i${i} = '${id || ''}';\n`
               extra += `let \$${i} = \$i${i} && Game.getObjectById($i${i}) || null;\n`
               let name = roomHistory[i] || ''
               extra += `let \$rn${i} = '${name || ''}';\n`
               extra += `let \$r${i} = \$rn${i} && Game.rooms[$rn${i}] || null;\n`
           }
           d.expression = `{
${extra};
let $id = $i0;
let $roomName = $rn0;
let $room = $r0;
let $selected = $0;
${d.expression}
}`;
           console.log('INTERCEPTED',orig,d.expression);
           data = JSON.stringify(d);
        }
        return osend.call(this,data);
    };
}

$(function () {
    // push the load to the end of the event queue
    setTimeout(attachInterceptor);
});

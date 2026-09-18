// Online room adapter only: main.js and all local scenes remain untouched.
import {NetworkClient,EVENTS} from './net.js';
export function createRoomFlow({showSelection,setLocalMode,resetSelection,playConfirm,onGameAction}) {
  const net=new NetworkClient(globalThis.AXIE_NET||{});globalThis.axieNet=net;
  const room=document.getElementById('screen-room'),menu=document.getElementById('screen-menu');
  const input=document.getElementById('room-code'),status=document.getElementById('room-status');
  const create=document.getElementById('room-create'),join=document.getElementById('room-join');
  let busy=false,ready=false,notice;
  const message=text=>status.textContent=text;
  function enabled(value){create.disabled=join.disabled=!value;input.disabled=!value;}
  function cancel(){clearTimeout(notice);net.disconnect();busy=ready=false;enabled(true);message('Sin sala activa.');}
  function reveal(){for(const id of ['room-code-label','room-code','room-status','room-leave'])document.getElementById(id).hidden=false;input.maxLength=12;document.getElementById('room-description').textContent='Crea una sala y espera rival, o introduce su código para unirte. Servidor online en Render.';}
  const observer=new MutationObserver(records=>{if(!records.some(r=>r.target===room||r.target===menu))return;if(!room.classList.contains('hidden'))reveal();else if(!menu.classList.contains('hidden')&&(busy||net.room))cancel();});
  observer.observe(room,{attributes:true,attributeFilter:['class']});observer.observe(menu,{attributes:true,attributeFilter:['class']});
  const off=[net.on('status',message),net.on(EVENTS.ready,()=>{if(ready||!net.room||room.classList.contains('hidden'))return;ready=true;clearTimeout(notice);playConfirm();setLocalMode();resetSelection();showSelection();}),
    net.on(EVENTS.action,data=>{onGameAction?.(data);window.dispatchEvent(new CustomEvent('axie:game-action',{detail:data}));}),
    net.on(EVENTS.peerLeft,()=>{message('El rival salió. Crea otra sala.');net.leaveRoom();busy=ready=false;enabled(true);}),
    net.on('disconnect',()=>{clearTimeout(notice);message('Conexión perdida. Vuelve a crear o unirte.');busy=ready=false;enabled(true);})];
  document.getElementById('room-leave').addEventListener('click',e=>{e.stopImmediatePropagation();cancel();},{capture:true});
  window.addEventListener('pagehide',()=>{cancel();observer.disconnect();off.forEach(fn=>fn());},{once:true});
  return async role=>{
    if(busy||!['create','join'].includes(role))return;reveal();busy=true;ready=false;enabled(false);
    notice=setTimeout(()=>message('El servidor está tardando. Puede estar iniciándose; la espera tiene un límite y puedes salir de Sala.'),5000);
    try{const info=await(role==='create'?net.createRoom():net.joinRoom(input.value));clearTimeout(notice);if(!ready){input.value=info.roomId;message(`Sala ${info.roomId} · ${info.role} · Esperando rival…`);}}
    catch(error){clearTimeout(notice);busy=false;enabled(true);message(error.message);}
  };
}

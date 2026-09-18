export const SERVER_URL='https://axie-smash-server.onrender.com';
export const EVENTS=Object.freeze({create:'create-room',join:'join-room',action:'game-action',ready:'room-ready',leave:'leave-room',peerLeft:'room-peer-left'});
export class NetworkClient {
  constructor(options={}){this.options={url:SERVER_URL,path:'/socket.io',connectTimeout:60000,ackTimeout:12000,...options};this.listeners=new Map();this.room=null;this.epoch=0;this.seq=0;}
  on(event,fn){if(!this.listeners.has(event))this.listeners.set(event,new Set());this.listeners.get(event).add(fn);return()=>this.listeners.get(event)?.delete(fn);}
  publish(event,data){for(const fn of [...(this.listeners.get(event)||[])])fn(data);}
  async loadFactory(){if(this.options.ioFactory||globalThis.io)return this.options.ioFactory||globalThis.io;return new Promise((resolve,reject)=>{const script=document.createElement('script');script.src=this.options.clientScript||new URL(this.options.path.replace(/\/$/,'')+'/socket.io.js',this.options.url).href;const timer=setTimeout(()=>finish(Error('Render no respondió al cargar Socket.io. Puede estar iniciándose; vuelve a intentar.')),this.options.connectTimeout);const finish=error=>{clearTimeout(timer);script.onload=script.onerror=null;if(error){script.remove();reject(error);}else if(typeof globalThis.io==='function')resolve(globalThis.io);else reject(Error('Bundle Socket.io inválido'));};script.onload=()=>finish();script.onerror=()=>finish(Error('No se pudo cargar Socket.io. Comprueba servidor, conexión y HTTPS.'));document.head.append(script);});}
  async connect(){if(this.socket?.connected)return this;if(this.connecting)return this.connecting;const epoch=this.epoch;this.connecting=this.open(epoch).finally(()=>this.connecting=null);return this.connecting;}
  async open(epoch){
    this.publish('status','Conectando con Render… Puede tardar hasta 60 segundos.');const io=await this.loadFactory();if(epoch!==this.epoch)throw Error('Conexión cancelada');
    if(!this.socket){const s=this.socket=io(this.options.url,{path:this.options.path,autoConnect:false,reconnection:false,timeout:this.options.connectTimeout,auth:this.options.auth||{}});
      s.on(EVENTS.ready,data=>{this.pendingReady=data;if(data?.roomId===this.room?.roomId)this.publish(EVENTS.ready,data);});
      for(const event of [EVENTS.action,EVENTS.peerLeft])s.on(event,data=>{if(data?.roomId===this.room?.roomId)this.publish(event,data);});
      s.on('disconnect',reason=>{const active=!!this.room;this.room=null;this.pendingReady=null;if(active)this.publish('disconnect',reason);});
    }
    await new Promise((resolve,reject)=>{const s=this.socket;const cleanup=()=>{clearTimeout(timer);s.off('connect',ok);s.off('connect_error',fail);};const ok=()=>{cleanup();resolve();};const fail=e=>{cleanup();s.disconnect();reject(Error('No se pudo conectar a Render: '+e.message+'. Comprueba CORS y vuelve a intentar.'));};const timer=setTimeout(()=>fail(Error('Tiempo de conexión agotado; el servidor puede estar dormido')),this.options.connectTimeout);s.once('connect',ok);s.once('connect_error',fail);s.connect();});return this;
  }
  async request(event,data={}){await this.connect();if(!this.socket.connected)throw Error('Socket desconectado');this.publish('status','Esperando respuesta del servidor…');
    return new Promise((resolve,reject)=>{let settled=false;const done=(error,response)=>{if(settled)return;settled=true;clearTimeout(timer);this.socket.off('disconnect',lost);if(error)reject(error);else resolve(response);};const lost=()=>done(Error('Conexión perdida esperando '+event));const timer=setTimeout(()=>done(Error('Sin respuesta a '+event+'. El backend debe implementar este evento y devolver su callback ACK. Reintenta si Render está iniciándose.')),this.options.ackTimeout);this.socket.on('disconnect',lost);
      this.socket.emit(event,data,response=>{if(!response?.ok)return done(Error(response?.error||'Respuesta ACK inválida para '+event));done(null,response);});
    });
  }
  async enter(event,data){if(this.room||this.entering)throw Error('Ya existe una solicitud de sala activa');this.entering=true;const epoch=this.epoch;try{const reply=await this.request(event,data);if(epoch!==this.epoch)throw Error('Solicitud cancelada');if(!/^[A-Z0-9]{6,12}$/.test(reply.roomId)||reply.role!==(event===EVENTS.create?'P1':'P2'))throw Error('Código o rol inválido recibido del servidor');this.room={roomId:reply.roomId,role:reply.role};this.seq=0;if(this.pendingReady?.roomId===reply.roomId)queueMicrotask(()=>{if(this.room)this.publish(EVENTS.ready,this.pendingReady);});return {...this.room};}catch(error){this.socket?.disconnect();throw error;}finally{this.entering=false;}}
  createRoom(){return this.enter(EVENTS.create,{});}
  joinRoom(code){const roomId=String(code||'').trim().toUpperCase();if(!/^[A-Z0-9]{6,12}$/.test(roomId))return Promise.reject(Error('Introduce un código alfanumérico de 6 a 12 caracteres'));return this.enter(EVENTS.join,{roomId});}
  sendGameAction(data){if(!this.socket?.connected||!this.room)return false;this.socket.emit(EVENTS.action,{...data,roomId:this.room.roomId,seq:++this.seq});return true;}
  selectCharacter(character,ready=false){if(!this.room)return Promise.reject(Error('No estás en una sala'));return this.request(EVENTS.action,{roomId:this.room.roomId,seq:++this.seq,type:'selection',character,ready});}
  leaveRoom(){if(this.socket?.connected&&this.room)this.socket.emit(EVENTS.leave,{roomId:this.room.roomId});this.room=null;this.pendingReady=null;}
  disconnect(){this.epoch++;this.leaveRoom();this.socket?.disconnect();}
}

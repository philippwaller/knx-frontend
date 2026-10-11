/*! For license information please see 39377.b4c9882de40aab5b.js.LICENSE.txt */
export const __rspack_esm_id=39377;export const __rspack_esm_ids=[39377];export const __webpack_modules__={46345(t,e,a){var o=a(94167);a.d(e,{},{l:async(t,e)=>{if(navigator.clipboard)try{return void await navigator.clipboard.writeText(t)}catch{}const a=e||(0,o.n)()?.getRootNode()||document.body,i=a.nodeType===Node.DOCUMENT_NODE?document.body:a,n=document.createElement("textarea");n.value=t,n.setAttribute("readonly",""),n.style.position="fixed",n.style.top="0",n.style.left="0",n.style.opacity="0",i.appendChild(n),n.select(),document.execCommand("copy"),i.removeChild(n)}})},58361(t,e,a){a.a(t,async function(t,e){try{var o=a(15151),i=a(95744),n=a(72283),s=a(3037),r=a(36565),l=a(40455),c=a(14694),h=a(37914),d=a(40043),p=a(14731),x=a(67052),y=t([d,p]);[d,p]=y.then?(await y)():y;class g extends i.WF{render(){const t=(0,c.H)(this.backPath);return i.html` <div class="toolbar ${(0,s.H)({narrow:this.narrow})}"> <div class="toolbar-content"> ${this.mainPage||!t&&(0,l.GL)()?.root?i.html`<ha-menu-button></ha-menu-button>`:i.html` <ha-icon-button-arrow-prev .href=${t} @click=${this._backTapped}></ha-icon-button-arrow-prev> `} <div class="main-title"> <slot name="header">${this.header}</slot> </div> <slot name="toolbar-icon"></slot> </div> </div> <div class=${(0,s.H)({content:!0,"ha-scrollbar":this.scrollable,"not-scrollable":!this.scrollable})} @scroll=${this._saveScrollPos}> <slot></slot> </div> <div id="fab"> <slot name="fab"></slot> </div> `}_saveScrollPos(t){this._savedScrollPos=t.target.scrollTop}_backTapped(t){(0,h.E)(t,this.backPath,this.backCallback)}static get styles(){return[x.dp,i.AH`:host{background-color:var(--primary-background-color);height:100%;display:block;position:relative;overflow:hidden}:host([narrow]){width:100%;position:fixed}.toolbar{background-color:var(--app-header-background-color);padding-top:var(--safe-area-inset-top);padding-right:var(--safe-area-inset-right)}:host([narrow]) .toolbar{padding-left:var(--safe-area-inset-left)}.toolbar-content{font-size:var(--ha-font-size-xl);height:var(--header-height);font-weight:var(--ha-font-weight-normal);color:var(--app-header-text-color,white);border-bottom:var(--app-header-border-bottom,none);box-sizing:border-box;align-items:center;padding:8px 12px;display:flex}.toolbar a{color:var(--sidebar-text-color);text-decoration:none}ha-menu-button,ha-icon-button-arrow-prev,::slotted([slot=toolbar-icon]){pointer-events:auto;color:var(--sidebar-icon-color);align-items:center;display:flex}.main-title{line-height:var(--ha-line-height-normal);overflow-wrap:break-word;-webkit-line-clamp:2;text-overflow:ellipsis;-webkit-box-orient:vertical;flex-grow:1;min-width:0;margin-inline-start:var(--ha-space-6);display:-webkit-box;overflow:hidden}.narrow .main-title{margin-inline-start:var(--ha-space-2)}.content{width:calc(100% - var(--safe-area-inset-right,0px));height:calc(100% - 1px - var(--header-height,0px) - var(--safe-area-inset-top,0px) - var(--safe-area-inset-bottom,0px));padding-bottom:var(--safe-area-inset-bottom,0px);margin-right:var(--safe-area-inset-right);-webkit-overflow-scrolling:touch;position:relative;overflow:auto}.content.not-scrollable{flex-direction:column;display:flex;overflow:hidden}:host([narrow]) .content{width:calc(100% - var(--safe-area-inset-left,0px) - var(--safe-area-inset-right,0px));margin-left:var(--safe-area-inset-left)}#fab{right:calc(16px + var(--safe-area-inset-right,0px));inset-inline-start:initial;inset-inline-end:calc(16px + var(--safe-area-inset-right,0px));bottom:calc(16px + var(--safe-area-inset-bottom,0px));z-index:1;justify-content:flex-end;gap:var(--ha-space-2);--ha-button-box-shadow:var(--ha-box-shadow-l);flex-wrap:wrap;display:flex;position:absolute}:host([narrow]) #fab.tabs{bottom:calc(84px + var(--safe-area-inset-bottom,0px))}#fab[is-wide]{bottom:calc(24px + var(--safe-area-inset-bottom,0px));right:calc(24px + var(--safe-area-inset-right,0px));inset-inline-start:initial;inset-inline-end:calc(24px + var(--safe-area-inset-right,0px))}`]}constructor(...t){super(...t),this.mainPage=!1,this.narrow=!1,this.scrollable=!0}}(0,o.Cg)([(0,n.MZ)({attribute:!1})],g.prototype,"hass",void 0),(0,o.Cg)([(0,n.MZ)()],g.prototype,"header",void 0),(0,o.Cg)([(0,n.MZ)({type:Boolean,attribute:"main-page"})],g.prototype,"mainPage",void 0),(0,o.Cg)([(0,n.MZ)({type:String,attribute:"back-path"})],g.prototype,"backPath",void 0),(0,o.Cg)([(0,n.MZ)({attribute:!1})],g.prototype,"backCallback",void 0),(0,o.Cg)([(0,n.MZ)({type:Boolean,reflect:!0})],g.prototype,"narrow",void 0),(0,o.Cg)([(0,n.MZ)({type:Boolean})],g.prototype,"scrollable",void 0),(0,o.Cg)([(0,r.a)(".content")],g.prototype,"_savedScrollPos",void 0),(0,o.Cg)([(0,n.Ls)({passive:!0})],g.prototype,"_saveScrollPos",null),g=(0,o.Cg)([(0,n.EM)("hass-subpage")],g),e()}catch(t){e(t)}})},88502(t,e,a){a(47144),a(25744);var o=a(15151),i=a(95744),n=a(72283),s=a(60923),r=a(36854),l=a(87180);a(58102),a(8021),a(89542),a(25102),a(47508);const c=.1,h=1.3,d=.2,p=224,x=240,y=[84,154,224],g=.03,u=.12,m=.24,v=.05,b=.45,f=.6,k={cycle:24,bursts:[[.6],[4.4,4.7],[9.2],[12.6,13],[16.9],[19.4,19.8]]},$={flight:c+h+d,blink:g+m,blinkDelays:y.map(t=>c+t/p*h-g),noAck:f-v,noAckDelay:c+h+d+v},w=[.04,.08],_=12,M=26,C=48,j=.24,T=.75,A=.9,Z={hit:Object.fromEntries(y.map((t,e)=>[e+1,c+t/p*h])),flight:{},flash:A+.03};for(const t of[1,2,3])Z.flight[t]=Z.hit[t]+A;const z={cycle:15.5,sends:[{at:.5,device:2},{at:3,device:1},{at:5.6,device:3},{at:8.2,device:3},{at:10.7,device:1},{at:13,device:2}]},H=t=>Math.max(...t.bursts.map(t=>t.length)),D=t=>{const e=Array.from({length:H(t)},()=>[]);for(const a of t.bursts)a.forEach((t,a)=>e[a].push(t));return e},E=(t,e,a)=>{const o=new Map;for(const[t,i]of a)o.set(Math.min(Math.max(t,0),e),i);const i=[...o.entries()].sort(([t],[e])=>t-e).map(([t,a])=>`    ${((t,e)=>`${Number((t/e*100).toFixed(3))}%`)(t,e)} {\n${a.map(t=>`      ${t};`).join("\n")}\n    }`).join("\n");return`@keyframes ${t} {\n${i}\n  }`},P=(t,e)=>[`transform: translateX(${t}px)`,`opacity: ${e}`],W=["fill: var(--knx-bus-scene-line)","opacity: 0.3"],N=["fill: var(--knx-bus-scene-reject)","opacity: 1"],S=["stroke: var(--knx-bus-scene-line)","stroke-opacity: 0.6"],B=["stroke: var(--knx-bus-scene-reject)","stroke-opacity: 1"],J=["opacity: 0"],F=["opacity: 1"],O=t=>{return[...D(t).map((e,a)=>((t,e,a)=>E(t,a,[[0,P(0,0)],...e.flatMap(t=>[[t,P(0,0)],[t+c,P(0,1)],[t+c+h,P(p,1)],[t+$.flight,P(x,0)],[t+$.flight+.02,P(0,0)]]),[a,P(0,0)]]))(`knx-send-${a}`,e,t.cycle)),...y.map((e,a)=>((t,e,a,o)=>E(t,o,[[0,W],...e.flatMap(t=>{const e=t+c+a/p*h;return[[e-g,W],[e,N],[e+u,N],[e+m,W]]}),[o,W]]))(`knx-blink-${a+1}`,t.bursts.flat(),e,t.cycle)),(e="knx-no-ack",a=t.bursts,o=t.cycle,E(e,o,[[0,J],...a.flatMap(t=>{const e=Math.max(...t)+$.flight;return[[e,J],[e+v,F],[e+b,F],[e+f,J]]}),[o,J]]))].join("\n\n  ");var e,a,o},U=(t,e)=>{const a=y[e-1],o=t+Z.hit[e];return[[t,P(0,0)],[t+c,P(0,1)],[o,P(a-_,1)],[o+j,P(a-M,1)],[o+T,P(a-C,0)],[o+T+.02,P(0,0)]]},K=(t,e,a,o,i,n=0)=>E(t,e,[[0,o],...a.flatMap(t=>((t,e,a,o=0)=>[[t-.03,e],[t+o,a],[t+.55+o,a],[t+A,e]])(t,o,i,n)),[e,o]]),L=(t=z)=>{const{cycle:e}=t,a=e=>t.sends.filter(t=>t.device===e).map(t=>t.at+Z.hit[e]);return[...[1,2,3].flatMap(o=>[E(`knx-reject-${o}`,e,[[0,P(0,0)],...t.sends.filter(t=>t.device===o).flatMap(t=>U(t.at,t.device)),[e,P(0,0)]]),K(`knx-nak-body-${o}`,e,a(o),S,B),K(`knx-nak-led-${o}`,e,a(o),W,N),K(`knx-nak-text-${o}`,e,a(o),J,F,.06)])].join("\n\n  ")},V=(t,e)=>`${t} {\n      ${e}\n    }`,q=i.JW` <svg class="ha-logo" viewBox="0 0 240 240" x="21" y="40" width="30" height="30"> <path class="house" d="M240 224.762a15 15 0 0 1-15 15H15a15 15 0 0 1-15-15v-90c0-8.25 4.77-19.769 10.61-25.609l98.78-98.7805c5.83-5.83 15.38-5.83 21.21 0l98.79 98.7895c5.83 5.83 10.61 17.36 10.61 25.61v90-.01Z"/> <path class="tree" d="m107.27 239.762-40.63-40.63c-2.09.72-4.32 1.13-6.64 1.13-11.3 0-20.5-9.2-20.5-20.5s9.2-20.5 20.5-20.5 20.5 9.2 20.5 20.5c0 2.33-.41 4.56-1.13 6.65l31.63 31.63v-115.88c-6.8-3.3395-11.5-10.3195-11.5-18.3895 0-11.3 9.2-20.5 20.5-20.5s20.5 9.2 20.5 20.5c0 8.07-4.7 15.05-11.5 18.3895v81.27l31.46-31.46c-.62-1.96-.96-4.04-.96-6.2 0-11.3 9.2-20.5 20.5-20.5s20.5 9.2 20.5 20.5-9.2 20.5-20.5 20.5c-2.5 0-4.88-.47-7.09-1.29L129 208.892v30.88z"/> </svg> `,R=[t=>i.JW` <rect class="glyph fill" x=${t-11} y="53" width="12" height="3" rx="1.5"/> <rect class="glyph fill" x=${t-11} y="60" width="12" height="3" rx="1.5"/> `,t=>i.JW` <circle class="glyph line" cx=${t-5} cy="58" r="5.5"/> <line class="glyph line" x1=${t-5} y1="58" x2=${t-2} y2="54.5"/> `,t=>i.JW` <circle class="glyph fill" cx=${t-10} cy="63" r="1.6"/> <path class="glyph line" d="M ${t-10} 58.5 A 4.5 4.5 0 0 1 ${t-5.5} 63"/> <path class="glyph line" d="M ${t-10} 54 A 9 9 0 0 1 ${t-1} 63"/> `],X=(t,e)=>i.JW` <g class="device device-${e}"> <line class="drop" x1=${t} y1="70" x2=${t} y2="84"/> <rect class="body" x=${t-17} y="46" width="34" height="24" rx="5"/> ${R[e-1](t)} <circle class="led" cx=${t+10} cy="53" r="2.5"/> </g> `,I=(t,e)=>i.JW` <g class="ghost ghost-2 ${t}"><circle cx="36" cy="84" r="2.5"/></g> <g class="ghost ghost-1 ${t}"><circle cx="36" cy="84" r="3.2"/></g> <g class="telegram ${t}"> <circle class="halo" cx="36" cy="84" r="9"/> <circle class="dot" cx="36" cy="84" r="4"/> <rect class="badge" x="19" y="94" width="34" height="14" rx="7"/> <text x="36" y="104" text-anchor="middle">${e}</text> </g> `,G=H(k),Y={1:120,2:190,3:260},Q="4/0/4",tt={1:"4/0/3",2:"5/0/0",3:"5/0/3"},et=1e3,at=2,ot=6,it=100;class nt extends i.WF{render(){return i.html` <svg viewBox="0 0 320 118" xmlns="http://www.w3.org/2000/svg"> <line class="bus" x1="12" y1="84" x2="308" y2="84"/> <line class="bus bus-shadow" x1="12" y1="87" x2="308" y2="87"/> <line class="bus-load" x1="12" y1="84" x2="308" y2="84"/> <g class="rate"> <text class="rate-value" x="308" y="27" text-anchor="end">${this._rate}</text> <text class="rate-unit" x="308" y="37" text-anchor="end">${this.rateUnit}</text> </g> <g class="sender"> <line class="drop" x1="36" y1="70" x2="36" y2="84"/> ${(0,s.u)(this._sent,t=>t.id,()=>i.JW`<circle class="ripple" cx="36" cy="55" r="16"/>`)} ${q} </g> ${X(Y[1],1)} ${X(Y[2],2)} ${X(Y[3],3)} <text class="no-ack" x="308" y="79" text-anchor="end">no ACK</text> ${[1,2,3].map(t=>i.JW`<text class="nak nak-${t}" x=${Y[t]} y="38" text-anchor="middle">NAK</text>`)} ${"error"===this.variant?[1,2,3].map(t=>I(`scheduled reject-lane-${t}`,tt[t])):Array.from({length:G},(t,e)=>I(`scheduled lane-${e}`,Q))} ${(0,s.u)(this._sent,t=>t.id,this._renderShot)} </svg> `}fire(){if((0,r.r)(l.G,"haptic","light"),this._tapTimes.push(Date.now()),this._updateRate(),this._holdSchedule(),"function"==typeof window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches)return;const t="error"===this.variant?1+Math.floor(3*Math.random()):void 0;this._sent=[...this._sent,{id:this._nextId++,device:t}]}_holdSchedule(){this.busy=!0,window.clearTimeout(this._quietTimer),this._quietTimer=window.setTimeout(()=>{this._quietTimer=void 0,this.busy=!1},1500)}_updateRate(){const t=Date.now()-et;this._tapTimes=this._tapTimes.filter(e=>e>t),this._rate=this._tapTimes.length;const e=(this._rate-at)/(ot-at);this.style.setProperty("--knx-bus-scene-load",String(Math.min(Math.max(e,0),1))),this._tapTimes.length&&void 0===this._rateTick&&(this._rateTick=window.setTimeout(()=>{this._rateTick=void 0,this._updateRate()},it))}firstUpdated(){this.setAttribute("aria-hidden","true")}disconnectedCallback(){super.disconnectedCallback(),window.clearTimeout(this._rateTick),window.clearTimeout(this._quietTimer),this._rateTick=this._quietTimer=void 0,this.busy=!1}constructor(...t){super(...t),this.variant="not-found",this.busy=!1,this.rateUnit="telegrams/s",this._rate=0,this._sent=[],this._nextId=0,this._tapTimes=[],this._renderShot=({id:t,device:e})=>{if(e){const a=Y[e];return i.JW` <g class="shot reject-${e}" data-id=${t} @animationend=${this._shotEnded}> ${I("",tt[e])} <rect class="body-echo" x=${a-17} y="46" width="34" height="24" rx="5"/> <circle class="led-echo" cx=${a+10} cy="53" r="2.5"/> <text class="nak-echo" x=${a} y="38" text-anchor="middle">NAK</text> </g> `}return i.JW` <g class="shot" data-id=${t} @animationend=${this._shotEnded}> ${I("",Q)} <circle class="led-echo led-echo-1" cx="130" cy="53" r="2.5"/> <circle class="led-echo led-echo-2" cx="200" cy="53" r="2.5"/> <circle class="led-echo led-echo-3" cx="270" cy="53" r="2.5"/> <text class="shot-no-ack" x="308" y="79" text-anchor="end">no ACK</text> </g> `},this._shotEnded=t=>{if("knx-shot-no-ack"!==t.animationName&&"knx-shot-nak"!==t.animationName)return;const e=Number(t.currentTarget.dataset.id);this._sent=this._sent.filter(t=>t.id!==e)}}}nt.styles=i.AH`
    :host {
      display: block;
      width: 100%;
      max-width: 400px;
      --knx-bus-scene-line: var(--secondary-text-color);
      --knx-bus-scene-device: var(--card-background-color);
      /* same fill + white text as the "Outgoing" badge in the group monitor */
      --knx-bus-scene-telegram: var(--knx-blue, var(--primary-color));
      --knx-bus-scene-on-telegram: var(--text-primary-color, #fff);
      --knx-bus-scene-reject: var(--error-color);
      /* --knx-bus-scene-load (0..1) is set inline by _updateRate */
    }

    svg {
      display: block;
      width: 100%;
      height: auto;
      overflow: visible;
    }

    .bus,
    .drop {
      stroke: var(--knx-bus-scene-line);
      stroke-width: 1.5;
      stroke-linecap: round;
      opacity: 0.55;
    }

    .bus-shadow {
      opacity: 0.2;
    }

    .drop {
      opacity: 0.4;
    }

    /* bus load: the line fills with KNX blue as the rate climbs */
    .bus-load {
      stroke: var(--knx-bus-scene-telegram);
      stroke-width: 2.2;
      stroke-linecap: round;
      opacity: calc(var(--knx-bus-scene-load, 0) * 0.85);
      transition: opacity 250ms ease;
    }

    .rate {
      opacity: var(--knx-bus-scene-load, 0);
      transition: opacity 250ms ease;
    }

    .rate-value {
      font-family: var(--ha-font-family-code, monospace);
      font-size: 24px;
      font-weight: var(--ha-font-weight-medium, 500);
      font-variant-numeric: tabular-nums;
      fill: var(--primary-text-color);
    }

    .rate-unit {
      font-size: 6.5px;
      font-weight: var(--ha-font-weight-medium, 500);
      letter-spacing: 0.14em;
      text-transform: uppercase;
      fill: var(--secondary-text-color);
    }

    /* brand colours as in ha-logo-svg, readable on light and dark themes */
    .sender .house,
    .sender .ripple {
      fill: #18bcf2;
    }

    .sender .tree {
      fill: #f2f4f9;
    }

    /* one ripple per tap, spreading out behind the logo, each on its own */
    .sender .ripple {
      opacity: 0;
      transform-box: fill-box;
      transform-origin: center;
      animation: knx-ripple 550ms ease-out;
    }

    @keyframes knx-ripple {
      0% {
        transform: scale(0.6);
        opacity: 0.4;
      }
      100% {
        transform: scale(2.4);
        opacity: 0;
      }
    }

    .device .body {
      fill: var(--knx-bus-scene-device);
      stroke: var(--knx-bus-scene-line);
      stroke-width: 1.5;
      stroke-opacity: 0.6;
    }

    .device .glyph {
      opacity: 0.4;
    }

    .device .glyph.fill {
      fill: var(--knx-bus-scene-line);
    }

    .device .glyph.line {
      fill: none;
      stroke: var(--knx-bus-scene-line);
      stroke-width: 1.5;
      stroke-linecap: round;
    }

    .device .led,
    .shot .led-echo {
      fill: var(--knx-bus-scene-line);
      opacity: 0.3;
    }

    .shot .led-echo {
      opacity: 0;
    }

    .shot .body-echo {
      fill: none;
      stroke: var(--knx-bus-scene-reject);
      stroke-width: 1.5;
      stroke-opacity: 0;
    }

    /* telegrams are invisible until their keyframes bring them onto the bus */
    .telegram,
    .ghost {
      opacity: 0;
    }

    .telegram .dot {
      fill: var(--knx-bus-scene-telegram);
      stroke: var(--primary-background-color);
      stroke-width: 1.5;
    }

    .telegram .halo,
    .telegram .badge,
    .ghost circle {
      fill: var(--knx-bus-scene-telegram);
    }

    .telegram .halo {
      opacity: 0.25;
    }

    .ghost-1 circle {
      opacity: 0.35;
    }

    .ghost-2 circle {
      opacity: 0.16;
    }

    .telegram text {
      font-family: var(--ha-font-family-code, monospace);
      font-size: 9px;
      fill: var(--knx-bus-scene-on-telegram);
    }

    .no-ack,
    .shot-no-ack,
    .nak,
    .nak-echo {
      font-family: var(--ha-font-family-code, monospace);
      font-size: 8px;
      letter-spacing: 0.08em;
      fill: var(--knx-bus-scene-reject);
      opacity: 0;
    }

    /* all animation bindings and keyframes, see knx-bus-scene-animations.ts */
    ${(0,i.iz)(((t=k)=>{const e=`${t.cycle}s linear infinite`,a=`${z.cycle}s linear infinite`,o=t=>`:host([variant="not-found"]) ${t}`,i=t=>`:host([variant="error"]) ${t}`,n=[1,2,3];return[...D(t).map((t,a)=>V(o(`.lane-${a}`),`animation: knx-send-${a} ${e};`)),...n.map(t=>V(o(`.device-${t} .led`),`animation: knx-blink-${t} ${e};`)),V(o(".no-ack"),`animation: knx-no-ack ${e};`),...n.flatMap(t=>[V(i(`.reject-lane-${t}`),`animation: knx-reject-${t} ${a};`),V(i(`.device-${t} .body`),`animation: knx-nak-body-${t} ${a};`),V(i(`.device-${t} .led`),`animation: knx-nak-led-${t} ${a};`),V(i(`.nak-${t}`),`animation: knx-nak-text-${t} ${a};`)]),V(":host([busy]) .scheduled,\n    :host([busy]) .device .led,\n    :host([busy]) .device .body,\n    :host([busy]) .no-ack,\n    :host([busy]) .nak","animation: none;"),V(".shot .telegram,\n    .shot .ghost",`animation: knx-shot ${$.flight}s linear;`),V(".shot .led-echo",`animation: knx-shot-blink ${$.blink}s linear;`),...$.blinkDelays.map((t,e)=>V(`.shot .led-echo-${e+1}`,`animation-delay: ${t.toFixed(3)}s;`)),V(".shot .shot-no-ack",`animation: knx-shot-no-ack ${$.noAck}s linear ${$.noAckDelay}s;`),...n.flatMap(t=>{const e=`${(Z.hit[t]-.03).toFixed(3)}s`;return[V(`.shot.reject-${t} .telegram,\n    .shot.reject-${t} .ghost`,`animation: knx-shot-reject-${t} ${Z.flight[t].toFixed(3)}s linear;`),V(`.shot.reject-${t} .body-echo`,`animation: knx-shot-nak-body ${Z.flash}s linear ${e};`),V(`.shot.reject-${t} .led-echo`,`animation: knx-shot-nak-led ${Z.flash}s linear ${e};`),V(`.shot.reject-${t} .nak-echo`,`animation: knx-shot-nak ${Z.flash}s linear ${e};`)]}),...w.map((t,e)=>V(`:host .ghost.ghost-${e+1}`,`animation-delay: ${t}s;`)),O(t),[E("knx-shot",$.flight,[[0,P(0,0)],[c,P(0,1)],[c+h,P(p,1)],[$.flight,P(x,0)]]),E("knx-shot-blink",$.blink,[[0,W],[g,N],[g+u,N],[$.blink,W]]),E("knx-shot-no-ack",$.noAck,[[0,F],[b-v,F],[$.noAck,J]])].join("\n\n  "),[...[1,2,3].map(t=>E(`knx-shot-reject-${t}`,Z.flight[t],[...U(0,t).slice(0,-1),[Z.flight[t],P(0,0)]])),K("knx-shot-nak-body",Z.flash,[.03],["stroke-opacity: 0"],["stroke-opacity: 1"]),K("knx-shot-nak-led",Z.flash,[.03],J,N),K("knx-shot-nak",Z.flash,[.03],J,F,.06)].join("\n\n  "),L()].join("\n\n    ")})())}

    /* ---- reduced motion: show the end of the story instead ------------- */
    @media (prefers-reduced-motion: reduce) {
      .telegram,
      .device .led,
      .device .body,
      .no-ack,
      .nak {
        animation: none !important;
      }

      .ghost,
      .shot,
      .sender .ripple {
        display: none;
      }

      :host([variant="not-found"]) .telegram.lane-0 {
        transform: translateX(224px);
        opacity: 0.6;
      }

      :host([variant="not-found"]) .no-ack,
      :host([variant="error"]) .nak-1 {
        opacity: 1;
      }

      :host([variant="error"]) .telegram.reject-lane-1 {
        transform: translateX(58px);
        opacity: 1;
      }

      :host([variant="error"]) .device-1 .body {
        stroke: var(--knx-bus-scene-reject);
        stroke-opacity: 1;
      }

      :host([variant="error"]) .device-1 .led {
        fill: var(--knx-bus-scene-reject);
        opacity: 1;
      }
    }
  `,(0,o.Cg)([(0,n.MZ)({reflect:!0})],nt.prototype,"variant",void 0),(0,o.Cg)([(0,n.MZ)({type:Boolean,reflect:!0})],nt.prototype,"busy",void 0),(0,o.Cg)([(0,n.MZ)({attribute:"rate-unit"})],nt.prototype,"rateUnit",void 0),(0,o.Cg)([(0,n.wk)()],nt.prototype,"_rate",void 0),(0,o.Cg)([(0,n.wk)()],nt.prototype,"_sent",void 0),nt=(0,o.Cg)([(0,n.EM)("knx-bus-scene")],nt)},59848(t,e,a){a.a(t,async function(t,e){try{a(47144),a(99686),a(24791),a(77809),a(92653);var o=a(15151),i=a(95744),n=a(72283),s=a(51765),r=a(58361),l=a(46345),c=a(55992),h=(a(88502),t([s,r]));[s,r]=h.then?(await h)():h;const d="M19,21H8V7H19M19,5H8A2,2 0 0,0 6,7V21A2,2 0 0,0 8,23H19A2,2 0 0,0 21,21V7A2,2 0 0,0 19,5M16,1H4A2,2 0 0,0 2,3V17H4V3H16V1Z",p=new Set(["ha-button","ha-icon-button","button","a","input","select","textarea"]);class x extends i.WF{render(){return i.html` <hass-subpage .hass=${this.hass} .narrow=${this.narrow} .header=${this.header}> <div class="content" @pointerdown=${this._tap}> <knx-bus-scene .variant=${this.variant} .rateUnit=${this.rateUnit}></knx-bus-scene> <h1> ${this.eyebrow?i.html`<span class="eyebrow">${this.eyebrow}</span>`:i.nothing} <span class="headline">${this.headline}</span> </h1> ${this.description?i.html`<p class="description">${this.description}</p>`:i.nothing} ${this.detail?i.html`<div class="detail"> <span class="detail-label">${this.detailLabel}</span> <div class="detail-body"> <code>${this.detail}</code> ${this.copyable?i.html`<ha-icon-button .path=${d} label=${this.hass.localize("ui.common.copy")} @click=${this._copy}></ha-icon-button>`:i.nothing} </div> </div>`:i.nothing} <div class="actions"><slot></slot></div> </div> </hass-subpage> `}_tap(t){if(0!==t.button)return;t.composedPath().some(t=>t instanceof Element&&p.has(t.localName))||this._scene?.fire()}async _copy(){await(0,l.l)(this.detail),(0,c.P)(this,{message:this.hass.localize("ui.common.copied_clipboard")})}constructor(...t){super(...t),this.narrow=!1,this.copyable=!1,this.variant="not-found",this.rateUnit="telegrams/s"}}x.styles=i.AH`:host{height:100%;display:block}.content{-webkit-tap-highlight-color:transparent;-webkit-touch-callout:none;touch-action:manipulation;user-select:none;box-sizing:border-box;text-align:center;max-width:520px;min-height:100%;color:var(--primary-text-color);flex-direction:column;justify-content:center;align-items:center;margin:0 auto;padding:24px 16px 14vh;display:flex}knx-bus-scene{margin-bottom:28px}h1{font:inherit;margin:0 0 12px}.eyebrow{color:var(--secondary-text-color);font-size:var(--ha-font-size-s,12px);font-weight:var(--ha-font-weight-medium,500);letter-spacing:.14em;text-transform:uppercase;margin:0 0 6px;display:block}.headline{font-family:var(--knx-status-page-headline-font,var(--ha-font-family-body,inherit));font-size:var(--knx-status-page-headline-size,var(--ha-font-size-3xl,28px));font-weight:var(--ha-font-weight-medium,500);line-height:var(--ha-line-height-condensed,1.2);display:block}.description{max-width:42ch;color:var(--secondary-text-color);font-size:var(--ha-font-size-l,16px);line-height:var(--ha-line-height-normal,1.6);margin:0}.detail{text-align:left;width:100%;margin-top:24px}.detail-label{color:var(--secondary-text-color);font-size:var(--ha-font-size-s,12px);font-weight:var(--ha-font-weight-medium,500);letter-spacing:.14em;text-transform:uppercase;margin:0 0 6px 2px;display:block}.detail-body{border-radius:var(--ha-border-radius-md,12px);background:var(--secondary-background-color);align-items:flex-start;gap:4px;padding:8px 6px 8px 14px;display:flex}.detail-body code{font-family:var(--ha-font-family-code,monospace);font-size:var(--ha-font-size-s,12px);line-height:var(--ha-line-height-normal,1.6);color:var(--primary-text-color);overflow-wrap:anywhere;user-select:text;flex:1;padding:6px 0}.detail-body ha-icon-button{--mdc-icon-button-size:36px;--mdc-icon-size:18px;color:var(--secondary-text-color);margin:-2px 0}.actions{flex-wrap:wrap;justify-content:center;gap:8px;margin-top:28px;display:flex}`,(0,o.Cg)([(0,n.MZ)({attribute:!1})],x.prototype,"hass",void 0),(0,o.Cg)([(0,n.MZ)({type:Boolean})],x.prototype,"narrow",void 0),(0,o.Cg)([(0,n.MZ)()],x.prototype,"header",void 0),(0,o.Cg)([(0,n.MZ)()],x.prototype,"eyebrow",void 0),(0,o.Cg)([(0,n.MZ)()],x.prototype,"headline",void 0),(0,o.Cg)([(0,n.MZ)()],x.prototype,"description",void 0),(0,o.Cg)([(0,n.MZ)({attribute:"detail-label"})],x.prototype,"detailLabel",void 0),(0,o.Cg)([(0,n.MZ)()],x.prototype,"detail",void 0),(0,o.Cg)([(0,n.MZ)({type:Boolean})],x.prototype,"copyable",void 0),(0,o.Cg)([(0,n.MZ)({reflect:!0})],x.prototype,"variant",void 0),(0,o.Cg)([(0,n.MZ)({attribute:"rate-unit"})],x.prototype,"rateUnit",void 0),(0,o.Cg)([(0,n.P)("knx-bus-scene")],x.prototype,"_scene",void 0),x=(0,o.Cg)([(0,n.EM)("knx-status-page")],x),e()}catch(t){e(t)}})},71112(t,e,a){a.a(t,async function(t,o){try{var i=a(15151),n=a(95744),s=a(72283),r=a(35177),l=a(40455),c=a(59848),h=(a(25900),t([r,c]));[r,c]=h.then?(await h)():h;class d extends n.WF{_goBack(){(0,l.OE)("/knx")}_goToDashboard(){(0,l.oo)("/knx")}constructor(...t){super(...t),this.narrow=!1}}d.styles=n.AH`:host{height:100%;display:block}`,(0,i.Cg)([(0,s.MZ)({attribute:!1})],d.prototype,"hass",void 0),(0,i.Cg)([(0,s.MZ)({attribute:!1})],d.prototype,"knx",void 0),(0,i.Cg)([(0,s.MZ)({type:Boolean})],d.prototype,"narrow",void 0),(0,i.Cg)([(0,s.MZ)({attribute:!1})],d.prototype,"route",void 0),a.d(e,{F:()=>d}),o()}catch(t){o(t)}})},60923(t,e,a){a.d(e,{u:()=>r});a(25102),a(47508);var o=a(77757),i=a(49927),n=a(51655);const s=(t,e,a)=>{const o=new Map;for(let i=e;i<=a;i++)o.set(t[i],i);return o},r=(0,i.u$)(class extends i.WL{dt(t,e,a){let o;void 0===a?a=e:void 0!==e&&(o=e);const i=[],n=[];let s=0;for(const e of t)i[s]=o?o(e,s):s,n[s]=a(e,s),s++;return{values:n,keys:i}}render(t,e,a){return this.dt(t,e,a).values}update(t,[e,a,i]){const r=(0,n.cN)(t),{values:l,keys:c}=this.dt(e,a,i);if(!Array.isArray(r))return this.ut=c,l;const h=this.ut??=[],d=[];let p,x,y=0,g=r.length-1,u=0,m=l.length-1;for(;y<=g&&u<=m;)if(null===r[y])y++;else if(null===r[g])g--;else if(h[y]===c[u])d[u]=(0,n.lx)(r[y],l[u]),y++,u++;else if(h[g]===c[m])d[m]=(0,n.lx)(r[g],l[m]),g--,m--;else if(h[y]===c[m])d[m]=(0,n.lx)(r[y],l[m]),(0,n.Dx)(t,d[m+1],r[y]),y++,m--;else if(h[g]===c[u])d[u]=(0,n.lx)(r[g],l[u]),(0,n.Dx)(t,r[y],r[g]),g--,u++;else if(void 0===p&&(p=s(c,u,m),x=s(h,y,g)),p.has(h[y]))if(p.has(h[g])){const e=x.get(c[u]),a=void 0!==e?r[e]:null;if(null===a){const e=(0,n.Dx)(t,r[y]);(0,n.lx)(e,l[u]),d[u]=e}else d[u]=(0,n.lx)(a,l[u]),(0,n.Dx)(t,r[y],a),r[e]=null;u++}else(0,n.KO)(r[g]),g--;else(0,n.KO)(r[y]),y++;for(;u<=m;){const e=(0,n.Dx)(t,d[m+1]);(0,n.lx)(e,l[u]),d[u++]=e}for(;y<=g;){const t=r[y++];null!==t&&(0,n.KO)(t)}return this.ut=c,(0,n.mY)(t,d),o.c0}constructor(t){if(super(t),t.type!==i.OA.CHILD)throw Error("repeat() can only be used in text expressions")}})}};
//# sourceMappingURL=39377.b4c9882de40aab5b.js.map
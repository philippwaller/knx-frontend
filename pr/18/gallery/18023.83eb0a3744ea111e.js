/*! For license information please see 18023.83eb0a3744ea111e.js.LICENSE.txt */
export const __rspack_esm_id=18023;export const __rspack_esm_ids=[18023];export const __webpack_modules__={49340(t,e,i){i.a(t,async function(t,s){try{i.r(e);var n=i(15151),r=i(95744),o=i(72283),a=i(60923),h=i(26830),l=i(78688),c=(i(67370),i(15107)),u=i(35900),d=(i(62249),i(40455)),p=i(91516),m=i(25900),g=i(69903),b=t([h,l,c,u,g]);[h,l,c,u,g]=b.then?(await b)():b;class y extends r.WF{render(){const t=this.entities.length+this.entitiesYaml.length+this.exposes.length;return t?t<=2?r.html` <ha-chip-set> ${(0,a.u)(this.entities,t=>t,t=>this._renderEntityItem(t))} ${(0,a.u)(this.entitiesYaml,t=>t,t=>this._renderEntityYamlItem(t))} ${(0,a.u)(this.exposes,t=>t,t=>this._renderExposeItem(t))} </ha-chip-set> `:r.html` <ha-chip-set> ${this._renderEntitiesSection()} ${this._renderExposesSection()} </ha-chip-set> `:r.nothing}_renderEntitiesSection(){const t=this.entities.length+this.entitiesYaml.length;if(!t)return r.nothing;if(1===t)return 1===this.entities.length?this._renderEntityItem(this.entities[0]):this._renderEntityYamlItem(this.entitiesYaml[0]);const e=this.localize("ui.components.target-picker.entities_count",{count:t});return r.html` <ha-dropdown role="button" tabindex="0" @click=${p.d}> <ha-label slot="trigger" class="open-menu" dense>${e}</ha-label> ${(0,a.u)(this.entities,t=>t,t=>r.html`<ha-dropdown-item .value=${t}> ${this._renderEntityItem(t)} </ha-dropdown-item>`)} ${(0,a.u)(this.entitiesYaml,t=>t,t=>r.html`<ha-dropdown-item .value=${t}> ${this._renderEntityYamlItem(t)} </ha-dropdown-item>`)} </ha-dropdown> `}_renderExposesSection(){const t=this.exposes.length;if(!t)return r.nothing;if(1===t)return this._renderExposeItem(this.exposes[0]);const e=this.localize("component.knx.config_panel.common.exposes_count",{count:t});return r.html` <ha-dropdown role="button" tabindex="0" @click=${p.d}> <ha-label slot="trigger" class="open-menu" dense>${e}</ha-label> ${(0,a.u)(this.exposes,t=>t,t=>r.html`<ha-dropdown-item .value=${t}> ${this._renderExposeItem(t)} </ha-dropdown-item>`)} </ha-dropdown> `}_renderEntityItem(t){const e=this.hass?.states[t];return r.html` <a class="related-item link" href=${this._entityHref(t)} @click=${this._linkClicked}> <ha-label dense class="entity-label"> <ha-state-icon slot="icon" .hass=${this.hass} .stateObj=${e}></ha-state-icon> ${t} </ha-label> </a> `}_renderEntityYamlItem(t){const e=this.hass?.states[t];return r.html` <ha-label dense class="entity-label yaml" .description=${"YAML"}> <ha-state-icon slot="icon" .hass=${this.hass} .stateObj=${e}></ha-state-icon> ${t} </ha-label> `}_renderExposeItem(t){return r.html` <a class="related-item link" href=${this._exposeHref(t)} @click=${this._linkClicked}> <ha-label dense class="expose-label" .description=${this.localize("component.knx.config_panel.expose.title")}> <ha-svg-icon slot="icon" .path=${m.ML.iconPath}></ha-svg-icon> ${t} </ha-label> </a> `}_entityHref(t){return`/knx/entities/edit/${t}`}_exposeHref(t){return`/knx/expose/edit/${t}`}_linkClicked(t){t.defaultPrevented||0!==t.button||t.metaKey||t.ctrlKey||t.shiftKey||(t.preventDefault(),t.stopPropagation(),(0,d.oo)(t.currentTarget.href))}constructor(...t){super(...t),this.entities=[],this.entitiesYaml=[],this.exposes=[]}}y.styles=r.AH`
    :host {
      display: block;
      flex-grow: 1;
    }

    ha-chip-set {
      flex-direction: column;
      flex-wrap: nowrap;
      align-items: flex-start;
      row-gap: 4px;
    }

    .entity-label {
      --ha-label-background-color: ${(0,r.iz)(m.B4.iconColor)};
      --ha-label-background-opacity: 0.5;
    }

    .yaml {
      --ha-label-background-color: var(--disabled-color);
      cursor: default;
    }

    .expose-label {
      --ha-label-background-color: ${(0,r.iz)(m.ML.iconColor)};
      --ha-label-background-opacity: 0.5;
    }

    .link {
      color: inherit;
      text-decoration: none;
    }

    .related-item {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .open-menu {
      --ha-label-background-color: transparent;
      border: 1px solid var(--divider-color);
    }
  `,(0,n.Cg)([(0,o.MZ)({attribute:!1})],y.prototype,"hass",void 0),(0,n.Cg)([(0,o.MZ)({attribute:!1})],y.prototype,"entities",void 0),(0,n.Cg)([(0,o.MZ)({attribute:!1})],y.prototype,"entitiesYaml",void 0),(0,n.Cg)([(0,o.MZ)({attribute:!1})],y.prototype,"exposes",void 0),(0,n.Cg)([(0,o.wk)(),(0,g.v)()],y.prototype,"localize",void 0),y=(0,n.Cg)([(0,o.EM)("knx-data-table-related-label")],y),s()}catch(t){s(t)}})},35387(t,e,i){i.d(e,{YZ:()=>r,ue:()=>n});i(47144),i(21927);var s=i(80211);const n=Symbol();class r{get taskComplete(){return this.t||(1===this.i?this.t=new Promise((t,e)=>{this.o=t,this.h=e}):3===this.i?this.t=Promise.reject(this.l):this.t=Promise.resolve(this.u)),this.t}hostUpdate(){!0===this.autoRun&&this.S()}hostUpdated(){"afterUpdate"===this.autoRun&&this.S()}T(){if(void 0===this.j)return;const t=this.j();if(!Array.isArray(t))throw Error("The args function must return an array");return t}async S(){const t=this.T(),e=this.O;this.O=t,t===e||void 0===t||void 0!==e&&this.m(e,t)||await this.run(t)}async run(t){let e,i;t??=this.T(),this.O=t,1===this.i?this.q?.abort():(this.t=void 0,this.o=void 0,this.h=void 0),this.i=1,"afterUpdate"===this.autoRun?queueMicrotask(()=>this._.requestUpdate()):this._.requestUpdate();const s=++this.p;this.q=new AbortController;let r=!1;try{e=await this.v(t,{signal:this.q.signal})}catch(t){r=!0,i=t}if(this.p===s){if(e===n)this.i=0;else{if(!1===r){try{this.k?.(e)}catch{}this.i=2,this.o?.(e)}else{try{this.A?.(i)}catch{}this.i=3,this.h?.(i)}this.u=e,this.l=i}this._.requestUpdate()}}abort(t){1===this.i&&this.q?.abort(t)}get value(){return this.u}get error(){return this.l}get status(){return this.i}render(t){switch(this.i){case 0:return t.initial?.();case 1:return t.pending?.();case 2:return t.complete?.(this.value);case 3:return t.error?.(this.error);default:throw Error("Unexpected status: "+this.i)}}constructor(t,e,i){this.p=0,this.i=0,(this._=t).addController(this);const s="object"==typeof e?e:{task:e,args:i};this.v=s.task,this.j=s.args,this.m=s.argsEqual??o,this.k=s.onComplete,this.A=s.onError,this.autoRun=s.autoRun??!0,"initialValue"in s&&(this.u=s.initialValue,this.i=2,this.O=this.T?.())}}const o=(t,e)=>t===e||t.length===e.length&&t.every((t,i)=>!(0,s.Ec)(t,e[i]))},58481(t,e,i){i(47144),i(8021),i(89542);function s(t){return new Promise((e,i)=>{t.oncomplete=t.onsuccess=()=>e(t.result),t.onabort=t.onerror=()=>i(t.error)})}function n(t,e){let i;return(n,r)=>(()=>{if(i)return i;const n=indexedDB.open(t);return n.onupgradeneeded=()=>n.result.createObjectStore(e),i=s(n),i.then(t=>{t.onclose=()=>i=void 0},()=>{i=void 0}),i})().then(t=>r(t.transaction(e,n).objectStore(e)))}let r;function o(){return r||(r=n("keyval-store","keyval")),r}function a(t,e=o()){return e("readonly",e=>s(e.get(t)))}function h(t,e,i=o()){return i("readwrite",i=>(i.put(e,t),s(i.transaction)))}function l(t,e=o()){return e("readwrite",e=>(t.forEach(t=>e.put(t[1],t[0])),s(e.transaction)))}function c(t,e=o()){return e("readwrite",e=>(t.forEach(t=>e.delete(t)),s(e.transaction)))}function u(t=o()){return t("readwrite",t=>(t.clear(),s(t.transaction)))}function d(t,e){return t.openCursor().onsuccess=function(){this.result&&(e(this.result),this.result.continue())},s(t.transaction)}function p(t=o()){return t("readonly",t=>{if(t.getAll&&t.getAllKeys)return Promise.all([s(t.getAllKeys()),s(t.getAll())]).then(([t,e])=>t.map((t,i)=>[t,e[i]]));const e=[];return d(t,t=>e.push([t.key,t.value])).then(()=>e)})}i.d(e,{IU:()=>u,Jt:()=>a,LJ:()=>c,Yd:()=>s,_y:()=>l,hZ:()=>h,jO:()=>p,y$:()=>n})}};
//# sourceMappingURL=18023.83eb0a3744ea111e.js.map
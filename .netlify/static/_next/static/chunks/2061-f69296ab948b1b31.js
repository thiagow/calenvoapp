(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[2061],{49322:function(e,t,r){"use strict";r.d(t,{Z:function(){return n}});let n=(0,r(79205).Z)("CircleAlert",[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["line",{x1:"12",x2:"12",y1:"8",y2:"12",key:"1pkeuh"}],["line",{x1:"12",x2:"12.01",y1:"16",y2:"16",key:"4dfq90"}]])},92934:function(e,t,r){"use strict";r.d(t,{Z:function(){return n}});let n=(0,r(79205).Z)("CircleCheck",[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["path",{d:"m9 12 2 2 4-4",key:"dzmm74"}]])},33245:function(e,t,r){"use strict";r.d(t,{Z:function(){return n}});let n=(0,r(79205).Z)("Info",[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["path",{d:"M12 16v-4",key:"1dtifu"}],["path",{d:"M12 8h.01",key:"e9boi3"}]])},76865:function(e,t,r){"use strict";r.d(t,{Z:function(){return n}});let n=(0,r(79205).Z)("TriangleAlert",[["path",{d:"m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3",key:"wmoenq"}],["path",{d:"M12 9v4",key:"juzpu7"}],["path",{d:"M12 17h.01",key:"p32p05"}]])},32489:function(e,t,r){"use strict";r.d(t,{Z:function(){return n}});let n=(0,r(79205).Z)("X",[["path",{d:"M18 6 6 18",key:"1bl5f8"}],["path",{d:"m6 6 12 12",key:"d8bk6v"}]])},50911:function(e){e.exports={style:{fontFamily:"'__Inter_f367f3', '__Inter_Fallback_f367f3'",fontStyle:"normal"},className:"__className_f367f3"}},67822:function(e,t,r){"use strict";r.d(t,{B:function(){return l}});var n=r(2265),o=r(73966),a=r(98575),i=r(37053),s=r(57437);function l(e){let t=e+"CollectionProvider",[r,l]=(0,o.b)(t),[c,d]=r(t,{collectionRef:{current:null},itemMap:new Map}),u=e=>{let{scope:t,children:r}=e,o=n.useRef(null),a=n.useRef(new Map).current;return(0,s.jsx)(c,{scope:t,itemMap:a,collectionRef:o,children:r})};u.displayName=t;let p=e+"CollectionSlot",f=n.forwardRef((e,t)=>{let{scope:r,children:n}=e,o=d(p,r),l=(0,a.e)(t,o.collectionRef);return(0,s.jsx)(i.g7,{ref:l,children:n})});f.displayName=p;let m=e+"CollectionItemSlot",y="data-radix-collection-item",h=n.forwardRef((e,t)=>{let{scope:r,children:o,...l}=e,c=n.useRef(null),u=(0,a.e)(t,c),p=d(m,r);return n.useEffect(()=>(p.itemMap.set(c,{ref:c,...l}),()=>void p.itemMap.delete(c))),(0,s.jsx)(i.g7,{[y]:"",ref:u,children:o})});return h.displayName=m,[{Provider:u,Slot:f,ItemSlot:h},function(t){let r=d(e+"CollectionConsumer",t);return n.useCallback(()=>{let e=r.collectionRef.current;if(!e)return[];let t=Array.from(e.querySelectorAll(`[${y}]`));return Array.from(r.itemMap.values()).sort((e,r)=>t.indexOf(e.ref.current)-t.indexOf(r.ref.current))},[r.collectionRef,r.itemMap])},l]}},41915:function(e,t,r){"use strict";r.d(t,{Dx:function(){return Q},aU:function(){return et},dk:function(){return ee},fC:function(){return G},l_:function(){return J},x8:function(){return er},zt:function(){return Y}});var n=r(2265),o=r(54887),a=r(6741),i=r(98575),s=r(67822),l=r(73966),c=r(15278),d=r(83832),u=r(71599),p=r(66840),f=r(26606),m=r(80886),y=r(61188),h=r(95098),v=r(57437),g="ToastProvider",[w,x,b]=(0,s.B)("Toast"),[E,T]=(0,l.b)("Toast",[b]),[C,k]=E(g),S=e=>{let{__scopeToast:t,label:r="Notification",duration:o=5e3,swipeDirection:a="right",swipeThreshold:i=50,children:s}=e,[l,c]=n.useState(null),[d,u]=n.useState(0),p=n.useRef(!1),f=n.useRef(!1);return r.trim()||console.error(`Invalid prop \`label\` supplied to \`${g}\`. Expected non-empty \`string\`.`),(0,v.jsx)(w.Provider,{scope:t,children:(0,v.jsx)(C,{scope:t,label:r,duration:o,swipeDirection:a,swipeThreshold:i,toastCount:d,viewport:l,onViewportChange:c,onToastAdd:n.useCallback(()=>u(e=>e+1),[]),onToastRemove:n.useCallback(()=>u(e=>e-1),[]),isFocusedToastEscapeKeyDownRef:p,isClosePausedRef:f,children:s})})};S.displayName=g;var $="ToastViewport",P=["F8"],R="toast.viewportPause",j="toast.viewportResume",M=n.forwardRef((e,t)=>{let{__scopeToast:r,hotkey:o=P,label:a="Notifications ({hotkey})",...s}=e,l=k($,r),d=x(r),u=n.useRef(null),f=n.useRef(null),m=n.useRef(null),y=n.useRef(null),h=(0,i.e)(t,y,l.onViewportChange),g=o.join("+").replace(/Key/g,"").replace(/Digit/g,""),b=l.toastCount>0;n.useEffect(()=>{let e=e=>{o.every(t=>e[t]||e.code===t)&&y.current?.focus()};return document.addEventListener("keydown",e),()=>document.removeEventListener("keydown",e)},[o]),n.useEffect(()=>{let e=u.current,t=y.current;if(b&&e&&t){let r=()=>{if(!l.isClosePausedRef.current){let e=new CustomEvent(R);t.dispatchEvent(e),l.isClosePausedRef.current=!0}},n=()=>{if(l.isClosePausedRef.current){let e=new CustomEvent(j);t.dispatchEvent(e),l.isClosePausedRef.current=!1}},o=t=>{e.contains(t.relatedTarget)||n()},a=()=>{e.contains(document.activeElement)||n()};return e.addEventListener("focusin",r),e.addEventListener("focusout",o),e.addEventListener("pointermove",r),e.addEventListener("pointerleave",a),window.addEventListener("blur",r),window.addEventListener("focus",n),()=>{e.removeEventListener("focusin",r),e.removeEventListener("focusout",o),e.removeEventListener("pointermove",r),e.removeEventListener("pointerleave",a),window.removeEventListener("blur",r),window.removeEventListener("focus",n)}}},[b,l.isClosePausedRef]);let E=n.useCallback(({tabbingDirection:e})=>{let t=d().map(t=>{let r=t.ref.current,n=[r,...function(e){let t=[],r=document.createTreeWalker(e,NodeFilter.SHOW_ELEMENT,{acceptNode:e=>{let t="INPUT"===e.tagName&&"hidden"===e.type;return e.disabled||e.hidden||t?NodeFilter.FILTER_SKIP:e.tabIndex>=0?NodeFilter.FILTER_ACCEPT:NodeFilter.FILTER_SKIP}});for(;r.nextNode();)t.push(r.currentNode);return t}(r)];return"forwards"===e?n:n.reverse()});return("forwards"===e?t.reverse():t).flat()},[d]);return n.useEffect(()=>{let e=y.current;if(e){let t=t=>{let r=t.altKey||t.ctrlKey||t.metaKey;if("Tab"===t.key&&!r){let r=document.activeElement,n=t.shiftKey;if(t.target===e&&n){f.current?.focus();return}let o=E({tabbingDirection:n?"backwards":"forwards"}),a=o.findIndex(e=>e===r);B(o.slice(a+1))?t.preventDefault():n?f.current?.focus():m.current?.focus()}};return e.addEventListener("keydown",t),()=>e.removeEventListener("keydown",t)}},[d,E]),(0,v.jsxs)(c.I0,{ref:u,role:"region","aria-label":a.replace("{hotkey}",g),tabIndex:-1,style:{pointerEvents:b?void 0:"none"},children:[b&&(0,v.jsx)(L,{ref:f,onFocusFromOutsideViewport:()=>{B(E({tabbingDirection:"forwards"}))}}),(0,v.jsx)(w.Slot,{scope:r,children:(0,v.jsx)(p.WV.ol,{tabIndex:-1,...s,ref:h})}),b&&(0,v.jsx)(L,{ref:m,onFocusFromOutsideViewport:()=>{B(E({tabbingDirection:"backwards"}))}})]})});M.displayName=$;var N="ToastFocusProxy",L=n.forwardRef((e,t)=>{let{__scopeToast:r,onFocusFromOutsideViewport:n,...o}=e,a=k(N,r);return(0,v.jsx)(h.T,{"aria-hidden":!0,tabIndex:0,...o,ref:t,style:{position:"fixed"},onFocus:e=>{let t=e.relatedTarget;a.viewport?.contains(t)||n()}})});L.displayName=N;var I="Toast",A=n.forwardRef((e,t)=>{let{forceMount:r,open:n,defaultOpen:o,onOpenChange:i,...s}=e,[l=!0,c]=(0,m.T)({prop:n,defaultProp:o,onChange:i});return(0,v.jsx)(u.z,{present:r||l,children:(0,v.jsx)(_,{open:l,...s,ref:t,onClose:()=>c(!1),onPause:(0,f.W)(e.onPause),onResume:(0,f.W)(e.onResume),onSwipeStart:(0,a.M)(e.onSwipeStart,e=>{e.currentTarget.setAttribute("data-swipe","start")}),onSwipeMove:(0,a.M)(e.onSwipeMove,e=>{let{x:t,y:r}=e.detail.delta;e.currentTarget.setAttribute("data-swipe","move"),e.currentTarget.style.setProperty("--radix-toast-swipe-move-x",`${t}px`),e.currentTarget.style.setProperty("--radix-toast-swipe-move-y",`${r}px`)}),onSwipeCancel:(0,a.M)(e.onSwipeCancel,e=>{e.currentTarget.setAttribute("data-swipe","cancel"),e.currentTarget.style.removeProperty("--radix-toast-swipe-move-x"),e.currentTarget.style.removeProperty("--radix-toast-swipe-move-y"),e.currentTarget.style.removeProperty("--radix-toast-swipe-end-x"),e.currentTarget.style.removeProperty("--radix-toast-swipe-end-y")}),onSwipeEnd:(0,a.M)(e.onSwipeEnd,e=>{let{x:t,y:r}=e.detail.delta;e.currentTarget.setAttribute("data-swipe","end"),e.currentTarget.style.removeProperty("--radix-toast-swipe-move-x"),e.currentTarget.style.removeProperty("--radix-toast-swipe-move-y"),e.currentTarget.style.setProperty("--radix-toast-swipe-end-x",`${t}px`),e.currentTarget.style.setProperty("--radix-toast-swipe-end-y",`${r}px`),c(!1)})})})});A.displayName=I;var[D,F]=E(I,{onClose(){}}),_=n.forwardRef((e,t)=>{let{__scopeToast:r,type:s="foreground",duration:l,open:d,onClose:u,onEscapeKeyDown:m,onPause:y,onResume:h,onSwipeStart:g,onSwipeMove:x,onSwipeCancel:b,onSwipeEnd:E,...T}=e,C=k(I,r),[S,$]=n.useState(null),P=(0,i.e)(t,e=>$(e)),M=n.useRef(null),N=n.useRef(null),L=l||C.duration,A=n.useRef(0),F=n.useRef(L),_=n.useRef(0),{onToastAdd:K,onToastRemove:z}=C,V=(0,f.W)(()=>{S?.contains(document.activeElement)&&C.viewport?.focus(),u()}),W=n.useCallback(e=>{e&&e!==1/0&&(window.clearTimeout(_.current),A.current=new Date().getTime(),_.current=window.setTimeout(V,e))},[V]);n.useEffect(()=>{let e=C.viewport;if(e){let t=()=>{W(F.current),h?.()},r=()=>{let e=new Date().getTime()-A.current;F.current=F.current-e,window.clearTimeout(_.current),y?.()};return e.addEventListener(R,r),e.addEventListener(j,t),()=>{e.removeEventListener(R,r),e.removeEventListener(j,t)}}},[C.viewport,L,y,h,W]),n.useEffect(()=>{d&&!C.isClosePausedRef.current&&W(L)},[d,L,C.isClosePausedRef,W]),n.useEffect(()=>(K(),()=>z()),[K,z]);let Z=n.useMemo(()=>S?function e(t){let r=[];return Array.from(t.childNodes).forEach(t=>{if(t.nodeType===t.TEXT_NODE&&t.textContent&&r.push(t.textContent),t.nodeType===t.ELEMENT_NODE){let n=t.ariaHidden||t.hidden||"none"===t.style.display,o=""===t.dataset.radixToastAnnounceExclude;if(!n){if(o){let e=t.dataset.radixToastAnnounceAlt;e&&r.push(e)}else r.push(...e(t))}}}),r}(S):null,[S]);return C.viewport?(0,v.jsxs)(v.Fragment,{children:[Z&&(0,v.jsx)(O,{__scopeToast:r,role:"status","aria-live":"foreground"===s?"assertive":"polite","aria-atomic":!0,children:Z}),(0,v.jsx)(D,{scope:r,onClose:V,children:o.createPortal((0,v.jsx)(w.ItemSlot,{scope:r,children:(0,v.jsx)(c.fC,{asChild:!0,onEscapeKeyDown:(0,a.M)(m,()=>{C.isFocusedToastEscapeKeyDownRef.current||V(),C.isFocusedToastEscapeKeyDownRef.current=!1}),children:(0,v.jsx)(p.WV.li,{role:"status","aria-live":"off","aria-atomic":!0,tabIndex:0,"data-state":d?"open":"closed","data-swipe-direction":C.swipeDirection,...T,ref:P,style:{userSelect:"none",touchAction:"none",...e.style},onKeyDown:(0,a.M)(e.onKeyDown,e=>{"Escape"!==e.key||(m?.(e.nativeEvent),e.nativeEvent.defaultPrevented||(C.isFocusedToastEscapeKeyDownRef.current=!0,V()))}),onPointerDown:(0,a.M)(e.onPointerDown,e=>{0===e.button&&(M.current={x:e.clientX,y:e.clientY})}),onPointerMove:(0,a.M)(e.onPointerMove,e=>{if(!M.current)return;let t=e.clientX-M.current.x,r=e.clientY-M.current.y,n=!!N.current,o=["left","right"].includes(C.swipeDirection),a=["left","up"].includes(C.swipeDirection)?Math.min:Math.max,i=o?a(0,t):0,s=o?0:a(0,r),l="touch"===e.pointerType?10:2,c={x:i,y:s},d={originalEvent:e,delta:c};n?(N.current=c,U("toast.swipeMove",x,d,{discrete:!1})):X(c,C.swipeDirection,l)?(N.current=c,U("toast.swipeStart",g,d,{discrete:!1}),e.target.setPointerCapture(e.pointerId)):(Math.abs(t)>l||Math.abs(r)>l)&&(M.current=null)}),onPointerUp:(0,a.M)(e.onPointerUp,e=>{let t=N.current,r=e.target;if(r.hasPointerCapture(e.pointerId)&&r.releasePointerCapture(e.pointerId),N.current=null,M.current=null,t){let r=e.currentTarget,n={originalEvent:e,delta:t};X(t,C.swipeDirection,C.swipeThreshold)?U("toast.swipeEnd",E,n,{discrete:!0}):U("toast.swipeCancel",b,n,{discrete:!0}),r.addEventListener("click",e=>e.preventDefault(),{once:!0})}})})})}),C.viewport)})]}):null}),O=e=>{let{__scopeToast:t,children:r,...o}=e,a=k(I,t),[i,s]=n.useState(!1),[l,c]=n.useState(!1);return function(e=()=>{}){let t=(0,f.W)(e);(0,y.b)(()=>{let e=0,r=0;return e=window.requestAnimationFrame(()=>r=window.requestAnimationFrame(t)),()=>{window.cancelAnimationFrame(e),window.cancelAnimationFrame(r)}},[t])}(()=>s(!0)),n.useEffect(()=>{let e=window.setTimeout(()=>c(!0),1e3);return()=>window.clearTimeout(e)},[]),l?null:(0,v.jsx)(d.h,{asChild:!0,children:(0,v.jsx)(h.T,{...o,children:i&&(0,v.jsxs)(v.Fragment,{children:[a.label," ",r]})})})},K=n.forwardRef((e,t)=>{let{__scopeToast:r,...n}=e;return(0,v.jsx)(p.WV.div,{...n,ref:t})});K.displayName="ToastTitle";var z=n.forwardRef((e,t)=>{let{__scopeToast:r,...n}=e;return(0,v.jsx)(p.WV.div,{...n,ref:t})});z.displayName="ToastDescription";var V="ToastAction",W=n.forwardRef((e,t)=>{let{altText:r,...n}=e;return r.trim()?(0,v.jsx)(q,{altText:r,asChild:!0,children:(0,v.jsx)(H,{...n,ref:t})}):(console.error(`Invalid prop \`altText\` supplied to \`${V}\`. Expected non-empty \`string\`.`),null)});W.displayName=V;var Z="ToastClose",H=n.forwardRef((e,t)=>{let{__scopeToast:r,...n}=e,o=F(Z,r);return(0,v.jsx)(q,{asChild:!0,children:(0,v.jsx)(p.WV.button,{type:"button",...n,ref:t,onClick:(0,a.M)(e.onClick,o.onClose)})})});H.displayName=Z;var q=n.forwardRef((e,t)=>{let{__scopeToast:r,altText:n,...o}=e;return(0,v.jsx)(p.WV.div,{"data-radix-toast-announce-exclude":"","data-radix-toast-announce-alt":n||void 0,...o,ref:t})});function U(e,t,r,{discrete:n}){let o=r.originalEvent.currentTarget,a=new CustomEvent(e,{bubbles:!0,cancelable:!0,detail:r});t&&o.addEventListener(e,t,{once:!0}),n?(0,p.jH)(o,a):o.dispatchEvent(a)}var X=(e,t,r=0)=>{let n=Math.abs(e.x),o=Math.abs(e.y),a=n>o;return"left"===t||"right"===t?a&&n>r:!a&&o>r};function B(e){let t=document.activeElement;return e.some(e=>e===t||(e.focus(),document.activeElement!==t))}var Y=S,J=M,G=A,Q=K,ee=z,et=W,er=H},95098:function(e,t,r){"use strict";r.d(t,{T:function(){return i}});var n=r(2265),o=r(66840),a=r(57437),i=n.forwardRef((e,t)=>(0,a.jsx)(o.WV.span,{...e,ref:t,style:{position:"absolute",border:0,width:1,height:1,padding:0,margin:-1,overflow:"hidden",clip:"rect(0, 0, 0, 0)",whiteSpace:"nowrap",wordWrap:"normal",...e.style}}));i.displayName="VisuallyHidden"},25922:function(e,t,r){"use strict";r.d(t,{f:function(){return l}});var n=r(2265),o=["light","dark"],a="(prefers-color-scheme: dark)",i="undefined"==typeof window,s=n.createContext(void 0),l=e=>n.useContext(s)?e.children:n.createElement(d,{...e}),c=["light","dark"],d=({forcedTheme:e,disableTransitionOnChange:t=!1,enableSystem:r=!0,enableColorScheme:i=!0,storageKey:l="theme",themes:d=c,defaultTheme:y=r?"system":"light",attribute:h="data-theme",value:v,children:g,nonce:w})=>{let[x,b]=n.useState(()=>p(l,y)),[E,T]=n.useState(()=>p(l)),C=v?Object.values(v):d,k=n.useCallback(e=>{let n=e;if(!n)return;"system"===e&&r&&(n=m());let a=v?v[n]:n,s=t?f():null,l=document.documentElement;if("class"===h?(l.classList.remove(...C),a&&l.classList.add(a)):a?l.setAttribute(h,a):l.removeAttribute(h),i){let e=o.includes(y)?y:null,t=o.includes(n)?n:e;l.style.colorScheme=t}null==s||s()},[]),S=n.useCallback(e=>{let t="function"==typeof e?e(e):e;b(t);try{localStorage.setItem(l,t)}catch(e){}},[e]),$=n.useCallback(t=>{T(m(t)),"system"===x&&r&&!e&&k("system")},[x,e]);n.useEffect(()=>{let e=window.matchMedia(a);return e.addListener($),$(e),()=>e.removeListener($)},[$]),n.useEffect(()=>{let e=e=>{e.key===l&&S(e.newValue||y)};return window.addEventListener("storage",e),()=>window.removeEventListener("storage",e)},[S]),n.useEffect(()=>{k(null!=e?e:x)},[e,x]);let P=n.useMemo(()=>({theme:x,setTheme:S,forcedTheme:e,resolvedTheme:"system"===x?E:x,themes:r?[...d,"system"]:d,systemTheme:r?E:void 0}),[x,S,e,E,r,d]);return n.createElement(s.Provider,{value:P},n.createElement(u,{forcedTheme:e,disableTransitionOnChange:t,enableSystem:r,enableColorScheme:i,storageKey:l,themes:d,defaultTheme:y,attribute:h,value:v,children:g,attrs:C,nonce:w}),g)},u=n.memo(({forcedTheme:e,storageKey:t,attribute:r,enableSystem:i,enableColorScheme:s,defaultTheme:l,value:c,attrs:d,nonce:u})=>{let p="system"===l,f="class"===r?`var d=document.documentElement,c=d.classList;c.remove(${d.map(e=>`'${e}'`).join(",")});`:`var d=document.documentElement,n='${r}',s='setAttribute';`,m=s?(o.includes(l)?l:null)?`if(e==='light'||e==='dark'||!e)d.style.colorScheme=e||'${l}'`:"if(e==='light'||e==='dark')d.style.colorScheme=e":"",y=(e,t=!1,n=!0)=>{let a=c?c[e]:e,i=t?e+"|| ''":`'${a}'`,l="";return s&&n&&!t&&o.includes(e)&&(l+=`d.style.colorScheme = '${e}';`),"class"===r?t||a?l+=`c.add(${i})`:l+="null":a&&(l+=`d[s](n,${i})`),l},h=e?`!function(){${f}${y(e)}}()`:i?`!function(){try{${f}var e=localStorage.getItem('${t}');if('system'===e||(!e&&${p})){var t='${a}',m=window.matchMedia(t);if(m.media!==t||m.matches){${y("dark")}}else{${y("light")}}}else if(e){${c?`var x=${JSON.stringify(c)};`:""}${y(c?"x[e]":"e",!0)}}${p?"":"else{"+y(l,!1,!1)+"}"}${m}}catch(e){}}()`:`!function(){try{${f}var e=localStorage.getItem('${t}');if(e){${c?`var x=${JSON.stringify(c)};`:""}${y(c?"x[e]":"e",!0)}}else{${y(l,!1,!1)};}${m}}catch(t){}}();`;return n.createElement("script",{nonce:u,dangerouslySetInnerHTML:{__html:h}})}),p=(e,t)=>{let r;if(!i){try{r=localStorage.getItem(e)||void 0}catch(e){}return r||t}},f=()=>{let e=document.createElement("style");return e.appendChild(document.createTextNode("*{-webkit-transition:none!important;-moz-transition:none!important;-o-transition:none!important;-ms-transition:none!important;transition:none!important}")),document.head.appendChild(e),()=>{window.getComputedStyle(document.body),setTimeout(()=>{document.head.removeChild(e)},1)}},m=e=>(e||(e=window.matchMedia(a)),e.matches?"dark":"light")},75186:function(e,t,r){"use strict";let n,o;r.d(t,{Toaster:function(){return eu},ZP:function(){return ep}});var a,i=r(2265);let s={data:""},l=e=>{if("object"==typeof window){let t=(e?e.querySelector("#_goober"):window._goober)||Object.assign(document.createElement("style"),{innerHTML:" ",id:"_goober"});return t.nonce=window.__nonce__,t.parentNode||(e||document.head).appendChild(t),t.firstChild}return e||s},c=/(?:([\u0080-\uFFFF\w-%@]+) *:? *([^{;]+?);|([^;}{]*?) *{)|(}\s*)/g,d=/\/\*[^]*?\*\/|  +/g,u=/\n+/g,p=(e,t)=>{let r="",n="",o="";for(let a in e){let i=e[a];"@"==a[0]?"i"==a[1]?r=a+" "+i+";":n+="f"==a[1]?p(i,a):a+"{"+p(i,"k"==a[1]?"":t)+"}":"object"==typeof i?n+=p(i,t?t.replace(/([^,])+/g,e=>a.replace(/([^,]*:\S+\([^)]*\))|([^,])+/g,t=>/&/.test(t)?t.replace(/&/g,e):e?e+" "+t:t)):a):null!=i&&(a=/^--/.test(a)?a:a.replace(/[A-Z]/g,"-$&").toLowerCase(),o+=p.p?p.p(a,i):a+":"+i+";")}return r+(t&&o?t+"{"+o+"}":o)+n},f={},m=e=>{if("object"==typeof e){let t="";for(let r in e)t+=r+m(e[r]);return t}return e},y=(e,t,r,n,o)=>{var a;let i=m(e),s=f[i]||(f[i]=(e=>{let t=0,r=11;for(;t<e.length;)r=101*r+e.charCodeAt(t++)>>>0;return"go"+r})(i));if(!f[s]){let t=i!==e?e:(e=>{let t,r,n=[{}];for(;t=c.exec(e.replace(d,""));)t[4]?n.shift():t[3]?(r=t[3].replace(u," ").trim(),n.unshift(n[0][r]=n[0][r]||{})):n[0][t[1]]=t[2].replace(u," ").trim();return n[0]})(e);f[s]=p(o?{["@keyframes "+s]:t}:t,r?"":"."+s)}let l=r&&f.g?f.g:null;return r&&(f.g=f[s]),a=f[s],l?t.data=t.data.replace(l,a):-1===t.data.indexOf(a)&&(t.data=n?a+t.data:t.data+a),s},h=(e,t,r)=>e.reduce((e,n,o)=>{let a=t[o];if(a&&a.call){let e=a(r),t=e&&e.props&&e.props.className||/^go/.test(e)&&e;a=t?"."+t:e&&"object"==typeof e?e.props?"":p(e,""):!1===e?"":e}return e+n+(null==a?"":a)},"");function v(e){let t=this||{},r=e.call?e(t.p):e;return y(r.unshift?r.raw?h(r,[].slice.call(arguments,1),t.p):r.reduce((e,r)=>Object.assign(e,r&&r.call?r(t.p):r),{}):r,l(t.target),t.g,t.o,t.k)}v.bind({g:1});let g,w,x,b=v.bind({k:1});function E(e,t){let r=this||{};return function(){let n=arguments;function o(a,i){let s=Object.assign({},a),l=s.className||o.className;r.p=Object.assign({theme:w&&w()},s),r.o=/ *go\d+/.test(l),s.className=v.apply(r,n)+(l?" "+l:""),t&&(s.ref=i);let c=e;return e[0]&&(c=s.as||e,delete s.as),x&&c[0]&&x(s),g(c,s)}return t?t(o):o}}var T=e=>"function"==typeof e,C=(e,t)=>T(e)?e(t):e,k=(n=0,()=>(++n).toString()),S=()=>{if(void 0===o&&"u">typeof window){let e=matchMedia("(prefers-reduced-motion: reduce)");o=!e||e.matches}return o},$=new Map,P=e=>{if($.has(e))return;let t=setTimeout(()=>{$.delete(e),L({type:4,toastId:e})},1e3);$.set(e,t)},R=e=>{let t=$.get(e);t&&clearTimeout(t)},j=(e,t)=>{switch(t.type){case 0:return{...e,toasts:[t.toast,...e.toasts].slice(0,20)};case 1:return t.toast.id&&R(t.toast.id),{...e,toasts:e.toasts.map(e=>e.id===t.toast.id?{...e,...t.toast}:e)};case 2:let{toast:r}=t;return e.toasts.find(e=>e.id===r.id)?j(e,{type:1,toast:r}):j(e,{type:0,toast:r});case 3:let{toastId:n}=t;return n?P(n):e.toasts.forEach(e=>{P(e.id)}),{...e,toasts:e.toasts.map(e=>e.id===n||void 0===n?{...e,visible:!1}:e)};case 4:return void 0===t.toastId?{...e,toasts:[]}:{...e,toasts:e.toasts.filter(e=>e.id!==t.toastId)};case 5:return{...e,pausedAt:t.time};case 6:let o=t.time-(e.pausedAt||0);return{...e,pausedAt:void 0,toasts:e.toasts.map(e=>({...e,pauseDuration:e.pauseDuration+o}))}}},M=[],N={toasts:[],pausedAt:void 0},L=e=>{N=j(N,e),M.forEach(e=>{e(N)})},I={blank:4e3,error:4e3,success:2e3,loading:1/0,custom:4e3},A=(e={})=>{let[t,r]=(0,i.useState)(N);(0,i.useEffect)(()=>(M.push(r),()=>{let e=M.indexOf(r);e>-1&&M.splice(e,1)}),[t]);let n=t.toasts.map(t=>{var r,n;return{...e,...e[t.type],...t,duration:t.duration||(null==(r=e[t.type])?void 0:r.duration)||(null==e?void 0:e.duration)||I[t.type],style:{...e.style,...null==(n=e[t.type])?void 0:n.style,...t.style}}});return{...t,toasts:n}},D=(e,t="blank",r)=>({createdAt:Date.now(),visible:!0,type:t,ariaProps:{role:"status","aria-live":"polite"},message:e,pauseDuration:0,...r,id:(null==r?void 0:r.id)||k()}),F=e=>(t,r)=>{let n=D(t,e,r);return L({type:2,toast:n}),n.id},_=(e,t)=>F("blank")(e,t);_.error=F("error"),_.success=F("success"),_.loading=F("loading"),_.custom=F("custom"),_.dismiss=e=>{L({type:3,toastId:e})},_.remove=e=>L({type:4,toastId:e}),_.promise=(e,t,r)=>{let n=_.loading(t.loading,{...r,...null==r?void 0:r.loading});return e.then(e=>(_.success(C(t.success,e),{id:n,...r,...null==r?void 0:r.success}),e)).catch(e=>{_.error(C(t.error,e),{id:n,...r,...null==r?void 0:r.error})}),e};var O=(e,t)=>{L({type:1,toast:{id:e,height:t}})},K=()=>{L({type:5,time:Date.now()})},z=e=>{let{toasts:t,pausedAt:r}=A(e);(0,i.useEffect)(()=>{if(r)return;let e=Date.now(),n=t.map(t=>{if(t.duration===1/0)return;let r=(t.duration||0)+t.pauseDuration-(e-t.createdAt);if(r<0){t.visible&&_.dismiss(t.id);return}return setTimeout(()=>_.dismiss(t.id),r)});return()=>{n.forEach(e=>e&&clearTimeout(e))}},[t,r]);let n=(0,i.useCallback)(()=>{r&&L({type:6,time:Date.now()})},[r]),o=(0,i.useCallback)((e,r)=>{let{reverseOrder:n=!1,gutter:o=8,defaultPosition:a}=r||{},i=t.filter(t=>(t.position||a)===(e.position||a)&&t.height),s=i.findIndex(t=>t.id===e.id),l=i.filter((e,t)=>t<s&&e.visible).length;return i.filter(e=>e.visible).slice(...n?[l+1]:[0,l]).reduce((e,t)=>e+(t.height||0)+o,0)},[t]);return{toasts:t,handlers:{updateHeight:O,startPause:K,endPause:n,calculateOffset:o}}},V=b`
from {
  transform: scale(0) rotate(45deg);
	opacity: 0;
}
to {
 transform: scale(1) rotate(45deg);
  opacity: 1;
}`,W=b`
from {
  transform: scale(0);
  opacity: 0;
}
to {
  transform: scale(1);
  opacity: 1;
}`,Z=b`
from {
  transform: scale(0) rotate(90deg);
	opacity: 0;
}
to {
  transform: scale(1) rotate(90deg);
	opacity: 1;
}`,H=E("div")`
  width: 20px;
  opacity: 0;
  height: 20px;
  border-radius: 10px;
  background: ${e=>e.primary||"#ff4b4b"};
  position: relative;
  transform: rotate(45deg);

  animation: ${V} 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)
    forwards;
  animation-delay: 100ms;

  &:after,
  &:before {
    content: '';
    animation: ${W} 0.15s ease-out forwards;
    animation-delay: 150ms;
    position: absolute;
    border-radius: 3px;
    opacity: 0;
    background: ${e=>e.secondary||"#fff"};
    bottom: 9px;
    left: 4px;
    height: 2px;
    width: 12px;
  }

  &:before {
    animation: ${Z} 0.15s ease-out forwards;
    animation-delay: 180ms;
    transform: rotate(90deg);
  }
`,q=b`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`,U=E("div")`
  width: 12px;
  height: 12px;
  box-sizing: border-box;
  border: 2px solid;
  border-radius: 100%;
  border-color: ${e=>e.secondary||"#e0e0e0"};
  border-right-color: ${e=>e.primary||"#616161"};
  animation: ${q} 1s linear infinite;
`,X=b`
from {
  transform: scale(0) rotate(45deg);
	opacity: 0;
}
to {
  transform: scale(1) rotate(45deg);
	opacity: 1;
}`,B=b`
0% {
	height: 0;
	width: 0;
	opacity: 0;
}
40% {
  height: 0;
	width: 6px;
	opacity: 1;
}
100% {
  opacity: 1;
  height: 10px;
}`,Y=E("div")`
  width: 20px;
  opacity: 0;
  height: 20px;
  border-radius: 10px;
  background: ${e=>e.primary||"#61d345"};
  position: relative;
  transform: rotate(45deg);

  animation: ${X} 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)
    forwards;
  animation-delay: 100ms;
  &:after {
    content: '';
    box-sizing: border-box;
    animation: ${B} 0.2s ease-out forwards;
    opacity: 0;
    animation-delay: 200ms;
    position: absolute;
    border-right: 2px solid;
    border-bottom: 2px solid;
    border-color: ${e=>e.secondary||"#fff"};
    bottom: 6px;
    left: 6px;
    height: 10px;
    width: 6px;
  }
`,J=E("div")`
  position: absolute;
`,G=E("div")`
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  min-width: 20px;
  min-height: 20px;
`,Q=b`
from {
  transform: scale(0.6);
  opacity: 0.4;
}
to {
  transform: scale(1);
  opacity: 1;
}`,ee=E("div")`
  position: relative;
  transform: scale(0.6);
  opacity: 0.4;
  min-width: 20px;
  animation: ${Q} 0.3s 0.12s cubic-bezier(0.175, 0.885, 0.32, 1.275)
    forwards;
`,et=({toast:e})=>{let{icon:t,type:r,iconTheme:n}=e;return void 0!==t?"string"==typeof t?i.createElement(ee,null,t):t:"blank"===r?null:i.createElement(G,null,i.createElement(U,{...n}),"loading"!==r&&i.createElement(J,null,"error"===r?i.createElement(H,{...n}):i.createElement(Y,{...n})))},er=e=>`
0% {transform: translate3d(0,${-200*e}%,0) scale(.6); opacity:.5;}
100% {transform: translate3d(0,0,0) scale(1); opacity:1;}
`,en=e=>`
0% {transform: translate3d(0,0,-1px) scale(1); opacity:1;}
100% {transform: translate3d(0,${-150*e}%,-1px) scale(.6); opacity:0;}
`,eo=E("div")`
  display: flex;
  align-items: center;
  background: #fff;
  color: #363636;
  line-height: 1.3;
  will-change: transform;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.1), 0 3px 3px rgba(0, 0, 0, 0.05);
  max-width: 350px;
  pointer-events: auto;
  padding: 8px 10px;
  border-radius: 8px;
`,ea=E("div")`
  display: flex;
  justify-content: center;
  margin: 4px 10px;
  color: inherit;
  flex: 1 1 auto;
  white-space: pre-line;
`,ei=(e,t)=>{let r=e.includes("top")?1:-1,[n,o]=S()?["0%{opacity:0;} 100%{opacity:1;}","0%{opacity:1;} 100%{opacity:0;}"]:[er(r),en(r)];return{animation:t?`${b(n)} 0.35s cubic-bezier(.21,1.02,.73,1) forwards`:`${b(o)} 0.4s forwards cubic-bezier(.06,.71,.55,1)`}},es=i.memo(({toast:e,position:t,style:r,children:n})=>{let o=e.height?ei(e.position||t||"top-center",e.visible):{opacity:0},a=i.createElement(et,{toast:e}),s=i.createElement(ea,{...e.ariaProps},C(e.message,e));return i.createElement(eo,{className:e.className,style:{...o,...r,...e.style}},"function"==typeof n?n({icon:a,message:s}):i.createElement(i.Fragment,null,a,s))});a=i.createElement,p.p=void 0,g=a,w=void 0,x=void 0;var el=({id:e,className:t,style:r,onHeightUpdate:n,children:o})=>{let a=i.useCallback(t=>{if(t){let r=()=>{n(e,t.getBoundingClientRect().height)};r(),new MutationObserver(r).observe(t,{subtree:!0,childList:!0,characterData:!0})}},[e,n]);return i.createElement("div",{ref:a,className:t,style:r},o)},ec=(e,t)=>{let r=e.includes("top"),n=e.includes("center")?{justifyContent:"center"}:e.includes("right")?{justifyContent:"flex-end"}:{};return{left:0,right:0,display:"flex",position:"absolute",transition:S()?void 0:"all 230ms cubic-bezier(.21,1.02,.73,1)",transform:`translateY(${t*(r?1:-1)}px)`,...r?{top:0}:{bottom:0},...n}},ed=v`
  z-index: 9999;
  > * {
    pointer-events: auto;
  }
`,eu=({reverseOrder:e,position:t="top-center",toastOptions:r,gutter:n,children:o,containerStyle:a,containerClassName:s})=>{let{toasts:l,handlers:c}=z(r);return i.createElement("div",{style:{position:"fixed",zIndex:9999,top:16,left:16,right:16,bottom:16,pointerEvents:"none",...a},className:s,onMouseEnter:c.startPause,onMouseLeave:c.endPause},l.map(r=>{let a=r.position||t,s=ec(a,c.calculateOffset(r,{reverseOrder:e,gutter:n,defaultPosition:t}));return i.createElement(el,{id:r.id,key:r.id,onHeightUpdate:c.updateHeight,className:r.visible?ed:"",style:s},"custom"===r.type?C(r.message,r):o?o(r):i.createElement(es,{toast:r,position:a}))}))},ep=_}}]);
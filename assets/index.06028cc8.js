var Et=Object.defineProperty,St=Object.defineProperties;var qt=Object.getOwnPropertyDescriptors;var ge=Object.getOwnPropertySymbols;var Pt=Object.prototype.hasOwnProperty,Lt=Object.prototype.propertyIsEnumerable;var be=(n,e,t)=>e in n?Et(n,e,{enumerable:!0,configurable:!0,writable:!0,value:t}):n[e]=t,V=(n,e)=>{for(var t in e||(e={}))Pt.call(e,t)&&be(n,t,e[t]);if(ge)for(var t of ge(e))Lt.call(e,t)&&be(n,t,e[t]);return n},In=(n,e)=>St(n,qt(e));import{R as Vn,P as zt,a as Rt}from"./vendor.f4562c12.js";const jt=function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const s of document.querySelectorAll('link[rel="modulepreload"]'))r(s);new MutationObserver(s=>{for(const a of s)if(a.type==="childList")for(const o of a.addedNodes)o.tagName==="LINK"&&o.rel==="modulepreload"&&r(o)}).observe(document,{childList:!0,subtree:!0});function t(s){const a={};return s.integrity&&(a.integrity=s.integrity),s.referrerpolicy&&(a.referrerPolicy=s.referrerpolicy),s.crossorigin==="use-credentials"?a.credentials="include":s.crossorigin==="anonymous"?a.credentials="omit":a.credentials="same-origin",a}function r(s){if(s.ep)return;s.ep=!0;const a=t(s);fetch(s.href,a)}};jt();const ve=()=>g.varId++,Wn=()=>g.tyVarId++,g={varId:0,tyVarId:0,instances:new Map,datatypes:new Map,typeclasses:new Map,typeClassMethods:new Map,typeClassMethodsOccs:new Map,identifiers:new Map},At=()=>{g.varId=0,g.tyVarId=0,g.instances.clear(),g.datatypes.clear(),g.typeclasses.clear(),g.typeClassMethods.clear(),g.typeClassMethodsOccs.clear(),g.identifiers.clear()},fn=n=>n!==void 0,Gn=n=>n===void 0,Xn=void 0,Fe=(n,e,t)=>fn(n)?e(n):t,pn=(n,e)=>{const t=[];for(let r=0;r<n;r++)t.push(e(r));return t},Dt=(n="")=>{throw Error(`Code marked as unreachable was reached: ${n}`)};function Ut(n,e,t){return n[e]=t,n}function*_e(n,e){const t=Math.min(n.length,e.length);for(let r=0;r<t;r++)yield[n[r],e[r]]}function Jt(n,e){for(const t of n)if(e(t))return!0;return!1}function*$e(n){let e=0;for(const t of n)yield[t,e++]}function*Wt(n,e){for(let t=0;t<e;t++)yield n}function Zn(n){return n[0]}function Mn(n){return n.slice(1)}function an(n){return[Zn(n),Mn(n)]}function Gt(n,e){return n.size===e.size&&!Jt(n.keys(),t=>!e.has(t))}function we(n,e,t){if(e<0||t<0||e>=n.length||t>=n.length)throw new Error(`invalid swap indices, len: ${n.length}, i: ${e}, j: ${t}`);const r=n[e];n[e]=n[t],n[t]=r}const Xt=n=>JSON.parse(JSON.stringify(n)),Oe=(n,e)=>{const t=new Map;for(const[r,s]of n)t.set(r,e(s,r));return t},Zt=(n,e)=>{for(const t of n)if(e(t))return t;return Xn},Ht=(n,e)=>{if(n.length!==e.length)return!1;const t=new Set(n),r=new Set(e);for(const s of t)if(!r.has(s))return!1;return!0},Hn=n=>new Map(Object.entries(n)),xe=n=>{let e=Xn;return()=>(Gn(e)&&(e=n()),e)};function Z(n,e=""){if(!n)throw new Error(`assertion failed: ${e}`)}const u=n=>({type:"ok",value:n}),O=n=>({type:"error",value:n}),Bn=n=>n.type==="ok",b=n=>n.type==="error",c=(n,e)=>b(n)?n:e(n.value),Kn=(n,e,t)=>b(n)?n:b(e)?e:t([n.value,e.value]),Kt=(n,e,t,r)=>b(n)?n:b(e)?e:b(t)?t:r([n.value,e.value,t.value]),Qt=(n,e)=>b(n)?n:u(e(n.value)),Ne=(n,e)=>{const t=[];for(const r of n){if(b(r))return r;t.push(e(r.value))}return u(t)},Qn=n=>Ne(n,e=>e),Yn=(n,e,t)=>{let r=u(t);return n.forEach((s,a)=>{if(b(r))return r;r=e(r.value,s,a)}),r},Yt=n=>{if(b(n))throw new Error(n.value);return n.value},nr=()=>({}),er=(n,e)=>n[e]!==void 0,tr=(n,e)=>n[e],rr=(n,e,t)=>In(V({},n),{[e]:t}),sr=(n,e,t)=>(n[e]=t,n),ar=(n,e)=>{const t=V({},n);return delete t[e],t},or=(n,e)=>V(V({},n),e),cr=(n,e)=>{const t={};for(const[r,s]of Object.entries(n)){const a=e(s);if(b(a))return a;t[r]=a.value}return u(t)},ne=(n,e)=>Ce([[n,e]]),ir=(n,e)=>Ce([[n,e]],!0),ee=(n,e)=>{if(R(e))for(const t of n)e.context.includes(t)||e.context.push(t);else for(const t of n){const r=lr(t,e);if(b(r))return r}return u("()")},lr=(n,e)=>{const t=ur(e.name,n);if(b(t))return t;for(const r of e.args)ee([n],r);return u("()")},ur=(n,e)=>{var r,s;const{instances:t}=g;return!((r=t.get(e))==null?void 0:r.includes(n))&&!((s=t.get(e))==null?void 0:s.includes("*"))?O(`no instance of class ${e} found for ${n}`):u("()")};function x(n,e,t=[]){if(R(n))if(e[n.value]!==void 0&&!t.includes(n.value)){const r=e[n.value];return R(r)&&r.value===n.value&&Ht(r.context,n.context)?u(V({},n)):c(x(r,e,t),s=>{const a=ee(n.context,s);return b(a)?a:u(s)})}else return u(V({},n));return c(Qn(n.args.map(r=>x(r,e,t))),r=>u(B(n.name,...r)))}const kn=(n,e=new Set)=>{if(R(n))return e.add(n.value),e;for(const t of n.args)kn(t,e);return e},fr=({polyVars:n,ty:e},t=new Set)=>{const r=kn(e,t);for(const s of r)n.includes(s)&&r.delete(s);return r},pr=n=>{const e=new Set;for(const t of Object.values(n))fr(t,e);return e};function mr(n,e){return c(x(n.ty,e,n.polyVars),t=>u(d(t,...n.polyVars)))}const Q=(n,e)=>cr(n,t=>mr(t,e)),U=(n,...e)=>{let t=V({},n);for(const r of e){const s=dr(t,r);if(b(s))return s;t=s.value}return u(t)},dr=(n,e)=>{const t={};for(const[r,s]of Object.entries(n)){const a=x(s,e);if(b(a))return a;t[r]=a.value}for(const[r,s]of Object.entries(e))t[r]=s;return u(t)},Te=(n,e)=>R(e)?n.value===e.value:e.args.some(t=>Te(n,t)),Ce=(n,e=!1)=>{const t={};for(;n.length>0;){const[r,s]=n.pop();if(!Ve(r,s)){if(R(r)){if(Te(r,s))return O("occur_check");{const a=ee(r.context,s);if(b(a))return a;t[r.value]=s;for(let o=0;o<n.length;o++){const i=x(n[o][0],t);if(b(i))return i;const p=x(n[o][1],t);if(b(p))return p;n[o][0]=i.value,n[o][1]=p.value}continue}}if(!e&&R(s)){n.push([s,r]);continue}if(Y(r)&&Y(s)&&r.name===s.name&&r.args.length==s.args.length){for(let a=0;a<r.args.length;a++)n.push([r.args[a],s.args[a]]);continue}return O("no_rule_applies")}}return u(t)},hr=(n,e)=>{const t={};for(let r=0;r<Math.min(n.length,e.length);r++)t[n[r]]=e[r];return t},yr=n=>`{ ${Object.entries(n).map(([e,t])=>`${Be(on(parseInt(e)))} : ${W(t)}`).join(", ")} }`,on=(n,e=[])=>({value:n,context:e}),B=(n,...e)=>({name:n,args:e}),gr=()=>{const n=new Map;return{name:e=>(n.has(e)||n.set(e,on(Wn())),n.get(e)),reset:()=>{n.clear()}}};function d(n,...e){return{ty:n,polyVars:e.map(t=>typeof t=="number"?t:t.value)}}function R(n){return n.context!==void 0}function Y(n){return n.args!==void 0}const J=()=>on(Wn()),mn=({polyVars:n,ty:e})=>{const t=n.map(J);return x(e,hr(n,t))},Ie=(n,e)=>{const t=pr(n),r=[...kn(e)].filter(s=>!t.has(s));return d(e,...r)},Ve=(n,e)=>Y(n)&&Y(e)?n.name===e.name&&n.args.length===e.args.length&&n.args.every((t,r)=>Ve(t,e.args[r])):R(n)&&R(e)?n.value===e.value:!1,Me=n=>R(n)?n.context.length>0:n.args.some(Me),W=n=>R(n)?Be(n):br(n);function Be(n){const e=typeof n=="number"?n:n.value,t=String.fromCharCode(945+e%23);return e>=23?t+`${Math.floor(e/23)}`:t}const br=n=>{switch(n.name){case"->":return`${W(n.args[0])} -> ${W(n.args[1])}`;case"tuple":return`(${n.args.map(W).join(", ")})`}return n.args.length===0?n.name:`${n.name} ${n.args.map(e=>W(e)).join(" ")}`},En=(n,e=new Map)=>{if(R(n)){if(e.has(n.value))return e.get(n.value);{const t=on(e.size,n.context);return e.set(n.value,t),t}}return B(n.name,...n.args.map(t=>En(t,e)))},te=(n,e=[])=>{if(R(n))return[...e,"*"];n.name!=="->"&&e.push(n.name);for(const t of n.args)te(t,e);return e},_=B("Int"),N=B("Float"),j=B("Bool"),vn=B("Char"),ke=B("()"),Ee=B("List",vn);function $(...n){Z(n.length>0);const e=n.length===1?ke:n[0],t=n.length===1?[n[0]]:n.slice(1);return Se(e,...t)}const Se=(n,...e)=>e.length===1?B("->",n,e[0]):B("->",n,Se(e[0],...e.slice(1))),qe=n=>Y(n)&&n.name==="->"?qe(n.args[1]):n,Pe=n=>Y(n)&&n.name==="->"?[n.args[0],...Pe(n.args[1])]:[n],Fn=$(_,_,_),Sn=$(_,_,j),vr=n=>{const e=pn(n,()=>J());return d($(...e,B("tuple",...e)),...e)},Fr=n=>{switch(n.kind){case"integer":return d(_);case"float":return d(N);case"char":return d(vn)}};d(Fn),d(Fn),d(Fn),d(Fn),d(Fn),d(Sn),d(Sn),d(Sn),d(Sn),d($(on(0),$(on(0),j)),on(0));const _r={plusInt:d($(_,_,_)),minusInt:d($(_,_,_)),timesInt:d($(_,_,_)),divideInt:d($(_,_,_)),modInt:d($(_,_,_)),eqInt:d($(_,_,j)),lssInt:d($(_,_,j)),leqInt:d($(_,_,j)),gtrInt:d($(_,_,j)),geqInt:d($(_,_,j)),stringOfInt:d($(_,Ee)),plusFloat:d($(N,N,N)),minusFloat:d($(N,N,N)),timesFloat:d($(N,N,N)),divideFloat:d($(N,N,N)),eqFloat:d($(N,N,j)),lssFloat:d($(N,N,j)),leqFloat:d($(N,N,j)),gtrFloat:d($(N,N,j)),geqFloat:d($(N,N,j)),floatOfInt:d($(_,N)),stringOfFloat:d($(N,Ee)),eqChar:d($(vn,vn,j))},re=Hn(_r);function $r(n){return re.has(n)}const wr=xe(()=>{const n=nr();for(const[e,t]of re.entries())sr(n,e,t);return n}),Or=n=>({value:n,id:ve()}),xr=n=>({value:n.name,id:n.id}),qn=n=>({type:"variable",name:n.value,id:n.id});function G(n){return typeof n.value=="string"}const Le=(n,e=new Set)=>{if(G(n))return e.add(n),e;for(const t of n.args)Le(t,e);return e},nn=(n,e,t)=>{const r=ne(n,e);return b(r)?O(`${r.value} : cannot unify ${W(n)} with ${W(e)} in pattern "${_n(t)}"`):r},ze=(n,e,t,r)=>{if(G(e))if(g.datatypes.has(e.value)){const l=g.datatypes.get(e.value);return c(mn(l),h=>nn(t,h,e))}else{if(r[e.value]!==void 0)return c(mn(r[e.value]),l=>nn(t,l,e));{const l=J();return r[e.value]=d(l),nn(t,l,e)}}if(e.name==="_")return nn(t,J(),e);if(/[0-9]+/.test(e.name))return nn(t,_,e);if(/[0-9]*\.[0-9]+/.test(e.name))return nn(t,N,e);if(e.name[0]==="'")return nn(t,vn,e);if(e.name!=="tuple"&&!g.datatypes.has(e.name))return O(`unknown variant: ${e.name} in pattern "${_n(e)}"`);const s=e.name==="tuple"?vr(e.args.length):g.datatypes.get(e.name),a=mn(s);if(b(a))return a;const o=Pe(a.value),i=o.pop(),p=Yn(o,([l,h],T,C)=>c(x(T,l),F=>c(ze(h,e.args[C],F,r),m=>c(Q(h,m),X=>c(U(m,l),Un=>u([Un,X]))))),[{},n]);return c(p,([l])=>c(x(i,l),h=>c(x(t,l),T=>c(nn(h,T,e),C=>U(C,l)))))},_n=n=>G(n)?n.value:n.args.length===0?n.name:n.name==="tuple"?`(${n.args.map(_n).join(", ")})`:`${n.name} ${n.args.map(_n).join(" ")}`,M=n=>Nr(n),Nr=n=>({type:"variable",name:n,id:ve()}),en=(n,e)=>Re([...n].reverse(),e),Re=(n,e)=>{if(Z(n.length>0,"lambdaOf called with a function with no arguments"),n.length===1)return{type:"lambda",arg:n[0],body:e};const[t,r]=[n[0],n.slice(1)];return Re(r,{type:"lambda",arg:t,body:e})},je=n=>Ae(n),Tr=M("Cons"),Cr=M("Nil"),Ae=n=>n.length===0?Cr:{type:"app",lhs:{type:"app",lhs:Tr,rhs:n[0]},rhs:Ae(n.slice(1))},$n=(...n)=>{Z(n.length>1);const e=n.pop();return{type:"app",lhs:n.length>1?$n(...n):n[0],rhs:e}},Ir={".":"dot","-":"minus","~":"tilde","+":"plus","*":"star","&":"ampersand","|":"pipe","/":"slash","\\":"backslash","^":"caret","%":"percent","\xB0":"num",$:"dollar","@":"at","#":"hash",";":"semicolon",":":"colon",_:"underscore","=":"eq","'":"prime",">":"gtr","<":"lss","!":"exclamation"},De=Hn(Ir),Vr=()=>({type:"fail"}),Mr=(n,e)=>({type:"leaf",action:n,bindings:e}),Br=(n,e)=>({type:"switch",occurence:n,tests:e}),tn="_",Ue=n=>G(n)||n.name==="_"?tn:{name:n.name,args:n.args.map(Ue)},kr=n=>[Ue(n)],Er=(n,e={},t=0)=>{if(G(n))return Ut(e,n.value,{type:"subterm",index:t,pos:[]});for(const[r,s]of $e(n.args))Je(r,e,s,{type:"subterm",index:t,pos:[]});return e},Je=(n,e,t=0,r)=>{const s={type:"subterm",index:r.index,pos:[...r.pos,t]};if(G(n))e[n.value]=s;else for(const[a,o]of $e(n.args))Je(a,e,o,s)},Sr=({expr:n,pattern:e})=>{const t={};return Er([e][0],t,-1),{action:A(n),bindings:t}},qr=n=>{const e=n.cases.map(t=>kr(t.pattern));return{patterns:e,dims:[n.cases.length,e[0].length],actions:n.cases.map(Sr)}},Pr=(n,e,t)=>{const[r,s]=an(n);if(r===tn)return[...Wt(tn,t),...s];if(r.name===e)return[...r.args,...s]},Lr=(n,e,t)=>{const r=n.patterns.map(a=>Pr(a,e,t)),s=[..._e(r,n.actions)].filter(([a,o])=>a).map(([a,o])=>o);return{patterns:r.filter(fn),dims:[s.length,t+n.dims[1]-1],actions:s}},zr=n=>{const[e,t]=an(n);if(e===tn)return t},Rr=n=>{const e=n.patterns.map(zr),t=[..._e(e,n.actions)].filter(([r,s])=>r).map(([r,s])=>s);return{patterns:e.filter(fn),dims:[t.length,n.dims[1]-1],actions:t}},We=(n,e)=>{const t=[];for(const r of n.patterns)t.push(r[e]);return t},jr=n=>{for(let e=0;e<n.dims[1];e++)if(We(n,e).some(t=>t!==tn))return e;return Dt("No valid column found"),0},Ar=(n,e)=>{for(const t of n.patterns)we(t,0,e)},Dr=n=>{const e=new Map;for(const t of n)t!==tn&&e.set(t.name,t.args.length);return e};let Ur=0;const Jr=(n,e,t)=>{const r=[{index:-1,pos:[],argIndex:Ur++}];return se(r,e,t)},se=(n,e,t)=>{const[r,s]=e.dims;if(r===0)return Vr();if(r>0&&(s===0||e.patterns[0].every(l=>l===tn)))return Mr(e.actions[0].action,e.actions[0].bindings);const a=jr(e);a!==0&&(we(n,0,a),Ar(e,a));const o=We(e,0),i=Dr(o),p=[];for(const[l,h]of i){const T=[...pn(h,F=>({index:n[0].index,pos:[...n[0].pos,F],argIndex:0}))],C=se([...T,...Mn(n)],Lr(e,l,h),t);p.push([l,C])}if(!Gt(i,t)){const l=se(Mn(n),Rr(e),t);p.push([tn,l])}return Br(Zn(n),p)},Wr=n=>{const e=[];for(const t of n){const r=Gr(t);fn(r)&&e.push(...r)}return e},Gr=n=>{switch(n.type){case"fun":return[{type:"fun",name:n.funName.name,args:n.args.map(t=>t.name),body:A(n.body)}];case"datatype":return n.variants.map(t=>{const r=pn(t.args.length,a=>`v${a}`),s={type:"tyconst",name:t.name,args:r.map(a=>({type:"variable",name:a}))};return{type:"fun",name:t.name,args:r,body:s}})}},A=n=>{switch(n.type){case"app":return{type:"app",lhs:A(n.lhs),rhs:A(n.rhs)};case"case_of":{const e=qr(n),t=Jr(n.arity,e,new Set);return{type:"switch",value:A(n.value),dt:t}}case"constant":return n;case"if_then_else":return{type:"if_then_else",cond:A(n.cond),thenBranch:A(n.thenBranch),elseBranch:A(n.elseBranch)};case"lambda":return{type:"lambda",arg:n.arg.name,body:A(n.body)};case"let_in":return{type:"let_in",left:n.left.name,middle:A(n.middle),right:A(n.right)};case"let_rec_in":return{type:"let_rec_in",arg:n.arg.name,funName:n.funName.name,middle:A(n.middle),right:A(n.right)};case"tyconst":return{type:"tyconst",name:n.name,args:n.args.map(A)};case"variable":return n}},Xr=`
    function plusInt(a) {
        return b => a + b;
    }
`,Zr=`
    function minusInt(a) {
        return b => a - b;
    }
`,Hr=`
    function timesInt(a) {
        return b => a * b;
    }
`,Kr=`
    function divideInt(a) {
        return b => Math.floor(a / b);
    }
`,Qr=`
    function modInt(a) {
        return b => a % b;
    }
`,Yr=`
    function eqInt(a) {
        return b => a === b;
    }
`,ns=`
    function lssInt(a) {
        return b => a < b;
    }
`,es=`
    function leqInt(a) {
        return b => a <= b;
    }
`,ts=`
    function gtrInt(a) {
        return b => a > b;
    }
`,rs=`
    function geqInt(a) {
        return b => a >= b;
    }
`,ss=`
    function stringOfInt(n) {
        let res = { name: "Nil", args: [] };
        const chars = n.toString();

        for (let i = chars.length - 1; i >= 0; i--) {
            res = { name: "Cons", args: [chars[i], res] };
        }

        return res;
    }
`,as=`
    function plusFloat(a) {
        return b => a + b;
    }
`,os=`
    function minusFloat(a) {
        return b => a + b;
    }
`,cs=`
    function timesFloat(a) {
        return b => a * b;
    }
`,is=`
    function divideFloat(a) {
        return b => a / b;
    }
`,ls=`
    function eqFloat(a) {
        return b => a === b;
    }
`,us=`
    function lssFloat(a) {
        return b => a < b;
    }
`,fs=`
    function leqFloat(a) {
        return b => a <= b;
    }
`,ps=`
    function gtrFloat(a) {
        return b => a > b;
    }
`,ms=`
    function gtrFloat(a) {
        return b => a >= b;
    }
`,ds=`
    function stringOfFloat(n) {
        let res =  { name: "Nil", args: [] };
        const chars = n.toString();

        for (let i = chars.length - 1; i >= 0; i--) {
            res = { name: "Cons", args: [chars[i], res] };
        }

        return res;
    }
`,hs=`
    function floatOfInt(n) {
        return n;
    }
`,ys=`
    function eqChar(a) {
        return b => a === b;
    }
`,gs={plusInt:Xr,minusInt:Zr,timesInt:Hr,divideInt:Kr,modInt:Qr,eqInt:Yr,lssInt:ns,leqInt:es,gtrInt:ts,geqInt:rs,stringOfInt:ss,plusFloat:as,minusFloat:os,timesFloat:cs,divideFloat:is,eqFloat:ls,lssFloat:us,leqFloat:fs,gtrFloat:ps,geqFloat:ms,stringOfFloat:ds,floatOfInt:hs,eqChar:ys},bs=xe(()=>Hn(gs)),wn=n=>n==="eval"?"eval_":n.split("").map(e=>De.has(e)?e==="_"?"_":`_${De.get(e)}_`:e).join(""),ae=new Set,vs=n=>{ae.clear();const e=[],t=Wr(n);for(const s of t)(s.type==="fun"||g.datatypes.has(s.name))&&e.push(Fs(s));return[[...ae].map(s=>bs().get(s).trim()),e].map(s=>s.join(`

`)).join(`

`)},Fs=n=>{var e;switch(n.type){case"fun":if(n.args.length===0)return g.datatypes.has(n.name)?`const ${wn(n.name)} = { name: "${n.name}", args: [] };`:`const ${wn(n.name)} = ${E(n.body)};`;const t=Mn(n.args);return`function ${wn(n.name)}(${(e=Zn(n.args))!=null?e:""}) {
                return ${E(t.length>0?en(t,n.body):n.body)};
            }`}},E=n=>{switch(n.type){case"variable":return n.name==="True"?"true":n.name==="False"?"false":$r(n.name)?(ae.add(n.name),n.name):wn(n.name);case"tyconst":return`({ name: "${n.name}", args: [${n.args.map(E).join(", ")}] })`;case"lambda":return`(${n.arg} => ${E(n.body)})`;case"let_in":return`(${n.left} => ${E(n.right)})(${E(n.middle)})`;case"let_rec_in":const e=wn(n.funName);return`(${e} => ${E(n.right)})(function ${e}(${n.arg}) {
 return ${E(n.middle)}; 
})`;case"if_then_else":return`${E(n.cond)} ? ${E(n.thenBranch)} : ${E(n.elseBranch)}`;case"app":return`${E(n.lhs)}(${E(n.rhs)})`;case"subterm":return Ge(n);case"constant":switch(n.kind){case"integer":case"float":return`${n.value}`;case"char":return`'${n.value}'`}case"switch":return`(arg => { 
 ${Ke(n.dt)} 
 })(${E(n.value)})`}},Ge=n=>{let e=n.index===-1?"arg":`arg.args[${n.index}]`;for(const t of n.pos)e=`${e}.args[${t}]`;return e},Xe=n=>/[0-9]+/.test(n),Ze=n=>n[0]==="'",He=n=>n==="True"||n==="False",_s=n=>Xe(n)?n:He(n)?n==="True":Ze(n)?n:`"${n}"`,Ke=n=>{switch(n.type){case"fail":return"throw new Error('pattern matching failed');";case"leaf":const e=`return ${E(n.action)};`;return Object.keys(n.bindings).length>0?`{
 ${Object.entries(n.bindings).map(([s,a])=>`const ${s} = ${E(a)};`).join(`
`)} 
 ${e} 
}`:e;case"switch":const t=n.tests.some(([r,s])=>He(r)||Xe(r)||Ze(r));return`
                switch (${Ge(n.occurence)}${t?"":".name"}) {
                    ${n.tests.map(([r,s])=>`${r==="_"?"default":`case ${_s(r)}`}:
                    ${Ke(s)}`).join(`
`)}
                }`}},$s=n=>Oe(n,(e,t)=>Qe(Ye(t,e))),Qe=n=>{if(n.args.every(G))return{type:"fun",funName:n.funName,args:n.args.map(qn),body:I(n.body)};{const e=n.args.length,t=pn(e,a=>M(`x${a}`)),r=e===1?t[0]:ws(t),s={type:"case_of",value:r,arity:e,cases:[{pattern:e===1?n.args[0]:{name:"tuple",args:n.args},expr:I(n.body)}]};return{type:"fun",funName:n.funName,args:t,body:s}}},I=n=>{switch(n.type){case"lambda":{const e=n.arg;if(G(e))return{type:"lambda",arg:qn(e),body:I(n.body)};{const t=M("x");return{type:"lambda",arg:t,body:{type:"case_of",arity:1,value:t,cases:[{pattern:n.arg,expr:I(n.body)}]}}}}case"let_in":{const e=n.left;return G(e)?{type:"let_in",left:qn(e),middle:I(n.middle),right:I(n.right)}:{type:"case_of",value:I(n.middle),arity:1,cases:[{pattern:n.left,expr:I(n.right)}]}}case"let_rec_in":{const e=n.arg;if(G(e))return{type:"let_rec_in",arg:qn(e),funName:n.funName,middle:I(n.middle),right:I(n.right)};{const t=M("x");return{type:"let_rec_in",arg:t,funName:n.funName,right:I(n.right),middle:{type:"case_of",value:t,arity:1,cases:[{pattern:n.arg,expr:I(n.middle)}]}}}}case"case_of":return{type:"case_of",value:I(n.value),arity:n.arity,cases:n.cases.map(e=>({pattern:e.pattern,expr:I(e.expr)}))};case"tyconst":return{type:"tyconst",name:n.name,args:n.args.map(I)};case"if_then_else":return{type:"if_then_else",cond:I(n.cond),thenBranch:I(n.thenBranch),elseBranch:I(n.elseBranch)};case"app":return{type:"app",lhs:I(n.lhs),rhs:I(n.rhs)};case"constant":return n}return n},ws=n=>({type:"tyconst",name:"tuple",args:n}),Os=n=>({type:"tyconst",name:"tuple",args:n}),Ye=(n,e)=>{if(e.length===1)return e[0];const t=e[0].args.length;Z(e.every(o=>o.args.length===t),`inconsistent arities for '${n}', expected ${t} arguments`);const r=pn(t,o=>M(`x${o}`)),s=t===1?r[0]:Os(r),a={type:"case_of",value:s,arity:t,cases:e.map(o=>({pattern:o.args.length===1?o.args[0]:{name:"tuple",args:o.args},expr:o.body}))};return{type:"fun",funName:e[0].funName,args:r.map(xr),body:a}},nt=n=>{var t;const e=new Map;for(const r of n)e.has(r.funName.name)||e.set(r.funName.name,[]),(t=e.get(r.funName.name))==null||t.push(r);return e},xs=(n,e,t)=>`${t}_${te(e).join("_")}_${n}`,Ns=n=>{const e=[];for(const[t,[r,s]]of n.defs)e.push(In(V({},s),{funName:{type:"variable",name:xs(t,n.ty,n.class_),id:r}}));return e},Ts=(n,e=!1)=>{var p;const t=[...n.coreFuncs.values()];t.push(...n.instances.map(Ns).flat());const r=ce(t,n.datatypes.values()),s=Ss(r),a=new Map;for(const l of t)a.set(l.funName.name,l);const o=new Map;if(s.size>0)for(const l of ks(s)){const[h,T]=an(l),C=new Set([...l.map(F=>{var m;return[...(m=r.get(F))!=null?m:[]]})].flat());r.set(h,C),o.set(h,Is(l.map(F=>a.get(F))));for(const F of T){r.delete(F),a.delete(F);for(const m of r.values())m.has(F)&&(m.delete(F),m.add(h))}(p=r.get(h))==null||p.delete(h)}if(e){const l=r.get("main");for(const h of r.keys())h!=="main"&&l.add(h)}const i=[...ot("main",r)].filter(l=>a.has(l)).map(l=>a.get(l));return Bs(i,o)},et=(n,...e)=>{for(const t of e)n[t]=!0;return n},On=(n,...e)=>et(V({},n),...e),tt=(...n)=>et({},...n),Cs=n=>`%${n}%`,cn=M("ReplaceMe"),rt=(n,e,t)=>{const[r,s]=an([...e,...n.args]),a=M(Cs(n.funName.name)),o={type:"let_in",left:n.funName,middle:e.length===0?a:I($n(a,...e)),right:cn};t.top===null||t.bottom===null?(t.top=o,t.bottom=t.top):(o.right=t.top,t.top=o),t.bottom.right=n.body;const i=Xt(t.top),p=s.length>0?en(s,i):i;return{type:"let_rec_in",funName:a,arg:r,middle:p,right:cn}},Is=n=>{Z(n.length>1);const[e,t]=an(n),r=t.map(i=>i.funName),s={top:null,bottom:null},a=rt(e,r,s),o=t.reduce((i,p)=>{r.shift();const l=rt(p,r,s);return i.right=l,l},a);return s.top!==null&&s.bottom!==null&&(s.bottom.right=cn,o.right=s.top),a},Vs=n=>{const[e,t]=an(n.args);return{type:"let_rec_in",arg:e,funName:n.funName,middle:t.length===0?n.body:en(t,n.body),right:cn}},Ms=n=>({type:"let_in",left:n.funName,middle:en(n.args,n.body),right:cn}),oe=(n,e)=>{n.right.type==="variable"&&n.right.name===cn.name?n.right=e:(Z(n.right.type==="let_in"||n.right.type==="let_rec_in"),oe(n.right,e))},st=(n,e)=>n.args.length===0?{type:"let_in",left:n.funName,middle:n.body,right:cn}:e.has(n.funName.name)?e.get(n.funName.name):Ps(n)?Vs(n):Ms(n),Bs=(n,e)=>{if(n.length===1)return n[0].body;const[t,r]=an(n),s=r.pop(),a=st(t,e),o=r.reduce((i,p)=>{const l=st(p,e);return oe(i,l),l},a);return oe(o,s.body),a},at=(n,e,t=new Set)=>{var r;if(t.has(n))return t;t.add(n);for(const s of(r=e.get(n))!=null?r:[])at(s,e,t);return t},ot=(n,e,t=new Set)=>{var r;if(t.has(n))return t;for(const s of(r=e.get(n))!=null?r:[])ot(s,e,t);return t.add(n),t},ct=(n,e,t=new Set)=>{var s;const r=[];r.push(n),t.add(n);for(const a of(s=e.get(n))!=null?s:[])t.has(a)||r.push(...ct(a,e,t));return r},ks=n=>{const e=[],t=new Set;for(const r of n.keys())if(!t.has(r)){const s=ct(r,n,t);e.push(s)}return e},it=(n,e,t,r=new Set)=>{var s;if(n===e)return!0;r.add(n);for(const a of(s=t.get(n))!=null?s:[])if(!r.has(a)&&it(a,e,t,r))return!0;return!1},Es=(n,e)=>{var r;const t=new Set;for(const s of(r=e.get(n))!=null?r:[])it(s,n,e)&&t.add(s);return t},Ss=n=>{const e=new Map;for(const t of n.keys()){const r=Es(t,n);r.size>0&&e.set(t,r)}return e},ce=(n,e)=>{const t=tt(...qs(e)),r=new Map;for(const s of n){const a=Ls(s,t);r.set(s.funName.name,a)}return r},qs=n=>{const e=[];for(const t of n)for(const r of t.variants)e.push(r.name);return e.push(...re.keys()),e},Ps=n=>P(n.body,tt(...n.args.map(e=>e.name))).has(n.funName.name),Ls=(n,e)=>P(n.body,On(e,n.funName.name,...n.args.map(t=>t.name))),P=(n,e={},t=new Set)=>{switch(n.type){case"variable":{e[n.name]||t.add(n.name);break}case"let_in":{const r=On(e,n.left.name);P(n.middle,r,t),P(n.right,r,t);break}case"let_rec_in":{const r=On(e,n.funName.name,n.arg.name);P(n.middle,r,t),P(n.right,r,t);break}case"app":{P(n.lhs,e,t),P(n.rhs,e,t);break}case"lambda":{P(n.body,On(e,n.arg.name),t);break}case"if_then_else":{P(n.cond,e,t),P(n.thenBranch,e,t),P(n.elseBranch,e,t);break}case"case_of":{P(n.value,e,t);for(const{pattern:r,expr:s}of n.cases){const a=On(e,...[...Le(r)].map(o=>o.value));P(s,a,t)}break}case"tyconst":{for(const r of n.args)P(r,e,t);break}}return t},L=(n,e=!1)=>{switch(n.type){case"variable":return e?`${n.name}@${n.id}`:n.name;case"constant":switch(n.kind){case"integer":return`${n.value}`;case"float":return`${n.value}`;case"char":return`'${n.value}'`}case"let_in":return`let ${e?`${n.left.name}@${n.left.id}`:n.left.name} = ${L(n.middle,e)} in ${L(n.right,e)}`;case"let_rec_in":return`let rec ${e?`${n.funName.name}@${n.funName.id}`:n.funName.name} ${n.arg.name} = ${L(n.middle,e)} in ${L(n.right,e)}`;case"lambda":return`\u03BB${e?`${n.arg.name}@${n.arg.id}`:n.arg.name} -> ${L(n.body,e)}`;case"if_then_else":return`if ${L(n.cond,e)} then ${L(n.thenBranch,e)} else ${L(n.elseBranch,e)}`;case"app":return`((${L(n.lhs,e)}) ${L(n.rhs,e)})`;case"tyconst":return n.args.length===0?n.name:n.name==="tuple"?`(${n.args.map(r=>L(r,e)).join(", ")})`:`(${n.name} ${n.args.map(r=>L(r,e)).join(" ")})`;case"case_of":const t=n.cases.map(({pattern:r,expr:s})=>`${_n(r)} -> ${L(s,e)}`);return`case ${L(n.value,e)} of ${t.join("  | ")}`}},zs=(n,e={})=>{const t=J();return c(D(e,n,t),r=>r[t.value]===void 0?O(`unbound type variable: "${W(t)}" in ${yr(r)}`):c(x(r[t.value],r),s=>u([s,r])))},dn=(n,e,t)=>{const r=ne(n,e);if(b(r))if(r.value==="no_rule_applies"||r.value==="occur_check"){const s=En(n),a=En(e);return O(`cannot unify ${W(s)} with ${W(a)} in expression "${L(t)}"`)}else return r;return r},xn=(n,{id:e,name:t},r)=>(g.identifiers.set(e,[t,r]),rr(n,t,r)),D=(n,e,t)=>{switch(e.type){case"constant":{const r=Fr(e);return c(mn(r),s=>dn(t,s,e))}case"variable":{const r=er(n,e.name),s=g.datatypes.has(e.name),a=g.typeClassMethods.has(e.name);if(!(r||s||a))return O(`unbound variable "${e.name}"`);const o=r?tr(n,e.name):s?g.datatypes.get(e.name):g.typeClassMethods.get(e.name);return a&&!r&&(g.typeClassMethodsOccs.set(e.id,[t,e.name]),g.typeClassMethodsOccs.set(e.id,[t,e.name])),c(mn(o),i=>(g.identifiers.has(e.id)||g.identifiers.set(e.id,[e.name,d(i)]),dn(t,i,e)))}case"if_then_else":return c(D(n,e.cond,j),r=>c(Q(n,r),s=>c(x(t,r),a=>c(D(s,e.thenBranch,a),o=>c(Q(s,o),i=>c(x(a,o),p=>c(D(i,e.elseBranch,p),l=>U(l,o,r))))))));case"lambda":{const r=J(),s=J(),a=xn(n,e.arg,d(r));return c(D(a,e.body,s),o=>c(x($(r,s),o),i=>c(x(t,o),p=>c(dn(p,i,e),l=>U(l,o)))))}case"app":{const r=J();return c(D(n,e.lhs,$(r,t)),s=>c(Q(n,s),a=>c(x(r,s),o=>c(D(a,e.rhs,o),i=>U(i,s)))))}case"let_in":{const r=J();return c(D(n,e.middle,r),s=>c(Q(n,s),a=>c(x(r,s),o=>c(x(t,s),i=>{const p=Ie(ar(a,e.left.name),o),l=xn(a,e.left,p);return c(D(l,e.right,i),h=>U(h,s))}))))}case"let_rec_in":{const r=J(),s=J(),a=$(r,s),o=xn(n,e.arg,d(r)),i=xn(o,e.funName,d(a));return c(D(i,e.middle,s),p=>c(Q(n,p),l=>c(x(a,p),h=>c(x(t,p),T=>{const C=xn(l,e.funName,Ie(l,h));return c(D(C,e.right,T),F=>U(F,p))}))))}case"tyconst":if(g.datatypes.has(e.name)){const r=g.datatypes.get(e.name),s=mn(d(qe(r.ty),...r.polyVars));return c(s,a=>dn(t,a,e))}else{if(e.name==="()")return dn(t,ke,e);if(e.name==="tuple"){const r=e.args.length,s=B("tuple",...pn(r,J));return c(dn(s,t,e),a=>{const o=Yn(s.args,([i,p,l],h)=>c(D(p,e.args[l],h),T=>c(Q(p,T),C=>c(U(T,i),F=>u([F,C,l+1])))),[a,n,0]);return c(o,([i])=>u(i))})}else return O(`unknown type constructor: "${e.name}"`)}case"case_of":{const r=J();return c(D(n,e.value,r),s=>{const a=c(x(t,s),o=>c(x(r,s),i=>Yn(e.cases,([p,l,h],{pattern:T,expr:C})=>{const F={};return c(ze(n,T,h,F),m=>c(U(m,p),X=>c(x(h,m),Un=>c(Q(or(n,F),X),Vt=>c(x(l,m),ye=>c(D(Vt,C,ye),Jn=>c(U(Jn,X),Mt=>c(x(ye,Jn),Bt=>c(x(Un,Jn),kt=>u([Mt,Bt,kt]))))))))))},[s,o,i])));return c(a,([o])=>u(o))})}}},Rs=n=>{for(const{name:e,typeVars:t,variants:r}of n){const s=B(e,...t);for(const a of r){const o=a.args.length===0?s:$(a.args[0],...a.args.slice(1),s);Z(Y(o));const i=d(B(o.name,...o.args),...t);g.datatypes.set(a.name,i)}}},js=n=>{var e;for(const{name:t,tyVar:r,methods:s}of n){g.typeclasses.has(t)||g.typeclasses.set(t,{methods:new Map,tyVar:r});for(const[a,o]of s)(e=g.typeclasses.get(t))==null||e.methods.set(a,o),g.typeClassMethods.set(a,o)}},As=n=>{var e;for(const{class_:t,ty:r}of n){g.instances.has(t)||g.instances.set(t,[]);const s=Y(r)?r.name:"*";(e=g.instances.get(t))==null||e.push(s)}},Ds=n=>{Rs(n.datatypes.values()),js(n.typeclasses.values()),As(n.instances)},lt=(n,e,t)=>R(n)?n.value===e?t:n:B(n.name,...n.args.map(r=>lt(r,e,t))),ut=n=>{const e=new Map;for(const t of n.defs.keys()){if(!g.typeclasses.has(n.class_))return O(`cannot define an instance for '${W(n.ty)}', type class '${n.class_}' not found.`);const r=g.typeclasses.get(n.class_);if(!r.methods.has(t))return O(`'${t}' is not a valid method of type class '${n.class_}'`);const s=r.methods.get(t),a=lt(s.ty,r.tyVar,n.ty);e.set(t,a)}return u(e)},Us=n=>{let e={};for(const t of n){const r=ut(t);if(b(r))return r;for(const[s,a]of r.value.entries()){if(!t.defs.has(s))return O(`type class instance for '${t.class_} ${W(a)}' is missing method '${s}'`);const[o]=t.defs.get(s),[i,p]=g.identifiers.get(o),l=ne(a,p.ty);if(b(l))return O(`invalid type for method '${s}' of type class '${t.class_}'`);const h=U(e,l.value);if(Bn(h))e=h.value;else return h}}return u(e)},Nn=new Map,Js=(n,e)=>{Nn.clear();const t=new Map,r=[];for(const s of n.instances){const a=Ws(s,t);if(b(a))return a}for(const s of n.coreFuncs.values()){const a=pt(s.funName,e);if(b(a))return a;const o=Gs(s,a.value,e,t);if(b(o))return o;r.push(...o.value)}for(const[s,a]of Nn.entries())r.push({type:"fun",funName:M(s),args:[],body:a});return u(r)},ft=(n,e,t,r)=>{var s;r.has(n)||r.set(n,[]),(s=r.get(n))==null||s.push([e,t])},Ws=(n,e)=>c(ut(n),t=>{for(const[r,s]of t.entries()){const[a,o]=n.defs.get(r),i=o.args.length>0?en(o.args,o.body):o.body;ft(r,s,i,e)}return u("()")}),Gs=(n,e,t,r)=>Me(e)&&n.funName.name!=="main"?(ft(n.funName.name,e,n.args.length>0?en(n.args,n.body):n.body,r),u([])):c(z(n.body,t,r),a=>u([In(V({},n),{body:a})])),Xs=(n,e,t,r)=>{var a;const s=`${n}_specialized_${te(e).join("_")}`;if(Nn.has(s))return u(M(s));for(const[o,i]of(a=r.get(n))!=null?a:[]){const p=x(e,t);if(b(p))return p;const l=x(o,t);if(b(l))return l;const h=ir(l.value,p.value);if(Bn(h))return Nn.set(s,i),c(U(h.value,t),T=>c(z(i,T,r),C=>(Nn.set(s,C),u(M(s)))))}return O(`no replacement found for '${n}' with type '${W(e)}'`)},pt=(n,e)=>{if(!g.identifiers.has(n.id))return O(`identifier ${n.name} (${n.id}) does not have type information`);const[t,r]=g.identifiers.get(n.id),s=x(r.ty,e);return b(s)?s:u(s.value)},z=(n,e,t)=>{switch(n.type){case"variable":return g.datatypes.has(n.name)?u(n):t.has(n.name)?c(pt(n,e),r=>c(Xs(n.name,r,e,t),s=>u(s))):u(n);case"let_in":return Kn(z(n.middle,e,t),z(n.right,e,t),([r,s])=>u({type:"let_in",left:n.left,middle:r,right:s}));case"let_rec_in":return Kn(z(n.middle,e,t),z(n.right,e,t),([r,s])=>u({type:"let_rec_in",funName:n.funName,arg:n.arg,middle:r,right:s}));case"constant":return u(n);case"if_then_else":return Kt(z(n.cond,e,t),z(n.thenBranch,e,t),z(n.elseBranch,e,t),([r,s,a])=>u({type:"if_then_else",cond:r,thenBranch:s,elseBranch:a}));case"app":return Kn(z(n.lhs,e,t),z(n.rhs,e,t),([r,s])=>u({type:"app",lhs:r,rhs:s}));case"lambda":return c(z(n.body,e,t),r=>u({type:"lambda",arg:n.arg,body:r}));case"case_of":return c(z(n.value,e,t),r=>{const s=Qn(n.cases.map(({expr:a,pattern:o})=>c(z(a,e,t),i=>u({expr:i,pattern:o}))));return c(s,a=>u({type:"case_of",arity:n.arity,value:r,cases:a}))});case"tyconst":{const r=Qn(n.args.map(s=>z(s,e,t)));return c(r,s=>u({type:"tyconst",name:n.name,args:s}))}}},Zs=(n,e)=>({type:"let_in",left:e,middle:n,right:M("main")}),Hs=(n,e)=>{const t=new Map(n.map(s=>[s.funName.name,s]));return e.filter(s=>t.has(s)).map(s=>t.get(s))},Ks=n=>{const e=n.getCoreFuncDecl("main");if(Gn(e))return O("main function not found");const t=Ts(n,!0);At(),Ds(n);const r=wr();return c(zs(Zs(t,e.funName),r),([s,a])=>c(Us(n.instances),o=>c(U(a,o),i=>c(Js(n,i),p=>{const l=ce(p,n.datatypes.values()),h=Hs(p,[...at("main",l)].reverse());return u({ty:En(s),main:Zt(p,T=>T.funName.name==="main"),coreProg:[...n.datatypes.values(),...h],singleExprProg:t,sig:i})}))))},Qs={dot:".",lparen:"(",rparen:")",lbracket:"[",rbracket:"]",pipe:"|",comma:",",lambda:"\\",rightarrow:"->",cons:"::",semicolon:";",colon:":",bigarrow:"=>"},Ys=n=>{switch(n.type){case"identifier":case"variable":return n.name;case"comment":return`% ${n.value}`;case"EOF":return"eof";case"keyword":return n.value;case"symbol":return n.name;case"integer":return n.value.toString();case"char":return`'${n.value}'`;case"float":return n.value.toString();case"string":return`"${n.value}"`;default:return Qs[n.type]}},mt=({line:n,column:e})=>`${n}:${e}`,na=new Map([["(","lparen"],[")","rparen"],["[","lbracket"],["]","rbracket"],["->","rightarrow"],[".","dot"],[",","comma"],["\\","lambda"],[";","semicolon"],["|","pipe"],["::","cons"],[":","colon"],["=>","bigarrow"]]),ea=["let","rec","in","if","then","else","data","case","of","class","instance","where","import","export"];function*ta(n){var i,p,l,h,T,C;let e=0,t={line:1,column:1};const r=(F=1)=>{for(let m=0;m<F;m++)s()===`
`?(t.line++,t.column=1):t.column++,e++},s=()=>n[e],a=(F=1)=>n.substr(e,F),o=()=>{var F;for(;e<n.length&&[" ",`
`,"\r","	"].includes((F=s())!=null?F:"");)r()};n:for(;e<n.length;){o();const F=s();if(Gn(F))break;for(const[m,X]of na.entries())if(a(m.length)===m){yield u(V({type:X},t)),r(m.length);continue n}for(const m of ea)if(a(m.length+1)===`${m} `||a(m.length+1)===`${m}
`){yield u(V({type:"keyword",value:m},t)),r(m.length);continue n}if(F==="'"){let m="";r(),m=(i=s())!=null?i:"",r(),s()!=="'"&&(yield O(`missing closing "'"`)),r(),yield u(V({type:"char",value:m},t));continue}if(F==='"'){let m="";for(r();fn(s())&&s()!=='"';)m+=s(),r();s()!=='"'&&(yield O(`missing closing '"'`)),r(),yield u(V({type:"string",value:m},t));continue}if(/[a-z_']/.test(F)){let m="";do m+=s(),r();while(/[a-zA-Z0-9_']/.test((p=s())!=null?p:""));yield u(V({type:"variable",name:m},t));continue}if(/[A-Z]/.test(F)){let m="";do m+=s(),r();while(/[a-zA-Z0-9_]/.test((l=s())!=null?l:""));yield u(V({type:"identifier",name:m},t));continue}if(a(2)==="--"){do r();while(e<n.length&&s()!==`
`);continue}if(/[!#$%&*+.\/<=>\?@\\^\|\-~]/.test(F)){let m="";do m+=s(),r();while(/[!#$%&*+.\/<=>\?@\\^\|\-~]/.test((h=s())!=null?h:""));yield u(V({type:"symbol",name:m},t));continue}if(ie(F)){let m="",X=!1;do m+=s(),r();while(ie((T=s())!=null?T:""));if(s()==="."){r(),m+=".",X=!0;do m+=s(),r();while(ie((C=s())!=null?C:""))}X?yield u(V({type:"float",value:parseFloat(m)},t)):yield u(V({type:"integer",value:parseInt(m)},t));continue}yield O(`Unrecognized token near "${n.substr(e,10)}", at ${mt(t)}`);return}}const ie=n=>{const e=n.charCodeAt(0);return e>=48&&e<=57},Pn=n=>{n.pos++},Ln=({tokens:n,pos:e})=>n[e],rn=n=>typeof n=="object"?n.ref:n;function v(...n){return e=>{const t=[];for(const r of n){const s=rn(r)(e);if(b(s))return s;t.push(s.value)}return u(t)}}const w=(...n)=>e=>{const{pos:t}=e;let r=O("`alt` received an empty list of parsers");for(const s of n)if(e.pos=t,r=rn(s)(e),Bn(r))return r;return r},y=(n,e)=>t=>c(n(t),r=>u(e(r))),zn=n=>e=>{const t=[];let r=rn(n)(e);for(;Bn(r);)t.push(r.value),r=rn(n)(e);return u(t)},Tn=n=>e=>{const t=[];let r;for(;r=rn(n)(e),!b(r);)t.push(r.value);return u(t)},ra=n=>fn(n)?`'${Ys(n)}' at ${mt(n)}`:"invalid token",f=n=>e=>{const t=Ln(e);return(t==null?void 0:t.type)===n?(Pn(e),u(t)):O(`expected token of type "${n}"`)},k=n=>e=>{const t=Ln(e);return(t==null?void 0:t.type)==="keyword"&&t.value===n?(Pn(e),u(t)):O(`expected token of type "${n}"`)},S=n=>e=>{const t=Ln(e);return(t==null?void 0:t.type)==="symbol"&&t.name===n?(Pn(e),u(t)):O(`expected symbol : "${n}"`)},H=n=>y(v(f("lparen"),n,f("rparen")),([e,t,r])=>t),dt=n=>w(n,H(n)),sa=n=>y(v(f("lbracket"),n,f("rbracket")),([e,t,r])=>t),sn=n=>ln(n,"comma"),ln=(n,e,t=!1)=>r=>{var o;const s=[];let a=!0;do{a?a=!1:Pn(r);const i=rn(n)(r);if(b(i))return t&&s.length>0?u(s):i;s.push(i.value)}while(((o=Ln(r))==null?void 0:o.type)===e);return u(s)};function hn(...n){return w(...n)}const Rn=(n,e,t)=>y(v(n,zn(e)),([r,s])=>s.length===0?r:s.reduce(t,r)),jn=n=>e=>{const t=rn(n)(e);return b(t)?u(Xn):u(t.value)},ht=(n,e)=>c(Ne([...ta(n)],t=>t),t=>{const r={tokens:t,pos:0},s=rn(e)(r);return r.pos!==r.tokens.length?O(`Unexpected token: ${ra(r.tokens[r.pos])}`):s}),yn=()=>({ref:()=>O("dummy")}),q=yn(),K=yn(),Cn=yn(),aa=y(f("integer"),({value:n})=>({type:"constant",kind:"integer",value:n})),yt=n=>({type:"constant",kind:"char",value:n}),oa=y(f("char"),({value:n})=>yt(n)),ca=y(f("float"),({value:n})=>({type:"constant",kind:"float",value:n})),gt=hn(aa,oa,ca),ia=y(f("string"),({value:n})=>je(n.split("").map(yt))),la=y(H(f("symbol")),({name:n})=>M(n)),gn=w(y(f("variable"),({name:n})=>M(n)),la),le=y(f("identifier"),({name:n})=>M(n)),ua=y(v(f("lparen"),f("rparen")),()=>({type:"tyconst",name:"()",args:[]})),fa=w(y(v(f("lparen"),q,f("comma"),sn(q),f("rparen")),([n,e,t,r,s])=>({type:"tyconst",name:"tuple",args:[e,...r]})),ua),pa=y(v(f("lbracket"),f("rbracket")),()=>({type:"tyconst",name:"Nil",args:[]})),ma=w(y(sa(sn(q)),je),pa),bt=hn(H(q),gt,gn,le,fa,ma,ia),vt=Rn(bt,v(hn(S("*"),S("/"),S("%")),bt),(n,[e,t])=>$n(M(e.name),n,t)),Ft=Rn(vt,v(hn(S("+"),S("-")),vt),(n,[e,t])=>$n(M(e.name),n,t)),ue=Rn(Ft,Ft,(n,e)=>({type:"app",lhs:n,rhs:e}));let fe=yn();fe.ref=w(y(v(ue,f("cons"),fe),([n,e,t])=>({type:"app",lhs:{type:"app",lhs:M("Cons"),rhs:n},rhs:t})),ue);const da=Rn(fe,v(hn(S("=="),S("/="),S("<"),S("<="),S(">"),S(">="),S("++")),ue),(n,[e,t])=>$n(M(e.name),n,t)),ha=w(y(v(k("if"),q,k("then"),q,k("else"),q),([n,e,t,r,s,a])=>({type:"if_then_else",cond:e,thenBranch:r,elseBranch:a})),da),ya=y(v(Cn,f("rightarrow"),q),([n,e,t])=>({pattern:n,expr:t})),ga=y(v(k("case"),q,k("of"),jn(f("pipe")),ln(ya,"pipe")),([n,e,t,r,s])=>({type:"case_of",arity:1,value:e,cases:s})),ba=w(y(v(k("let"),K,S("="),q,k("in"),q),([n,e,t,r,s,a])=>({type:"let_in",left:e,middle:r,right:a})),w(ga,ha)),va=w(y(v(k("let"),k("rec"),gn,zn(K),S("="),q,k("in"),q),([n,e,t,r,s,a,o,i])=>({type:"let_rec_in",funName:M(t.name),arg:r[0],middle:r.length===1?a:en(r.slice(1),a),right:i})),ba),Fa=w(y(v(f("lambda"),zn(K),f("rightarrow"),q),([n,e,t,r])=>en(e,r)),va);q.ref=Fa;const _t=y(v(gn,Tn(K),S("="),q),([n,e,t,r])=>({type:"fun",funName:n,args:e,body:r})),{name:$t,reset:wt}=gr(),An=y(f("variable"),({name:n})=>$t(n));let bn=yn();const _a=y(v(f("lparen"),f("rparen")),()=>B("unit")),$a=w(y(v(f("lparen"),bn,f("comma"),sn(bn),f("rparen")),([n,e,t,r,s])=>B("tuple",e,...r)),_a),Ot=y(dt(v(f("identifier"),Tn(w(y(f("identifier"),({name:n})=>B(n)),An,$a,H(bn))))),([n,e])=>B(n.name,...e)),wa=y(ln(hn(An,Ot),"rightarrow"),n=>n.length>1?$(...n):n[0]);bn.ref=dt(wa);const Oa=w(y(v(k("data"),f("identifier"),Tn(f("variable")),S("="),jn(f("pipe")),ln(Ot,"pipe")),([n,e,t,r,s,a])=>({type:"datatype",typeVars:t.map(o=>$t(o.name)),name:e.name,variants:a})),_t),xt=y(H(sn(v(f("identifier"),zn(An)))),n=>n.map(([{name:e},t])=>({name:e,tyVars:t.map(r=>r.value)}))),xa=y(v(gn,f("colon"),bn),([{name:n},e,t])=>[n,d(t,...kn(t))]),Na=(n,e,t,r)=>(wt(),{type:"typeclass",context:n,name:e,tyVar:t,methods:new Map(r.map(([s,a])=>{var l;const o={},i=new Map;i.set(t,[e]);for(const{name:h,tyVars:T}of n)for(const C of T)i.has(C)||i.set(C,[]),(l=i.get(C))==null||l.push(h);for(const[h,T]of i)o[h]={value:h,context:T};const p=d(Yt(x(a.ty,o)),...a.polyVars);return[s,p]}))}),Ta=w(y(v(k("class"),jn(v(xt,f("bigarrow"))),f("identifier"),An,k("where"),ln(xa,"comma")),([n,e,{name:t},r,s,a])=>Na(Fe(e,([o])=>o,[]),t,r.value,a)),Oa),Ca=n=>(wt(),n),Ia=w(y(v(k("instance"),jn(v(xt,f("bigarrow"))),f("identifier"),bn,k("where"),ln(_t,"comma")),([n,e,{name:t},r,s,a])=>Ca({type:"instance",context:Fe(e,([o])=>o,[]),class_:t,ty:r,defs:Oe(nt(a),(o,i)=>[Wn(),Qe(Ye(i,o))])})),Ta),Va=w(y(v(k("import"),f("string"),H(sn(w(gn,le)))),([n,e,t])=>({type:"import",path:e.value,imports:t.map(r=>r.name)})),Ia),Ma=w(y(v(k("export"),H(sn(w(gn,le)))),([n,e])=>({type:"export",exports:e.map(t=>t.name)})),Va),Ba=Ma,Nt=ln(Ba,"semicolon",!0),ka=H(K),Ea=w(y(f("variable"),({name:n})=>n==="_"?{name:"_",args:[]}:Or(n)),ka),Tt=n=>({name:`'${n}'`,args:[]}),Sa=w(y(gt,n=>{switch(n.kind){case"integer":case"float":return{name:`${n.value}`,args:[]};case"char":return Tt(n.value)}}),Ea),qa=w(y(f("identifier"),n=>({name:n.name,args:[]})),Sa),Pa=w(y(H(v(f("identifier"),Tn(K))),([n,e])=>({name:n.name,args:e})),qa);Cn.ref=w(y(v(f("identifier"),Tn(K)),([n,e])=>({name:n.name,args:e})),K);const La=w(y(v(f("lparen"),f("rparen")),()=>({name:"unit",args:[]})),Pa),za=w(y(v(f("lparen"),Cn,f("comma"),sn(Cn),f("rparen")),([n,e,t,r,s])=>({name:"tuple",args:[e,...r]})),La),Ra=w(y(v(f("lbracket"),f("rbracket")),()=>({name:"Nil",args:[]})),za),Ct=w(y(v(f("lbracket"),sn(Cn),f("rbracket")),([n,e,t])=>[...e].reverse().reduce((r,s)=>({name:"Cons",args:[s,r]}),{name:"Nil",args:[]})),Ra),ja=w(y(f("string"),({value:n})=>n.split("").map(Tt).reverse().reduce((e,t)=>({name:"Cons",args:[t,e]}),{name:"Nil",args:[]})),Ct);let pe=yn();pe.ref=w(y(v(Ct,f("cons"),pe),([n,e,t])=>({name:"Cons",args:[n,t]})),ja);K.ref=pe.ref;class me{constructor(e,t,r){this.exports=new Set,this.imports=new Map,this.datatypes=new Map,this.typeclasses=new Map,this.instances=[],this.coreFuncs=new Map,this.variants=new Map,this.path=t,this.fs=r;const s=[];for(const a of e)switch(a.type){case"fun":s.push(a);break;case"import":this.imports.set(a.path,new Set(a.imports));break;case"export":for(const o of a.exports)this.exports.add(o);break;case"datatype":this.datatypes.set(a.name,a);for(const o of a.variants)this.variants.set(o.name,a.name);break;case"typeclass":this.typeclasses.set(a.name,a);break;case"instance":this.instances.push(a);break}this.funcs=nt(s),this.coreFuncs=$s(this.funcs),this.deps=ce(this.coreFuncs.values(),[])}hasFuncDecl(e){return this.funcs.has(e)}getCoreFuncDecl(e){return this.coreFuncs.get(e)}addFuncFrom(e,t){Z(!this.funcs.has(e)),Z(t.funcs.has(e)),this.funcs.set(e,t.funcs.get(e)),this.coreFuncs.set(e,t.coreFuncs.get(e))}gatherImports(e,t){var a;const r=new Set,s=[...t];this.instances.push(...e.instances);for(const o of e.instances)this.instances.push(o);for(;s.length!==0;){const o=s.pop();if(!r.has(o)){if(t.has(o)&&!e.exports.has(o)&&!e.variants.has(o))return O(`"${e.path}" has no exported member named "${o}"`);if(this.funcs.has(o))return O(`imported member '${o}' already exists`);if(e.funcs.has(o)){this.addFuncFrom(o,e);for(const i of(a=e.deps.get(o))!=null?a:[])s.push(i)}else if(e.datatypes.has(o))this.datatypes.has(o)||this.datatypes.set(o,e.datatypes.get(o));else if(e.typeclasses.has(o))this.typeclasses.has(o)||this.typeclasses.set(o,e.typeclasses.get(o));else if(e.variants.has(o)){const i=e.variants.get(o);this.datatypes.has(i)||this.datatypes.set(i,e.datatypes.get(i))}else return O(`'${o}' is not defined in "${e.path}"`);r.add(o)}}return u("()")}async addImports(){const e=new Map,t=await this.collectImports(e);return this.instances=this.instances.filter(r=>this.typeclasses.has(r.class_)),t}async collectImports(e){const t=this.fs.getPath();this.fs.setPath(this.path);for(const[r,s]of this.imports.entries()){const a=this.fs.resolve(r);try{const o=await this.fs.readFile(a),i=e.has(a)?u(e.get(a)):Qt(ht(o,Nt),h=>new me(h,a,this.fs));if(b(i))return i;e.has(a)||e.set(a,i.value);const p=await i.value.collectImports(e);if(b(p))return p;const l=this.gatherImports(i.value,s);if(b(l))return l}catch(o){return O(`Could not import "${a}": ${o}`)}}return this.fs.setPath(t),u("()")}asCoreDecls(){return[...this.coreFuncs.values(),...this.datatypes.values(),...this.typeclasses.values(),...this.instances]}}const Aa=async(n,e)=>{try{const t=e.resolve(n),r=await e.readFile(t),s=ht(r,Nt);if(b(s))return s;const a=new me(s.value,t,e);return c(await a.addImports(),()=>u(a))}catch(t){return O(`Could not import "${n}": ${t}`)}},It=async(n,e)=>c(await Aa(n,e),t=>c(Ks(t),({ty:r,coreProg:s})=>{let a=vs(s);return a+=`

console.log(main);`,u([r,a])})),de=n=>n.startsWith("/"),Da=(n,e)=>{let t=n;const r=s=>{const a=(s.startsWith("/")?s.slice(1):s).split("/");return s.endsWith("/")||a.pop(),`/${a.join("/")}`};return{getPath:()=>t,setPath:s=>{if(!de(s))throw new Error(`called setPath with a relative path: ${s}`);t=s},readFile:async s=>{if(s in e&&de(s))return e[s];throw new Error(`Unknown file: ${s}`)},resolve:s=>{if(de(s))return s;const a=[];for(const o of`${r(t).slice(1)}/${s}`.split("/"))o===".."?a.pop():o==="."||a.push(o);return`/${a.join("/")}`},addFile:(s,a)=>{e[s]=a}}};var Ua=`import "../prelude/Prelude.ze" (Eq, Num);

data Bool = True | False;
data List a = Nil | Cons a (List a);
data Maybe a = None | Some a;
data Either a b = Left a | Right b;
data Nat = Z | S Nat;

either b = if b then Left 3 else Right False;

natOfInt n = if n == 0 then Z else S (natOfInt (n - 1));

reverse lst = reverse' lst [];
reverse' [] rev = rev;
reverse' (h :: tl) acc = reverse' tl (h :: acc);

range n = if n == 0 then [0] else n :: (range (n - 1));

main = reverse (range 100);`,Ja=`-- Girafe interpreter

import "../prelude/Prelude.ze" (Num, Eq);

data Bool = True | False;
data List a = Nil | Cons a (List a);
data Maybe a = None | Some a;

data Term =
    | Var (List Char)
    | Fun (List Char) (List Term);

trs = [
    (Fun "Add" [Var "a", Fun "0" []], Var "a"),
    (Fun "Add" [Fun "0" [], Var "b"], Var "b"),
    (Fun "Add" [Fun "S" [Var "a"], Var "b"], Fun "S" [Fun "Add" [Var "a", Var "b"]]),
    (Fun "Add" [Var "a", Fun "S" [Var "b"]], Fun "S" [Fun "Add" [Var "a", Var "b"]]),
    (Fun "Mult" [Var "a", Fun "0" []], Fun "0" []),
    (Fun "Mult" [Fun "0" [], Var "b"], Fun "0" []),
    (Fun "Mult" [Fun "S" [Var "a"], Var "b"], Fun "Add" [Fun "Mult" [Var "a", Var "b"], Var "b"]),
    (Fun "Mult" [Var "a", Fun "S" [Var "b"]], Fun "Add" [Fun "Mult" [Var "a", Var "b"], Var "a"]),
    (Fun "1" [], Fun "S" [Fun "0" []]),
    (Fun "2" [], Fun "S" [Fun "1" []]),
    (Fun "3" [], Fun "S" [Fun "2" []]),
    (Fun "4" [], Fun "S" [Fun "3" []]),
    (Fun "5" [], Fun "S" [Fun "4" []]),
    (Fun "6" [], Fun "S" [Fun "5" []]),
    (Fun "7" [], Fun "S" [Fun "6" []]),
    (Fun "8" [], Fun "S" [Fun "7" []]),
    (Fun "9" [], Fun "S" [Fun "8" []]),
    (Fun "10" [], Fun "S" [Fun "9" []]),
    (Fun "Range" [Var "n"], Fun "RangeAux" [Var "n", Fun "Nil" []]),
    (Fun "RangeAux" [Fun "0" [], Var "acc"], Var "acc"),
    (Fun "RangeAux" [Fun "S" [Var "n"], Var "acc"], Fun "RangeAux" [Var "n", Fun "Cons" [Var "n", Var "acc"]])
];

ruleName (Fun f _, _) = f;

map _ [] = [];
map f h::tl = (f h) :: (map f tl);

prepend as [] = as;
prepend [] bs = bs;
prepend a::as bs = a :: (prepend as bs);

append as bs = prepend bs as;

flatten lists = flatten' lists [];
flatten' [] acc = acc;
flatten' lst::lists acc = flatten' lists (append lst acc);

intercalate _ [] = [];
intercalate _ [x] = [x];
intercalate sep h::tl = h :: sep :: (intercalate sep tl);

join sep lst = flatten (intercalate sep lst);

show (Var x) = x;
show (Fun f []) = f;
show (Fun f args) = flatten [f, "(", join "," (map show args), ")"];

showRule (lhs, rhs) = flatten [show lhs, " -> ", show rhs];

len [] = 0;
len _::tl = (len tl) + 1;

zip [] _ = [];
zip _ [] = [];
zip a::as b::bs = (a, b)::(zip as bs);

and True True = True;
and _ _ = False;

unify s t = unify' [(s, t)] [];

unify' [] sig = Some sig;
unify' ((Var a, Var b)::eqs) sig = 
    if a == b then unify' eqs sig
    else unify' eqs ((a, Var b)::sig);
unify' ((Var a, t)::eqs) sig = unify' eqs ((a, t)::sig);
unify' ((Fun f as, Fun g bs)::eqs) sig =
    if and (f == g) ((len as) == (len bs))
    then unify' (prepend (zip as bs) eqs) sig
    else None;
unify' _ _ = None;


findSubst x [] = Var x;
findSubst x (y, t)::tl = if x == y then t else findSubst x tl;

substitute (Var x) sig = findSubst x sig;
substitute (Fun f args) sig = Fun f (map (\\a -> substitute a sig) args);

findRule _ [] = None;
findRule t (lhs, rhs)::rules = 
    case unify lhs t of
        | None -> findRule t rules
        | Some sig -> Some ((lhs, rhs), sig);

reduce (Var x) _ = (Var x, False);
reduce (Fun f args) rules = 
    let s = Fun f (map (\\a -> normalize a rules) args) in
    case findRule s rules of
        | None -> (s, False)
        | Some ((_, rhs), sig) -> (substitute rhs sig, True);

normalize term rules = normalize' (term, True) rules;
normalize' (t, True) rules = normalize' (reduce t rules) rules;
normalize' (t, False) rules = t;

main = show (normalize (Fun "Range" [Fun "Mult" [Fun "3" [], Fun "2" []]]) trs);`,Wa=`import "../prelude/Prelude.ze" (
    Bool, List, Maybe, Eq, Ord, Num,
    not, and, or
);

data BinaryOperator = 
    Plus | Minus | Times | Divide | Modulo | Lss |
    Leq | Gtr | Geq | Eq | Neq | And | Or;

data UnaryOperator = Neg | Not;

data Expr = 
    Const Value |
    BinOp BinaryOperator Expr Expr |
    MonOp UnaryOperator Expr |
    Var (List Char) |
    LetIn (List Char) Expr Expr |
    If Expr Expr Expr |
    Lambda (List Char) Expr |
    App Expr Expr |
    LetRecIn (List Char) (List Char) Expr Expr;

data Value =
    IntVal Int |
    BoolVal Bool |
    ClosureVal (List Char) Expr (List (List Char, Value)) |
    ClosureRecVal (List Char) (List Char) Expr (List (List Char, Value));

intOf (IntVal n) = n;
boolOf (BoolVal q) = q;

intBinOp op a b env = 
    IntVal (op (intOf (eval a env)) (intOf (eval b env)));

boolBinOp op a b env = 
    BoolVal (op (intOf (eval a env)) (intOf (eval b env)));

logicalBinOp op a b env = 
    BoolVal (op (boolOf (eval a env)) (boolOf (eval b env)));

lookupEnv x [] = None; 
lookupEnv x (y, v)::tl = if y == x then Some v else lookupEnv x tl;

unwrap (Some x) = x;

closureOf (ClosureRecVal f x body env) = 
    let recVal = ClosureRecVal f x body env in
    ClosureVal x body ((f, recVal)::env);
closureOf v = v;

eval (Const v) _ = v;
eval (MonOp Neg n) env = IntVal (0 - (intOf (eval n env)));
eval (MonOp Not q) env = BoolVal (not (boolOf (eval q env)));
eval (BinOp Plus a b) env = intBinOp (+) a b env;
eval (BinOp Minus a b) env = intBinOp (-) a b env;
eval (BinOp Times a b) env = intBinOp (*) a b env;
eval (BinOp Divide a b) env = intBinOp (/) a b env;
eval (BinOp Modulo a b) env = intBinOp (%) a b env;
-- FIXME: (<) should work { \u03B514 : Int }
eval (BinOp Lss a b) env = boolBinOp (lssInt) a b env;
eval (BinOp Leq a b) env = boolBinOp (<=) a b env;
eval (BinOp Gtr a b) env = boolBinOp (>) a b env;
eval (BinOp Geq a b) env = boolBinOp (>=) a b env;
eval (BinOp Eq a b) env = boolBinOp (==) a b env;
eval (BinOp Neq a b) env = boolBinOp (\\n m -> not (n == m)) a b env;
eval (BinOp And a b) env = logicalBinOp and a b env;
eval (BinOp Or a b) env = logicalBinOp or a b env;
eval (Var x) env = unwrap (lookupEnv x env); 
eval (LetIn x val e) env = eval e ((x, eval val env)::env);
eval (If cond t e) env = 
    if (boolOf (eval cond env))
        then (eval t env)
        else (eval e env);
eval (Lambda x body) env = ClosureVal x body env;
eval (App lhs rhs) env1 = 
    let v = eval rhs env1 in
    let (ClosureVal x body env2) = closureOf (eval lhs env1) in
    eval body ((x, v)::env2);
eval (LetRecIn f x body e) env = 
    let recVal = ClosureRecVal f x body env in
    eval e ((f, recVal)::env);

fact n = intOf (eval (LetRecIn "fact" "n" (
        If (BinOp Eq (Var "n") (Const (IntVal 0)))
            (Const (IntVal 1))
            (BinOp Times (Var "n") (App (Var "fact") (BinOp Minus (Var "n") (Const (IntVal 1)))))
    ) (App (Var "fact") (Const (IntVal n)))) []);

isPrime n = boolOf (eval (LetRecIn "isPrime" "n" (
    Lambda "i" (
        If (BinOp Leq (BinOp Times (Var "i") (Var "i")) (Var "n"))
            (If (BinOp Eq (BinOp Modulo (Var "n") (Var "i")) (Const (IntVal 0)))
                (Const (BoolVal False))
                (App (App (Var "isPrime") (Var "n")) (BinOp Plus (Var "i") (Const (IntVal 1))))
            )
            (BinOp Neq (Var "n") (Const (IntVal 1)))
    )
) (App (App (Var "isPrime") (Const (IntVal n))) (Const (IntVal 2)))) []);

listPrimes n = listPrimes' n [];

listPrimes' 0 acc = acc;
listPrimes' n acc = listPrimes' (n - 1) (if isPrime n then n::acc else acc);

main = listPrimes 100;`,Ga=`import "../prelude/Prelude.ze" (Eq, Ord, Num);

data Bool = True | False;
data List a = Nil | Cons a (List a);
data Maybe a = None | Some a;

filter _ [] = [];
filter f (h :: tl) =
    let next = filter f tl in
    if f h then h :: next else next;

isPrime n =
    if n == 2 then True
    else if or (n < 2) (n % 2 == 0) then False
    else let rec aux n i =
        if i * i > n then True
        else if n % i == 0 then False
        else aux n (i + 2)
    in aux n 3;

or False False = False;
or _ _ = True;

pow n 0 = 1;
pow n p = n * (pow n (p - 1));

isMersennePrime p = if isPrime p then isPrime ((pow 2 p) - 1) else False;

even 0 = True;
even n = odd (n - 1);

odd 0 = False;
odd n = even (n - 1);

head (h :: _) = h;
tail (_ :: tl) = tl;

map _ [] = [];
map f (h :: tl) = (f h) :: (map f tl);
 
range n = range' n [];
range' 0 acc = acc;
range' n acc = range' (n - 1) (n :: acc);

len [] = 0;
len (_ :: tl) = (len tl) + 1;

mapMaybe _ None = None;
mapMaybe f (Some x) = Some (f x);

append [] bs = bs;
append (a :: as) bs = a :: (append as bs);

main = len (filter isPrime (range 100));`,Xa=`import "../prelude/Prelude.ze" (Num, Eq, Ord, List);

data Bool = True | False;
data Maybe a = None | Some a;
data List a = Nil | Cons a (List a);

isNone None = True;
isNone _ = False;

isSome (Some _) = True;
isSome _ = False;

len x0 = case x0 of
    | [] -> 0
    | (h :: tl) -> (len tl) + 1;

range n = n :: (if n == 0 then [] else range (n - 1));

main = len [1, 2, 3];`,Za=`import "./Eq.ze" (Eq);

data Bool = True | False;

not True = False;
not False = True;

and True True = True;
and _ _ = False;

or False False = False;
or _ _ = True;

xor True True = False;
xor False False = False;
xor _ _ = True;

instance Eq Bool where
    (==) True True = True,
    (==) False False = True,
    (==) _ _ = False;

export (Bool, not, and, or, xor);`,Ha=`
class Eq a where
    (==) : a -> a -> Bool;

instance Eq Int where
    (==) = eqInt;

instance Eq Char where
    (==) = eqChar;

export (Eq);`,Ka=`-- FIXME: infinite loop (circular depedencies)
-- import "./Bool.ze" (Bool);

import "./Eq.ze" (Eq);

data Bool = True | False;
data List a = Nil | Cons a (List a);

instance (Eq a) => Eq (List a) where
    (==) [] [] = True,
    (==) a::as b::bs = if a == b then as == bs else False,
    (==) _ _ = False;

map f lst = map' f lst [];
map' _ [] acc = acc;
map' f h::tl acc = map' f tl (f h)::acc;

filter pred lst = filter' pred lst [];
filter' _ [] acc = acc;
filter' pred h::tl acc = filter' pred tl (if pred h then h::acc else acc);

any _ [] = False;
any pred h::tl = if pred h then True else any pred tl;

all _ [] = False;
all pred h::tl = if pred h then all tl else False;

(++) as [] = as;
(++) [] bs = bs;
(++) a::as bs = a :: (as ++ bs);

append as bs = bs ++ as;

flatten lists = flatten' lists [];
flatten' [] acc = acc;
flatten' lst::lists acc = flatten' lists (append lst acc);

intercalate _ [] = [];
intercalate _ [x] = [x];
intercalate sep h::tl = h::sep::(intercalate sep tl);

join sep lst = flatten (intercalate sep lst);

export (
    List,
    map, filter, any, all, (++),
    append, flatten, intercalate, join
);`,Qa=`data Maybe a = None | Some a;

export (Maybe);`,Ya=`class Num a where
    (-) : a -> a -> a,
    (+) : a -> a -> a,
    (/) : a -> a -> a,
    (*) : a -> a -> a,
    (%) : a -> a -> a;

instance Num Int where
    (+) = plusInt,
    (-) = minusInt,
    (*) = timesInt,
    (/) = divideInt,
    (%) = modInt;

export (Num);`,no=`class Ord d where
    (<) : a -> a -> Bool,
    (<=) : a -> a -> Bool,
    (>) : a -> a -> Bool,
    (>=) : a -> a -> Bool;

instance Ord Int where
    (<) = lssInt,
    (<=) = leqInt,
    (>) = gtrInt,
    (>=) = geqInt;

export (Ord);`,eo=`import "./Bool.ze" (Bool, not, or, and, xor);
import "./Maybe.ze" (Maybe);
import "./Eq.ze" (Eq);
import "./Num.ze" (Num);
import "./Ord.ze" (Ord);
import "./List.ze" (
    List,
    map, filter, any, all, (++),
    append, flatten, intercalate, join
);

export (
    Bool, List, Maybe, -- data types
    Eq, Num, Ord, -- type classes
    map, filter, any, all, (++), -- List
    append, flatten, intercalate, join,
    not, or, and, xor -- Bool
);`;const to={Primes:Ga,"Data types":Ua,"Pattern Matching":Xa,"Lambda evaluator":Wa,"Girafe interpreter":Ja},un={bool:Za,eq:Ha,list:Ka,maybe:Qa,num:Ya,ord:no,index:eo},ro=n=>{const e=`
    onmessage = () => {
      ${n}
      postMessage(main);
    };
  `,t=new Blob([e],{type:"application/javascript"}),r=new Worker(URL.createObjectURL(t));return new Promise(s=>{r.postMessage("start"),r.onmessage=a=>{s(a.data)}})},Dn=Da("/examples/",{"/prelude/Bool.ze":un.bool,"/prelude/Eq.ze":un.eq,"/prelude/List.ze":un.list,"/prelude/Maybe.ze":un.maybe,"/prelude/Num.ze":un.num,"/prelude/Ord.ze":un.ord,"/prelude/Prelude.ze":un.index}),so=n=>{let e=n;const t=[];for(;typeof e=="object"&&e.name==="Cons";)if(e.name==="Cons"){const[r]=e.args;t.push(he(r)),e=e.args[1]}return`[${t.join(", ")}]`},he=n=>{switch(typeof n){case"number":return`${n}`;case"string":return`"${n}"`;case"object":switch(n.name){case"Nil":return"[]";case"Cons":return so(n);default:return n.args.length===0?n.name:`${n.name}(${n.args.map(he).join(", ")})`}}return JSON.stringify(n,null,2)},ao={Run:async(n,e)=>{e("...running"),Dn.addFile("/examples/tmp.ze",n);const t=await It("/examples/tmp.ze",Dn);if(t.type==="ok"){const[,r]=t.value,s=await ro(r);e(he(s))}else e(t.value)},Transpile:async(n,e)=>{Dn.addFile("/examples/tmp.ze",n);const t=await It("/examples/tmp.ze",Dn);if(t.type==="ok"){const[,r]=t.value;e(r)}else e(t.value)}},oo=()=>Vn.createElement(zt,{actions:ao,samples:to,aceMode:"haskell",lightTheme:"xcode",darkTheme:"dracula",outputOptions:{wrap:!0,tabSize:2,showLineNumbers:!0}});Rt.render(Vn.createElement(Vn.StrictMode,null,Vn.createElement(oo,null)),document.getElementById("root"));

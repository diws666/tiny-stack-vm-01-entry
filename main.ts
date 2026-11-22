import {mkdirSync as a,readdirSync as b,readFileSync as c,writeFileSync as w}from'node:fs';
const I=process.env.MAKEFUN_INPUT_DIR||'/input',O=process.env.MAKEFUN_OUTPUT_DIR||'/output';
const S=256,K=64,W=256,L=1e6,Q=65536;
const op=[0,1,2,3,4,5,6,7,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,32,33,34,48,49,50,51,52,64,65,80,81,82,83],im="01400000000000000000000022220000000",po="0001122322222221222122222201100121101",pu="01102233111111111111111111100000100010";
function v(p,x){
const n=p.length,D=new Int32Array(S),C=new Int32Array(K),R=new Int32Array(W),o=new Uint8Array(Q),e=new TextEncoder(),R2=()=>o.slice(0,l);
let s=0,k=0,i=0,pc=0,t=0,l=0,u,r,A,B;
for(;;){
if(t===L)return{x:R2(),c:10};
if(pc<0||pc>=n)return{x:R2(),c:9};
let z=p[pc],y=op.indexOf(z);
if(y<0)return{x:R2(),c:5};
let m=im.charCodeAt(y)&15;
if(pc+m>=n)return{x:R2(),c:9};
let g=po.charCodeAt(y)&15,h=pu.charCodeAt(y)&15;
t++;let q=pc+1+m;
if(s<g)return{x:R2(),c:2};
if(s-g+h>S)return{x:R2(),c:3};
pc=q;
switch(z){
case 0:return{x:R2(),c:0};
case 1:D[s++]=(p[q-1]<<24)>>24;break;
case 2:D[s++]=p[q-4]|p[q-3]<<8|p[q-2]<<16|p[q-1]<<24;break;
case 3:s--;break;
case 4:D[s]=D[s-1];s++;break;
case 5:u=D[s-1];D[s-1]=D[s-2];D[s-2]=u;break;
case 6:D[s]=D[s-2];s++;break;
case 7:u=D[s-3];D[s-3]=D[s-2];D[s-2]=D[s-1];D[s-1]=u;break;
case 23:D[s-1]=-D[s-1]|0;break;
case 27:D[s-1]=~D[s-1];break;
case 48:case 49:case 50:{let W2=((p[q-2]|p[q-1]<<8)<<16)>>16;
if(z<49||(z===49?D[--s]===0:D[--s]!==0))pc=q+W2;break;}
case 51:if(k===K)return{x:R2(),c:7};C[k++]=q;pc=p[q-2]|p[q-1]<<8;break;
case 52:if(k===0)return{x:R2(),c:8};pc=C[--k];break;
case 64:u=D[s-1];if(u<0||u>=W)return{x:R2(),c:6};D[s-1]=R[u];break;
case 65:u=D[s-1];if(u<0||u>=W)return{x:R2(),c:6};s-=2;R[u]=D[s];break;
case 80:{let B2=e.encode(String(D[s-1]));if(l+B2.length>Q)return{x:R2(),c:11};s--;o.set(B2,l);l+=B2.length;break;}
case 81:if(l+1>Q)return{x:R2(),c:11};o[l++]=D[--s]&255;break;
case 82:D[s++]=i<x.length?x[i++]:-1;break;
case 83:return{x:R2(),c:D[--s]&255;}
default:{B=D[s-1],A=D[s-2];
switch(z){
case 16:r=(A+B)|0;break;
case 17:r=(A-B)|0;break;
case 18:r=Math.imul(A,B);break;
case 19:if(B===0)return{x:R2(),c:4};r=A===-2147483648&&B===-1?A:(A/B)|0;break;
case 20:if(B===0)return{x:R2(),c:4};r=B===-1?0:A%B|0;break;
case 21:if(B===0)return{x:R2(),c:4};r=Math.floor((A>>>0)/(B>>>0))|0;break;
case 22:if(B===0)return{x:R2(),c:4};r=(A>>>0)%(B>>>0)|0;break;
case 24:r=A&B;break;
case 25:r=A|B;break;
case 26:r=A^B;break;
case 28:r=A<<(B&31);break;
case 29:r=A>>(B&31);break;
case 30:r=(A>>>(B&31))|0;break;
case 32:r=A===B?1:0;break;
case 33:r=A<B?1:0;break;
case 34:r=(A>>>0)<(B>>>0)?1:0;break;}
s-=2;D[s++]=r;}
}
}
}
for(const d of b(I).sort()){
let z=v(c(I+'/'+d+'/program.bin'),c(I+'/'+d+'/input.bin'));
a(O+'/'+d,{recursive:true});
w(O+'/'+d+'/stdout.bin',z.x);
w(O+'/'+d+'/exit.txt',z.c+'\n');
}

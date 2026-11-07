import test from "node:test";
import assert from "node:assert/strict";
import { installGlassFeedback, previewGlassFeedback } from "../src/lib/glass-motion.ts";

test("shared feedback handles touch activation and automatic previews, and honors reduced motion",t=>{
  const names=["Element","HTMLElement","document","window","getComputedStyle"] as const;
  const original=new Map(names.map(name=>[name,Object.getOwnPropertyDescriptor(globalThis,name)]));
  let reduced=false,coarse=false;
  class Button {
    isConnected=true;children:Button[]=[];animations:{frames:Keyframe[];cancelled:boolean;onfinish:(()=>void)|null;cancel:()=>void}[]=[];
    closest(){return this;}getAttribute(){return null;}
    querySelectorAll(){return this.children;}
    animate(frames:Keyframe[]) {
      const animation={frames,cancelled:false,onfinish:null as (()=>void)|null,cancel(){this.cancelled=true;}};
      this.animations.push(animation);return animation;
    }
  }
  const document=new EventTarget(),window=new EventTarget();
  Object.assign(window,{matchMedia:(query:string)=>({matches:query.includes("reduced-motion") ? reduced : coarse})});
  for(const [name,value] of Object.entries({Element:Button,HTMLElement:Button,document,window,getComputedStyle:()=>({scale:"1 1"})}))
    Object.defineProperty(globalThis,name,{configurable:true,writable:true,value});
  const stop=installGlassFeedback(()=>0);
  t.after(()=>{stop();for(const name of names){const descriptor=original.get(name);if(descriptor) Object.defineProperty(globalThis,name,descriptor);else Reflect.deleteProperty(globalThis,name);}});
  const button=new Button();
  function pointer(type:string,pointerType:string) {
    const event=new Event(type);
    Object.defineProperties(event,{target:{value:button},pointerId:{value:1},button:{value:0},pointerType:{value:pointerType}});
    document.dispatchEvent(event);
  }
  pointer("pointerdown","mouse");pointer("pointerup","mouse");
  const mousePeak=Number(String(button.animations.at(-1)!.frames[1].scale).split(" ")[1]);
  pointer("pointerdown","touch");pointer("pointerup","touch");
  const touchPeak=Number(String(button.animations.at(-1)!.frames[1].scale).split(" ")[1]);
  assert.ok(touchPeak>mousePeak,"Touch did not get a stronger bounce");
  const root=new Button(),choice=new Button();root.children=[button,choice];
  coarse=true;
  previewGlassFeedback(root as unknown as HTMLElement);
  assert.equal(choice.animations.length,1,"The selected-tab sample did not demonstrate its response");
  const frames=choice.animations[0].frames;
  assert.ok(Number(String(frames[1].scale).split(" ")[1])<1 && Number(String(frames[2].scale).split(" ")[1])>1);
  const before=button.animations.length;reduced=true;
  previewGlassFeedback(root as unknown as HTMLElement);pointer("pointerdown","touch");pointer("pointerup","touch");
  assert.equal(button.animations.length,before,"Reduced-motion preference was ignored");
  reduced=false;stop();previewGlassFeedback(root as unknown as HTMLElement);
  assert.equal(button.animations.length,before,"Preview listener survived teardown");
});

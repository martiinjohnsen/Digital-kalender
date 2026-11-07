import { glassLevel } from "./glass.ts";
export function glassMotion(value:number) {
  const strength=1-glassLevel(value)/100;
  return {strength,pressX:1-.03*strength,pressY:1-.08*strength,popX:1+.025*strength,popY:1+.045*strength,duration:140+280*strength};
}
/** One shared response for pointer, keyboard and assistive-technology activation. */
export function installGlassFeedback(readLevel:()=>number):()=>void {
  const selector='button:not(:disabled):not(.block-grip),a.button,.bottom-nav > a,.nav-item,.avatar,.glass-choice,.scene-toggle,summary,label.button';
  let held:{element:HTMLElement;pointer:number|null;animation:Animation|null}|null=null;
  let lastRelease=-Infinity;
  const running=new Map<HTMLElement,Animation>();
  function animate(element:HTMLElement,frames:Keyframe[],duration:number) {
    running.get(element)?.cancel();
    const animation=element.animate(frames,{duration,easing:"cubic-bezier(.22,.7,.3,1)",fill:"forwards"});
    running.set(element,animation);return animation;
  }
  const target=(event:Event)=>event.target instanceof Element ? event.target.closest<HTMLElement>(selector) : null;
  const reduced=()=>window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  function begin(event:PointerEvent|KeyboardEvent,pointer:number|null) {
    const element=target(event),motion=glassMotion(readLevel());
    if(!element || typeof element.animate!=="function" || reduced() || !motion.strength || element.getAttribute("aria-disabled")==="true") return;
    cancel();running.get(element)?.cancel();
    held={element,pointer,animation:animate(element,[{scale:"1 1"},{scale:`${motion.pressX} ${motion.pressY}`}],110)};
  }
  function pop(element:HTMLElement) {
    if(!element.isConnected || typeof element.animate!=="function" || reduced()) {running.get(element)?.cancel();running.delete(element);return;}
    const motion=glassMotion(readLevel());if(!motion.strength) return;
    const current=getComputedStyle(element).scale;
    const animation=animate(element,[{scale:current==="none" ? "1 1" : current},{scale:`${motion.popX} ${motion.popY}`,offset:.45},{scale:`${1-.005*motion.strength} ${1-.012*motion.strength}`,offset:.75},{scale:"1 1"}],motion.duration);
    animation.onfinish=()=>{animation.cancel();if(running.get(element)===animation) running.delete(element);};
  }
  function cancel(){if(held){held.animation?.cancel();running.delete(held.element);held=null;}}
  const down=(event:PointerEvent)=>{if(event.button===0) begin(event,event.pointerId);};
  const up=(event:PointerEvent)=>{if(held?.pointer===event.pointerId){const element=held.element;held=null;lastRelease=performance.now();pop(element);}};
  const keyDown=(event:KeyboardEvent)=>{if(!event.repeat && (event.key==="Enter" || event.key===" ") && target(event)===document.activeElement) begin(event,null);};
  const keyUp=(event:KeyboardEvent)=>{if(held?.pointer===null && (event.key==="Enter" || event.key===" ")){const element=held.element;held=null;lastRelease=performance.now();pop(element);}};
  const click=(event:MouseEvent)=>{if(event.detail===0 && !held && performance.now()-lastRelease>90){const element=target(event);if(element) pop(element);}};
  document.addEventListener("pointerdown",down,true);document.addEventListener("pointerup",up,true);document.addEventListener("pointercancel",cancel,true);
  document.addEventListener("keydown",keyDown,true);document.addEventListener("keyup",keyUp,true);document.addEventListener("click",click,true);window.addEventListener("blur",cancel);
  return ()=>{cancel();for(const animation of running.values()) animation.cancel();running.clear();document.removeEventListener("pointerdown",down,true);document.removeEventListener("pointerup",up,true);document.removeEventListener("pointercancel",cancel,true);document.removeEventListener("keydown",keyDown,true);document.removeEventListener("keyup",keyUp,true);document.removeEventListener("click",click,true);window.removeEventListener("blur",cancel);};
}

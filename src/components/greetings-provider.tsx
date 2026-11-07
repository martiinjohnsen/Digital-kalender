"use client";
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { rpcForUser, supabase, authMessage } from "@/lib/cloud/client";
import { useAccount } from "./account-provider";
import { cleanUnusedMedia } from "@/lib/cloud/media";
import { sameGreeting, temporaryGreeting, type Greeting, type GreetingDraft, type PreviewGreeting } from "@/lib/greetings";
export type { Greeting, PreviewGreeting } from "@/lib/greetings";
type Greetings = {items:Greeting[];ready:boolean;error:string;refresh:()=>Promise<void>;claim:(id:string,day:number,preview?:PreviewGreeting)=>Promise<boolean>;
  save:(id:string,day:number,draft:GreetingDraft,revision:number,preview?:PreviewGreeting)=>Promise<void>;
  clearPreview:(id:string)=>void;read:(id:string,items:Greeting[])=>Promise<void>};
const Context=createContext<Greetings|null>(null);
export function useGreetings() {const value=useContext(Context);if(!value) throw new Error("Hilsenene er ikke tilgjengelige.");return value;}
export function GreetingsProvider({children}:{children:ReactNode}) {
  const {user}=useAccount();
  const identity=useRef(user?.id);identity.current=user?.id;
  const [state,setState]=useState({userId:"",items:[] as Greeting[],ready:false,error:""});
  const [temporary,setTemporary]=useState({userId:"",items:[] as Greeting[]});
  const temporaryRef=useRef(temporary);
  const changeTemporary=(items:Greeting[])=>{const next={userId:user?.id ?? "",items};temporaryRef.current=next;setTemporary(next);};
  const temporaryItems=()=>temporaryRef.current.userId===user?.id ? temporaryRef.current.items : [];
  const sequence=useRef(0);
  const refresh=useCallback(async()=>{
    if(!user) return;
    const userId=user.id,ticket=++sequence.current;
    try {
      const {data,error}=await rpcForUser(userId,"get_luke_greetings");if(error) throw error;
      if(identity.current===userId && ticket===sequence.current) setState({userId,items:data ?? [],ready:true,error:""});
      if(identity.current===userId) void cleanUnusedMedia(userId).catch(()=>{});
    } catch(error) {if(identity.current===userId && ticket===sequence.current) setState(previous=>({...previous,userId,error:authMessage(error)}));}
  },[user?.id]);
  useEffect(()=>{
    sequence.current++;setState({userId:user?.id ?? "",items:[],ready:false,error:""});
    const empty={userId:user?.id ?? "",items:[] as Greeting[]};temporaryRef.current=empty;setTemporary(empty);
    if(!user) return;
    void refresh();
    const resume=()=>{if(document.visibilityState === "visible") void refresh();};
    const channel=supabase().channel(`greetings:${user.id}`).on("postgres_changes",{event:"*",schema:"public",table:"luke_greetings"},resume)
      .on("postgres_changes",{event:"*",schema:"public",table:"luke_preview_progress",filter:`user_id=eq.${user.id}`},resume).subscribe();
    const timer=setInterval(resume,30000);
    window.addEventListener("focus",resume);window.addEventListener("online",resume);document.addEventListener("visibilitychange",resume);
    return ()=>{sequence.current++;clearInterval(timer);void supabase().removeChannel(channel);window.removeEventListener("focus",resume);window.removeEventListener("online",resume);document.removeEventListener("visibilitychange",resume);};
  },[user?.id,refresh]);
  async function mutate(name:string,args:Record<string,unknown>) {
    const userId=user?.id;if(!userId) throw new Error("Logg inn for å sende en hilsen.");
    const {data,error}=await rpcForUser(userId,name,args);
    if(error) throw new Error(error.message);
    if(identity.current!==userId) throw new Error("Innloggingen er endret. Åpne siden på nytt.");
    sequence.current++;
    if(Array.isArray(data)) setState({userId,items:data,ready:true,error:""});
    await refresh();
    return data;
  }
  return <Context.Provider value={{
    items:[...(state.userId===user?.id ? state.items : []),...(temporary.userId===user?.id ? temporary.items : [])].sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt)),
    ready:state.userId===user?.id && state.ready,error:state.userId===user?.id ? state.error : "",refresh,
    clearPreview:id=>changeTemporary(temporaryItems().filter(item=>item.calendarId!==id)),
    claim:async(id,day,preview)=>{
      if(preview && !preview.save) {
        if(!user) throw new Error("Logg inn for å prøve hilsener.");
        const before=temporaryItems(),after=temporaryGreeting(before,id,day,user.id,preview.mode);
        changeTemporary(after);return after!==before;
      }
      const result=preview
        ? await mutate("luke_preview_greeting",{p_calendar_id:id,p_mode:preview.mode,p_day:day,p_action:"claim",p_payload:{}})
        : await mutate("claim_luke_greeting_prompt",{p_calendar_id:id,p_day:day});
      return result===true;
    },
    save:async(id,day,draft,revision,preview)=>{
      if(preview && !preview.save) {
        if(!user) throw new Error("Logg inn for å prøve hilsener.");
        changeTemporary(temporaryGreeting(temporaryItems(),id,day,user.id,preview.mode,draft,revision));return;
      }
      if(preview) await mutate("luke_preview_greeting",{p_calendar_id:id,p_mode:preview.mode,p_day:day,p_action:"save",p_payload:{...draft,revision}});
      else await mutate("save_luke_greeting",{p_calendar_id:id,p_day:day,p_body:draft.body,p_image:draft.image,p_audio:draft.audio,p_revision:revision});
    },
    read:async(id,items)=>{
      const trials=items.filter(item=>item.temporary),saved=items.filter(item=>!item.temporary);
      if(trials.length) changeTemporary(temporaryItems().map(item=>{
        const seen=trials.find(seen=>sameGreeting(item,id,seen.day,seen.userId,seen.previewMode));
        return seen ? {...item,seenRevision:Math.max(item.seenRevision,Math.min(item.revision,seen.revision))} : item;
      }));
      if(saved.length) await mutate("read_luke_greetings",{p_calendar_id:id,p_seen:saved.map(item=>({userId:item.userId,day:item.day,revision:item.revision,previewMode:item.previewMode}))});
    },
  }}>{children}</Context.Provider>;
}

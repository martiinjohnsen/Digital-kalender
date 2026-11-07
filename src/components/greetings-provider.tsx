"use client";
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { rpcForUser, supabase, authMessage } from "@/lib/cloud/client";
import { useAccount } from "./account-provider";
import { cleanUnusedMedia } from "@/lib/cloud/media";
export type Greeting = {calendarId:string;userId:string;day:number;name:string;body:string;image:string|null;audio:string|null;revision:number;seenRevision:number;updatedAt:string;owner:boolean};
type Greetings = {items:Greeting[];ready:boolean;error:string;refresh:()=>Promise<void>;claim:(id:string,day:number)=>Promise<boolean>;
  save:(id:string,day:number,draft:{body:string;image:string|null;audio:string|null},revision:number)=>Promise<void>;
  read:(id:string,items:Greeting[])=>Promise<void>};
const Context=createContext<Greetings|null>(null);
export function useGreetings() {const value=useContext(Context);if(!value) throw new Error("Hilsenene er ikke tilgjengelige.");return value;}
export function GreetingsProvider({children}:{children:ReactNode}) {
  const {user}=useAccount();
  const identity=useRef(user?.id);identity.current=user?.id;
  const [state,setState]=useState({userId:"",items:[] as Greeting[],ready:false,error:""});
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
    if(!user) return;
    void refresh();
    const resume=()=>{if(document.visibilityState === "visible") void refresh();};
    const channel=supabase().channel(`greetings:${user.id}`).on("postgres_changes",{event:"*",schema:"public",table:"luke_greetings"},resume).subscribe();
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
    items:state.userId===user?.id ? state.items : [],ready:state.userId===user?.id && state.ready,error:state.userId===user?.id ? state.error : "",refresh,
    claim:async(id,day)=>{const result=await mutate("claim_luke_greeting_prompt",{p_calendar_id:id,p_day:day});void refresh();return result===true;},
    save:async(id,day,draft,revision)=>{await mutate("save_luke_greeting",{p_calendar_id:id,p_day:day,p_body:draft.body,p_image:draft.image,p_audio:draft.audio,p_revision:revision});},
    read:async(id,items)=>{await mutate("read_luke_greetings",{p_calendar_id:id,p_seen:items.map(item=>({userId:item.userId,day:item.day,revision:item.revision}))});},
  }}>{children}</Context.Provider>;
}

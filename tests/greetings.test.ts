import test from "node:test";
import assert from "node:assert/strict";
import { sameGreeting, temporaryGreeting } from "../src/lib/greetings.ts";

test("a temporary trial offers once, can be edited and keeps the saved revision until content changes",()=>{
  const claimed=temporaryGreeting([],"calendar",1,"owner","test");
  assert.equal(temporaryGreeting(claimed,"calendar",1,"owner","test"),claimed);
  assert.equal(claimed[0].revision,0);
  const sent=temporaryGreeting(claimed,"calendar",1,"owner","test",{body:" Takk! ",image:null,audio:null});
  assert.equal(sent[0].body,"Takk!");assert.equal(sent[0].revision,1);
  assert.equal(sent[0].owner,true);assert.equal(sent[0].temporary,true);
  assert.equal(temporaryGreeting(sent,"calendar",1,"owner","test",{body:"Takk!",image:null,audio:null},1)[0].revision,1);
  const edited=temporaryGreeting(sent,"calendar",1,"owner","test",{body:"Takk igjen!",image:null,audio:null},1);
  assert.equal(edited[0].revision,2);
  assert.throws(()=>temporaryGreeting(edited,"calendar",1,"owner","test",{body:"Gammelt",image:null,audio:null},1),/endret/);
  assert.equal(sent[0].body,"Takk!","An edit mutated a previous snapshot");
});
test("trial modes, accounts and days stay separate and cannot match a real recipient greeting",()=>{
  let items=temporaryGreeting([],"calendar",1,"owner","test");
  items=temporaryGreeting(items,"calendar",1,"owner","date");
  items=temporaryGreeting(items,"calendar",2,"owner","test");
  items=temporaryGreeting(items,"calendar",1,"another-owner","test");
  assert.equal(items.length,4);
  assert.equal(items.filter(item=>sameGreeting(item,"calendar",1,"owner","test")).length,1);
  assert.equal(items.filter(item=>sameGreeting(item,"calendar",1,"owner")).length,0);
  assert.throws(()=>temporaryGreeting([],"calendar",1,"owner","test",{body:"",image:null,audio:null}),/Skriv en hilsen/);
});

import * as r0 from "@/local-api/budgets/route";
import * as r1 from "@/local-api/connections/route";
import * as r2 from "@/local-api/connections/sync/route";
import * as r3 from "@/local-api/connections/[id]/route";
import * as r4 from "@/local-api/health/route";
import * as r5 from "@/local-api/receipts/route";
import * as r6 from "@/local-api/receipts/[id]/route";
import * as r7 from "@/local-api/transactions/route";
import * as r8 from "@/local-api/transactions/[id]/route";
import { initializeDatabase } from "@/db";
type Handler = (request:Request, context:{params:Promise<{id:string}>}) => Promise<Response>;
const routes: Array<[string, Record<string,unknown>]> = [
  ["/api/budgets", r0],
  ["/api/connections", r1],
  ["/api/connections/sync", r2],
  ["/api/connections/[id]", r3],
  ["/api/health", r4],
  ["/api/receipts", r5],
  ["/api/receipts/[id]", r6],
  ["/api/transactions", r7],
  ["/api/transactions/[id]", r8],
];
let queue:Promise<unknown>=Promise.resolve();
// Serialize operations so rapid clicks cannot double-spend or create duplicate records.
export function localFetch(url:string,init:RequestInit={}) : Promise<Response> {
 const execute=async()=>{
   await initializeDatabase();
   const parsed=new URL(url,location.origin);
   for(const [pattern,handlers] of routes){
     const match=parsed.pathname.match(new RegExp("^"+pattern.replace("[id]","([^/]+)")+"$"));
     if(!match)continue;
     const handler=handlers[(init.method??"GET").toUpperCase()] as Handler | undefined;
     if(!handler)return Response.json({error:"Method not allowed"},{status:405});
     return handler(new Request(parsed,init),{params:Promise.resolve({id:match[1]??""})});
   }
   return Response.json({error:"Not found"},{status:404});
 };
 const result=queue.then(execute); queue=result.catch(()=>{}); return result;
}

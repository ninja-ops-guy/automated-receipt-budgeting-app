"use client";
import {useEffect,useState} from "react";
import {localFetch} from "@/lib/local-fetch";
import BudgetWorkspace, {type PurchaseRecord,type EmailConnectionRecord,type BudgetRecord} from "./budget-workspace";
type Data={purchases:PurchaseRecord[];connections:EmailConnectionRecord[];budgets:BudgetRecord[]};
export default function Page(){
 const [data,setData]=useState<Data|null>(null),[error,setError]=useState("");
 useEffect(()=>{let active=true;Promise.all(["transactions","connections","budgets"].map(async p=>{const r=await localFetch("/api/"+p);if(!r.ok)throw new Error("Could not load your workspace");return r.json()})).then(([purchases,connections,budgets])=>{if(active)setData({purchases,connections,budgets})}).catch(e=>{if(active)setError(e.message)});return()=>{active=false}},[]);
 if(error)return <p role="alert">{error}</p>;
 if(!data)return <p role="status">Loading purchases…</p>;
 return <BudgetWorkspace initialTransactions={data.purchases} initialConnections={data.connections} initialBudgets={data.budgets}/>;
}

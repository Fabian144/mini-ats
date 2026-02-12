import{b as l,u as k,a as q,s as o}from"./index-QOa0XFRL.js";import{u as b,b as K,c as u}from"./vendor-query-CUB_NE-9.js";const M=l("Linkedin",[["path",{d:"M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z",key:"c2jq9f"}],["rect",{width:"4",height:"12",x:"2",y:"9",key:"mk3on5"}],["circle",{cx:"4",cy:"4",r:"2",key:"bt5ra8"}]]);const L=l("Mail",[["rect",{width:"20",height:"16",x:"2",y:"4",rx:"2",key:"18n3k1"}],["path",{d:"m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7",key:"1ocrg3"}]]);const A=l("Phone",[["path",{d:"M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z",key:"foiqr5"}]]);function C(){const{user:p,isAdmin:y,adminViewAccount:m}=k(),{toast:s}=q(),n=b(),i=m?.id??p?.id,d=y&&!m,c=K({queryKey:["candidates",d?"all":i],queryFn:async()=>{let e=o.from("candidates").select(`
          id,
          user_id,
          job_id,
          name,
          email,
          phone,
          linkedin_url,
          notes,
          status,
          created_at,
          updated_at,
          jobs (
            id,
            title,
            company
          )
        `).order("created_at",{ascending:!0}).limit(200);d||(e=e.eq("user_id",i));const{data:t,error:a}=await e;if(a)throw a;return t},enabled:d?y:!!i,staleTime:1e3*60*2,refetchOnMount:"always"}),f=u({mutationFn:async e=>{if(!i)throw new Error("Missing target account for candidate creation");const{data:t,error:a}=await o.from("candidates").insert({...e,user_id:i}).select().single();if(a)throw a;return t},onSuccess:()=>{n.invalidateQueries({queryKey:["candidates"]}),s({title:"Kandidat tillagd!"})},onError:e=>{s({title:"Kunde inte lägga till kandidat",description:e.message,variant:"destructive"})}}),g=u({mutationFn:async({id:e,...t})=>{const{jobs:a,...r}=t,{data:w,error:h}=await o.from("candidates").update(r).eq("id",e).select().single();if(h)throw h;return w},onMutate:async e=>{await n.cancelQueries({queryKey:["candidates"]});const t=n.getQueryData(["candidates",i]);return t&&n.setQueryData(["candidates",i],a=>(a??[]).map(r=>r.id===e.id?{...r,...e}:r)),{previous:t}},onError:(e,t,a)=>{a?.previous&&n.setQueryData(["candidates",i],a.previous),s({title:"Kunde inte uppdatera kandidat",description:e.message,variant:"destructive"})},onSettled:()=>{n.invalidateQueries({queryKey:["candidates"]})}}),v=u({mutationFn:async e=>{const{error:t}=await o.from("candidates").delete().eq("id",e);if(t)throw t},onSuccess:()=>{n.invalidateQueries({queryKey:["candidates"]}),s({title:"Kandidat borttagen!"})},onError:e=>{s({title:"Kunde inte ta bort kandidat",description:e.message,variant:"destructive"})}});return{candidates:!d&&i?(c.data??[]).filter(e=>e.user_id===i):c.data??[],isLoading:c.isLoading,createCandidate:f,updateCandidate:g,deleteCandidate:v}}export{M as L,L as M,A as P,C as u};

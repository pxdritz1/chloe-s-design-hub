import { useEffect, useState } from "react";
import { ArrowLeft, ArrowUpRight, Blend, CircleDot, Image, LayoutDashboard, Menu, Monitor, Moon, Palette, ScanLine, Shapes, ShieldCheck, Sun, Type, X } from "lucide-react";
import { BrowserRouter, Link, Navigate, Route, Routes, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { changeLanguage } from "./i18n";
import i18n from "./i18n";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

type Theme = "light" | "dark" | "system";
const usePreferences = create<{theme:Theme;setTheme:(theme:Theme)=>void}>()(
 persist((set)=>({theme:"system",setTheme:(theme)=>set({theme})}),{name:"chloe-design-hub-preferences",storage:createJSONStorage(()=>localStorage),partialize:(state)=>({theme:state.theme})})
);
const tools = [
 {id:"halftone",key:"halftone",category:"image",icon:CircleDot,tone:"clay"},
 {id:"wallpaper-studio",key:"wallpaper",category:"image",icon:Image,tone:"sage"},
 {id:"photocraft",key:"photocraft",category:"image",icon:Blend,tone:"sand"},
 {id:"background-remover",key:"background",category:"image",icon:ScanLine,tone:"lavender"},
 {id:"color-tools",key:"colors",category:"color",icon:Palette,tone:"sage"},
 {id:"accessibility",key:"accessibility",category:"color",icon:ShieldCheck,tone:"clay"},
 {id:"svg-tools",key:"svg",category:"vector",icon:Shapes,tone:"lavender"},
 {id:"typography",key:"typography",category:"type",icon:Type,tone:"sand"}
] as const;

function Shell() {
 const {t}=useTranslation();
 const theme=usePreferences(s=>s.theme);
 const setTheme=usePreferences(s=>s.setTheme);
 const [menuOpen,setMenuOpen]=useState(false);
 const [language,setLanguage]=useState(i18n.resolvedLanguage || "en");
 useEffect(()=>{
  const media=window.matchMedia("(prefers-color-scheme: dark)");
  const apply=()=>{const value=theme==="system"?(media.matches?"dark":"light"):theme;document.documentElement.dataset.theme=value;document.documentElement.style.colorScheme=value;};
  apply();media.addEventListener("change",apply);return()=>media.removeEventListener("change",apply);
 },[theme]);
 const themes:Theme[]=["light","dark","system"];
 const next=themes[(themes.indexOf(theme)+1)%themes.length];
 const ThemeIcon=theme==="light"?Sun:theme==="dark"?Moon:Monitor;
 async function selectLanguage(value:string){if(value==="en"||value==="es"||value==="pt-BR"){await changeLanguage(value);setLanguage(value);}}
 return <div className="min-h-screen bg-background text-foreground md:flex">
  <aside className="hidden min-h-screen w-64 shrink-0 flex-col border-r border-border bg-surface/70 px-5 py-7 md:flex">
   <Link to="/dashboard" className="mb-12 flex items-center gap-3 rounded-xl">
    <span className="flex size-10 items-center justify-center rounded-2xl bg-accent text-white"><Palette size={20}/></span>
    <span><span className="block text-sm font-semibold tracking-tight">chloe's design hub</span><span className="mt-0.5 block text-xs text-muted">{t("tagline")}</span></span>
   </Link>
   <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[.18em] text-muted">WORKSPACE</p>
   <Link to="/dashboard" className="flex items-center gap-3 rounded-xl bg-elevated px-3 py-2.5 text-sm font-medium"><LayoutDashboard size={17}/>{t("allTools")}</Link>
   <div className="mt-auto rounded-2xl border border-border bg-elevated p-4"><div className="mb-3 flex size-9 items-center justify-center rounded-xl bg-accent/15 text-accent"><ShieldCheck size={18}/></div><p className="text-sm font-medium">{t("local")}</p><p className="mt-1 text-xs leading-relaxed text-muted">{t("localDescription")}</p></div>
  </aside>
  <div className="min-w-0 flex-1">
   <header className="flex min-h-[76px] items-center justify-between gap-4 border-b border-border px-5 sm:px-8 lg:px-12">
    <button className="flex items-center gap-2 text-sm font-semibold md:hidden" onClick={()=>setMenuOpen(!menuOpen)} aria-label={t("language")}><Menu size={18}/> chloe's design hub</button>
    <span className="hidden text-xs text-muted md:block">{t("allTools")}</span>
    <div className="ml-auto flex items-center gap-2">
     <label className="sr-only" htmlFor="language-select">{t("language")}</label>
     <select id="language-select" value={language} onChange={e=>void selectLanguage(e.target.value)} className="h-9 rounded-xl border border-border bg-surface px-3 text-xs font-medium"><option value="en">EN</option><option value="es">ES</option><option value="pt-BR">PT-BR</option></select>
     <button onClick={()=>setTheme(next)} aria-label={t("theme")+": "+t(theme)} title={t("theme")+": "+t(theme)} className="flex size-9 items-center justify-center rounded-xl border border-border bg-surface text-muted hover:bg-elevated"><ThemeIcon size={16}/></button>
    </div>
   </header>
   {menuOpen&&<div className="border-b border-border bg-surface p-4 md:hidden"><Link onClick={()=>setMenuOpen(false)} to="/dashboard" className="flex items-center gap-2 text-sm"><LayoutDashboard size={16}/>{t("allTools")}</Link></div>}
   <main className="mx-auto w-full max-w-[1440px] px-5 pb-12 pt-8 sm:px-8 lg:px-12">
    <Routes><Route path="/dashboard" element={<Dashboard/>}/><Route path="/tools/:toolId" element={<ToolLanding/>}/><Route path="*" element={<Navigate to="/dashboard" replace/>}/></Routes>
   </main>
  </div>
 </div>;
}
function Dashboard(){
 const {t}=useTranslation();
 return <div className="space-y-10">
  <section className="max-w-3xl"><p className="mb-3 text-xs font-semibold uppercase tracking-[.2em] text-accent">chloe's design hub</p><h1 className="text-4xl font-semibold tracking-[-.045em] sm:text-5xl">{t("greeting")}</h1><p className="mt-4 max-w-xl text-base leading-relaxed text-muted sm:text-lg">{t("intro")}</p></section>
  <section><div className="mb-5 flex flex-wrap items-end justify-between gap-3"><div><h2 className="text-lg font-semibold tracking-tight">{t("allTools")}</h2><p className="mt-1 text-sm text-muted">Pick a tool and make something yours.</p></div><span className="rounded-full bg-surface px-3 py-1.5 text-xs text-muted">8 tools to explore</span></div>
   <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{tools.map(tool=>{const Icon=tool.icon;return <Link key={tool.id} to={"/tools/"+tool.id} className="group flex min-h-48 flex-col rounded-2xl border border-border bg-surface p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-accent/40 hover:bg-elevated hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"><div className="flex items-start justify-between"><span className={"flex size-11 items-center justify-center rounded-2xl "+(tool.tone==="sage"?"bg-sage-soft text-accent":tool.tone==="clay"?"bg-clay-soft text-clay":tool.tone==="lavender"?"bg-lavender-soft text-lavender":"bg-sand-soft text-sand-ink")}><Icon size={20} strokeWidth={1.7}/></span><ArrowUpRight size={17} className="text-muted transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"/></div><div className="mt-auto pt-7"><p className="mb-1 text-[11px] font-medium uppercase tracking-[.14em] text-muted">{t("category."+tool.category)}</p><h3 className="text-base font-semibold tracking-tight">{t("tools."+tool.key+".0")}</h3><p className="mt-1.5 text-sm leading-relaxed text-muted">{t("tools."+tool.key+".1")}</p></div></Link>})}</div>
  </section>
  <section className="grid gap-3 lg:grid-cols-[1.4fr_1fr]"><div className="rounded-2xl border border-border bg-elevated p-6 sm:p-7"><div className="mb-4 flex size-10 items-center justify-center rounded-xl bg-accent/15 text-accent"><ShieldCheck size={20}/></div><h2 className="text-lg font-semibold">{t("local")}</h2><p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">{t("localDescription")}</p></div><div className="flex flex-col justify-between rounded-2xl bg-accent p-6 text-white sm:p-7"><p className="text-xs font-semibold uppercase tracking-[.18em] text-white/70">A CREATIVE SPACE</p><div className="mt-8"><p className="text-2xl font-semibold tracking-tight">{t("greeting")}</p><p className="mt-2 text-sm leading-relaxed text-white/75">{t("intro")}</p></div></div></section>
 </div>;
}
function ToolLanding(){
 const {toolId}=useParams();const {t}=useTranslation();const tool=tools.find(item=>item.id===toolId);
 if(!tool)return <div className="py-20 text-center"><h1 className="text-2xl font-semibold">404</h1><Link to="/dashboard" className="mt-4 inline-flex items-center gap-2 text-sm text-accent"><ArrowLeft size={15}/>{t("back")}</Link></div>;
 const Icon=tool.icon;
 return <div className="mx-auto max-w-2xl py-8"><Link to="/dashboard" className="inline-flex items-center gap-2 text-sm text-muted hover:text-foreground"><ArrowLeft size={15}/>{t("back")}</Link><div className="mt-10 rounded-3xl border border-border bg-surface p-8 sm:p-12"><div className="flex size-14 items-center justify-center rounded-2xl bg-accent/15 text-accent"><Icon size={26}/></div><p className="mt-7 text-xs font-semibold uppercase tracking-[.16em] text-accent">{t("category."+tool.category)}</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">{t("tools."+tool.key+".0")}</h1><p className="mt-3 text-sm leading-relaxed text-muted">{t("tools."+tool.key+".1")}</p><div className="mt-8 flex gap-3 rounded-2xl bg-elevated p-4"><Menu size={19} className="mt-0.5 shrink-0 text-muted"/><div><p className="text-sm font-medium">{t("coming")}</p><p className="mt-1 text-sm leading-relaxed text-muted">{t("comingDescription")}</p></div></div></div></div>;
}
export function App(){return <BrowserRouter><Shell/></BrowserRouter>;}

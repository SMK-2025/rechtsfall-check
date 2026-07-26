import type {MetadataRoute} from "next";
import {getSiteUrl} from "@/lib/site-url";
export default function sitemap():MetadataRoute.Sitemap{
  const site=getSiteUrl(),lastModified=new Date("2026-07-26");
  return [
    {path:"",priority:1},
    {path:"/rechtsfall-check",priority:.9},
    {path:"/so-funktionierts",priority:.8},
    {path:"/rechtsgebiete",priority:.9},
    {path:"/preise",priority:.8},
    {path:"/sicherheit",priority:.6},
    {path:"/fragen",priority:.7},
  ].map(item=>({url:`${site}${item.path}`,lastModified,changeFrequency:"weekly" as const,priority:item.priority}));
}

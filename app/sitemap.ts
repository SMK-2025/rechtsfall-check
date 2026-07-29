import type {MetadataRoute} from "next";
import {getSiteUrl} from "@/lib/site-url";
import {legalAreas} from "@/lib/legal-areas";
export default function sitemap():MetadataRoute.Sitemap{
  const site=getSiteUrl(),lastModified=new Date("2026-07-29");
  const pages=[
    {path:"",priority:1},
    {path:"/rechtsfall-check",priority:.9},
    {path:"/so-funktionierts",priority:.8},
    {path:"/rechtsgebiete",priority:.9},
    {path:"/preise",priority:.8},
    {path:"/sicherheit",priority:.6},
    {path:"/fragen",priority:.7},
    {path:"/datenschutz",priority:.3},
    {path:"/impressum",priority:.3},
    {path:"/agb",priority:.3},
    {path:"/barrierefreiheit",priority:.3},
  ].map(item=>({url:`${site}${item.path}`,lastModified,changeFrequency:"weekly" as const,priority:item.priority}));
  const areas=legalAreas.map(area=>({url:`${site}/rechtsgebiete/${area.slug}`,lastModified,changeFrequency:"monthly" as const,priority:.75}));
  return [...pages,...areas];
}

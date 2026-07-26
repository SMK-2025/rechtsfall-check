import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAuthenticatedMember } from "../../lib/server/member";
import { ProfileForm } from "./profile-form";
export const dynamic="force-dynamic";
export const metadata:Metadata={title:"Mein Profil | Rechtsfall Check",robots:{index:false,follow:false}};
export default async function ProfilePage(){const user=await getAuthenticatedMember();if(!user)redirect("/anmelden?returnTo=%2Fprofil");return <ProfileForm initial={{displayName:user.displayName,email:user.email}}/>}

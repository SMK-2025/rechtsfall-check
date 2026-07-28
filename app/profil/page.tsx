import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAuthenticatedMember } from "../../lib/server/member";
import { ProfileForm } from "./profile-form";
export const dynamic="force-dynamic";
export const metadata:Metadata={title:"Mein Profil | Rechtsfall Check",robots:{index:false,follow:false}};
export default async function ProfilePage(){
  const user=await getAuthenticatedMember();
  if(!user)redirect("/anmelden?returnTo=%2Fprofil");
  const nameParts=user.displayName.trim().split(/\s+/);
  return <ProfileForm initial={{
    firstName:user.firstName ?? nameParts[0] ?? "",
    lastName:user.lastName ?? nameParts.slice(1).join(" "),
    street:user.street ?? "",
    postalCode:user.postalCode ?? "",
    city:user.city ?? "",
    phone:user.phone ?? "",
    email:user.email,
    deletionRequestedAt:user.deletionRequestedAt?.toISOString() ?? null,
    deletionScheduledFor:user.deletionScheduledFor?.toISOString() ?? null,
  }}/>;
}

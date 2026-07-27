import { redirect } from "next/navigation";

export default function RegisterPage() {
  redirect("/anmelden?mode=signup");
}

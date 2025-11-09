import { redirect } from "next/navigation";

/**
 * Redirection vers la nouvelle route de choix de rôle
 */
export default function RegisterRedirect() {
  redirect("/auth/role");
}


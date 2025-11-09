import { redirect } from "next/navigation";

/**
 * Redirection vers la nouvelle route de login
 */
export default function LoginRedirect() {
  redirect("/auth/login");
}


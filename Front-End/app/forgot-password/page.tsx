import { redirect } from "next/navigation";

/**
 * Redirection vers la nouvelle route de mot de passe oublié
 */
export default function ForgotPasswordRedirect() {
  redirect("/auth/forgot-password");
}


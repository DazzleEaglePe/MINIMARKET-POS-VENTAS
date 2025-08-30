import { supabase } from "./supabase.config";

export async function bootstrapUserAfterLogin({ id_auth, email }) {
  const { data, error } = await supabase.rpc('bootstrap_user_after_login', {
    p_id_auth: id_auth,
    p_email: email,
  });
  if (error) {
    throw new Error(error.message);
  }
  return data;
}

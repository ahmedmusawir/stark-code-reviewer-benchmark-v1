import HomePageContent from "./HomePageContent";
import { createClient } from "@/utils/supabase/server";
import { getUserRole, type AppRole } from "@/utils/get-user-role";

const Home = async () => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const user = data?.user ?? null;
  const role: AppRole | null = user ? await getUserRole(user.id) : null;

  return (
    <HomePageContent userEmail={user?.email ?? null} role={role} />
  );
};

export default Home;

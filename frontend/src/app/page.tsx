import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { ChatComponent } from "@/components/chat";
import { LandingPage } from "@/components/landing";

export default async function Home() {
  const { isAuthenticated } = getKindeServerSession();
  if (!(await isAuthenticated())) {
    return <LandingPage />;
  }
  return (
    <div className="h-screen w-full bg-background">
      <ChatComponent />
    </div>
  );
}

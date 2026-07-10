import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { redirect } from "next/navigation";
import { ChatComponent } from "@/components/chat";

export default async function ChatPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { isAuthenticated } = getKindeServerSession();
  if (!(await isAuthenticated())) redirect("/");

  const { id } = await params;
  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <ChatComponent initialId={id} />
    </div>
  );
}

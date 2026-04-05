'use client'

import { useRouter } from "next/navigation";

export const HomeComponent = () => {
  const router = useRouter();
  const handleClick = async () => {
    router.replace('/chat/' + crypto.randomUUID());
  };

  return (
    <div className="flex flex-col flex-1 bg-zinc-50 items-center justify-center">
      <button className="bg-black text-white p-4" onClick={handleClick}>
        Start Message
      </button>
    </div>
  );
}

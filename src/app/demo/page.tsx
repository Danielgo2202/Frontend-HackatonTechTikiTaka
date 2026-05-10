"use client";

import { MeetingRoom } from "@/components/meeting/MeetingRoom";
import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { Sparkles } from "lucide-react";

export default function DemoPage() {
  return (
    <div className="relative grid min-h-dvh grid-rows-[auto_minmax(0,1fr)] bg-[#0A0E1A]">
      <header className="relative z-20 border-b border-white/[0.06] bg-[#0A0E1A]/85 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-[1360px] items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm font-semibold tracking-tight text-[#F1F5F9]"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/20">
              <Sparkles className="h-4 w-4 text-white" aria-hidden />
            </span>
            Close Pilot
          </Link>
          <UserButton
            appearance={{
              elements: {
                avatarBox: "h-9 w-9 ring-2 ring-white/10",
              },
            }}
          />
        </div>
      </header>
      <MeetingRoom fillViewport={false} />
    </div>
  );
}

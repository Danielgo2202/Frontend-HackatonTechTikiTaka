"use client";

import { MeetingRoom } from "@/components/meeting/MeetingRoom";
import { UserButton } from "@clerk/nextjs";
import { BellDot } from "lucide-react";
import Link from "next/link";

export default function DemoPage() {
  return (
    <div className="min-h-dvh bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-[1500px] items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2">
              <div className="grid h-7 w-7 place-items-center rounded-lg bg-foreground text-[11px] font-bold text-background">
                CP
              </div>
              <span className="text-[15px] font-semibold tracking-tight">
                Close Pilot
              </span>
            </Link>
            <span className="hidden rounded-full bg-success/10 px-2.5 py-1 text-[11px] font-medium text-success md:inline-flex">
              Live workspace
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button className="grid h-9 w-9 place-items-center rounded-full transition hover:bg-accent">
              <BellDot className="h-4 w-4" />
            </button>
            <UserButton
              appearance={{
                elements: {
                  avatarBox: "h-9 w-9 ring-1 ring-stone-200",
                },
              }}
            />
          </div>
        </div>
      </header>
      <MeetingRoom fillViewport={false} />
    </div>
  );
}

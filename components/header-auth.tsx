"use client";

import { Show, SignInButton, UserButton } from "@clerk/nextjs";
import { Suspense } from "react";

import { Button } from "@/components/ui/button";

export function HeaderAuth() {
  return (
    <Suspense fallback={<Button variant="secondary">Login</Button>}>
      <Show when="signed-out">
        <SignInButton mode="modal">
          <Button variant="secondary">Login</Button>
        </SignInButton>
      </Show>
      <Show when="signed-in">
        <UserButton />
      </Show>
    </Suspense>
  );
}

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { navigateWithTransition, type RouteTransitionDirection } from "@/lib/view-transition";
import type { MouseEvent, PointerEvent, ReactNode } from "react";
import { useRef } from "react";

type TransitionLinkProps = {
  href: string;
  className?: string;
  children: ReactNode;
  direction?: RouteTransitionDirection;
};

export function TransitionLink({
  href,
  className,
  children,
  direction = "forward",
}: TransitionLinkProps) {
  const router = useRouter();
  const pointerTypeRef = useRef<string | null>(null);

  const handlePointerDown = (event: PointerEvent<HTMLAnchorElement>) => {
    pointerTypeRef.current = event.pointerType || null;
  };

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }

    event.preventDefault();

    // Mouse clicks felt jittery with View Transitions on this page.
    // Keep transitions for touch/pen swipes and non-pointer navigations.
    if (pointerTypeRef.current === "mouse") {
      router.push(href);
      return;
    }

    navigateWithTransition(router, href, direction);
  };

  return (
    <Link
      href={href}
      className={className}
      onPointerDown={handlePointerDown}
      onClick={handleClick}
    >
      {children}
    </Link>
  );
}

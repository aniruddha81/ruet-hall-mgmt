"use client";

import { useRouter } from "next/navigation";
import { useRef, type TouchEvent } from "react";
import { navigateWithTransition, type RouteTransitionDirection } from "@/lib/view-transition";

type SwipeTarget = {
  href: string;
  direction: RouteTransitionDirection;
};

type SwipeTransitionOptions = {
  onSwipeLeft?: SwipeTarget;
  onSwipeRight?: SwipeTarget;
  threshold?: number;
};

const INTERACTIVE_SELECTOR = "input, textarea, select, button, a, [role='button']";

export function useSwipeRouteTransition({
  onSwipeLeft,
  onSwipeRight,
  threshold = 90,
}: SwipeTransitionOptions) {
  const router = useRouter();
  const startXRef = useRef<number | null>(null);
  const startYRef = useRef<number | null>(null);
  const shouldTrackRef = useRef(true);
  const isNavigatingRef = useRef(false);

  const clearDragState = () => {
    delete document.documentElement.dataset.routeDragging;
    document.documentElement.style.removeProperty("--swipe-dx");
  };

  const navigateToSwipeTarget = (target: SwipeTarget) => {
    if (isNavigatingRef.current) {
      return;
    }
    isNavigatingRef.current = true;
    navigateWithTransition(router, target.href, target.direction);
  };

  const onTouchStart = (event: TouchEvent<HTMLElement>) => {
    if (event.touches.length !== 1) {
      shouldTrackRef.current = false;
      return;
    }

    const target = event.target as HTMLElement | null;
    shouldTrackRef.current = !target?.closest(INTERACTIVE_SELECTOR);

    if (!shouldTrackRef.current) {
      return;
    }

    startXRef.current = event.touches[0].clientX;
    startYRef.current = event.touches[0].clientY;
    document.documentElement.dataset.routeDragging = "true";
  };

  const onTouchMove = (event: TouchEvent<HTMLElement>) => {
    if (!shouldTrackRef.current || startXRef.current === null || startYRef.current === null) {
      return;
    }

    const dx = event.touches[0].clientX - startXRef.current;
    const dy = event.touches[0].clientY - startYRef.current;

    if (Math.abs(dx) < Math.abs(dy)) {
      return;
    }

    const clamped = Math.max(-140, Math.min(140, dx));
    document.documentElement.style.setProperty("--swipe-dx", `${clamped}px`);
  };

  const onTouchEnd = (event: TouchEvent<HTMLElement>) => {
    if (!shouldTrackRef.current || startXRef.current === null || startYRef.current === null) {
      return;
    }

    const touch = event.changedTouches[0];
    const deltaX = touch.clientX - startXRef.current;
    const deltaY = touch.clientY - startYRef.current;
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);

    startXRef.current = null;
    startYRef.current = null;
    shouldTrackRef.current = true;
    clearDragState();

    if (absX < threshold || absX < absY * 1.2) {
      return;
    }

    if (deltaX < 0 && onSwipeLeft) {
      navigateToSwipeTarget(onSwipeLeft);
      return;
    }

    if (deltaX > 0 && onSwipeRight) {
      navigateToSwipeTarget(onSwipeRight);
    }
  };

  const onTouchCancel = () => {
    startXRef.current = null;
    startYRef.current = null;
    shouldTrackRef.current = true;
    clearDragState();
  };

  return {
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    onTouchCancel,
  };
}

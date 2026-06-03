import type { Hall, MealMenu, MealType } from "@/lib/types";
import { HALLS } from "@/lib/types";

export type TomorrowMenus = {
  lunch: MealMenu[];
  dinner: MealMenu[];
};

export type MealBookingStep = "hall" | "meal";

export function formatHallLabel(hall: string) {
  return hall.replace(/_/g, " ");
}

export function getHallsWithTomorrowMenus(menus: TomorrowMenus): Hall[] {
  const available = new Set<Hall>();
  for (const menu of [...menus.lunch, ...menus.dinner]) {
    available.add(menu.hall);
  }
  return HALLS.filter((hall) => available.has(hall));
}

export function getMealTypesForHall(
  menus: TomorrowMenus,
  hall: Hall,
): MealType[] {
  const types: MealType[] = [];
  if (menus.lunch.some((m) => m.hall === hall)) types.push("LUNCH");
  if (menus.dinner.some((m) => m.hall === hall)) types.push("DINNER");
  return types;
}

export function getMenuForHallAndMeal(
  menus: TomorrowMenus,
  hall: Hall,
  mealType: MealType,
): MealMenu | undefined {
  const list = mealType === "LUNCH" ? menus.lunch : menus.dinner;
  return list.find((m) => m.hall === hall);
}

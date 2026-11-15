"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

export const ROUTE_COLORS = [
  { label: "USC red", value: "#990000" },
  { label: "USC gold", value: "#ffcc00" },
  { label: "Green", value: "#16a34a" },
] as const;
export const ARROW_STYLES = [
  { value: "chevron", label: "Chevron", path: "m9 7 6 5-6 5" },
  { value: "triangle", label: "Triangle", path: "m7 5 11 7-11 7Z" },
  { value: "arrow", label: "Arrow", path: "M4 12h15m-6-6 6 6-6 6" },
] as const;
export type ArrowStyle = (typeof ARROW_STYLES)[number]["value"];
const Appearance = createContext({
  color: "#16a34a",
  arrowStyle: "chevron" as ArrowStyle,
  setColor: (_: string) => {},
  setArrowStyle: (_: ArrowStyle) => {},
});

export const useRouteAppearance = () => useContext(Appearance);

export function RouteAppearanceProvider({ children }: { children: ReactNode }) {
  const [color, setColor] = useState("#16a34a");
  const [arrowStyle, setArrowStyle] = useState<ArrowStyle>("chevron");
  return (
    <Appearance.Provider value={{ color, setColor, arrowStyle, setArrowStyle }}>
      {children}
    </Appearance.Provider>
  );
}

export function RouteAppearance() {
  const { color, setColor, arrowStyle, setArrowStyle } = useRouteAppearance();
  return (
    <details
      className="rounded-xl border border-neutral-200 bg-neutral-50 p-3"
      open
    >
      <summary className="cursor-pointer text-[12px] font-bold text-neutral-800">
        Route appearance{" "}
        <span className="ml-1 font-normal text-neutral-500">· Temporary</span>
      </summary>
      <fieldset className="mt-3">
        <legend className="mb-2 text-[11px] font-semibold text-neutral-600">
          Route color
        </legend>
        <div className="grid grid-cols-3 gap-1.5">
          {ROUTE_COLORS.map((option) => (
            <label
              key={option.value}
              className={`relative flex min-h-11 cursor-pointer items-center justify-center gap-1.5 rounded-lg border bg-white px-1 text-[11px] font-semibold focus-within:ring-2 focus-within:ring-neutral-500 ${color === option.value ? "border-neutral-800 text-neutral-900" : "border-neutral-200 text-neutral-600"}`}
            >
              <input
                className="sr-only"
                type="radio"
                name="route-color"
                value={option.value}
                checked={color === option.value}
                onChange={() => setColor(option.value)}
              />
              <span
                className="h-3 w-3 shrink-0 rounded-full border border-black/15"
                style={{ background: option.value }}
              />
              {option.label}
            </label>
          ))}
        </div>
      </fieldset>
      <fieldset className="mt-3">
        <legend className="mb-2 text-[11px] font-semibold text-neutral-600">
          Direction arrows
        </legend>
        <div className="grid grid-cols-3 gap-1.5">
          {ARROW_STYLES.map((option) => (
            <label
              key={option.value}
              className={`relative flex min-h-14 cursor-pointer flex-col items-center justify-center rounded-lg border bg-white text-[11px] font-semibold focus-within:ring-2 focus-within:ring-neutral-500 ${arrowStyle === option.value ? "border-neutral-800 text-neutral-900" : "border-neutral-200 text-neutral-600"}`}
            >
              <input
                className="sr-only"
                type="radio"
                name="route-arrow"
                value={option.value}
                checked={arrowStyle === option.value}
                onChange={() => setArrowStyle(option.value)}
              />
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                className="h-6 w-6"
                style={{ color: color === "#ffcc00" ? "#806600" : color }}
              >
                <path
                  d={option.path}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              {option.label}
            </label>
          ))}
        </div>
      </fieldset>
      <p className="mt-2 text-[10px] leading-relaxed text-neutral-500">
        Preview changes instantly. Resets when you reload.
      </p>
    </details>
  );
}

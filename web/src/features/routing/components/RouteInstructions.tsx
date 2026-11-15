import { ChevronLeft, ChevronRight, X } from "lucide-react";
import type { Route } from "@trojan-compass/shared/api";

export function RouteInstructions({
  route,
  activeStep,
  onStep,
  onClear,
}: {
  route: Route;
  activeStep: number;
  onStep: (index: number) => void;
  onClear: () => void;
}) {
  const current = route.steps[activeStep];
  return (
    <section
      aria-label="Route directions"
      className="mt-5 border-t border-neutral-200 pt-4"
    >
      <div className="flex items-start gap-2">
        <div className="flex-1">
          <h3 className="text-[14px] font-bold text-green-800">
            Follow the green line
          </h3>
          <p className="mt-1 text-[12px] text-neutral-600">
            {Math.round(route.distanceMeters)} m · About{" "}
            {Math.max(1, Math.ceil(route.durationSeconds / 60))} min ·{" "}
            {route.usesElevator
              ? "Elevators"
              : route.usesStairs
                ? "Stairs"
                : "Same floor"}
          </p>
        </div>
        <button
          type="button"
          aria-label="Clear route"
          onClick={onClear}
          className="rounded p-1 text-neutral-400 hover:bg-neutral-100"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <p
        className="mt-3 rounded-lg bg-green-50 p-3 text-[12px] leading-relaxed text-green-900"
        role="status"
      >
        {current?.text}
      </p>
      <p className="mt-2 text-[11px] leading-relaxed text-neutral-500">
        <span className="font-semibold text-green-800">Green arrows</span> show
        where to walk.
        {route.legs.some((leg) => leg.kind === "vertical") && (
          <>
            <br />
            <span className="font-semibold text-blue-700">
              Blue marker
            </span>{" "}
            shows where to change floors.
          </>
        )}
      </p>
      <div className="mt-2 flex items-center justify-between text-[11px] text-neutral-500">
        <button
          type="button"
          onClick={() => onStep(activeStep - 1)}
          disabled={activeStep === 0}
          className="flex items-center gap-1 rounded px-2 py-1.5 disabled:opacity-30"
        >
          <ChevronLeft className="h-3 w-3" />
          Previous
        </button>
        <span>
          Step {activeStep + 1} of {route.steps.length}
        </span>
        <button
          type="button"
          onClick={() => onStep(activeStep + 1)}
          disabled={activeStep >= route.steps.length - 1}
          className="flex items-center gap-1 rounded px-2 py-1.5 text-green-800 disabled:opacity-30"
        >
          Next
          <ChevronRight className="h-3 w-3" />
        </button>
      </div>
      <ol className="mt-2 space-y-1">
        {route.steps.map((step, i) => (
          <li key={step.id}>
            <button
              type="button"
              onClick={() => onStep(i)}
              aria-current={i === activeStep ? "step" : undefined}
              className={`flex w-full items-start gap-2 rounded-lg p-2 text-left text-[12px] leading-relaxed ${i === activeStep ? "bg-green-50 font-semibold text-green-900" : "text-neutral-600 hover:bg-neutral-50"}`}
            >
              <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full border border-current text-[10px]">
                {i + 1}
              </span>
              {step.text}
            </button>
          </li>
        ))}
      </ol>
      <p className="mt-3 text-[11px] leading-relaxed text-neutral-500">
        {route.stepFreeRequested && !route.verifiedStepFree
          ? "Illustrative elevator route. Step-free access and elevator availability have not been verified."
          : "Illustrative route · Distances and travel times are estimates."}
      </p>
    </section>
  );
}

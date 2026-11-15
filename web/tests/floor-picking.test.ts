import assert from "node:assert/strict";
import { test } from "node:test";
import {
  Children,
  createElement,
  isValidElement,
  type ComponentProps,
  type FunctionComponent,
  type ReactElement,
} from "react";
import { renderToStaticMarkup } from "react-dom/server";
import "./viewer-fixtures";
import { BuildingScene } from "../src/features/map/renderer/BuildingScene";

function scene(floor: number, allFloors = false) {
  return BuildingScene({
    code: "LAW",
    floor,
    allFloors,
    layers: new Set(),
    highlights: new Map(),
    currentLocation: null,
    placingCurrentLocation: false,
    isFinalLeg: false,
    onMoveCurrentLocation() {},
    onSelectCell() {},
    onSelectFloor() {},
  });
}

test("faint floors above the selected floor cannot intercept clicks", () => {
  const floors = Children.toArray(scene(2).props.children).filter(
    (child): child is ReactElement<{ floor: number; interactive: boolean }> =>
      isValidElement<{ interactive: boolean }>(child) &&
      "interactive" in child.props,
  );
  assert.ok(floors.some(({ props }) => props.floor > 2));
  assert.ok(floors.some(({ props }) => props.floor < 2));
  for (const { props } of floors)
    assert.equal(props.interactive, props.floor < 2);
});

test("active floor surfaces block clicks and hover reaching floors behind them", () => {
  for (const allFloors of [false, true]) {
    const floors = Children.toArray(scene(4, allFloors).props.children).filter(
      (child): child is ReactElement<ComponentProps<typeof BuildingScene>> =>
        isValidElement<ComponentProps<typeof BuildingScene>>(child) &&
        "onSelectCell" in child.props,
    );
    assert.ok(floors.length > 0);
    for (const floor of floors) {
      let blocked = 0;
      function Probe() {
        const Component = floor.type as FunctionComponent<
          ComponentProps<typeof BuildingScene>
        >;
        const group = Component(floor.props) as ReactElement<{
          onClick: (event: { stopPropagation(): void }) => void;
          onPointerOver: (event: { stopPropagation(): void }) => void;
        }>;
        const event = { stopPropagation: () => blocked++ };
        group.props.onClick(event);
        group.props.onPointerOver(event);
        return null;
      }
      renderToStaticMarkup(createElement(Probe));
      assert.equal(blocked, 2);
    }
  }
});

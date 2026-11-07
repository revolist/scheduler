import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FilterPlugin } from "@revolist/revogrid";
import { EventSchedulerPlugin } from "@revolist/scheduler";
import { DialogPlugin } from "@revolist/revogrid-pro";
import { createPropertyBookingDemo } from "../../src/examples/property-booking/demo";
import {
  createBookings,
  createProperties,
} from "../../src/examples/property-booking/data";
import { openBookingEditor } from "../../src/examples/property-booking/editor";

const history = vi.hoisted(() => ({ dispose: vi.fn() }));
vi.mock("@revolist/revogrid-pro", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@revolist/revogrid-pro")>()),
  defineHistoryControls: vi.fn(() => history.dispose),
}));
vi.mock("../../src/examples/property-booking/editor", () => ({
  openBookingEditor: vi.fn(),
}));

function connection(matchingIds: string[] = ["harbour", "sunset"]) {
  const grid = document.createElement("div") as unknown as HTMLRevoGridElement;
  const filter = Object.assign(Object.create(FilterPlugin.prototype), {
    multiFilterItems: {
      resourceLabel: [{ type: "contains", value: "native selection" }],
    },
    getRowFilter: vi.fn(
      (rows: { resourceId: string }[], filters: Record<string, unknown>) =>
        Object.fromEntries(
          rows.flatMap((row, index) =>
            Object.keys(filters).length &&
            !matchingIds.includes(String(row.resourceId))
              ? [[index, true]]
              : [],
          ),
        ),
    ),
  });
  const scheduler = Object.assign(
    Object.create(EventSchedulerPlugin.prototype),
    {
      getProjection: vi.fn(),
      getResourceColumnState: vi.fn(() => [
        {
          prop: "resourceLabel",
          filters: filter.multiFilterItems.resourceLabel,
        },
      ]),
      resetResourceColumnState: vi.fn(() => {
        filter.multiFilterItems = {};
        grid.dispatchEvent(
          new CustomEvent("afterfilterapply", { detail: { filterItems: {} } }),
        );
      }),
    },
  );
  const dialog = Object.assign(Object.create(DialogPlugin.prototype), {
    close: vi.fn(),
  });
  Object.assign(grid, {
    componentOnReady: vi.fn(async () => grid),
    getPlugins: vi.fn(async () => [scheduler, dialog, filter]),
    getVisibleSource: vi.fn(async () =>
      matchingIds.map((resourceId) => ({
        __eventSchedulerResource: true,
        resourceId,
      })),
    ),
  });
  const apply = async () => {
    grid.dispatchEvent(
      new CustomEvent("afterfilterapply", {
        detail: { filterItems: filter.multiFilterItems },
      }),
    );
    await Promise.resolve();
  };
  return { grid, filter, scheduler, dialog, apply };
}

beforeEach(() => {
  vi.spyOn(window.customElements, "whenDefined").mockResolvedValue(HTMLElement);
  history.dispose.mockClear();
  vi.mocked(openBookingEditor).mockClear();
});
afterEach(() => vi.restoreAllMocks());

describe("Property Booking regression contracts", () => {
  it("keeps native filtering independent from toolbar narrowing and broadening", async () => {
    const model = createPropertyBookingDemo();
    const f = connection();
    await model.connect(f.grid, document.createElement("div"), vi.fn());
    await f.apply();
    expect(model.state.propertyCount).toBe(2);
    model.setType("Villa");
    expect(model.state.propertyCount).toBe(1);
    model.setType("All properties");
    expect(model.state.propertyCount).toBe(2);
    model.setCapacity(8);
    expect(model.state.propertyCount).toBe(1);
    model.setCapacity(0);
    expect(model.state.propertyCount).toBe(2);
    expect(model.state.config.timelineSummary).toMatchObject({
      resourceIds: ["harbour", "sunset"],
    });
    expect(f.filter.getRowFilter).toHaveBeenCalled();
    expect(
      f.filter.getRowFilter.mock.calls.every(
        ([rows]) => rows.length === createProperties().length,
      ),
    ).toBe(true);
    f.filter.multiFilterItems = {};
    await f.apply();
    expect(model.state.propertyCount).toBe(createProperties().length);
    model.disconnect();
  });

  it("limits selection, totals and creation to the native resource scope and clears it on Reset", async () => {
    const model = createPropertyBookingDemo();
    const f = connection();
    await model.connect(f.grid, document.createElement("div"), vi.fn());
    await f.apply();
    model.selectAll(true);
    expect(model.state.selectedIds).toEqual(["harbour", "sunset"]);
    model.setSummary("selectedOnly", true);
    expect(model.state.config.timelineSummary).toMatchObject({
      resourceIds: ["harbour", "sunset"],
    });
    model.newBooking();
    expect(
      vi
        .mocked(openBookingEditor)
        .mock.calls.at(-1)?.[0]
        .resources.map((r) => r.id),
    ).toEqual(["harbour", "sunset"]);
    model.reset();
    await Promise.resolve();
    expect(f.scheduler.resetResourceColumnState).toHaveBeenCalledOnce();
    expect(model.state.propertyCount).toBe(createProperties().length);
    expect(model.state.selectedIds).toEqual([]);
    expect(model.state.config.timelineSummary).toMatchObject({
      resourceIds: createProperties().map((r) => r.id),
    });
    model.disconnect();
  });

  it("does not create a booking when native filters match no resources", async () => {
    const model = createPropertyBookingDemo();
    const f = connection([]);
    await model.connect(f.grid, document.createElement("div"), vi.fn());
    await f.apply();
    expect(model.state.propertyCount).toBe(0);
    model.selectAll(true);
    expect(model.state.selectedCount).toBe(0);
    model.newBooking();
    expect(openBookingEditor).not.toHaveBeenCalled();
    model.disconnect();
  });

  it("cleans up filtering and history on disconnect and recomputes scope on reconnect", async () => {
    const model = createPropertyBookingDemo();
    const first = connection();
    const publish = vi.fn();
    await model.connect(first.grid, document.createElement("div"), publish);
    await first.apply();
    model.disconnect();
    expect(history.dispose).toHaveBeenCalledOnce();
    const count = publish.mock.calls.length;
    await first.apply();
    expect(publish).toHaveBeenCalledTimes(count);
    const second = connection(["cedar"]);
    await model.connect(second.grid, document.createElement("div"), publish);
    await second.apply();
    expect(model.state.propertyCount).toBe(1);
    model.disconnect();
    expect(history.dispose).toHaveBeenCalledTimes(2);
  });

  it("preserves authored event colors in both status resolution and custom event surfaces", () => {
    const config = createPropertyBookingDemo().state.config;
    for (const status of ["New", "Confirmed"]) {
      const event = { ...createBookings()[0], status, color: "#123456" };
      expect(config.statusColorResolver?.(event)).toBe("#123456");
      const properties = config.customization?.events?.properties;
      expect(typeof properties).toBe("function");
      expect((properties as Function)({ event }).style).toMatchObject({
        "--event-scheduler-event-color": "#123456",
        "--event-scheduler-event-track-bg": "#123456",
      });
    }
  });

  it("rejects unsupported statuses while accepting an otherwise valid booking", () => {
    const validate = createPropertyBookingDemo().state.config
      .validateMutation as Function;
    const event = createBookings()[0];
    expect(validate({ changedEvents: [event] })).toBeUndefined();
    expect(
      validate({ changedEvents: [{ ...event, status: "Unrecognized" }] }),
    ).toMatch(/supported booking status/i);
  });

  it("keeps navigation inside supported years without corrupting the applied range", () => {
    const model = createPropertyBookingDemo();
    model.setRange("0001-01-01", "0001-01-14");
    expect(model.state.start).toBe("0001-01-01");
    model.navigate(-7);
    expect([model.state.start, model.state.end]).toEqual([
      "0001-01-01",
      "0001-01-14",
    ]);
    model.setRange("9999-12-18", "9999-12-31");
    model.navigate(7);
    expect([model.state.start, model.state.end]).toEqual([
      "9999-12-18",
      "9999-12-31",
    ]);
  });

  it("allows 62 inclusive calendar days but rejects 63 and noncanonical dates", () => {
    const model = createPropertyBookingDemo();
    model.setRange("2026-10-19", "2026-12-19");
    expect(model.state.end).toBe("2026-12-19");
    model.setRange("2026-10-19", "2026-12-20");
    expect(model.state.end).toBe("2026-12-19");
    model.setRange("2026-1-01", "2026-01-02");
    expect(model.state.start).toBe("2026-10-19");
  });
});

"use client";
import {
  useEffect,
  useRef,
  useState,
  type PointerEvent,
  type ReactNode,
} from "react";
import { blockNames, moveDoorBlock, type DoorBlockKind } from "@/lib/model";
import { Icon } from "./icons";
type Drag = {
  block: DoorBlockKind;
  pointer: number;
  y: number;
  target: number;
};
export function ContentStack({
  order,
  onOrderChange,
  onRemove,
  renderBlock,
}: {
  order: DoorBlockKind[];
  onOrderChange: (order: DoorBlockKind[]) => void;
  onRemove: (block: DoorBlockKind) => void;
  renderBlock: (block: DoorBlockKind) => ReactNode;
}) {
  const root = useRef<HTMLDivElement>(null),
    rows = useRef(new Map<DoorBlockKind, HTMLElement>()),
    active = useRef<Drag | null>(null),
    orderRef = useRef(order),
    changeRef = useRef(onOrderChange),
    pointerY = useRef(0);
  orderRef.current = order;
  changeRef.current = onOrderChange;
  const [drag, setDrag] = useState<Drag | null>(null),
    [announcement, setAnnouncement] = useState("");
  function updateDrag(value: Drag | null) {
    active.current = value;
    setDrag(value);
  }
  function complete(cancel = false) {
    const current = active.current;
    if (!current) return;
    updateDrag(null);
    if (!cancel) {
      changeRef.current(
        moveDoorBlock(
          orderRef.current,
          orderRef.current.indexOf(current.block),
          current.target,
        ),
      );
      setAnnouncement(
        `${blockNames[current.block]} er flyttet til plass ${current.target + 1}.`,
      );
    }
  }
  function start(event: PointerEvent<HTMLButtonElement>, block: DoorBlockKind) {
    if (event.button !== 0 || orderRef.current.length < 2) return;
    event.preventDefault();
    event.currentTarget.focus({ preventScroll: true });
    event.currentTarget.setPointerCapture(event.pointerId);
    pointerY.current = event.clientY;
    updateDrag({
      block,
      pointer: event.pointerId,
      y: event.clientY,
      target: orderRef.current.indexOf(block),
    });
  }
  function move(event: { pointerId: number; clientY: number }) {
    const current = active.current;
    if (!current || event.pointerId !== current.pointer) return;
    pointerY.current = event.clientY;
    const others = orderRef.current.filter((block) => block !== current.block);
    let target = others.findIndex((block) => {
      const box = rows.current.get(block)?.getBoundingClientRect();
      return box && event.clientY < box.top + box.height / 2;
    });
    if (target < 0) target = others.length;
    updateDrag({ ...current, y: event.clientY, target });
  }
  useEffect(() => {
    const release = (event: globalThis.PointerEvent) => {
      if (active.current?.pointer === event.pointerId) complete();
    };
    const cancel = () => complete(true);
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && active.current) {
        event.preventDefault();
        event.stopPropagation();
        complete(true);
      }
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", release);
    window.addEventListener("pointercancel", cancel);
    window.addEventListener("blur", cancel);
    window.addEventListener("keydown", escape, true);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", release);
      window.removeEventListener("pointercancel", cancel);
      window.removeEventListener("blur", cancel);
      window.removeEventListener("keydown", escape, true);
    };
  }, []);
  useEffect(() => {
    if (!drag) return;
    const scroller = root.current?.closest<HTMLElement>(".dialog-scroll");
    let frame: number;
    const scroll = () => {
      if (scroller) {
        const box = scroller.getBoundingClientRect(),
          y = pointerY.current,
          direction = y < box.top + 110 ? -1 : y > box.bottom - 90 ? 1 : 0;
        if (direction) scroller.scrollTop += direction * 7;
      }
      frame = requestAnimationFrame(scroll);
    };
    frame = requestAnimationFrame(scroll);
    return () => cancelAnimationFrame(frame);
  }, [Boolean(drag)]);
  const target = drag
    ? order.filter((block) => block !== drag.block)[drag.target]
    : undefined;
  return (
    <div ref={root} className={`content-stack ${drag ? "is-sorting" : ""}`}>
      <span className="sr-only" role="status">
        {announcement}
      </span>
      {order.map((block, index) => (
        <section
          key={block}
          ref={(element) => {
            if (element) rows.current.set(block, element);
            else rows.current.delete(block);
          }}
          className={`content-block ${drag?.block === block ? "drag-source" : ""} ${target === block ? "drop-before" : ""}`}
          data-block={block}
        >
          <header className="content-block-header">
            <h3>{blockNames[block]}</h3>
            <span className="block-position">{index + 1}</span>
            <button
              type="button"
              className="block-remove"
              aria-label={`Fjern ${blockNames[block].toLocaleLowerCase("nb")}`}
              onClick={() => onRemove(block)}
            >
              <Icon name="trash" size={16} />
              <span>Fjern</span>
            </button>
            <button
              type="button"
              className="block-grip"
              aria-label={`Flytt ${blockNames[block].toLocaleLowerCase("nb")}. Dra eller bruk pil opp og ned.`}
              title="Dra for å endre rekkefølge. Du kan også bruke piltastene."
              disabled={order.length < 2}
              onPointerDown={(event) => start(event, block)}
              onPointerUp={() => complete()}
              onPointerCancel={() => complete(true)}
              onLostPointerCapture={() => complete()}
              onKeyDown={(event) => {
                const next =
                  event.key === "ArrowUp"
                    ? index - 1
                    : event.key === "ArrowDown"
                      ? index + 1
                      : event.key === "Home"
                        ? 0
                        : event.key === "End"
                          ? order.length - 1
                          : -1;
                if (next < 0 || next >= order.length) return;
                event.preventDefault();
                onOrderChange(moveDoorBlock(order, index, next));
                setAnnouncement(
                  `${blockNames[block]} er flyttet til plass ${next + 1}.`,
                );
              }}
            >
              <svg
                viewBox="0 0 24 24"
                width="21"
                height="21"
                aria-hidden="true"
                fill="currentColor"
              >
                {[7, 12, 17].flatMap((y) =>
                  [9, 15].map((x) => (
                    <circle key={`${x}-${y}`} cx={x} cy={y} r="1.4" />
                  )),
                )}
              </svg>
            </button>
          </header>
          <div className="content-block-body" hidden={!!drag}>
            {renderBlock(block)}
          </div>
        </section>
      ))}
      {drag && (
        <>
          <div
            className={`block-drop-end ${target === undefined ? "visible" : ""}`}
          />
          <div
            className="block-drag-ghost"
            style={{
              top:
                drag.y - (root.current?.getBoundingClientRect().top ?? 0) - 25,
              left: 0,
              width: "100%",
            }}
            aria-hidden="true"
          >
            <strong>{blockNames[drag.block]}</strong>
            <span>Flytt hit</span>
          </div>
        </>
      )}
    </div>
  );
}

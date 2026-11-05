"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useLayoutEffect, useState, type ReactNode } from "react";
import { BrandMark, Icon, type IconName } from "./icons";
import { useAccount } from "./account-provider";
import { useStore } from "./provider";
import { InstallButton } from "./pwa";
import { Dialog } from "./dialog";
import { NewCalendar, startNew } from "./new-calendar";
import { gettingStarted } from "@/lib/getting-started";
import { navigationScroll, type NavigationScroll } from "@/lib/mobile-navigation";
const links: { href: string; name: string; mobile: string; icon: IconName }[] =
  [
    {
      href: "/calendars",
      name: "Mine kalendere",
      mobile: "Kalendere",
      icon: "calendar",
    },
    {
      href: "/inspiration",
      name: "Inspirasjon",
      mobile: "Inspirasjon",
      icon: "sparkles",
    },
    {
      href: "/settings",
      name: "Konto",
      mobile: "Konto",
      icon: "user",
    },
  ];
export function Shell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { user } = useAccount();
  const path = usePathname(),
    { status, cloud, requireAccount } = useStore();
  const [newCalendar, setNewCalendar] = useState(false),
    [help, setHelp] = useState(false);
  const [compactNav, setCompactNav] = useState(false);
  useLayoutEffect(() => {
    const top = () => window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    top();
    const frame = requestAnimationFrame(top);
    return () => cancelAnimationFrame(frame);
  }, [path]);
  useEffect(() => {
    setCompactNav(false);
    if (path.endsWith("/preview") || path === "/receive") return;
    const mobile = window.matchMedia("(max-width: 760px)");
    let scroll: NavigationScroll = {
      y: Math.max(0, window.scrollY),
      anchor: Math.max(0, window.scrollY),
      direction: 0,
      compact: false,
    };
    let frame = 0;
    const reset = () => {
      scroll = { y: Math.max(0, window.scrollY), anchor: Math.max(0, window.scrollY), direction: 0, compact: false };
      setCompactNav(false);
    };
    const update = () => {
      frame = 0;
      if (!mobile.matches || document.querySelector("dialog[open]")) return;
      const next = navigationScroll(
        scroll, window.scrollY, document.documentElement.scrollHeight - window.innerHeight,
      );
      if (next.compact !== scroll.compact) setCompactNav(next.compact);
      scroll = next;
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    mobile.addEventListener("change", reset);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      mobile.removeEventListener("change", reset);
    };
  }, [path]);
  useEffect(() => {
    const listener = () => {
      if (requireAccount(true)) setNewCalendar(true);
    };
    window.addEventListener("luke:new", listener);
    return () => window.removeEventListener("luke:new", listener);
  }, [requireAccount]);
  useEffect(() => {
    if (!cloud) {
      setNewCalendar(false);
      return;
    }
    if (
      path === "/calendars" &&
      new URLSearchParams(location.search).get("create") === "1"
    ) {
      setNewCalendar(true);
      router.replace("/calendars", { scroll: false });
    }
  }, [cloud, path, router]);
  const preview = path.endsWith("/preview") || path === "/receive";
  const active =
    path.startsWith("/calendar/") || path === "/" ? "/calendars" : path;
  const pageName = path.startsWith("/calendar/")
    ? "Kalender"
    : (active === "/settings" && !user ? "Logg inn" : links.find((link) => link.href === active)?.name ?? "Luke");
  return (
    <>
      <a className="skip-link" href="#main">
        Hopp til innhold
      </a>
      {!preview && (
        <aside className="sidebar">
          <Link
            href="/calendars"
            className="brand"
            aria-label="Luke, til mine kalendere"
          >
            <BrandMark />
            <span>
              luke<span className="brand-period">.</span>
            </span>
          </Link>
          <nav aria-label="Hovedmeny">
            {links.slice(0, 2).map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={
                  active === link.href ? "nav-item active" : "nav-item"
                }
                aria-current={active === link.href ? "page" : undefined}
              >
                <Icon name={link.icon} />
                {link.name}
              </Link>
            ))}
          </nav>
          <button
            className="button primary sidebar-create"
            onClick={() => startNew()}
          >
            <Icon name="plus" size={18} />
            Ny kalender
          </button>
          <div className="sidebar-bottom">
            <InstallButton compact />
            <Link
              href="/settings"
              className={
                active === "/settings" ? "nav-item active" : "nav-item"
              }
            >
              <Icon name="user" />
              {user ? "Konto" : "Logg inn"}
            </Link>
            <button className="nav-item" onClick={() => setHelp(true)}>
              <Icon name="help" />
              Hjelp
            </button>
          </div>
        </aside>
      )}
      <div className={preview ? "app-frame preview-frame" : "app-frame"}>
        {!preview && (
          <header className="topbar">
            <Link href="/calendars" className="brand mobile-brand">
              <BrandMark />
              <span>luke.</span>
            </Link>
            <span className="breadcrumb">
              <strong>{pageName}</strong>
            </span>
            <div className="topbar-right">
              {cloud && (
                <span
                  className={`save-status ${status}`}
                  title="Kalenderne lagres på kontoen din"
                >
                  <span className="status-dot" />
                  {status === "saved"
                    ? "Lagret på kontoen"
                    : status === "saving"
                      ? "Lagrer …"
                      : "Lagring feilet"}
                </span>
              )}
              <button
                className="icon-button help-button"
                aria-label="Hjelp"
                onClick={() => setHelp(true)}
              >
                <Icon name="help" size={19} />
              </button>
              <Link
                href="/settings"
                className={user ? "avatar" : "button secondary topbar-login"}
                aria-label={user ? "Åpne konto og innstillinger" : "Logg inn"}
              >
                {user ? <Icon name="user" size={21} /> : "Logg inn"}
              </Link>
            </div>
          </header>
        )}
        <main id="main" className={preview ? "preview-main" : "main-content"}>
          {children}
        </main>
      </div>
      {!preview && (
        <nav className={`bottom-nav${compactNav ? " is-compact" : ""}`} aria-label="Mobilmeny">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-label={link.href === "/settings" && !user ? "Logg inn" : link.name}
              aria-current={active === link.href ? "page" : undefined}
              className={active === link.href ? "active" : ""}
            >
              <Icon name={link.icon} size={21} />
              <span>{link.href === "/settings" && !user ? "Logg inn" : link.mobile}</span>
            </Link>
          ))}
        </nav>
      )}
      {newCalendar && cloud && (
        <NewCalendar onClose={() => setNewCalendar(false)} />
      )}{" "}
      {help && (
        <Dialog title={gettingStarted.title} onClose={() => setHelp(false)}>
          <div className="help-content">
            <p className="dialog-intro">{gettingStarted.description}</p>
            {gettingStarted.steps.map(({ icon, title, body }, index) => (
              <div className="help-step" key={title}>
                <span className="soft-icon">
                  <Icon name={icon} />
                </span>
                <div>
                  <h3>{index + 1}. {title}</h3>
                  <p>{body}</p>
                </div>
              </div>
            ))}
            <div className="info-box">
              <strong>Kalenderne følger kontoen din</strong>
              <p>
                Endringene lagres på kontoen. Mottakere bruker sin egen konto og
                ser oppdateringene dine, men kan ikke redigere kalenderen.
              </p>
            </div>
            <button
              className="button primary full"
              onClick={() => setHelp(false)}
            >
              Lukk
            </button>
          </div>
        </Dialog>
      )}
    </>
  );
}

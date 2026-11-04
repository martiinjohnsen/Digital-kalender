"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useLayoutEffect, useState, type ReactNode } from "react";
import { BrandMark, Icon, type IconName } from "./icons";
import { useStore } from "./provider";
import { InstallButton } from "./pwa";
import { Dialog } from "./dialog";
import { NewCalendar, startNew } from "./new-calendar";
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
      name: "Innstillinger",
      mobile: "Min side",
      icon: "settings",
    },
  ];
export function Shell({ children }: { children: ReactNode }) {
  const path = usePathname(),
    { data, status } = useStore();
  const [newCalendar, setNewCalendar] = useState(false),
    [help, setHelp] = useState(false);
  useLayoutEffect(() => {
    const top = () => window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    top();
    const frame = requestAnimationFrame(top);
    return () => cancelAnimationFrame(frame);
  }, [path]);
  useEffect(() => {
    const listener = () => setNewCalendar(true);
    window.addEventListener("luke:new", listener);
    return () => window.removeEventListener("luke:new", listener);
  }, []);
  const preview = path.endsWith("/preview") || path === "/receive";
  const active =
    path.startsWith("/calendar/") || path === "/" ? "/calendars" : path;
  const pageName = path.startsWith("/calendar/")
    ? "Kalender"
    : (links.find((link) => link.href === active)?.name ?? "Luke");
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
              <Icon name="settings" />
              Innstillinger
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
              <span
                className={`save-status ${status}`}
                title="Kalenderne lagres i nettleseren på denne enheten"
              >
                <span className="status-dot" />
                {status === "saved"
                  ? "Lagret på enheten"
                  : status === "saving"
                    ? "Lagrer …"
                    : "Lagring feilet"}
              </span>
              <button
                className="icon-button help-button"
                aria-label="Hjelp"
                onClick={() => setHelp(true)}
              >
                <Icon name="help" size={19} />
              </button>
              <Link
                href="/settings"
                className="avatar"
                aria-label="Åpne min side"
              >
                {data.preferences.name ? (
                  data.preferences.name.slice(0, 1).toUpperCase()
                ) : (
                  <Icon name="leaf" size={18} />
                )}
              </Link>
            </div>
          </header>
        )}
        <main id="main" className={preview ? "preview-main" : "main-content"}>
          {children}
        </main>
      </div>
      {!preview && (
        <nav className="bottom-nav" aria-label="Mobilmeny">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={active === link.href ? "page" : undefined}
              className={active === link.href ? "active" : ""}
            >
              <Icon name={link.icon} size={21} />
              <span>{link.mobile}</span>
            </Link>
          ))}
        </nav>
      )}
      {newCalendar && <NewCalendar onClose={() => setNewCalendar(false)} />}{" "}
      {help && (
        <Dialog title="Slik bruker du Luke" onClose={() => setHelp(false)}>
          <div className="help-content">
            {[
              [
                "calendar",
                "1. Opprett en kalender",
                "Velg navn, mottaker og hvordan kalenderen skal se ut.",
              ],
              [
                "gift",
                "2. Fyll lukene",
                "Legg inn tekst, bilder, gavekort eller video. Quizspørsmål og effekter kan legges til i samme luke.",
              ],
              [
                "eye",
                "3. Forhåndsvis og del",
                "Prøv kalenderen, eller slå av Åpne alle luker for å se datolåsen.",
              ],
            ].map(([icon, title, body]) => (
              <div className="help-step" key={title}>
                <span className="soft-icon">
                  <Icon name={icon as IconName} />
                </span>
                <div>
                  <h3>{title}</h3>
                  <p>{body}</p>
                </div>
              </div>
            ))}
            <div className="info-box">
              <strong>Innholdet lagres på denne enheten</strong>
              <p>
                Ta en sikkerhetskopi i Innstillinger. Prøvelenker inneholder
                hele kalenderkopien. Bruk dem til å prøve, og unngå private
                opplysninger og gavekort med verdi.
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

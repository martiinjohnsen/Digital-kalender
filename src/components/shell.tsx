"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { BrandMark, Icon, type IconName } from "./icons";
import { useStore } from "./provider";
import { InstallButton } from "./pwa";
import { Dialog } from "./dialog";
import { NewCalendar, startNew } from "./new-calendar";
import type { TemplateId } from "@/lib/templates";
const links: { href: string; name: string; mobile: string; icon: IconName }[] =
  [
    { href: "/", name: "Oversikt", mobile: "Hjem", icon: "home" },
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
  const path = usePathname();
  const { data, status } = useStore();
  const [newCalendar, setNewCalendar] = useState<{
    templateId?: TemplateId;
  } | null>(null);
  const [help, setHelp] = useState(false);
  useEffect(() => {
    const listener = (event: Event) =>
      setNewCalendar({
        templateId: (event as CustomEvent<TemplateId | undefined>).detail,
      });
    window.addEventListener("luke:new", listener);
    return () => window.removeEventListener("luke:new", listener);
  }, []);
  const preview = path.endsWith("/preview") || path === "/receive";
  const activeHref = path.startsWith("/calendar/") ? "/calendars" : path;
  const pageName = path.startsWith("/calendar/")
    ? "Kalenderverksted"
    : (links.find((l) => l.href === path)?.name ?? "Luke");
  return (
    <>
      <a className="skip-link" href="#main">
        Hopp til innhold
      </a>
      {!preview && (
        <aside className="sidebar">
          <Link href="/" className="brand" aria-label="Luke, til forsiden">
            <BrandMark />
            <span>
              luke<span className="brand-period">.</span>
            </span>
          </Link>
          <div className="sidebar-tagline">Små øyeblikk. Litt nærmere.</div>
          <div className="nav-caption">DITT ADVENTSVERKSTED</div>
          <nav aria-label="Hovedmeny">
            {links.slice(0, 3).map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={
                  activeHref === link.href ? "nav-item active" : "nav-item"
                }
                aria-current={activeHref === link.href ? "page" : undefined}
              >
                <Icon name={link.icon} />
                {link.name}
                {link.href === "/calendars" && (
                  <span className="nav-count">{data.calendars.length}</span>
                )}
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
              className={path === "/settings" ? "nav-item active" : "nav-item"}
            >
              <Icon name="settings" />
              Innstillinger
            </Link>
            <button className="nav-item" onClick={() => setHelp(true)}>
              <Icon name="help" />
              Litt hjelp på veien
            </button>
            <div className="sidebar-footer">
              Laget for å deles med noen du liker.
              <span>Luke · Første kapittel</span>
            </div>
          </div>
        </aside>
      )}
      <div className={preview ? "app-frame preview-frame" : "app-frame"}>
        {!preview && (
          <header className="topbar">
            <Link href="/" className="brand mobile-brand">
              <BrandMark />
              <span>luke.</span>
            </Link>
            <div className="breadcrumb">
              <span>Ditt verksted</span>
              <Icon name="chevron" size={13} />
              <strong>{pageName}</strong>
            </div>
            <div className="topbar-right">
              <span
                className={`save-status ${status}`}
                title="Kalenderne er lagret i nettleseren på denne enheten"
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
        {!preview && (
          <footer className="main-footer">
            <span>Små gleder, helt på din måte.</span>
            <span>
              Med omtanke <Icon name="heart" size={12} />
            </span>
          </footer>
        )}
      </div>
      {!preview && (
        <nav className="bottom-nav" aria-label="Mobilmeny">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={activeHref === link.href ? "page" : undefined}
              className={activeHref === link.href ? "active" : ""}
            >
              <Icon name={link.icon} size={21} />
              <span>{link.mobile}</span>
            </Link>
          ))}
        </nav>
      )}
      {newCalendar && (
        <NewCalendar
          templateId={newCalendar.templateId}
          onClose={() => setNewCalendar(null)}
        />
      )}{" "}
      {help && (
        <Dialog title="En liten hjelp på veien" onClose={() => setHelp(false)}>
          <div className="help-content">
            <p className="dialog-intro">
              Luke er et lite verksted for personlige adventskalendere. Begynn
              enkelt, og fyll på når du får en idé.
            </p>
            {[
              [
                "calendar",
                "1. Lag en kalender",
                "Velg navn, mottaker og et uttrykk du liker. Du kan starte tomt eller med en ferdig mal.",
              ],
              [
                "gift",
                "2. Gjør lukene personlige",
                "Trykk på en luke og legg til en hilsen, et bilde, en quiz, en video eller en opplevelse.",
              ],
              [
                "eye",
                "3. Prøv kalenderen",
                "Forhåndsvisning lar deg åpne alle lukene. Slå av prøvemodus for å se den vanlige datolåsen.",
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
              <strong>Greit å vite om denne versjonen</strong>
              <p>
                Kalenderne lagres i nettleseren på denne enheten. Ta en
                sikkerhetskopi i Innstillinger. Kontoer, samarbeid og ordinær
                publisering kobles til senere. Prøvelenker inneholder innholdet
                og er ikke egnet for hemmeligheter.
              </p>
            </div>
            <button
              className="button primary full"
              onClick={() => setHelp(false)}
            >
              Da er jeg klar <Icon name="arrow" size={17} />
            </button>
          </div>
        </Dialog>
      )}
    </>
  );
}

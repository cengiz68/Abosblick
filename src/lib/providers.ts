import type { Category } from "./constants";

/**
 * Schweizer Anbieter mit typischen Vertragsbedingungen.
 *
 * Quelle: "Schweizer Kündigungsfristen & Abo-Verzeichnis" von AboQuit.ch (frei nutzbar),
 * https://github.com/aboquit/schweizer-kuendigungsfristen-verzeichnis – Stand der Prüfung 1. November 2026.
 * Massgebend sind immer Vertrag und AGB des Kunden. Postadressen sind bewusst NICHT hinterlegt
 * (nicht in der Quelle) – der Nutzer übernimmt sie von seiner Rechnung.
 */

/** letter = Brief/E-Mail laut Anbieter zulässig · check = nicht geregelt/unklar · no-letter = Brief laut Anbieter ungültig */
export type Channel = "letter" | "check" | "no-letter";

export interface ProviderInfo {
  key: string;
  name: string;
  /** true = Name ist eine Gattung (z. B. "Grundversicherung"); der Nutzer trägt seine Kasse ein */
  genericName?: boolean;
  category: Category;
  defaults: {
    minTermMonths: number;
    noticeValue: number;
    noticeUnit: "DAYS" | "MONTHS";
    endOfMonth: boolean;
    autoRenew: boolean;
    renewalMonths: number;
    /** Vertragsbeginn auf den 1. Januar des laufenden Jahres setzen (Krankenkasse) */
    startJan1?: boolean;
  };
  channel: Channel;
  channelNote: string;
  tips: string[];
}

export const PROVIDER_SOURCE = {
  label: "AboQuit.ch Kündigungsfristen-Verzeichnis (Stand 1.11.2026)",
  url: "https://github.com/aboquit/schweizer-kuendigungsfristen-verzeichnis",
};

export const PROVIDERS: ProviderInfo[] = [
  {
    key: "swisscom", name: "Swisscom", category: "MOBILE",
    defaults: { minTermMonths: 12, noticeValue: 60, noticeUnit: "DAYS", endOfMonth: true, autoRenew: true, renewalMonths: 1 },
    channel: "check",
    channelNote: "Swisscom nennt My Swisscom bzw. Rückruf/Telefon; eine Schriftform ist nicht vorgeschrieben. Kanal vorab prüfen.",
    tips: ["Mindestlaufzeit meist 12 Monate, mit vergünstigtem Gerät bis 24 Monate – bitte im Vertrag nachsehen.", "Danach unbefristet, Kündigung 60 Tage auf Monatsende."],
  },
  {
    key: "sunrise", name: "Sunrise", category: "MOBILE",
    defaults: { minTermMonths: 12, noticeValue: 60, noticeUnit: "DAYS", endOfMonth: true, autoRenew: true, renewalMonths: 1 },
    channel: "no-letter",
    channelNote: "Laut Sunrise-Factsheets ist die Kündigung nur telefonisch oder per Chat gültig, nicht per Brief oder E-Mail (rechtlich umstritten).",
    tips: ["Je nach Abo 12 Monate oder keine Mindestlaufzeit.", "Kündigung telefonisch/per Chat und Bestätigung (SMS/Mail, Chat-Protokoll) aufbewahren."],
  },
  {
    key: "salt", name: "Salt", category: "MOBILE",
    defaults: { minTermMonths: 12, noticeValue: 60, noticeUnit: "DAYS", endOfMonth: false, autoRenew: true, renewalMonths: 1 },
    channel: "check",
    channelNote: "Ältere AGB nennen „schriftlich oder telefonisch“; es gab Fälle, in denen Salt einen Brief nicht akzeptierte. Kanal vorab klären.",
    tips: ["Bei 1-Monats-Mindestlaufzeit 30 Tage Frist, sonst 60 Tage.", "Mindestlaufzeit meist 12 oder 24 Monate."],
  },
  {
    key: "wingo", name: "Wingo", category: "MOBILE",
    defaults: { minTermMonths: 0, noticeValue: 2, noticeUnit: "MONTHS", endOfMonth: true, autoRenew: true, renewalMonths: 1 },
    channel: "check",
    channelNote: "Kündigungsweg im Kundenkonto bzw. bei der Hotline prüfen.",
    tips: ["2 Monate auf Monatsende, meist keine Mindestlaufzeit."],
  },
  {
    key: "yallo", name: "Yallo", category: "MOBILE",
    defaults: { minTermMonths: 0, noticeValue: 2, noticeUnit: "MONTHS", endOfMonth: true, autoRenew: true, renewalMonths: 1 },
    channel: "no-letter",
    channelNote: "Laut Yallo-Factsheet nur telefonisch oder per Chat, Brief oder E-Mail sind nicht gültig.",
    tips: ["2 Monate auf Monatsende, meist keine Mindestlaufzeit."],
  },
  {
    key: "activ-fitness", name: "Activ Fitness", category: "FITNESS",
    defaults: { minTermMonths: 12, noticeValue: 2, noticeUnit: "MONTHS", endOfMonth: false, autoRenew: true, renewalMonths: 12 },
    channel: "letter",
    channelNote: "Kündigung schriftlich per Brief oder E-Mail (laut FAQ an debi@activfitness.ch) zulässig.",
    tips: ["Gilt für Monatszahler (Verlängerung um die gleiche Dauer). Vorauszahler-Verträge laufen automatisch aus.", "Bitte Laufzeit im Vertrag prüfen."],
  },
  {
    key: "puregym", name: "PureGym (ehem. Basefit)", category: "FITNESS",
    defaults: { minTermMonths: 12, noticeValue: 10, noticeUnit: "DAYS", endOfMonth: true, autoRenew: true, renewalMonths: 12 },
    channel: "no-letter",
    channelNote: "Kündigung laut AGB ausschliesslich über den Online-Mitgliederbereich.",
    tips: ["Mindestens 10 Tage vor Ablauf kündigen, sonst automatische Verlängerung um die gleiche Dauer.", "Laufzeit im Vertrag prüfen."],
  },
  {
    key: "update-fitness", name: "Update Fitness", category: "FITNESS",
    defaults: { minTermMonths: 12, noticeValue: 28, noticeUnit: "DAYS", endOfMonth: false, autoRenew: true, renewalMonths: 12 },
    channel: "letter",
    channelNote: "Schriftlich am Standort mit den meisten Trainings; es gibt auch ein Online-Kündigungsformular.",
    tips: ["4 Wochen vor Vertragsablauf, Verlängerung um jeweils 12 Monate.", "Vertragsbeginn ist der Trainingsstart."],
  },
  {
    key: "sbb-ga", name: "SBB GA", category: "SUBSCRIPTION",
    defaults: { minTermMonths: 6, noticeValue: 1, noticeUnit: "MONTHS", endOfMonth: false, autoRenew: true, renewalMonths: 1 },
    channel: "letter",
    channelNote: "Kündigung mündlich, schriftlich oder über swisspass.ch möglich.",
    tips: ["Mindestdauer 6 Monate, danach 1 Abomonat auf Ende jedes Abomonats."],
  },
  {
    key: "sbb-halbtax", name: "SBB Halbtax", category: "SUBSCRIPTION",
    defaults: { minTermMonths: 12, noticeValue: 1, noticeUnit: "MONTHS", endOfMonth: false, autoRenew: true, renewalMonths: 12 },
    channel: "letter",
    channelNote: "Kündigung über swisspass.ch, an der Verkaufsstelle oder beim Contact Center.",
    tips: ["Spätestens 1 Monat vor der jährlichen Verlängerung kündigen."],
  },
  {
    key: "kvg", name: "Grundversicherung (KVG)", genericName: true, category: "HEALTH_INSURANCE",
    defaults: { minTermMonths: 12, noticeValue: 1, noticeUnit: "MONTHS", endOfMonth: true, autoRenew: true, renewalMonths: 12, startJan1: true },
    channel: "letter",
    channelNote: "Schriftlich, Einschreiben empfohlen. Massgebend ist der Eingang bei der Kasse, nicht der Poststempel.",
    tips: [
      "Kündigung muss bis 30. November bei der Kasse eintreffen (Wechsel per 1. Januar).",
      "Gleichzeitig bei der neuen Kasse anmelden – die alte entlässt dich nur mit Aufnahmebestätigung der neuen.",
      "Offene Prämien vorher bezahlen: Bei einer Mahnung bis 30.11. ist die Kündigung wirkungslos.",
    ],
  },
  {
    key: "vvg", name: "Zusatzversicherung (VVG)", genericName: true, category: "HEALTH_INSURANCE",
    defaults: { minTermMonths: 12, noticeValue: 3, noticeUnit: "MONTHS", endOfMonth: true, autoRenew: true, renewalMonths: 12, startJan1: true },
    channel: "letter",
    channelNote: "Schriftlich, Einschreiben empfohlen.",
    tips: [
      "Meist 3 Monate auf Ende Kalenderjahr – Eingang bis 30. September.",
      "Mindestdauer meist 1 Jahr, teils 3 Jahre – im Vertrag prüfen.",
      "Erst kündigen, wenn die neue Zusatzversicherung dich aufgenommen hat (Kassen dürfen ablehnen).",
    ],
  },
];

export function findProvider(key: string | null | undefined): ProviderInfo | undefined {
  return key ? PROVIDERS.find((p) => p.key === key) : undefined;
}

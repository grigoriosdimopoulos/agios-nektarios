"use client";

import { useActionState, useState } from "react";

import type { SiteSettings } from "@/lib/content/schema";
import { IDLE } from "../action-state";
import { saveSettingsAction } from "../actions";
import {
  Panel,
  StatusNote,
  buttonClass,
  inputClass,
  labelClass,
} from "../ui";

const TIME_OPTIONS = [
  { value: "auto", label: "Αυτόματα (πραγματική ώρα)" },
  { value: "dawn", label: "Αυγή" },
  { value: "day", label: "Μέρα" },
  { value: "dusk", label: "Σούρουπο" },
  { value: "night", label: "Νύχτα" },
];

const WEATHER_OPTIONS = [
  { value: "auto", label: "Αυτόματα (ζωντανός καιρός)" },
  { value: "clear", label: "Αίθριος" },
  { value: "clouds", label: "Συννεφιά" },
  { value: "rain", label: "Βροχή" },
  { value: "snow", label: "Χιόνι" },
  { value: "fog", label: "Ομίχλη" },
  { value: "storm", label: "Καταιγίδα" },
];

const SEASON_OPTIONS = [
  { value: "auto", label: "Αυτόματα (ημερολόγιο)" },
  { value: "spring", label: "Άνοιξη" },
  { value: "summer", label: "Καλοκαίρι" },
  { value: "autumn", label: "Φθινόπωρο" },
  { value: "winter", label: "Χειμώνας" },
];

const HOLIDAY_OPTIONS = [
  { value: "", label: "Αυτόματα (ημερολόγιο)" },
  { value: "none", label: "Καμία διακόσμηση" },
  { value: "independence", label: "25η Μαρτίου" },
  { value: "ohi", label: "28η Οκτωβρίου" },
  { value: "christmas", label: "Χριστούγεννα" },
  { value: "newyear", label: "Πρωτοχρονιά" },
  { value: "easter", label: "Πάσχα" },
  { value: "patron", label: "Άγιος Νεκτάριος (9 Νοεμβρίου)" },
];

function Toggle({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-1 h-4 w-4 accent-[rgba(154,123,82,0.9)]"
      />
      <span>
        <span className="block font-body text-[0.9rem] text-[rgba(232,228,214,0.82)]">
          {label}
        </span>
        {hint && (
          <span className="mt-0.5 block font-body text-[0.75rem] text-[rgba(232,228,214,0.35)]">
            {hint}
          </span>
        )}
      </span>
    </label>
  );
}

function Select({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (next: string) => void;
}) {
  return (
    <label className="block">
      <span className={labelClass}>{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={`${inputClass} mt-2`}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function SettingsForm({ initial }: { initial: SiteSettings }) {
  const [settings, setSettings] = useState<SiteSettings>(initial);
  const [state, formAction, pending] = useActionState(saveSettingsAction, IDLE);

  const setScene = (patch: Partial<SiteSettings["scene"]>) =>
    setSettings((current) => ({
      ...current,
      scene: { ...current.scene, ...patch },
    }));

  const setOverride = (patch: Partial<SiteSettings["scene"]["override"]>) =>
    setScene({ override: { ...settings.scene.override, ...patch } });

  const setPlate = (key: keyof SiteSettings["scene"]["plates"], value: string) =>
    setScene({ plates: { ...settings.scene.plates, [key]: value } });

  return (
    <form action={formAction} className="space-y-8">
      <input type="hidden" name="payload" value={JSON.stringify(settings)} />

      <Panel title="Ιστότοπος">
        <div className="grid gap-5 md:grid-cols-2">
          <label className="block">
            <span className={labelClass}>Όνομα</span>
            <input
              value={settings.siteTitle}
              onChange={(event) =>
                setSettings({ ...settings, siteTitle: event.target.value })
              }
              className={`${inputClass} mt-2`}
            />
          </label>
          <label className="block">
            <span className={labelClass}>Υπότιτλος</span>
            <input
              value={settings.tagline}
              onChange={(event) =>
                setSettings({ ...settings, tagline: event.target.value })
              }
              className={`${inputClass} mt-2`}
            />
          </label>
          <label className="block">
            <span className={labelClass}>Email</span>
            <input
              value={settings.email}
              onChange={(event) =>
                setSettings({ ...settings, email: event.target.value })
              }
              className={`${inputClass} mt-2`}
            />
          </label>
          <label className="block">
            <span className={labelClass}>Σημείωση υποσέλιδου</span>
            <input
              value={settings.footerNote}
              onChange={(event) =>
                setSettings({ ...settings, footerNote: event.target.value })
              }
              className={`${inputClass} mt-2`}
            />
          </label>
        </div>
      </Panel>

      <Panel
        title="Ζωντανό σκηνικό"
        description="Το φόντο ακολουθεί την πραγματική ώρα, τον καιρό και την εποχή στον Άγιο Νεκτάριο Κιθαιρώνα."
      >
        <div className="space-y-5">
          <Toggle
            label="Ενεργό"
            hint="Όταν είναι κλειστό, εμφανίζεται το απλό σκοτεινό φόντο."
            checked={settings.scene.enabled}
            onChange={(enabled) => setScene({ enabled })}
          />
          <Toggle
            label="Ζωντανός καιρός"
            hint="Άντληση συνθηκών από το Open-Meteo (χωρίς κλειδί, χωρίς cookies)."
            checked={settings.scene.liveWeather}
            onChange={(liveWeather) => setScene({ liveWeather })}
          />
          <Toggle
            label="Ζώα και πουλιά"
            hint="Πουλιά την ημέρα, κουκουβάγιες και νυχτερίδες τη νύχτα, έντομα την άνοιξη."
            checked={settings.scene.wildlife}
            onChange={(wildlife) => setScene({ wildlife })}
          />
          <Toggle
            label="Οικισμός"
            hint="Σπίτια με φώτα, καμινάδες και αυτοκίνητα στον δρόμο."
            checked={settings.scene.village}
            onChange={(village) => setScene({ village })}
          />
          <Toggle
            label="Εορταστικά θέματα"
            hint="25η Μαρτίου, 28η Οκτωβρίου, Χριστούγεννα, Πρωτοχρονιά, Πάσχα."
            checked={settings.scene.holidayThemes}
            onChange={(holidayThemes) => setScene({ holidayThemes })}
          />

          <label className="block">
            <span className={labelClass}>
              Ένταση — {Math.round(settings.scene.intensity * 100)}%
            </span>
            <input
              type="range"
              min={0}
              max={100}
              value={Math.round(settings.scene.intensity * 100)}
              onChange={(event) =>
                setScene({ intensity: Number(event.target.value) / 100 })
              }
              className="mt-3 w-full accent-[rgba(154,123,82,0.9)]"
            />
          </label>

          <div className="grid gap-5 md:grid-cols-3">
            <Select
              label="Ποιότητα"
              value={settings.scene.quality}
              options={[
                { value: "auto", label: "Αυτόματα" },
                { value: "low", label: "Χαμηλή" },
                { value: "medium", label: "Μεσαία" },
                { value: "high", label: "Υψηλή" },
              ]}
              onChange={(quality) =>
                setScene({ quality: quality as SiteSettings["scene"]["quality"] })
              }
            />
            <label className="block">
              <span className={labelClass}>Γεωγραφικό πλάτος</span>
              <input
                type="number"
                step="0.0001"
                value={settings.scene.latitude}
                onChange={(event) =>
                  setScene({ latitude: Number(event.target.value) })
                }
                className={`${inputClass} mt-2`}
              />
            </label>
            <label className="block">
              <span className={labelClass}>Γεωγραφικό μήκος</span>
              <input
                type="number"
                step="0.0001"
                value={settings.scene.longitude}
                onChange={(event) =>
                  setScene({ longitude: Number(event.target.value) })
                }
                className={`${inputClass} mt-2`}
              />
            </label>
          </div>
        </div>
      </Panel>

      <Panel
        title="Δοκιμή / εξαναγκασμός"
        description="Χρήσιμο για προεπισκόπηση. Αφήστε «Αυτόματα» για κανονική λειτουργία."
      >
        <div className="grid gap-5 md:grid-cols-2">
          <Select
            label="Ώρα"
            value={settings.scene.override.time}
            options={TIME_OPTIONS}
            onChange={(time) =>
              setOverride({ time: time as typeof settings.scene.override.time })
            }
          />
          <Select
            label="Καιρός"
            value={settings.scene.override.weather}
            options={WEATHER_OPTIONS}
            onChange={(weather) =>
              setOverride({
                weather: weather as typeof settings.scene.override.weather,
              })
            }
          />
          <Select
            label="Εποχή"
            value={settings.scene.override.season}
            options={SEASON_OPTIONS}
            onChange={(season) =>
              setOverride({
                season: season as typeof settings.scene.override.season,
              })
            }
          />
          <Select
            label="Γιορτή"
            value={settings.scene.override.holiday}
            options={HOLIDAY_OPTIONS}
            onChange={(holiday) => setOverride({ holiday })}
          />
        </div>
      </Panel>

      <Panel
        title="Φωτογραφικά επίπεδα"
        description="Το φόντο χρησιμοποιεί ήδη το πανόραμα του οικισμού από το παλιό site, κομμένο σε επίπεδα. Αν συμπληρώσετε εδώ δικούς σας συνδέσμους από τα «Αρχεία», αντικαθιστούν το ενσωματωμένο. Ό,τι κι αν βάλετε, φωτίζεται από τη μηχανή ανάλογα με την ώρα και τον καιρό."
      >
        <div className="grid gap-5 md:grid-cols-2">
          {(
            [
              ["sky", "Ουρανός"],
              ["far", "Μακρινό βουνό"],
              ["mid", "Μεσαίο επίπεδο"],
              ["near", "Κοντινό επίπεδο"],
            ] as const
          ).map(([key, label]) => (
            <label key={key} className="block">
              <span className={labelClass}>{label}</span>
              <input
                value={settings.scene.plates[key]}
                onChange={(event) => setPlate(key, event.target.value)}
                placeholder="/api/media/…"
                className={`${inputClass} mt-2`}
              />
            </label>
          ))}
        </div>
      </Panel>

      <div className="sticky bottom-4 flex flex-wrap items-center gap-4 rounded-[3px] border border-[rgba(232,228,214,0.08)] bg-[rgba(10,12,15,0.92)] p-4 backdrop-blur">
        <button type="submit" disabled={pending} className={buttonClass}>
          {pending ? "Αποθήκευση…" : "Αποθήκευση ρυθμίσεων"}
        </button>
        <StatusNote state={state} />
      </div>
    </form>
  );
}

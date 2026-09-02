"use client";

import { useActionState } from "react";

import { IDLE } from "../action-state";
import { loginAction } from "../actions";
import { StatusNote, buttonClass, inputClass, labelClass } from "../ui";

export function LoginForm({ next }: { next: string }) {
  const [state, formAction, pending] = useActionState(loginAction, IDLE);

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="next" value={next} />
      <label className="block">
        <span className={labelClass}>Όνομα χρήστη</span>
        <input
          name="username"
          autoComplete="username"
          defaultValue="admin"
          required
          className={`${inputClass} mt-2`}
        />
      </label>
      <label className="block">
        <span className={labelClass}>Κωδικός</span>
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className={`${inputClass} mt-2`}
        />
      </label>
      <StatusNote state={state} />
      <button type="submit" disabled={pending} className={`${buttonClass} w-full`}>
        {pending ? "Σύνδεση…" : "Σύνδεση"}
      </button>
    </form>
  );
}

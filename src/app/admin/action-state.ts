/** Shared shape for the admin server actions' `useActionState` results. */
export type ActionState = { ok: boolean; message: string };

export const IDLE: ActionState = { ok: false, message: "" };

"use client";

import { useFormStatus } from "react-dom";

type PendingSubmitButtonProps = {
  className?: string;
  label: string;
  pendingLabel: string;
};

export function PendingSubmitButton({
  className = "primary-button compact",
  label,
  pendingLabel,
}: PendingSubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button className={className} disabled={pending} type="submit">
      {pending ? pendingLabel : label}
    </button>
  );
}

import type { DoorIssues } from "@/lib/door-validation";

export function validationAttributes(issues: DoorIssues, field: string) {
  return {
    "data-validation-field": field,
    "aria-invalid": Boolean(issues[field]),
    "aria-describedby": issues[field] ? `${field}-error` : undefined,
  };
}

export function FieldError({ issues, field }: { issues: DoorIssues; field: string }) {
  return issues[field]
    ? <p className="field-error" id={`${field}-error`}>{issues[field]}</p>
    : null;
}

/** Hidden spam trap: humans never see or fill it; most bots do. Checked by `isSpam()` in lib/leads.ts. */
export function Honeypot() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute -left-[9999px] h-px w-px overflow-hidden opacity-0">
      <label>
        Leave this field empty
        <input type="text" name="company_url" tabIndex={-1} autoComplete="off" defaultValue="" />
      </label>
    </div>
  );
}

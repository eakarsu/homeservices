import Link from "next/link";
export default function Page() {
  return (
    <main className="max-w-xl mx-auto p-8 space-y-4">
      <h1 className="text-2xl font-bold">Payment checkout returned</h1>
      <p>
        Your invoice balance changes when the office receives a verified payment
        receipt. Returning here does not confirm payment.
      </p>
      <p>
        Reopen your private portal link to see the current balance, or contact
        the office if a payment remains pending.
      </p>
      <Link href="/dashboard/invoices">Office invoices</Link>
    </main>
  );
}

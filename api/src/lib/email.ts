/**
 * Sends email via Resend (fetch) when RESEND_API_KEY and RESEND_FROM are set; otherwise logs.
 */
export async function sendEmail(to: string, subject: string, text: string): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM;
  if (key && from) {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject,
        text,
      }),
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Resend failed: ${res.status} ${err}`);
    }
    return;
  }
  console.log(`[email stub] to=${to}\nSubject: ${subject}\n${text}\n---`);
}

export default function Home() {
  return (
    <main style={{ fontFamily: "monospace", padding: "2rem" }}>
      <h1>Vapi Integration</h1>
      <p>
        Webhook endpoint: <code>POST /api/vapi/webhook</code>
      </p>
      <p>
        Configure this URL in your{" "}
        <a href="https://dashboard.vapi.ai" target="_blank" rel="noreferrer">
          Vapi dashboard
        </a>{" "}
        under <strong>Server URL</strong>.
      </p>
    </main>
  );
}

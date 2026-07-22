export default function TermsOfService() {
  return (
    <div className="min-h-screen py-16 px-4 sm:px-6 lg:px-8 bg-background max-w-4xl mx-auto">
      <h1 className="text-4xl font-extrabold mb-8">Terms of Service</h1>
      <p className="text-muted-foreground mb-4">Last updated: {new Date().toLocaleDateString()}</p>
      
      <div className="space-y-6 text-foreground">
        <section>
          <h2 className="text-2xl font-bold mb-3">1. Acceptance of Terms</h2>
          <p>
            By accessing and using Hisab Management, you agree to be bound by these Terms of Service. 
            If you do not agree with any part of these terms, you may not use our service.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-3">2. Service Description</h2>
          <p>
            Hisab Management is a personal finance, ledger, and document vault application provided "as is". 
            We do not guarantee 100% uptime or absolute protection against data loss, though we employ industry-standard practices.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-3">3. User Responsibilities</h2>
          <p>
            You are responsible for maintaining the confidentiality of your account credentials (via your Google account).
            You agree not to misuse the service or use it for any illegal activities.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-3">4. Limitation of Liability</h2>
          <p>
            Hisab Management and its developers shall not be liable for any indirect, incidental, special, 
            consequential, or punitive damages resulting from your use of the service or any financial decisions 
            made based on the data stored within.
          </p>
        </section>
      </div>
    </div>
  );
}

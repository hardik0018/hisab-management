export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen py-16 px-4 sm:px-6 lg:px-8 bg-background max-w-4xl mx-auto">
      <h1 className="text-4xl font-extrabold mb-8">Privacy Policy</h1>
      <p className="text-muted-foreground mb-4">Last updated: {new Date().toLocaleDateString()}</p>
      
      <div className="space-y-6 text-foreground">
        <section>
          <h2 className="text-2xl font-bold mb-3">1. Information We Collect</h2>
          <p>
            When you use Hisab Management System, we collect the following types of information:
            <ul className="list-disc ml-6 mt-2">
              <li><strong>Google Profile Data:</strong> Name, email address, and profile picture (managed via Google OAuth).</li>
              <li><strong>Financial Data:</strong> Expenses, Hisab (credit/debit), marriage records, and vault documents that you input into the app.</li>
            </ul>
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-3">2. How We Use Your Information</h2>
          <p>
            We use your information exclusively to provide the core services of Hisab Management System:
            <ul className="list-disc ml-6 mt-2">
              <li>To securely authenticate you and maintain your session.</li>
              <li>To store, calculate, and display your personal financial tracking data.</li>
              <li>To send you push notifications or email reminders (if explicitly enabled).</li>
            </ul>
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-3">3. Data Sharing and Security</h2>
          <p>
            Your data is private. We do not sell, rent, or share your personal information with third parties for marketing purposes.
            Data is encrypted at rest and in transit. Vault documents are securely encrypted using AES-256-GCM.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-3">4. Data Deletion</h2>
          <p>
            You have the right to delete your data at any time. You can clear your space data via the Settings page. 
            For full account deletion, please contact the administrator.
          </p>
        </section>
      </div>
    </div>
  );
}

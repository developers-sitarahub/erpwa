import { Metadata } from "next";
import { Logo } from "@/components/logo";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy | GPS-ERP",
  description:
    "Privacy Policy for GPS-ERP WhatsApp Business Integration Platform",
};

export default function PrivacyPolicyPage() {
  const currentYear = new Date().getFullYear();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="w-full bg-card border-b border-border py-4 sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 md:px-6 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 transition-opacity hover:opacity-80"
          >
            <Logo className="h-10 w-auto" isSidebar={true} collapsed={false} />
          </Link>
          <nav>
            <Link
              href="/"
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
            >
              Back to Home
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 md:px-6 py-12">
        <div className="max-w-4xl mx-auto bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
          <div className="p-8 md:p-12">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Privacy Policy
            </h1>
            <p className="text-muted-foreground mb-8 text-sm">
              Last updated: {currentYear}
            </p>

            <div className="space-y-8 text-foreground leading-relaxed">
              <section>
                <p className="mb-4">
                  GPS-ERP (&quot;we&quot;, &quot;our&quot;, &quot;us&quot;)
                  provides business messaging and customer communication tools
                  using the WhatsApp Business Platform. We are committed to
                  protecting your privacy and ensuring the security of your
                  data.
                </p>
              </section>

              <section>
                <h2 className="text-xl md:text-2xl font-semibold text-primary mb-4">
                  Information We Collect
                </h2>
                <p className="mb-4 text-muted-foreground">
                  We may collect and process the following information on behalf
                  of businesses using our platform:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>Business account information (Name, Industry, etc.)</li>
                  <li>WhatsApp Business Account (WABA) details</li>
                  <li>Phone numbers connected to WhatsApp</li>
                  <li>Message template data</li>
                  <li>Messaging metadata (timestamps, delivery status)</li>
                  <li>
                    Customer contact numbers and message content strictly
                    necessary for message delivery
                  </li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl md:text-2xl font-semibold text-primary mb-4">
                  How We Use Information
                </h2>
                <p className="mb-4 text-muted-foreground">
                  We use this data strictly to:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>Enable WhatsApp messaging features and delivery</li>
                  <li>Manage WhatsApp Business Accounts and phone numbers</li>
                  <li>Provide analytics and performance insights to you</li>
                  <li>
                    Improve platform reliability, security, and performance
                  </li>
                </ul>
                <p className="mt-4 p-4 bg-secondary/30 rounded-lg border border-secondary text-sm font-medium">
                  We do <span className="text-destructive font-bold">not</span>{" "}
                  sell or share personal data with third parties for advertising
                  purposes.
                </p>
              </section>

              <section>
                <h2 className="text-xl md:text-2xl font-semibold text-primary mb-4">
                  Data Sharing
                </h2>
                <p className="mb-4 text-muted-foreground">
                  Data is shared only with:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>
                    <strong className="text-foreground">
                      Meta Platforms, Inc. (WhatsApp)
                    </strong>{" "}
                    to enable message delivery
                  </li>
                  <li>
                    <strong className="text-foreground">
                      Service Providers
                    </strong>{" "}
                    necessary for infrastructure hosting, database management,
                    and security
                  </li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl md:text-2xl font-semibold text-primary mb-4">
                  Data Retention
                </h2>
                <p className="text-muted-foreground">
                  We retain data only as long as necessary to provide our
                  services or as required by applicable laws and regulations.
                  You can request deletion of your account data at any time.
                </p>
              </section>

              <section>
                <h2 className="text-xl md:text-2xl font-semibold text-primary mb-4">
                  Data Security
                </h2>
                <p className="text-muted-foreground">
                  We implement robust technical and organizational security
                  measures to protect data from unauthorized access, alteration,
                  disclosure, or destruction. This includes encryption in
                  transit and at rest where applicable.
                </p>
              </section>

              <section>
                <h2 className="text-xl md:text-2xl font-semibold text-primary mb-4">
                  User Rights
                </h2>
                <p className="mb-4 text-muted-foreground">
                  Businesses using GPS-ERP may request access, correction, or
                  deletion of their data, or removal of their WhatsApp Business
                  integration.
                </p>
                <p className="text-muted-foreground">
                  To exercise these rights, please contact our privacy team at:{" "}
                  <a
                    href="mailto:info.kamatvishal@gmail.com"
                    className="text-primary font-medium hover:underline transition-all"
                  >
                    info.kamatvishal@gmail.com
                  </a>
                </p>
              </section>

              <hr className="border-border my-8" />

              <section>
                <h2 className="text-xl md:text-2xl font-semibold text-primary mb-4">
                  Contact Us
                </h2>
                <p className="text-muted-foreground">
                  If you have questions about this Privacy Policy, please
                  contact us at:{" "}
                  <a
                    href="mailto:info.kamatvishal@gmail.com"
                    className="text-primary font-medium hover:underline transition-all"
                  >
                    info.kamatvishal@gmail.com
                  </a>
                </p>
              </section>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-8 text-center text-muted-foreground text-sm border-t border-border bg-card">
        <p>&copy; {currentYear} GPS-ERP. All rights reserved.</p>
      </footer>
    </div>
  );
}

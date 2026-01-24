import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | GPS-ERP",
  description:
    "Privacy Policy for GPS-ERP WhatsApp Business Integration Platform",
};

export default function PrivacyPolicyPage() {
  return (
    <main className="max-w-4xl mx-auto px-6 py-12 text-gray-800">
      <h1 className="text-4xl font-bold mb-6">Privacy Policy</h1>
      <p className="mb-4">Last updated: {new Date().getFullYear()}</p>

      <p className="mb-6">
        GPS-ERP ("we", "our", "us") provides business messaging and customer
        communication tools using the WhatsApp Business Platform.
      </p>

      <h2 className="text-2xl font-semibold mt-8 mb-3">
        Information We Collect
      </h2>
      <p className="mb-4">
        We may collect and process the following information on behalf of
        businesses using our platform:
      </p>
      <ul className="list-disc pl-6 space-y-2">
        <li>Business account information</li>
        <li>WhatsApp Business Account (WABA) details</li>
        <li>Phone numbers connected to WhatsApp</li>
        <li>Message template data</li>
        <li>Messaging metadata (timestamps, delivery status)</li>
        <li>
          Customer contact numbers and message content necessary for message
          delivery
        </li>
      </ul>

      <h2 className="text-2xl font-semibold mt-8 mb-3">
        How We Use Information
      </h2>
      <p className="mb-4">We use this data strictly to:</p>
      <ul className="list-disc pl-6 space-y-2">
        <li>Enable WhatsApp messaging features</li>
        <li>Manage WhatsApp Business Accounts and phone numbers</li>
        <li>Provide analytics and performance insights</li>
        <li>Improve platform reliability and performance</li>
      </ul>
      <p className="mt-4">
        We do <strong>not</strong> sell or share personal data with third
        parties for advertising.
      </p>

      <h2 className="text-2xl font-semibold mt-8 mb-3">Data Sharing</h2>
      <p className="mb-4">Data is shared only with:</p>
      <ul className="list-disc pl-6 space-y-2">
        <li>Meta Platforms, Inc. (WhatsApp) to deliver messages</li>
        <li>
          Service providers necessary for infrastructure hosting and security
        </li>
      </ul>

      <h2 className="text-2xl font-semibold mt-8 mb-3">Data Retention</h2>
      <p className="mb-4">
        We retain data only as long as necessary to provide our services or as
        required by law.
      </p>

      <h2 className="text-2xl font-semibold mt-8 mb-3">Data Security</h2>
      <p className="mb-4">
        We implement technical and organizational security measures to protect
        data from unauthorized access, alteration, or disclosure.
      </p>

      <h2 className="text-2xl font-semibold mt-8 mb-3">User Rights</h2>
      <p className="mb-4">
        Businesses using GPS-ERP may request access, correction, or deletion of
        their data, or removal of their WhatsApp Business integration.
      </p>
      <p className="mb-4">
        Requests can be sent to:{" "}
        <a
          href="mailto:info.kamatvishal@gmail.com"
          className="text-blue-600 underline"
        >
          info.kamatvishal@gmail.com
        </a>
      </p>

      <h2 className="text-2xl font-semibold mt-8 mb-3">Contact Us</h2>
      <p>
        If you have questions about this Privacy Policy, contact us at:{" "}
        <a
          href="mailto:info.kamatvishal@gmail.com"
          className="text-blue-600 underline"
        >
          info.kamatvishal@gmail.com
        </a>
      </p>
    </main>
  );
}

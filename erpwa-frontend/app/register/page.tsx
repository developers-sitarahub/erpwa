"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AxiosError } from "axios";
import { toast } from "react-toastify";
import { useAuth } from "@/context/authContext";
import { Logo } from "@/components/logo";
import api, { setAccessToken } from "@/lib/api";
import {
  Loader2,
  CheckCircle2,
  ChevronRight,
  Smartphone,
  Building2,
  MessageCircle,
} from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const { user, loading: userLoading, updateUser } = useAuth();

  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Step 1 Form
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mobileOtp, setMobileOtp] = useState("");
  const [emailOtp, setEmailOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);

  // Step 2 Form
  const [businessName, setBusinessName] = useState("");
  const [businessCategory, setBusinessCategory] = useState("");
  const [country, setCountry] = useState("India");

  // Step 3 Form
  const [whatsappBusinessId, setWhatsappBusinessId] = useState("");
  const [whatsappPhoneNumberId, setWhatsappPhoneNumberId] = useState("");

  useEffect(() => {
    if (userLoading) return;

    // Resume flow if user is already logged in
    if (user) {
      const status = user.onboardingStatus || "pending";
      if (status === "identity_verified") {
        setCurrentStep(2);
      } else if (status === "business_info_completed") {
        setCurrentStep(3);
      } else if (status === "activated") {
        router.push(
          user.role === "vendor_owner" || user.role === "vendor_admin"
            ? "/admin/dashboard"
            : "/dashboard",
        );
      }
    }
  }, [user, userLoading, router]);

  async function handleRequestOtp() {
    if (!mobile) return toast.error("Mobile number is required");
    if (!email) return toast.error("Email is required first");
    setLoading(true);
    try {
      await api.post("/onboarding/request-otp", { mobile, email });
      toast.success("OTPs sent to your email and mobile!");
      setOtpSent(true);
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleStep1(e: React.FormEvent) {
    e.preventDefault();
    if (!otpSent) return handleRequestOtp();
    if (!mobileOtp || !emailOtp || !name || !email || !password)
      return toast.error("Please fill all fields");

    setLoading(true);
    try {
      const res = await api.post("/onboarding/step1", {
        name,
        mobile,
        email,
        password,
        mobileOtp,
        emailOtp,
      });
      toast.success("Identity verified!");
      // Set the token manually for current session because Context will only update on reload or login action
      setAccessToken(res.data.accessToken);
      updateUser(res.data.user);
      // Update the step visually instead of reloading
      setCurrentStep(2);
    } catch (err) {
      handleError(err);
      setLoading(false);
    }
  }

  async function handleStep2(e: React.FormEvent) {
    e.preventDefault();
    if (!businessName || !businessCategory)
      return toast.error("Please fill required fields");

    setLoading(true);
    try {
      const res = await api.post("/onboarding/step2", {
        businessName,
        businessCategory,
        country,
      });
      toast.success("Business information saved!");
      if (res.data.onboardingStatus) {
        updateUser({ onboardingStatus: res.data.onboardingStatus });
      }
      setCurrentStep(3);
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleStep3(e: React.FormEvent) {
    e.preventDefault();
    if (!whatsappBusinessId || !whatsappPhoneNumberId)
      return toast.error("Please fill required IDs");

    setLoading(true);
    try {
      const res = await api.post("/onboarding/step3", {
        whatsappBusinessId,
        whatsappPhoneNumberId,
      });
      toast.success("Platform Activated!");
      if (res.data.onboardingStatus) {
        updateUser({ onboardingStatus: res.data.onboardingStatus });
      }
      const dashboardPath =
        user?.role === "vendor_owner" || user?.role === "vendor_admin"
          ? "/admin/dashboard"
          : "/dashboard";
      router.push(dashboardPath);
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  }

  function handleError(err: unknown) {
    if (err instanceof AxiosError && err.response?.data?.message) {
      toast.error(err.response.data.message);
    } else if (err instanceof Error) {
      toast.error(err.message);
    } else {
      toast.error("An error occurred");
    }
  }

  if (userLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4 py-8">
      <div className="w-full max-w-2xl bg-card border border-border rounded-xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="bg-muted p-6 border-b border-border text-center">
          <div className="flex justify-center mb-6">
            <Logo className="w-48 h-auto max-h-24" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Complete Your Onboarding
          </h1>
          <p className="text-muted-foreground mt-2">
            Set up your vendor account to activate WhatsApp services.
          </p>
        </div>

        {/* Progress Tracker */}
        <div className="px-8 pt-8 pb-4">
          <div className="flex items-center justify-between relative">
            <div className="absolute top-1/2 left-0 w-full h-1 bg-muted -translate-y-1/2 z-0"></div>
            <div
              className="absolute top-1/2 left-0 h-1 bg-primary -translate-y-1/2 z-0 transition-all duration-500"
              style={{ width: `${(currentStep - 1) * 50}%` }}
            ></div>

            {/* Step 1 Indicator */}
            <div className="relative z-10 flex flex-col items-center gap-2">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center shadow-md transition-colors ${currentStep >= 1 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
              >
                {currentStep > 1 ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : (
                  <Smartphone className="w-5 h-5" />
                )}
              </div>
              <span
                className={`text-xs font-semibold ${currentStep >= 1 ? "text-primary" : "text-muted-foreground"}`}
              >
                Identity
              </span>
            </div>

            {/* Step 2 Indicator */}
            <div className="relative z-10 flex flex-col items-center gap-2">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center shadow-md transition-colors ${currentStep >= 2 ? "bg-primary text-primary-foreground" : "bg-muted border border-border text-muted-foreground"}`}
              >
                {currentStep > 2 ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : (
                  <Building2 className="w-5 h-5" />
                )}
              </div>
              <span
                className={`text-xs font-semibold ${currentStep >= 2 ? "text-primary" : "text-muted-foreground"}`}
              >
                Business Info
              </span>
            </div>

            {/* Step 3 Indicator */}
            <div className="relative z-10 flex flex-col items-center gap-2">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center shadow-md transition-colors ${currentStep >= 3 ? "bg-primary text-primary-foreground" : "bg-muted border border-border text-muted-foreground"}`}
              >
                {currentStep > 3 ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : (
                  <MessageCircle className="w-5 h-5" />
                )}
              </div>
              <span
                className={`text-xs font-semibold ${currentStep >= 3 ? "text-primary" : "text-muted-foreground"}`}
              >
                WhatsApp
              </span>
            </div>
          </div>
        </div>

        {/* Forms Container */}
        <div className="p-8">
          {/* STEP 1 */}
          {currentStep === 1 && (
            <form
              onSubmit={handleStep1}
              className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500"
            >
              <div className="space-y-1">
                <h2 className="text-xl font-semibold">
                  Account Identity Creation
                </h2>
                <p className="text-sm text-muted-foreground">
                  Create your platform account and verify your mobile number.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    disabled={loading}
                    className="w-full rounded-md border border-border bg-input px-4 py-2 text-foreground focus:ring-2 focus:ring-primary outline-none"
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                    className="w-full rounded-md border border-border bg-input px-4 py-2 text-foreground focus:ring-2 focus:ring-primary outline-none"
                    placeholder="john@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Mobile Number
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="tel"
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value)}
                      required
                      disabled={loading || otpSent}
                      className="w-full rounded-md border border-border bg-input px-4 py-2 text-foreground focus:ring-2 focus:ring-primary outline-none"
                      placeholder="+1234567890"
                    />
                    {!otpSent && (
                      <button
                        type="button"
                        onClick={handleRequestOtp}
                        disabled={loading || !mobile}
                        className="px-4 py-2 rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80 font-medium whitespace-nowrap"
                      >
                        {loading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          "Get OTP"
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {otpSent && (
                  <div className="grid grid-cols-2 gap-4 animate-in zoom-in-95 duration-300">
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Mobile OTP
                      </label>
                      <input
                        type="text"
                        value={mobileOtp}
                        onChange={(e) => setMobileOtp(e.target.value)}
                        required
                        disabled={loading}
                        className="w-full rounded-md border border-border bg-input px-4 py-2 text-foreground focus:ring-2 focus:ring-primary outline-none"
                        placeholder="123456"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Email OTP
                      </label>
                      <input
                        type="text"
                        value={emailOtp}
                        onChange={(e) => setEmailOtp(e.target.value)}
                        required
                        disabled={loading}
                        className="w-full rounded-md border border-border bg-input px-4 py-2 text-foreground focus:ring-2 focus:ring-primary outline-none"
                        placeholder="123456"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Set Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                    className="w-full rounded-md border border-border bg-input px-4 py-2 text-foreground focus:ring-2 focus:ring-primary outline-none"
                    placeholder="********"
                  />
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={loading || !otpSent}
                  className="w-full flex justify-center items-center gap-2 rounded-md bg-primary hover:bg-primary/90 text-primary-foreground py-2.5 font-medium transition disabled:opacity-60"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    "Verify & Continue"
                  )}
                  {!loading && <ChevronRight className="w-5 h-5" />}
                </button>
              </div>
              <div className="text-center mt-4">
                <button
                  type="button"
                  onClick={() => router.push("/login")}
                  className="text-sm text-primary hover:underline"
                >
                  Already have an account? Sign in
                </button>
              </div>
            </form>
          )}

          {/* STEP 2 */}
          {currentStep === 2 && (
            <form
              onSubmit={handleStep2}
              className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500"
            >
              <div className="space-y-1">
                <h2 className="text-xl font-semibold">
                  Business Context Information
                </h2>
                <p className="text-sm text-muted-foreground">
                  Tell us about your business to setup your workspace.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Business Name
                  </label>
                  <input
                    type="text"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    required
                    disabled={loading}
                    className="w-full rounded-md border border-border bg-input px-4 py-2 text-foreground focus:ring-2 focus:ring-primary outline-none"
                    placeholder="Acme Corp"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Business Category
                  </label>
                  <select
                    value={businessCategory}
                    onChange={(e) => setBusinessCategory(e.target.value)}
                    required
                    disabled={loading}
                    className="w-full rounded-md border border-border bg-input px-4 py-2 text-foreground focus:ring-2 focus:ring-primary outline-none"
                  >
                    <option value="" disabled>
                      Select a category
                    </option>
                    <option value="Retail">Retail & E-commerce</option>
                    <option value="SaaS">Software / IT</option>
                    <option value="Agency">Agency / Services</option>
                    <option value="Education">Education</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Country
                  </label>
                  <input
                    type="text"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    required
                    disabled={loading}
                    className="w-full rounded-md border border-border bg-input px-4 py-2 text-foreground focus:ring-2 focus:ring-primary outline-none"
                    placeholder="Country"
                  />
                </div>
              </div>

              <div className="pt-4 flex gap-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center items-center gap-2 rounded-md bg-primary hover:bg-primary/90 text-primary-foreground py-2.5 font-medium transition disabled:opacity-60"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    "Save & Continue"
                  )}
                  {!loading && <ChevronRight className="w-5 h-5" />}
                </button>
              </div>
            </form>
          )}

          {/* STEP 3 */}
          {currentStep === 3 && (
            <form
              onSubmit={handleStep3}
              className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500"
            >
              <div className="space-y-1">
                <h2 className="text-xl font-semibold">
                  WhatsApp Business Connection
                </h2>
                <p className="text-sm text-muted-foreground">
                  Link your WhatsApp Business account to activate your platform.
                </p>
              </div>

              <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 mb-4 flex items-start gap-4">
                <div className="bg-primary/20 p-2 rounded-full mt-1">
                  <MessageCircle className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground">
                    Embedded Signup
                  </h4>
                  <p className="text-sm text-muted-foreground mt-1 text-balance">
                    Ensure your Facebook Business Manager is ready. Only unique
                    WhatsApp numbers are permitted.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    WhatsApp Business ID
                  </label>
                  <input
                    type="text"
                    value={whatsappBusinessId}
                    onChange={(e) => setWhatsappBusinessId(e.target.value)}
                    required
                    disabled={loading}
                    className="w-full rounded-md border border-border bg-input px-4 py-2 text-foreground focus:ring-2 focus:ring-primary outline-none font-mono text-sm"
                    placeholder="e.g. 1098234723984"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    WhatsApp Phone Number ID
                  </label>
                  <input
                    type="text"
                    value={whatsappPhoneNumberId}
                    onChange={(e) => setWhatsappPhoneNumberId(e.target.value)}
                    required
                    disabled={loading}
                    className="w-full rounded-md border border-border bg-input px-4 py-2 text-foreground focus:ring-2 focus:ring-primary outline-none font-mono text-sm"
                    placeholder="e.g. 1042304982309"
                  />
                </div>
              </div>

              <div className="pt-4 flex gap-4">
                {/* 
                  Since user cannot navigate back structurally because backend stores state, 
                  but visually they stay at step 3. 
                  If they need to edit Step 2, they can't directly without API endpoint.
                  Requirements say "User can navigate back safely" in Step 2.
                  But if status=business_info_completed, the backend has stored it, we just display step 3.
                */}
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => setCurrentStep(2)}
                  className="px-6 rounded-md border border-border hover:bg-muted text-foreground py-2.5 font-medium transition disabled:opacity-60"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 flex justify-center items-center gap-2 rounded-md bg-primary hover:bg-primary/90 text-primary-foreground py-2.5 font-medium transition disabled:opacity-60"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    "Activate Platform"
                  )}
                  {!loading && <CheckCircle2 className="w-5 h-5" />}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

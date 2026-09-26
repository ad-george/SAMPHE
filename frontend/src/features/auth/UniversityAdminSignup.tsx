import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../../services/api";
import toast from "react-hot-toast";
import backgroundImage from "../../assets/background.png";
import { useAuth } from "../../context/AuthContext";

type Step = 1 | 2 | 3;

const UniversityAdminSignup = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [licenseError, setLicenseError] = useState("");

  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const [licenseCode, setLicenseCode] = useState("");

  const [form, setForm] = useState({
    institutionType: "",
    licenseType: "",
    institutionName: "",
    institutionEmail: "",
    institutionPhone: "",

    adminFullName: "",
    adminEmail: "",
    adminPhone: "",
    adminPassword: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const institutionTypes = [
    "University",
    "College",
    "TVET",
    "KMTC",
    "Polytechnic",
  ];

  const licenseTypes = ["SUBSCRIPTION", "PERPETUAL", "TRIAL"];

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const handleUniversityNext = () => {
    const newErrors: Record<string, string> = {};

    if (!form.institutionType) {
      newErrors.institutionType = "This field is required";
    }

    if (!form.licenseType) {
      newErrors.licenseType = "This field is required";
    }

    if (!form.institutionName.trim()) {
      newErrors.institutionName = "This field is required";
    }

    if (!form.institutionEmail.trim()) {
      newErrors.institutionEmail = "This field is required";
    }

    if (!form.institutionPhone.trim()) {
      newErrors.institutionPhone = "This field is required";
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      return;
    }

    setStep(2);
  };

  const handleAdminNext = async () => {
    const newErrors: Record<string, string> = {};

    if (!form.adminFullName.trim()) {
      newErrors.adminFullName = "This field is required";
    }

    if (!form.adminEmail.trim()) {
      newErrors.adminEmail = "This field is required";
    }

    if (!form.adminPhone.trim()) {
      newErrors.adminPhone = "This field is required";
    }

    if (!form.adminPassword) {
      newErrors.adminPassword = "This field is required";
    } else if (form.adminPassword.length < 6) {
      newErrors.adminPassword = "Password must be at least 6 characters";
    }

    if (!form.confirmPassword) {
      newErrors.confirmPassword = "This field is required";
    } else if (form.adminPassword !== form.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      return;
    }

    setLoading(true);

    try {
      const res = await api.post("/auth/university-admin/signup", {
        institutionType: form.institutionType,
        licenseType: form.licenseType,
        institutionName: form.institutionName,
        institutionEmail: form.institutionEmail,
        institutionPhone: form.institutionPhone,

        adminFullName: form.adminFullName,
        adminEmail: form.adminEmail,
        adminPhone: form.adminPhone,
        adminPassword: form.adminPassword,
      });

      sessionStorage.setItem("signupData", JSON.stringify(res.data.data));

      toast.success("Account details saved!");

      setErrors({});
      setStep(3);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Unable to create account");
    } finally {
      setLoading(false);
    }
  };

  const handleLicenseSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setLicenseError("");

    const rawCode = licenseCode.replace(/-/g, "");

    if (rawCode.length < 21) {
      setLicenseError(
        `License code is incomplete. Please enter all 21 characters.`,
      );
      return;
    }

    if (rawCode.length > 21) {
      setLicenseError("License code is invalid.");
      return;
    }

    setLoading(true);

    try {
      const signupData = JSON.parse(
        sessionStorage.getItem("signupData") || "{}",
      );

      const response = await api.post("/licenses/use", {
        code: licenseCode,
        universityId: signupData.universityId,
        usedBy: signupData.adminEmail,
        licenseType: signupData.licenseType || form.licenseType,
      });

      if (response.data.success) {
        setLicenseError("");
        toast.success("License activated! You can now log in.");
        sessionStorage.removeItem("signupData");
        navigate("/login/university-admin");
      }
    } catch (err: any) {
      const backendMessage = err.response?.data?.message || "";

      if (backendMessage === "INCOMPLETE") {
        setLicenseError(
          "License code is incomplete. Please enter all 21 characters.",
        );
      } else if (backendMessage === "INVALID") {
        setLicenseError("Invalid license code.");
      } else if (backendMessage === "EXPIRED") {
        setLicenseError("License code has expired.");
      } else if (backendMessage === "USED") {
        setLicenseError("License code has already been used.");
      } else if (backendMessage === "SUSPENDED") {
        setLicenseError("This license has been suspended.");
      } else if (backendMessage === "TYPE_MISMATCH") {
        setLicenseError(
          "License type does not match the selected license type.",
        );
      } else {
        setLicenseError(backendMessage || "Unable to validate license code.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePrevious = () => {
    if (step === 2) {
      setErrors({});
      setStep(1);
    }
  };

  const renderProgress = () => {
    return (
      <div className="flex items-center justify-center mb-5">
        <div className="flex items-center">
          <div
            className={`w-9 h-9 rounded-full flex items-center justify-center font-semibold text-sm transition-all duration-300 ${
              step >= 1
                ? "bg-emerald-600 text-white shadow-lg shadow-emerald-500/30"
                : "bg-gray-200 text-gray-500"
            }`}
          >
            1
          </div>

          <div
            className={`w-14 sm:w-20 h-1 transition-all duration-300 ${
              step >= 2 ? "bg-emerald-600" : "bg-gray-200"
            }`}
          />
        </div>

        <div className="flex items-center">
          <div
            className={`w-9 h-9 rounded-full flex items-center justify-center font-semibold text-sm transition-all duration-300 ${
              step >= 2
                ? "bg-emerald-600 text-white shadow-lg shadow-emerald-500/30"
                : "bg-gray-200 text-gray-500"
            }`}
          >
            2
          </div>

          <div
            className={`w-14 sm:w-20 h-1 transition-all duration-300 ${
              step >= 3 ? "bg-emerald-600" : "bg-gray-200"
            }`}
          />
        </div>

        <div
          className={`w-9 h-9 rounded-full flex items-center justify-center font-semibold text-sm transition-all duration-300 ${
            step >= 3
              ? "bg-emerald-600 text-white shadow-lg shadow-emerald-500/30"
              : "bg-gray-200 text-gray-500"
          }`}
        >
          3
        </div>
      </div>
    );
  };

  const renderStepLabels = () => {
    return (
      <div className="grid grid-cols-3 text-center mb-5">
        <div>
          <p className="text-xs sm:text-sm font-semibold text-white">
            University
          </p>
          <p className="text-[10px] sm:text-xs text-white mt-0.5">
            Institution Details
          </p>
        </div>

        <div>
          <p className="text-xs sm:text-sm font-semibold text-white">
            Administrator
          </p>
          <p className="text-[10px] sm:text-xs text-white mt-0.5">
            Admin Details
          </p>
        </div>

        <div>
          <p className="text-xs sm:text-sm font-semibold text-white">License</p>
          <p className="text-[10px] sm:text-xs text-white mt-0.5">Activation</p>
        </div>
      </div>
    );
  };

  return (
    <div
      className="min-h-screen relative flex items-center justify-center p-3 sm:p-5 overflow-hidden bg-slate-950"
      style={{
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: "cover",
        backgroundPosition: "left center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(to right, rgba(2,6,23,0.05) 0%, rgba(2,6,23,0.20) 35%, rgba(2,6,23,0.62) 70%, rgba(2,6,23,0.92) 100%)",
        }}
      />

      <div className="relative z-10 w-full max-w-5xl bg-white/10 backdrop-blur-md rounded-3xl shadow-2xl overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-5 min-h-[480px]">
          {/* LEFT BRANDING PANEL */}
          <div className="hidden lg:flex lg:col-span-2 bg-emerald-700/60 text-white p-5 flex-col justify-between">
            <div>
              <div className="p-4 border-b border-slate-800/60 flex items-center justify-center">
                <div className="flex items-center gap-3 bg-white/5 rounded-full px-5 py-3 border border-white/10">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 shrink-0">
                    <svg
                      className="w-8 h-8 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2.5}
                        d="M12 14l9-5-9-5-9 5 9 5z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2.5}
                        d="M12 14l6.16-3.422A12.042 12.042 0 0112 21a12.042 12.042 0 01-6.16-10.422L12 14z"
                      />
                    </svg>
                  </div>

                  <div className="overflow-hidden">
                    <h1 className="font-bold text-xl text-white tracking-tight whitespace-nowrap">
                      SUAMP
                    </h1>
                    <p className="text-[10px] text-slate-300 uppercase tracking-widest whitespace-nowrap">
                      Registration
                    </p>
                  </div>
                </div>
              </div>

              <h1 className="text-3xl font-bold leading-tight">
                Institutions
                <br />
                Registration
              </h1>

              <p className="text-emerald-100 mt-3 leading-relaxed text-sm">
                Create your institution account and set up your administrator
                access to the Smart University Attendance Management Platform.
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0 text-sm">
                  ✓
                </div>
                <div>
                  <p className="font-semibold text-sm">Institution Setup</p>
                  <p className="text-xs text-emerald-200">
                    Register Institution
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0 text-sm">
                  ✓
                </div>
                <div>
                  <p className="font-semibold text-sm">Administrator Account</p>
                  <p className="text-xs text-emerald-200">
                    Create your administrator credentials
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0 text-sm">
                  ✓
                </div>
                <div>
                  <p className="font-semibold text-sm">License Activation</p>
                  <p className="text-xs text-emerald-200">
                    Activate your institution account
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT FORM PANEL */}
          <div className="lg:col-span-3 p-5 sm:p-7 flex flex-col justify-center">
            <div className="lg:hidden text-center mb-5">
              <div className="flex items-center justify-center mb-3">
                <div className="flex items-center gap-3 bg-emerald-50 rounded-full px-4 py-2 border border-emerald-100">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-md">
                    <svg
                      className="w-6 h-6 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2.5}
                        d="M12 14l9-5-9-5-9 5 9 5z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2.5}
                        d="M12 14l6.16-3.422A12.042 12.042 0 0112 21a12.042 12.042 0 01-6.16-10.422L12 14z"
                      />
                    </svg>
                  </div>

                  <div className="text-left">
                    <h1 className="font-bold text-lg text-gray-800 tracking-tight">
                      SUAMP
                    </h1>
                    <p className="text-[9px] text-gray-400 uppercase tracking-widest">
                      Registration
                    </p>
                  </div>
                </div>
              </div>

              <p className="text-sm text-gray-500">
                Create your institution account
              </p>
            </div>

            {renderProgress()}
            {renderStepLabels()}

            {/* STEP 1 — UNIVERSITY DETAILS */}
            {step === 1 && (
              <div>
                <div className="mb-4">
                  <h2 className="text-2xl font-bold text-gray-800">
                    University Details
                  </h2>
                  <p className="text-sm text-white mt-1">
                    Enter the basic information about your institution.
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Institution Type
                      </label>
                      <select
                        name="institutionType"
                        value={form.institutionType}
                        onChange={handleChange}
                        className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none bg-white text-sm ${
                          errors.institutionType
                            ? "border-red-500"
                            : "border-gray-300"
                        }`}
                      >
                        <option value="">Select type...</option>
                        {institutionTypes.map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </select>
                      {errors.institutionType && (
                        <p className="text-red-500 text-xs mt-1">
                          {errors.institutionType}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        License Type
                      </label>
                      <select
                        name="licenseType"
                        value={form.licenseType}
                        onChange={handleChange}
                        className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none bg-white text-sm ${
                          errors.licenseType
                            ? "border-red-500"
                            : "border-gray-300"
                        }`}
                      >
                        <option value="">Select license type...</option>
                        {licenseTypes.map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </select>
                      {errors.licenseType && (
                        <p className="text-red-500 text-xs mt-1">
                          {errors.licenseType}
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Institution Name
                    </label>
                    <input
                      type="text"
                      name="institutionName"
                      value={form.institutionName}
                      onChange={handleChange}
                      placeholder="e.g. Meru University of Science and Technology"
                      className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none text-sm ${
                        errors.institutionName
                          ? "border-red-500"
                          : "border-gray-300"
                      }`}
                    />
                    {errors.institutionName && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.institutionName}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Institution Email
                      </label>
                      <input
                        type="email"
                        name="institutionEmail"
                        value={form.institutionEmail}
                        onChange={handleChange}
                        placeholder="info@university.ac.ke"
                        className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none text-sm ${
                          errors.institutionEmail
                            ? "border-red-500"
                            : "border-gray-300"
                        }`}
                      />
                      {errors.institutionEmail && (
                        <p className="text-red-500 text-xs mt-1">
                          {errors.institutionEmail}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Institution Phone
                      </label>
                      <input
                        type="text"
                        name="institutionPhone"
                        value={form.institutionPhone}
                        onChange={handleChange}
                        placeholder="+254 700 000 000"
                        className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none text-sm ${
                          errors.institutionPhone
                            ? "border-red-500"
                            : "border-gray-300"
                        }`}
                      />
                      {errors.institutionPhone && (
                        <p className="text-red-500 text-xs mt-1">
                          {errors.institutionPhone}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* NEXT + SIGN IN */}
                <div className="mt-5 flex items-center justify-between gap-4">
                  <Link
                    to="/login/university-admin"
                    className="text-green-400 font-bold hover:text-green-300 hover:underline"
                  >
                    Sign in
                  </Link>

                  <button
                    type="button"
                    onClick={handleUniversityNext}
                    className="px-7 py-2.5 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-500 transition shadow-lg shadow-emerald-500/30 flex items-center gap-2"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2 — ADMINISTRATOR DETAILS */}
            {step === 2 && (
              <div>
                <div className="mb-4">
                  <h2 className="text-2xl font-bold text-gray-800">
                    Administrator Details
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Create the administrator account for this institution.
                  </p>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Administrator Full Name
                    </label>
                    <input
                      type="text"
                      name="adminFullName"
                      value={form.adminFullName}
                      onChange={handleChange}
                      placeholder="e.g. John Mwangi"
                      className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none text-sm ${
                        errors.adminFullName
                          ? "border-red-500"
                          : "border-gray-300"
                      }`}
                    />
                    {errors.adminFullName && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.adminFullName}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Administrator Email
                      </label>
                      <input
                        type="email"
                        name="adminEmail"
                        value={form.adminEmail}
                        onChange={handleChange}
                        placeholder="admin@university.ac.ke"
                        className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none text-sm ${
                          errors.adminEmail
                            ? "border-red-500"
                            : "border-gray-300"
                        }`}
                      />
                      {errors.adminEmail && (
                        <p className="text-red-500 text-xs mt-1">
                          {errors.adminEmail}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Administrator Phone
                      </label>
                      <input
                        type="text"
                        name="adminPhone"
                        value={form.adminPhone}
                        onChange={handleChange}
                        placeholder="+254 700 000 000"
                        className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none text-sm ${
                          errors.adminPhone
                            ? "border-red-500"
                            : "border-gray-300"
                        }`}
                      />
                      {errors.adminPhone && (
                        <p className="text-red-500 text-xs mt-1">
                          {errors.adminPhone}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Password
                      </label>
                      <input
                        type="password"
                        name="adminPassword"
                        value={form.adminPassword}
                        onChange={handleChange}
                        placeholder="Minimum 6 characters"
                        className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none text-sm ${
                          errors.adminPassword
                            ? "border-red-500"
                            : "border-gray-300"
                        }`}
                      />
                      {errors.adminPassword && (
                        <p className="text-red-500 text-xs mt-1">
                          {errors.adminPassword}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Confirm Password
                      </label>
                      <input
                        type="password"
                        name="confirmPassword"
                        value={form.confirmPassword}
                        onChange={handleChange}
                        placeholder="Confirm password"
                        className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none text-sm ${
                          errors.confirmPassword
                            ? "border-red-500"
                            : "border-gray-300"
                        }`}
                      />
                      {errors.confirmPassword && (
                        <p className="text-red-500 text-xs mt-1">
                          {errors.confirmPassword}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* PREVIOUS | SIGN IN | NEXT */}
                <div className="mt-5 flex items-center justify-between gap-4">
                  <Link
                    to="/login/university-admin"
                    className="text-green-400 font-bold hover:text-green-300 hover:underline"
                  >
                    Sign in
                  </Link>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={handlePrevious}
                      disabled={loading}
                      className="px-6 py-2.5 border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition disabled:opacity-50"
                    >
                      Previous
                    </button>

                    <button
                      type="button"
                      onClick={handleAdminNext}
                      disabled={loading}
                      className="px-7 py-2.5 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-500 transition shadow-lg shadow-emerald-500/30 flex items-center gap-2 disabled:opacity-50"
                    >
                      {loading ? (
                        <>
                          <span className="animate-spin">⟳</span>
                          Creating...
                        </>
                      ) : (
                        <>Next</>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3 — LICENSE */}
            {step === 3 && (
              <div>
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <span className="text-3xl">🔑</span>
                  </div>

                  <h2 className="text-2xl font-bold text-gray-800">
                    Enter License Code
                  </h2>

                  <p className="text-white mt-2 max-w-md mx-auto text-sm">
                    Enter the license code provided by the platform
                    administrator to activate your institution account.
                  </p>
                </div>

                <form
                  onSubmit={handleLicenseSubmit}
                  className="max-w-md mx-auto"
                >
                  <div className="mb-5">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      License Code
                    </label>
                    <input
                      type="text"
                      value={licenseCode}
                      onChange={(e) => {
                        setLicenseError("");

                        const input = e.target.value;

                        const raw = input
                          .toUpperCase()
                          .replace(/[^A-Z0-9]/g, "");

                        const limited = raw.substring(0, 21);

                        let formatted = "";

                        for (let i = 0; i < limited.length; i++) {
                          if (i === 5 || i === 9 || i === 13 || i === 17) {
                            formatted += "-";
                          }

                          formatted += limited[i];
                        }

                        setLicenseCode(formatted);
                      }}
                      placeholder="SUAMP-XXXX-XXXX-XXXX-XXXX"
                      maxLength={25}
                      className={`w-full px-4 py-3 border rounded-lg
                        focus:ring-2 focus:ring-emerald-500
                        focus:border-transparent
                        outline-none font-mono text-lg
                        tracking-wider
                        ${
                          licenseError
                            ? "border-red-500 bg-red-50"
                            : "border-gray-300"
                        }`}
                      required
                    />
                    {licenseError && (
                      <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                        <span>⚠️</span>
                        <span>{licenseError}</span>
                      </p>
                    )}
                    <p className="text-xs text-white mt-2">
                      Enter full license code (e.g., SUAMP-ABCD-1234-EFGH-5678)
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-500 transition shadow-lg shadow-emerald-500/30 disabled:opacity-50"
                  >
                    {loading ? "Validating..." : "Submit License"}
                  </button>
                </form>

                <div className="flex items-center justify-center gap-4 mt-5">
                  <button
                    type="button"
                    onClick={() => {
                      setLicenseError("");
                      setStep(2);
                    }}
                    disabled={loading}
                    title="Go back to Admin Details"
                    className="text-white text-3xl font-extrabold leading-none hover:text-emerald-300 transition disabled:opacity-50"
                  >
                    ←|
                  </button>

                  <p className="text-sm text-white">
                    Already have an account?{" "}
                    <Link
                      to="/login/university-admin"
                      className="text-green-400 font-bold hover:text-green-300 hover:underline"
                    >
                      Sign In
                    </Link>
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UniversityAdminSignup;

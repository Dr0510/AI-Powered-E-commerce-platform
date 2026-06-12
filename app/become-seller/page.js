"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { useRouter } from "next/navigation";
import { useToast, ToastContainer } from "@/components/Toast";

const TOTAL_STEPS = 5;

const STEPS = [
  { num: 1, label: "Personal Info", icon: "👤" },
  { num: 2, label: "Business", icon: "🏪" },
  { num: 3, label: "Address", icon: "📍" },
  { num: 4, label: "Verification", icon: "✓" },
  { num: 5, label: "Store Setup", icon: "⚙️" },
];

const BUSINESS_TYPES = [
  "Individual", "Partnership", "Private Limited", "LLP",
  "Public Limited", "One Person Company", "NGO", "Other"
];

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand",
  "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur",
  "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab",
  "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura",
  "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry"
];

const STORE_CATEGORIES = [
  "Electronics", "Fashion", "Home & Kitchen", "Beauty & Personal",
  "Sports & Outdoors", "Books & Media", "Toys & Games", "Food & Grocery",
  "Health & Wellness", "Automotive", "Jewelry", "Handicrafts",
  "Pet Supplies", "Office Products", "Music & Instruments"
];

const SHIPPING_OPTIONS = [
  { value: "free", label: "Free Shipping" },
  { value: "flat", label: "Flat Rate Shipping" },
  { value: "calculated", label: "Calculated at Checkout" },
  { value: "pickup", label: "Local Pickup Only" },
];

function validatePAN(pan) {
  return /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan);
}

function validateAadhaar(aadhaar) {
  return /^\d{12}$/.test(aadhaar);
}

function validateGST(gst) {
  if (!gst) return true;
  return /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(gst);
}

function validateIFSC(ifsc) {
  return /^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc);
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePhone(phone) {
  return /^\d{10}$/.test(phone);
}

function validatePincode(pincode) {
  return /^\d{6}$/.test(pincode);
}

// Allowed image formats
const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

const UPLOAD_FOLDERS = {
  profile_photo: "seller-profiles",
  logo_url: "seller-logos",
  banner_url: "seller-banners",
  id_upload_url: "seller-ids",
};

/**
 * Client-side image uploader component with validation, progress, preview, replace, remove.
 */
function ImageUploader({ value, onChange, label, field, existingPublicId }) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState(null);

  // value is { secure_url, public_id } or null

  function validateFile(file) {
    if (!file) return "No file selected";
    if (!file.type.startsWith("image/")) return "File must be an image";
    if (!ALLOWED_TYPES.includes(file.type)) return "Allowed formats: JPG, PNG, WebP";
    if (file.size > MAX_SIZE) return "File too large. Maximum 5MB";
    return null;
  }

  function handleFileSelect(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError("");
    setUploading(true);
    setProgress(0);

    // Show local preview immediately
    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target.result);
    reader.readAsDataURL(file);

    // Upload to Cloudinary
    uploadFile(file, field)
      .then((result) => {
        if (result) {
          onChange(result);
        }
      })
      .catch((err) => {
        setError(err.message || "Upload failed");
      })
      .finally(() => {
        setUploading(false);
        setProgress(0);
      });
  }

  async function uploadFile(file, fieldName) {
    const folder = UPLOAD_FOLDERS[fieldName] || "seller-uploads";
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

    if (!cloudName) {
      throw new Error("Cloudinary cloud name not configured");
    }

    // Get signed signature from backend
    const timestamp = Math.round(Date.now() / 1000);
    let signatureData;
    try {
      signatureData = await api("/api/cloudinary/sign", {
        method: "POST",
        body: JSON.stringify({
          folder: `dr-mart/${folder}`,
          paramsToSign: {
            timestamp,
            folder: `dr-mart/${folder}`,
          },
        }),
      });
    } catch (err) {
      throw new Error("Failed to get upload signature");
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("api_key", signatureData.apiKey);
    formData.append("timestamp", timestamp);
    formData.append("signature", signatureData.signature);
    formData.append("folder", `dr-mart/${folder}`);
    formData.append("resource_type", "image");

    // Upload with XMLHttpRequest for progress tracking
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`);

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const pct = Math.round((event.loaded / event.total) * 100);
          setProgress(pct);
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const data = JSON.parse(xhr.responseText);
            if (data.secure_url && data.public_id) {
              // Delete old Cloudinary image if replacing
              if (existingPublicId && value?.public_id !== data.public_id) {
                deleteCloudinaryImage(existingPublicId).catch(() => {});
              }
              resolve({ secure_url: data.secure_url, public_id: data.public_id });
            } else {
              reject(new Error(data.error?.message || "Upload failed"));
            }
          } catch (err) {
            reject(new Error("Invalid response from server"));
          }
        } else {
          reject(new Error("Upload failed"));
        }
      };

      xhr.onerror = () => reject(new Error("Network error"));
      xhr.send(formData);
    });
  }

  async function deleteCloudinaryImage(publicId) {
    try {
      await api("/api/cloudinary/delete", {
        method: "POST",
        body: JSON.stringify({ publicId }),
      });
    } catch (e) {
      console.error("Failed to delete Cloudinary image:", e);
    }
  }

  function handleRemove() {
    if (!value) return;

    // Delete from Cloudinary if we have a public_id
    if (value.public_id) {
      deleteCloudinaryImage(value.public_id).catch(() => {});
    }

    onChange(null);
    setPreview(null);
    setError("");
  }

  function handleReplace() {
    // Trigger file picker
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/jpeg,image/jpg,image/png,image/webp";
    input.onchange = handleFileSelect;
    input.click();
  }

  const hasImage = value?.secure_url || preview;

  return (
    <div>
      <div className="flex items-center gap-4">
        {/* Preview */}
        <div className="relative h-16 w-16 rounded-lg bg-[var(--surface-secondary)] flex items-center justify-center overflow-hidden ring-1 ring-[var(--border-primary)] shrink-0">
          {uploading && preview ? (
            <img src={preview} alt="" className="h-full w-full object-cover opacity-50" />
          ) : hasImage ? (
            <img
              src={preview || value.secure_url}
              alt={label}
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="text-2xl">📷</span>
          )}

          {/* Upload progress overlay */}
          {uploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
              <div className="text-center">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent mx-auto" />
                <span className="text-[10px] font-bold text-white block mt-0.5">{progress}%</span>
              </div>
            </div>
          )}
        </div>

        {/* Buttons */}
        <div className="flex flex-col gap-1.5">
          {hasImage ? (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleReplace}
                disabled={uploading}
                className="px-3 py-1.5 rounded-lg border border-[var(--border-primary)] text-xs font-bold hover:bg-[var(--surface-secondary)] transition-all disabled:opacity-50"
              >
                {uploading ? "Uploading..." : "Replace"}
              </button>
              <button
                type="button"
                onClick={handleRemove}
                disabled={uploading}
                className="px-3 py-1.5 rounded-lg border border-red-200 text-red-600 text-xs font-bold hover:bg-red-50 transition-all disabled:opacity-50"
              >
                Remove
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => {
                const input = document.createElement("input");
                input.type = "file";
                input.accept = "image/jpeg,image/jpg,image/png,image/webp";
                input.onchange = handleFileSelect;
                input.click();
              }}
              disabled={uploading}
              className="px-4 py-2 rounded-lg border border-[var(--border-primary)] text-xs font-bold hover:bg-[var(--surface-secondary)] transition-all disabled:opacity-50"
            >
              {uploading ? "Uploading..." : "Upload Image"}
            </button>
          )}
        </div>
      </div>

      {/* Progress bar */}
      {uploading && progress > 0 && (
        <div className="mt-2 bg-[var(--surface-secondary)] rounded-full h-1.5 overflow-hidden">
          <div
            className="h-full bg-[var(--brand-green)] rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* Error */}
      {error && <p className="text-xs text-red-500 mt-1 font-medium">{error}</p>}
    </div>
  );
}

export default function BecomeSeller() {
  const router = useRouter();
  const { toasts, showToast, dismissToast } = useToast();

  // Step state
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [existingSeller, setExistingSeller] = useState(null);
  const [loadingExisting, setLoadingExisting] = useState(true);

  // Form data - image fields store { secure_url, public_id } objects
  const [form, setForm] = useState({
    full_name: "", phone: "", email: "", profile_photo_url: null,
    shopName: "", business_type: "", business_description: "", logo_url: null, banner_url: null,
    country: "India", state: "", city: "", pincode: "", address: "",
    aadhaar_number: "", pan_number: "", gst_number: "", id_upload_url: null,
    bank_details: { account_holder: "", account_number: "", ifsc: "", bank_name: "" },
    store_category: "", shipping_options: "", return_policy: "", store_policies: "",
  });

  const [errors, setErrors] = useState({});

  // Load saved draft and existing seller
  useEffect(() => {
    async function init() {
      try {
        const data = await api("/api/sellers/me");
        if (data.seller) {
          setExistingSeller(data.seller);
          const s = data.seller;
          setForm(prev => ({
            ...prev,
            full_name: s.full_name || prev.full_name,
            phone: s.phone || prev.phone,
            email: s.email || prev.email,
            profile_photo_url: s.profile_photo_url ? { secure_url: s.profile_photo_url, public_id: "" } : prev.profile_photo_url,
            shopName: s.shop_name || prev.shopName,
            business_type: s.business_type || prev.business_type,
            business_description: s.business_description || prev.business_description,
            country: s.country || prev.country,
            state: s.state || prev.state,
            city: s.city || prev.city,
            pincode: s.pincode || prev.pincode,
            address: s.address || prev.address,
            aadhaar_number: s.aadhaar_number || prev.aadhaar_number,
            pan_number: s.pan_number || prev.pan_number,
            gst_number: s.gst_number || prev.gst_number,
            id_upload_url: s.id_upload_url ? { secure_url: s.id_upload_url, public_id: "" } : prev.id_upload_url,
            bank_details: s.bank_details || prev.bank_details,
            store_category: s.category || prev.store_category,
            shipping_options: s.shipping_options || prev.shipping_options,
            return_policy: s.return_policy || prev.return_policy,
            store_policies: s.store_policies || prev.store_policies,
            logo_url: s.logo_url ? { secure_url: s.logo_url, public_id: "" } : prev.logo_url,
            banner_url: s.banner_url ? { secure_url: s.banner_url, public_id: "" } : prev.banner_url,
            description: s.description || prev.description,
          }));
        }

        try {
          const draft = localStorage.getItem("seller_draft");
          if (draft) {
            const parsed = JSON.parse(draft);
            setForm(prev => ({ ...prev, ...parsed }));
          }
        } catch (e) {}
      } catch (e) {
        console.error("Failed to load seller data:", e);
      } finally {
        setLoadingExisting(false);
      }
    }
    init();
  }, []);

  // Auto-save draft
  useEffect(() => {
    if (loadingExisting) return;
    const timer = setTimeout(() => {
      try {
        localStorage.setItem("seller_draft", JSON.stringify(form));
      } catch (e) {}
    }, 500);
    return () => clearTimeout(timer);
  }, [form, loadingExisting]);

  function updateField(field, value) {
    setForm(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: undefined }));
  }

  function updateBankField(field, value) {
    setForm(prev => ({
      ...prev,
      bank_details: { ...prev.bank_details, [field]: value }
    }));
  }

  // Image field helpers - handles { secure_url, public_id } objects
  function updateImageField(field, imageData) {
    setForm(prev => ({ ...prev, [field]: imageData }));
    setErrors(prev => ({ ...prev, [field]: undefined }));
  }

  function getImageUrl(field) {
    const val = form[field];
    if (!val) return null;
    if (typeof val === "string") return val;
    return val?.secure_url || null;
  }

  function getImagePublicId(field) {
    const val = form[field];
    if (!val || typeof val === "string") return null;
    return val?.public_id || null;
  }

  function validateStep(stepNum) {
    const errs = {};
    switch (stepNum) {
      case 1:
        if (!form.full_name?.trim()) errs.full_name = "Full name is required";
        if (!form.phone?.trim()) errs.phone = "Phone number is required";
        else if (!validatePhone(form.phone)) errs.phone = "Enter a valid 10-digit phone number";
        if (!form.email?.trim()) errs.email = "Email is required";
        else if (!validateEmail(form.email)) errs.email = "Enter a valid email address";
        break;
      case 2:
        if (!form.shopName?.trim()) errs.shopName = "Store name is required";
        else if (form.shopName.trim().length < 2) errs.shopName = "Store name must be at least 2 characters";
        break;
      case 3:
        if (!form.country?.trim()) errs.country = "Country is required";
        if (!form.state?.trim()) errs.state = "State is required";
        if (!form.city?.trim()) errs.city = "City is required";
        if (!form.pincode?.trim()) errs.pincode = "Pincode is required";
        else if (!validatePincode(form.pincode)) errs.pincode = "Enter a valid 6-digit pincode";
        if (!form.address?.trim()) errs.address = "Address is required";
        break;
      case 4:
        if (!form.aadhaar_number?.trim()) errs.aadhaar_number = "Aadhaar number is required";
        else if (!validateAadhaar(form.aadhaar_number)) errs.aadhaar_number = "Enter a valid 12-digit Aadhaar number";
        if (!form.pan_number?.trim()) errs.pan_number = "PAN number is required";
        else if (!validatePAN(form.pan_number)) errs.pan_number = "Enter a valid PAN (e.g., ABCDE1234F)";
        if (form.gst_number?.trim() && !validateGST(form.gst_number)) errs.gst_number = "Enter a valid GST number";
        if (!form.bank_details?.account_holder?.trim()) errs.account_holder = "Account holder name is required";
        if (!form.bank_details?.account_number?.trim()) errs.account_number = "Account number is required";
        if (!form.bank_details?.ifsc?.trim()) errs.ifsc = "IFSC code is required";
        else if (!validateIFSC(form.bank_details.ifsc)) errs.ifsc = "Enter a valid IFSC (e.g., HDFC0001234)";
        if (!form.bank_details?.bank_name?.trim()) errs.bank_name = "Bank name is required";
        break;
      case 5:
        if (!form.store_category) errs.store_category = "Store category is required";
        break;
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function nextStep() {
    if (!validateStep(step)) return;
    try { localStorage.setItem("seller_draft", JSON.stringify(form)); } catch (e) {}
    setStep(Math.min(step + 1, TOTAL_STEPS));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function prevStep() {
    setStep(Math.max(step - 1, 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function goToStep(n) {
    if (n < step) {
      setStep(n);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    if (n > step && validateStep(step)) {
      setStep(n);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    let allValid = true;
    for (let i = 1; i <= TOTAL_STEPS; i++) {
      if (!validateStep(i)) {
        allValid = false;
        setStep(i);
        window.scrollTo({ top: 0, behavior: "smooth" });
        break;
      }
    }
    if (!allValid) {
      showToast("Please complete all required fields", "warn");
      return;
    }

    setSubmitting(true);
    try {
      // Build payload - extract secure_url from image objects
      const payload = {
        ...form,
        profile_photo_url: getImageUrl("profile_photo_url"),
        logo_url: getImageUrl("logo_url"),
        banner_url: getImageUrl("banner_url"),
        id_upload_url: getImageUrl("id_upload_url"),
      };

      await api("/api/sellers", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      localStorage.removeItem("seller_draft");
      setSubmitted(true);
      showToast("Store created successfully! Welcome to DR MART.", "success");
    } catch (error) {
      showToast(error.message || "Failed to create store", "error");
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass = (field) => `
    w-full rounded-xl border
    ${errors[field] ? "border-red-400 ring-2 ring-red-200" : "border-[var(--border-primary)]"}
    bg-[var(--input-bg)] px-4 py-3 text-sm text-[var(--text-primary)]
    focus:outline-none focus:ring-2 focus:ring-[var(--brand-green)] focus:border-transparent
    transition-all duration-200 placeholder:text-[var(--text-muted)]
  `;

  const labelClass = "block text-sm font-bold text-[var(--text-secondary)] mb-1.5";
  const errorClass = "text-xs text-red-500 mt-1 font-medium";

  if (submitted) {
    return (
      <main className="min-h-screen bg-[var(--background)] flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="text-8xl mb-6 animate-bounce">🎉</div>
          <div className="text-6xl mb-4">🏪</div>
          <h1 className="text-3xl md:text-4xl font-black text-[var(--text-primary)] mb-3">
            Your Store is Live!
          </h1>
          <p className="text-[var(--text-muted)] mb-2">
            Welcome to DR MART, <span className="font-bold text-[var(--brand-green)]">{form.shopName}</span>!
          </p>
          <p className="text-sm text-[var(--text-muted)] mb-8">
            Start adding products and reaching thousands of customers.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/seller/dashboard"
              className="px-8 py-3.5 rounded-xl bg-[var(--brand-green)] text-white font-black text-sm hover:opacity-90 transition-all"
            >
              Go to Dashboard
            </Link>
            <Link
              href="/seller/products"
              className="px-8 py-3.5 rounded-xl border border-[var(--border-primary)] text-[var(--text-primary)] font-black text-sm hover:bg-[var(--surface-secondary)] transition-all"
            >
              Add Products
            </Link>
          </div>
          <div className="mt-6 glass-panel rounded-xl p-5 text-left">
            <p className="font-bold text-sm mb-3">📋 Quick Start Checklist</p>
            <ul className="space-y-2 text-sm text-[var(--text-secondary)]">
              <li className="flex items-center gap-2">☐ Add your first product</li>
              <li className="flex items-center gap-2">☐ Set up payment details</li>
              <li className="flex items-center gap-2">☐ Share your store link</li>
              <li className="flex items-center gap-2">☐ Complete your profile</li>
            </ul>
          </div>
        </div>
      </main>
    );
  }

  if (loadingExisting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-[var(--brand-green)] border-t-transparent mx-auto" />
          <p className="mt-4 text-sm font-bold text-[var(--text-muted)]">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--background)]">
      <header className="bg-gradient-to-r from-[var(--brand-green)] to-emerald-700 text-white px-4 py-5">
        <div className="max-w-4xl mx-auto">
          <Link href="/" className="text-xs font-bold opacity-80 hover:opacity-100 transition-opacity">
            ← Back to Storefront
          </Link>
          <h1 className="text-2xl md:text-3xl font-black mt-2">Become a Seller</h1>
          <p className="text-sm text-white/80 mt-1">Join thousands of sellers on DR MART</p>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {STEPS.map((s, i) => (
              <div key={s.num} className="flex items-center flex-1">
                <button
                  onClick={() => goToStep(s.num)}
                  className={`
                    flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all
                    ${step === s.num
                      ? "bg-[var(--brand-green)] text-white shadow-lg shadow-[var(--brand-green)]/30 scale-105"
                      : step > s.num
                        ? "bg-[var(--brand-green)]/10 text-[var(--brand-green)] cursor-pointer hover:bg-[var(--brand-green)]/20"
                        : "text-[var(--text-muted)] cursor-not-allowed opacity-50"
                    }
                  `}
                  disabled={s.num > step}
                >
                  <span className={`
                    flex items-center justify-center h-6 w-6 rounded-full text-xs font-bold
                    ${step === s.num ? "bg-white text-[var(--brand-green)]" :
                      step > s.num ? "bg-[var(--brand-green)] text-white" :
                      "bg-[var(--surface-secondary)] text-[var(--text-muted)]"}
                  `}>
                    {step > s.num ? "✓" : s.num}
                  </span>
                  <span className="hidden md:inline">{s.label}</span>
                </button>
                {i < STEPS.length - 1 && (
                  <div className={`
                    flex-1 h-0.5 mx-2 rounded-full transition-colors
                    ${step > s.num ? "bg-[var(--brand-green)]" : "bg-[var(--border-primary)]"}
                  `} />
                )}
              </div>
            ))}
          </div>
          <div className="text-center mt-3 md:hidden">
            <span className="text-sm font-bold text-[var(--text-secondary)]">
              Step {step} of {TOTAL_STEPS}: {STEPS[step - 1].label}
            </span>
          </div>
          <div className="mt-4 bg-[var(--surface-secondary)] rounded-full h-2 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[var(--brand-green)] to-emerald-500 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
            />
          </div>
        </div>

        {/* Form Card */}
        <div className="glass-panel rounded-2xl p-6 md:p-8 shadow-xl border border-[var(--border-primary)]">
          {existingSeller?.verification_status === "verified" ? (
            <div className="text-center py-6">
              <div className="text-5xl mb-4">✅</div>
              <h2 className="text-2xl font-black mb-2">You're Already a Seller!</h2>
              <p className="text-[var(--text-muted)] mb-6">
                Your store <span className="font-bold">{existingSeller.shop_name}</span> is already verified and live.
              </p>
              <Link href="/seller/dashboard" className="inline-block btn-primary px-6 py-3 rounded-lg font-black">
                Go to Dashboard
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {/* Step 1: Personal Information */}
              {step === 1 && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="flex items-center gap-3 mb-6">
                    <span className="text-3xl">{STEPS[0].icon}</span>
                    <div>
                      <h2 className="text-xl md:text-2xl font-black">Personal Information</h2>
                      <p className="text-sm text-[var(--text-muted)]">Tell us about yourself</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className={labelClass}>Full Name *</label>
                      <input
                        type="text"
                        placeholder="John Doe"
                        value={form.full_name}
                        onChange={e => updateField("full_name", e.target.value)}
                        className={inputClass("full_name")}
                      />
                      {errors.full_name && <p className={errorClass}>{errors.full_name}</p>}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className={labelClass}>Phone Number *</label>
                        <input
                          type="tel"
                          placeholder="9876543210"
                          value={form.phone}
                          onChange={e => updateField("phone", e.target.value)}
                          className={inputClass("phone")}
                          maxLength={10}
                        />
                        {errors.phone && <p className={errorClass}>{errors.phone}</p>}
                      </div>
                      <div>
                        <label className={labelClass}>Email *</label>
                        <input
                          type="email"
                          placeholder="john@example.com"
                          value={form.email}
                          onChange={e => updateField("email", e.target.value)}
                          className={inputClass("email")}
                        />
                        {errors.email && <p className={errorClass}>{errors.email}</p>}
                      </div>
                    </div>
                    <div>
                      <label className={labelClass}>Profile Photo</label>
                      <ImageUploader
                        value={form.profile_photo_url}
                        onChange={(val) => updateImageField("profile_photo_url", val)}
                        label="Profile Photo"
                        field="profile_photo"
                        existingPublicId={getImagePublicId("profile_photo_url")}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Business Information */}
              {step === 2 && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="flex items-center gap-3 mb-6">
                    <span className="text-3xl">{STEPS[1].icon}</span>
                    <div>
                      <h2 className="text-xl md:text-2xl font-black">Business Information</h2>
                      <p className="text-sm text-[var(--text-muted)]">Tell us about your business</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className={labelClass}>Store Name *</label>
                      <input
                        type="text"
                        placeholder="My Awesome Store"
                        value={form.shopName}
                        onChange={e => updateField("shopName", e.target.value)}
                        className={inputClass("shopName")}
                      />
                      {errors.shopName && <p className={errorClass}>{errors.shopName}</p>}
                      {form.shopName && (
                        <p className="text-xs text-[var(--text-muted)] mt-1">
                          Store URL: /store/{form.shopName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}
                        </p>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className={labelClass}>Business Type</label>
                        <select
                          value={form.business_type}
                          onChange={e => updateField("business_type", e.target.value)}
                          className={inputClass("business_type")}
                        >
                          <option value="">Select business type</option>
                          {BUSINESS_TYPES.map(t => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className={labelClass}>Business Description</label>
                      <textarea
                        placeholder="Tell customers what you sell and what makes your store special..."
                        value={form.business_description}
                        onChange={e => updateField("business_description", e.target.value)}
                        className={`${inputClass("business_description")} min-h-24`}
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className={labelClass}>Store Logo</label>
                        <ImageUploader
                          value={form.logo_url}
                          onChange={(val) => updateImageField("logo_url", val)}
                          label="Store Logo"
                          field="logo_url"
                          existingPublicId={getImagePublicId("logo_url")}
                        />
                      </div>
                      <div>
                        <label className={labelClass}>Store Banner</label>
                        <ImageUploader
                          value={form.banner_url}
                          onChange={(val) => updateImageField("banner_url", val)}
                          label="Store Banner"
                          field="banner_url"
                          existingPublicId={getImagePublicId("banner_url")}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Address */}
              {step === 3 && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="flex items-center gap-3 mb-6">
                    <span className="text-3xl">{STEPS[2].icon}</span>
                    <div>
                      <h2 className="text-xl md:text-2xl font-black">Address</h2>
                      <p className="text-sm text-[var(--text-muted)]">Where is your business located?</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className={labelClass}>Country *</label>
                      <input
                        type="text"
                        value={form.country}
                        onChange={e => updateField("country", e.target.value)}
                        className={inputClass("country")}
                      />
                      {errors.country && <p className={errorClass}>{errors.country}</p>}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className={labelClass}>State *</label>
                        <select
                          value={form.state}
                          onChange={e => updateField("state", e.target.value)}
                          className={inputClass("state")}
                        >
                          <option value="">Select state</option>
                          {INDIAN_STATES.map(s => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                        {errors.state && <p className={errorClass}>{errors.state}</p>}
                      </div>
                      <div>
                        <label className={labelClass}>City *</label>
                        <input
                          type="text"
                          placeholder="Mumbai"
                          value={form.city}
                          onChange={e => updateField("city", e.target.value)}
                          className={inputClass("city")}
                        />
                        {errors.city && <p className={errorClass}>{errors.city}</p>}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className={labelClass}>Pincode *</label>
                        <input
                          type="text"
                          placeholder="400001"
                          value={form.pincode}
                          onChange={e => updateField("pincode", e.target.value)}
                          className={inputClass("pincode")}
                          maxLength={6}
                        />
                        {errors.pincode && <p className={errorClass}>{errors.pincode}</p>}
                      </div>
                    </div>
                    <div>
                      <label className={labelClass}>Full Address *</label>
                      <textarea
                        placeholder="Street, building, area..."
                        value={form.address}
                        onChange={e => updateField("address", e.target.value)}
                        className={`${inputClass("address")} min-h-20`}
                      />
                      {errors.address && <p className={errorClass}>{errors.address}</p>}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4: Verification */}
              {step === 4 && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="flex items-center gap-3 mb-6">
                    <span className="text-3xl">{STEPS[3].icon}</span>
                    <div>
                      <h2 className="text-xl md:text-2xl font-black">Verification</h2>
                      <p className="text-sm text-[var(--text-muted)]">Verify your identity (secure & encrypted)</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="rounded-xl bg-yellow-500/10 border border-yellow-500/20 p-4 text-sm mb-4">
                      <p className="font-bold text-yellow-700 dark:text-yellow-400">🔒 Your data is secure</p>
                      <p className="text-[var(--text-muted)] text-xs mt-1">All documents are encrypted and only used for verification purposes.</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className={labelClass}>Aadhaar Number *</label>
                        <input
                          type="text"
                          placeholder="1234 5678 9012"
                          value={form.aadhaar_number}
                          onChange={e => updateField("aadhaar_number", e.target.value.replace(/\D/g, ""))}
                          className={inputClass("aadhaar_number")}
                          maxLength={12}
                        />
                        {errors.aadhaar_number && <p className={errorClass}>{errors.aadhaar_number}</p>}
                      </div>
                      <div>
                        <label className={labelClass}>PAN Number *</label>
                        <input
                          type="text"
                          placeholder="ABCDE1234F"
                          value={form.pan_number}
                          onChange={e => updateField("pan_number", e.target.value.toUpperCase())}
                          className={inputClass("pan_number")}
                          maxLength={10}
                        />
                        {errors.pan_number && <p className={errorClass}>{errors.pan_number}</p>}
                      </div>
                    </div>
                    <div>
                      <label className={labelClass}>GST Number (Optional)</label>
                      <input
                        type="text"
                        placeholder="22AAAAA0000A1Z5"
                        value={form.gst_number}
                        onChange={e => updateField("gst_number", e.target.value.toUpperCase())}
                        className={inputClass("gst_number")}
                        maxLength={15}
                      />
                      {errors.gst_number && <p className={errorClass}>{errors.gst_number}</p>}
                    </div>
                    <div>
                      <label className={labelClass}>ID Document Upload</label>
                      <ImageUploader
                        value={form.id_upload_url}
                        onChange={(val) => updateImageField("id_upload_url", val)}
                        label="ID Document"
                        field="id_upload_url"
                        existingPublicId={getImagePublicId("id_upload_url")}
                      />
                    </div>
                    <div className="border-t border-[var(--border-primary)] pt-4 mt-2">
                      <p className="font-bold text-sm mb-4">🏦 Bank Details</p>
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className={labelClass}>Account Holder Name *</label>
                            <input
                              type="text"
                              placeholder="John Doe"
                              value={form.bank_details.account_holder}
                              onChange={e => updateBankField("account_holder", e.target.value)}
                              className={inputClass("account_holder")}
                            />
                            {errors.account_holder && <p className={errorClass}>{errors.account_holder}</p>}
                          </div>
                          <div>
                            <label className={labelClass}>Account Number *</label>
                            <input
                              type="text"
                              placeholder="XXXXXXXXXXXX"
                              value={form.bank_details.account_number}
                              onChange={e => updateBankField("account_number", e.target.value)}
                              className={inputClass("account_number")}
                            />
                            {errors.account_number && <p className={errorClass}>{errors.account_number}</p>}
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className={labelClass}>IFSC Code *</label>
                            <input
                              type="text"
                              placeholder="HDFC0001234"
                              value={form.bank_details.ifsc}
                              onChange={e => updateBankField("ifsc", e.target.value.toUpperCase())}
                              className={inputClass("ifsc")}
                              maxLength={11}
                            />
                            {errors.ifsc && <p className={errorClass}>{errors.ifsc}</p>}
                          </div>
                          <div>
                            <label className={labelClass}>Bank Name *</label>
                            <input
                              type="text"
                              placeholder="HDFC Bank"
                              value={form.bank_details.bank_name}
                              onChange={e => updateBankField("bank_name", e.target.value)}
                              className={inputClass("bank_name")}
                            />
                            {errors.bank_name && <p className={errorClass}>{errors.bank_name}</p>}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 5: Store Setup */}
              {step === 5 && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="flex items-center gap-3 mb-6">
                    <span className="text-3xl">{STEPS[4].icon}</span>
                    <div>
                      <h2 className="text-xl md:text-2xl font-black">Store Setup</h2>
                      <p className="text-sm text-[var(--text-muted)]">Configure your store settings</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className={labelClass}>Store Category *</label>
                      <select
                        value={form.store_category}
                        onChange={e => updateField("store_category", e.target.value)}
                        className={inputClass("store_category")}
                      >
                        <option value="">Select a category</option>
                        {STORE_CATEGORIES.map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                      {errors.store_category && <p className={errorClass}>{errors.store_category}</p>}
                    </div>
                    <div>
                      <label className={labelClass}>Shipping Options</label>
                      <select
                        value={form.shipping_options}
                        onChange={e => updateField("shipping_options", e.target.value)}
                        className={inputClass("shipping_options")}
                      >
                        <option value="">Select shipping method</option>
                        {SHIPPING_OPTIONS.map(o => (
                          <option key={o.value} value={o.label}>{o.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className={labelClass}>Return Policy</label>
                      <textarea
                        placeholder="Describe your return policy..."
                        value={form.return_policy}
                        onChange={e => updateField("return_policy", e.target.value)}
                        className={`${inputClass("return_policy")} min-h-20`}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Store Policies</label>
                      <textarea
                        placeholder="Any additional store policies..."
                        value={form.store_policies}
                        onChange={e => updateField("store_policies", e.target.value)}
                        className={`${inputClass("store_policies")} min-h-20`}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex items-center justify-between mt-8 pt-6 border-t border-[var(--border-primary)]">
                <div>
                  {step > 1 ? (
                    <button
                      type="button"
                      onClick={prevStep}
                      className="px-6 py-3 rounded-xl border border-[var(--border-primary)] text-sm font-bold text-[var(--text-primary)] hover:bg-[var(--surface-secondary)] transition-all"
                    >
                      ← Back
                    </button>
                  ) : (
                    <Link href="/" className="px-6 py-3 rounded-xl border border-[var(--border-primary)] text-sm font-bold text-[var(--text-muted)] hover:bg-[var(--surface-secondary)] transition-all inline-block">
                      ← Cancel
                    </Link>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-[var(--text-muted)]">
                    Step {step}/{TOTAL_STEPS}
                  </span>
                  {step < TOTAL_STEPS ? (
                    <button
                      type="button"
                      onClick={nextStep}
                      className="px-8 py-3 rounded-xl bg-[var(--brand-green)] text-white font-black text-sm hover:opacity-90 transition-all shadow-lg shadow-[var(--brand-green)]/20"
                    >
                      Continue →
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-8 py-3 rounded-xl bg-[var(--brand-green)] text-white font-black text-sm hover:opacity-90 disabled:opacity-50 transition-all shadow-lg shadow-[var(--brand-green)]/30"
                    >
                      {submitting ? (
                        <span className="flex items-center gap-2">
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                          Creating Store...
                        </span>
                      ) : existingSeller ? (
                        "Update Store"
                      ) : (
                        "Launch Your Store 🚀"
                      )}
                    </button>
                  )}
                </div>
              </div>
            </form>
          )}
        </div>

        {/* Side info card */}
        <div className="mt-6 glass-panel rounded-xl p-5 border border-[var(--border-primary)]">
          <div className="flex items-start gap-3">
            <span className="text-2xl">💡</span>
            <div>
              <p className="font-bold text-sm">Why sell on DR MART?</p>
              <ul className="mt-2 space-y-1 text-xs text-[var(--text-muted)]">
                <li>✓ Reach thousands of active customers</li>
                <li>✓ Easy product management dashboard</li>
                <li>✓ Secure payments & regular payouts</li>
                <li>✓ 24/7 seller support</li>
                <li>✓ Marketing tools & analytics</li>
              </ul>
              <p className="mt-3 text-xs text-[var(--text-muted)]">
                {existingSeller ? "Your progress is auto-saved." : "Your draft is auto-saved locally."} No information is shared without your permission.
              </p>
            </div>
          </div>
        </div>
      </div>
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </main>
  );
}
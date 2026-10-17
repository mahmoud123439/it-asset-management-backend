import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  ArrowDownLeft,
  ArrowUpLeft,
  Bell,
  Box,
  BriefcaseBusiness,
  Building2,
  Check,
  ChevronDown,
  ChevronLeft,
  CircleHelp,
  Command,
  Laptop,
  LayoutDashboard,
  LogOut,
  Monitor,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Settings2,
  ShieldCheck,
  Users,

  X,
} from "lucide-react";

type Role = "ADMIN" | "IT_ENGINEER" | "IT_SUPPORT" | "MANAGER" | "EMPLOYEE";
type AssetStatus = "AVAILABLE" | "ASSIGNED" | "MAINTENANCE" | "RETIRED";
type Page = "dashboard" | "assets" | "assignments" | "users" | "groups" | "departments" | "profile" | "deviceRequests";
type Locale = "ar" | "en";

interface User {
  id: number;
  email: string;
  role: Role;
  employeeName?: string | null;
  jobTitle?: string | null;
  createdAt?: string;
  microsoft365LicenseAssigned: boolean;
  department?: { id?: number; name: string } | null;
  workGroups?: { group: { slug: WorkGroup["slug"]; name: string } }[];
  assignments?: ProfileAssignment[];
}

interface Asset {
  id: number;
  name: string;
  serialNumber: string;
  category: string;
  status: AssetStatus;
  createdAt: string;
  manufacturer?: string | null;
  model?: string | null;
  processor?: string | null;
  memoryGb?: number | null;
  storageGb?: number | null;
  storageType?: string | null;
  operatingSystem?: string | null;
  windowsEdition?: string | null;
  windowsLicenseAssigned: boolean;
  antivirusProduct?: string | null;
  softwareLicenses: string[];
}

interface Assignment {
  id: number;
  assignedAt: string;
  returnedAt: string | null;
  user: { id: number; email: string };
  asset: { id: number; name: string; serialNumber: string };
}

type ProfileAssignment = Omit<Assignment, "user"> & {
  issuedByName?: string | null;
  issuedBy?: { id: number; email: string; employeeName?: string | null } | null;
  asset: Asset;
};

interface HandoverAssignment extends Assignment {
  issuedByName: string;
  issuedBy?: { id: number; email: string; employeeName?: string | null } | null;
}

interface HandoverRecord {
  employee: User;
  asset: Asset;
  assignment: HandoverAssignment;
}

type DeviceRequestType = "REPLACE_DEVICE" | "UPGRADE_HARDWARE" | "OTHER";
type DeviceRequestStatus = "PENDING" | "APPROVED" | "REJECTED" | "COMPLETED";

interface DeviceChangeRequest {
  id: number;
  type: DeviceRequestType;
  message: string;
  status: DeviceRequestStatus;
  resolutionNote?: string | null;
  reviewedAt?: string | null;
  createdAt: string;
  user: Pick<User, "id" | "email" | "employeeName" | "jobTitle">;
  asset: Pick<Asset, "id" | "name" | "serialNumber" | "category" | "memoryGb" | "storageGb" | "storageType"> | null;
}

interface Department {
  id: number;
  name: string;
  _count?: { users: number };
}

interface WorkGroup {
  id: number;
  slug: "it" | "managers" | "employees";
  name: string;
  users: { user: User }[];
}

interface Stats {
  totalUsers: number;
  totalAssets: number;
  availableAssets: number;
  assignedAssets: number;
}

interface PageMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const API_URL = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

const copy = {
  ar: {
    brand: "مِداد",
    brandSub: "إدارة الأصول",
    workspace: "مساحة العمل",
    overview: "نظرة عامة",
    inventory: "إدارة المخزون",
    dashboard: "لوحة التحكم",
    assets: "الأصول",
    assignments: "العُهد والتسليم",
    deviceRequests: "طلبات الأجهزة",
    organization: "المؤسسة",
    users: "المستخدمون",
    groups: "المجموعات",
    groupSubtitle: "مجموعات العمل وأعضاؤها حسب الدور الوظيفي.",
    groupIt: "قسم IT",
    groupManagers: "المديرون",
    groupEmployees: "الموظفون",
    departments: "الأقسام",
    settings: "الإعدادات",
    help: "مركز المساعدة",
    signOut: "تسجيل الخروج",
    profile: "الملف الشخصي",
    profileSubtitle: "بيانات حسابك والأجهزة والعُهد المسجلة باسمك فقط.",
    personalInformation: "البيانات الشخصية",
    registeredGroups: "مجموعات العمل",
    memberSince: "تاريخ التسجيل",
    personalAssignments: "أجهزتي وسجل العُهد",
    noPersonalAssignments: "لا توجد أجهزة أو عُهد مسجلة على حسابك.",
    issuedBy: "سُلّم بواسطة",
    logoutFromAccount: "تسجيل الخروج من الحساب",
    assignmentDate: "تاريخ التسليم",
    returnDate: "تاريخ الإعادة",
    welcome: "مرحباً بعودتك",
    subtitle: "إليك ملخص حالة الأصول في مؤسستك اليوم.",
    today: "السبت، ١٧ أكتوبر ٢٠٢٦",
    search: "ابحث عن أصل، مستخدم...",
    totalAssets: "إجمالي الأصول",
    available: "متاح",
    assigned: "قيد الاستخدام",
    teamMembers: "أعضاء الفريق",
    tracked: "مسجّل في النظام",
    members: "حسابات مسجلة",
    assetsOverview: "حالة الأصول",
    inventoryStatus: "نظرة سريعة على المخزون",
    inUse: "قيد الاستخدام",
    maintenance: "صيانة",
    retired: "مستبعد",
    availableAssets: "أصول متاحة",
    recentActivity: "آخر العُهد",
    latestAssignments: "أحدث عمليات التسليم",
    viewAll: "عرض الكل",
    asset: "الأصل",
    assignedTo: "المستلم",
    date: "التاريخ",
    status: "الحالة",
    actions: "إجراء",
    noAssignments: "لا توجد عمليات تسليم حديثة.",
    quickActions: "إجراءات سريعة",
    addAsset: "إضافة أصل جديد",
    assignAsset: "تسليم أصل",
    manageTeam: "إدارة الفريق",
    supportCard: "هل تحتاج إلى مساعدة؟",
    supportText: "فريقنا جاهز لمساعدتك في إدارة أصولك.",
    contactSupport: "تواصل مع الدعم",
    allAssets: "كل الأصول",
    assetsSub: "تابع الأجهزة والمعدات المسجلة في مؤسستك.",
    addNewAsset: "إضافة أصل",
    filterSearch: "ابحث بالاسم أو الرقم التسلسلي",
    allStatuses: "كل الحالات",
    serial: "الرقم التسلسلي",
    category: "الفئة",
    manufacturer: "الشركة المصنّعة",
    model: "الموديل",
    processor: "المعالج",
    memory: "الذاكرة (GB)",
    storageCapacity: "سعة التخزين (GB)",
    storageType: "نوع وحدة التخزين",
    operatingSystem: "نظام التشغيل",
    hardwareDetails: "مواصفات الجهاز",
    microsoft365: "ترخيص Microsoft 365",
    windowsLicense: "ترخيص Windows",
    antivirus: "مضاد الفيروسات",
    softwareLicenses: "تراخيص البرامج على الجهاز",
    softwareOptionsHint: "اختر كل البرامج التي لها ترخيص على هذا الجهاز.",
    otherSoftwareLicenses: "برامج أخرى (افصل بينها بفاصلة)",
    noSoftwareLicenses: "لا توجد تراخيص برامج مسجلة.",
    licenseAssigned: "مُعيّن",
    licenseNotAssigned: "غير مُعيّن",
    toggleLicense: "تغيير حالة الترخيص",
    created: "تاريخ الإضافة",
    noAssets: "لا توجد أصول مطابقة للبحث.",
    loading: "جارٍ تحميل البيانات...",
    apiError: "تعذّر تحميل البيانات. تحقق من اتصال الـAPI ثم حاول مجدداً.",
    loginTitle: "أهلاً بك في مِداد",
    loginSubtitle: "سجّل دخولك لمتابعة أصول مؤسستك.",
    email: "البريد الإلكتروني",
    password: "كلمة المرور",
    login: "تسجيل الدخول",
    loggingIn: "جارٍ تسجيل الدخول...",
    loginError: "تعذّر تسجيل الدخول. تحقق من البريد وكلمة المرور.",
    invalidCredentials: "البريد الإلكتروني أو كلمة المرور غير صحيحة. تأكد من وجود حسابك.",
    loginUnavailable: "تعذّر الاتصال بالخادم. تأكد من تشغيل الـAPI على المنفذ 5000.",
    name: "اسم الأصل",
    employeeEmail: "بريد الموظف",
    employeePassword: "كلمة مرور الموظف",
    employeeName: "اسم الموظف",
    jobTitle: "المسمى الوظيفي",
    itResponsibleName: "اسم موظف IT المسؤول عن التسليم",
    employeeAccount: "حساب دخول الموظف",
    employeeOnly: "تظهر للموظف أجهزته المعينة فقط.",
    handoverTitle: "نموذج استلام وتسليم جهاز",
    handoverNumber: "رقم النموذج",
    handoverDate: "تاريخ التسليم",
    employeeDetails: "بيانات الموظف المستلم",
    deviceDetails: "بيانات وإمكانات الجهاز",
    installedLicenses: "التراخيص والبرامج",
    windowsLicenseStatus: "ترخيص Windows",
    antivirusProduct: "برنامج مضاد الفيروسات",
    receiverSignature: "توقيع الموظف المستلم",
    itResponsible: "موظف IT المسؤول عن التسليم",
    signature: "التوقيع",
    handoverAcknowledgment: "أقرّ باستلام الجهاز والملحقات الموضحة أعلاه بحالة سليمة، وأتحمل مسؤولية المحافظة عليها وفق سياسات المؤسسة.",
    printHandover: "طباعة ورقة الاستلام",
    close: "إغلاق",
    noLicensesListed: "لا توجد تراخيص برامج مسجلة.",
    save: "حفظ الأصل",
    cancel: "إلغاء",
    saving: "جارٍ الحفظ...",
    createAssetError: "تعذّر إنشاء الأصل.",
    updateAsset: "تعديل مواصفات الجهاز",
    updateAssetError: "تعذّر تعديل بيانات الجهاز.",
    deviceRequestSubtitle: "تابع طلبات تغيير الجهاز وترقية مكوناته.",
    newDeviceRequest: "طلب تغيير أو ترقية الجهاز",
    requestType: "نوع الطلب",
    requestReplace: "تغيير الجهاز",
    requestUpgrade: "زيادة RAM أو التخزين",
    requestOther: "طلب آخر",
    requestMessage: "اشرح احتياجك أو المواصفات المطلوبة",
    submitRequest: "إرسال الطلب إلى IT",
    requestSent: "تم إرسال طلبك إلى فريق IT.",
    requestError: "تعذّر إرسال الطلب.",
    yourRequests: "طلباتي",
    noDeviceRequests: "لا توجد طلبات أجهزة.",
    requestPending: "قيد المراجعة",
    requestApproved: "تمت الموافقة",
    requestRejected: "مرفوض",
    requestCompleted: "مكتمل",
    approveRequest: "موافقة",
    rejectRequest: "رفض",
    completeRequest: "إنهاء الطلب",
    resolutionNote: "ملاحظة IT أو سبب الرفض",
    reviewRequestError: "تعذّرت مراجعة الطلب.",
    currentDevice: "الجهاز الحالي",
    replacementDevice: "الجهاز البديل",
    oldDeviceStatus: "حالة الجهاز السابق",
    oldDeviceAvailable: "إعادته للمخزون",
    oldDeviceMaintenance: "إرساله للصيانة",
    oldDeviceRetired: "استبعاده",
    requestStatus: "حالة الطلب",
    required: "هذا الحقل مطلوب.",
    pagination: "صفحة",
    of: "من",
    previous: "السابق",
    next: "التالي",
    user: "المستخدم",
    role: "الصلاحية",
    department: "القسم",
    departmentCount: "عدد المستخدمين",
    active: "نشط",
    returned: "تمت الإعادة",
    roleAdmin: "مدير النظام",
    roleEngineer: "مهندس تقنية",
    roleSupport: "الدعم الفني",
    roleManager: "مدير",
    roleEmployee: "موظف",
    empty: "لا توجد بيانات للعرض.",
    notAllowed: "ليس لديك صلاحية لعرض هذا القسم.",
    currentUser: "حسابي",
    statusAvailable: "متاح",
    statusAssigned: "قيد الاستخدام",
    statusMaintenance: "صيانة",
    statusRetired: "مستبعد",
  },
  en: {
    brand: "Midad",
    brandSub: "Asset management",
    workspace: "WORKSPACE",
    overview: "OVERVIEW",
    inventory: "INVENTORY",
    dashboard: "Dashboard",
    assets: "Assets",
    assignments: "Assignments",
    deviceRequests: "Device requests",
    organization: "ORGANIZATION",
    users: "Users",
    groups: "Groups",
    groupSubtitle: "Work groups and members, organized by role.",
    groupIt: "IT",
    groupManagers: "Managers",
    groupEmployees: "Employees",
    departments: "Departments",
    settings: "Settings",
    help: "Help center",
    signOut: "Sign out",
    profile: "My profile",
    profileSubtitle: "Your account details and only the devices assigned to you.",
    personalInformation: "Personal information",
    registeredGroups: "Work groups",
    memberSince: "Member since",
    personalAssignments: "My devices and assignment history",
    noPersonalAssignments: "No devices or assignments are registered to your account.",
    issuedBy: "Issued by",
    logoutFromAccount: "Sign out of account",
    assignmentDate: "Assignment date",
    returnDate: "Return date",
    welcome: "Welcome back",
    subtitle: "Here is what's happening with your assets today.",
    today: "Saturday, October 17, 2026",
    search: "Search assets, people...",
    totalAssets: "Total assets",
    available: "Available",
    assigned: "In use",
    teamMembers: "Team members",
    tracked: "Tracked in the system",
    members: "Registered accounts",
    assetsOverview: "Asset overview",
    inventoryStatus: "A quick look at your inventory",
    inUse: "In use",
    maintenance: "Maintenance",
    retired: "Retired",
    availableAssets: "Available assets",
    recentActivity: "Recent activity",
    latestAssignments: "Latest assignments",
    viewAll: "View all",
    asset: "Asset",
    assignedTo: "Assigned to",
    date: "Date",
    status: "Status",
    actions: "Action",
    noAssignments: "No recent assignments.",
    quickActions: "Quick actions",
    addAsset: "Add a new asset",
    assignAsset: "Assign an asset",
    manageTeam: "Manage team",
    supportCard: "Need a hand?",
    supportText: "Our team is here to help manage your assets.",
    contactSupport: "Contact support",
    allAssets: "All assets",
    assetsSub: "Track devices and equipment registered in your organization.",
    addNewAsset: "Add asset",
    filterSearch: "Search by name or serial number",
    allStatuses: "All statuses",
    serial: "Serial number",
    category: "Category",
    manufacturer: "Manufacturer",
    model: "Model",
    processor: "Processor",
    memory: "Memory (GB)",
    storageCapacity: "Storage capacity (GB)",
    storageType: "Storage type",
    operatingSystem: "Operating system",
    hardwareDetails: "Device specifications",
    microsoft365: "Microsoft 365 license",
    windowsLicense: "Windows license",
    antivirus: "Antivirus",
    softwareLicenses: "Software licenses on this device",
    softwareOptionsHint: "Select all software licensed for this device.",
    otherSoftwareLicenses: "Other software (separate with commas)",
    noSoftwareLicenses: "No software licenses recorded.",
    licenseAssigned: "Assigned",
    licenseNotAssigned: "Not assigned",
    toggleLicense: "Toggle license assignment",
    created: "Date added",
    noAssets: "No assets match your search.",
    loading: "Loading data...",
    apiError: "Could not load data. Check your API connection and try again.",
    loginTitle: "Welcome to Midad",
    loginSubtitle: "Sign in to keep track of your organization's assets.",
    email: "Email address",
    password: "Password",
    login: "Sign in",
    loggingIn: "Signing in...",
    loginError: "Unable to sign in. Check your email and password.",
    invalidCredentials: "Email or password is incorrect. Make sure your account exists.",
    loginUnavailable: "Could not reach the server. Make sure the API is running on port 5000.",
    name: "Asset name",
    employeeEmail: "Employee email",
    employeePassword: "Employee password",
    employeeName: "Employee name",
    jobTitle: "Job title",
    itResponsibleName: "IT specialist responsible for handover",
    employeeAccount: "Employee sign-in account",
    employeeOnly: "Employees can only see devices assigned to them.",
    handoverTitle: "Device Handover & Receipt Form",
    handoverNumber: "Form number",
    handoverDate: "Handover date",
    employeeDetails: "Receiving employee",
    deviceDetails: "Device specifications",
    installedLicenses: "Licenses and software",
    windowsLicenseStatus: "Windows license",
    antivirusProduct: "Antivirus product",
    receiverSignature: "Receiving employee signature",
    itResponsible: "IT specialist responsible for handover",
    signature: "Signature",
    handoverAcknowledgment: "I acknowledge receipt of the device and accessories listed above in good condition and agree to safeguard them according to company policy.",
    printHandover: "Print handover form",
    close: "Close",
    noLicensesListed: "No software licenses recorded.",
    save: "Save asset",
    cancel: "Cancel",
    saving: "Saving...",
    createAssetError: "Could not create the asset.",
    updateAsset: "Edit device specifications",
    updateAssetError: "Could not update the device.",
    deviceRequestSubtitle: "Track device replacement and hardware upgrade requests.",
    newDeviceRequest: "Request a device change or upgrade",
    requestType: "Request type",
    requestReplace: "Replace device",
    requestUpgrade: "Upgrade RAM or storage",
    requestOther: "Other request",
    requestMessage: "Describe your need or requested specifications",
    submitRequest: "Send request to IT",
    requestSent: "Your request was sent to IT.",
    requestError: "Could not submit the request.",
    yourRequests: "My requests",
    noDeviceRequests: "There are no device requests.",
    requestPending: "Pending review",
    requestApproved: "Approved",
    requestRejected: "Rejected",
    requestCompleted: "Completed",
    approveRequest: "Approve",
    rejectRequest: "Reject",
    completeRequest: "Complete request",
    resolutionNote: "IT note or rejection reason",
    reviewRequestError: "Could not review the request.",
    currentDevice: "Current device",
    replacementDevice: "Replacement device",
    oldDeviceStatus: "Previous device status",
    oldDeviceAvailable: "Return to inventory",
    oldDeviceMaintenance: "Send to maintenance",
    oldDeviceRetired: "Retire device",
    requestStatus: "Request status",
    required: "This field is required.",
    pagination: "Page",
    of: "of",
    previous: "Previous",
    next: "Next",
    user: "User",
    role: "Role",
    department: "Department",
    departmentCount: "Members",
    active: "Active",
    returned: "Returned",
    roleAdmin: "Administrator",
    roleEngineer: "IT Engineer",
    roleSupport: "IT Support",
    roleManager: "Manager",
    roleEmployee: "Employee",
    empty: "No data to display.",
    notAllowed: "You do not have permission to view this section.",
    currentUser: "My account",
    statusAvailable: "Available",
    statusAssigned: "In use",
    statusMaintenance: "Maintenance",
    statusRetired: "Retired",
  },
} as const;

async function api<T>(path: string, token: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      Authorization: `Bearer ${token}`,
      ...init.headers,
    },
  });
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(
      body?.message
        ? `${body.message} (${response.status})`
        : `Request failed (${response.status})`,
    );
  }
  return body as T;
}

function roleName(role: Role, t: (typeof copy)[Locale]) {
  const names: Record<Role, string> = {
    ADMIN: t.roleAdmin,
    IT_ENGINEER: t.roleEngineer,
    IT_SUPPORT: t.roleSupport,
    MANAGER: t.roleManager,
    EMPLOYEE: t.roleEmployee,
  };
  return names[role];
}

function statusName(status: AssetStatus, t: (typeof copy)[Locale]) {
  const names: Record<AssetStatus, string> = {
    AVAILABLE: t.statusAvailable,
    ASSIGNED: t.statusAssigned,
    MAINTENANCE: t.statusMaintenance,
    RETIRED: t.statusRetired,
  };
  return names[status];
}

function formatDate(value: string, locale: Locale) {
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function Login({
  locale,
  onLogin,
  onChangeLocale,
}: {
  locale: Locale;
  onLogin: (email: string, password: string) => Promise<void>;
  onChangeLocale: (locale: Locale) => void;
}) {
  const t = copy[locale];
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await onLogin(email, password);
    } catch (error) {
      const reason = error instanceof Error ? error.message : "";
      setError(
        reason === "INVALID_CREDENTIALS"
          ? t.invalidCredentials
          : reason === "LOGIN_SERVER_ERROR"
            ? t.loginError
            : t.loginUnavailable,
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="login-screen" dir={locale === "ar" ? "rtl" : "ltr"}>
      <div className="login-art">
        <div className="login-art-grid" />
        <div className="login-art-copy">
          <div className="brand-mark large"><Command size={27} /></div>
          <span className="eyebrow">MIDAD ASSET PLATFORM</span>
          <h2>{locale === "ar" ? "كل أصولك، في مكان واحد." : "Every asset. One place."}</h2>
          <p>
            {locale === "ar"
              ? "مساحة عمل ذكية تمنح فريقك رؤية أوضح وتحكماً أسهل."
              : "A clearer view of your inventory, built for the way your team works."}
          </p>
          <div className="login-orbit"><Laptop size={32} /><span /><span /></div>
        </div>
        <span className="login-copyright">© 2026 Midad</span>
      </div>
      <section className="login-panel">
        <button className="locale-button login-locale" onClick={() => onChangeLocale(locale === "ar" ? "en" : "ar")}>
          {locale === "ar" ? "EN  English" : "عربي  AR"}
        </button>
        <div className="login-form-wrap">
          <div className="brand-mark mobile-brand"><Command size={23} /></div>
          <span className="eyebrow">{locale === "ar" ? "مساحة العمل الخاصة بك" : "YOUR WORKSPACE"}</span>
          <h1>{t.loginTitle}</h1>
          <p className="muted">{t.loginSubtitle}</p>
          <form onSubmit={submit}>
            <label htmlFor="email">{t.email}</label>
            <input
              id="email"
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="name@company.com"
            />
            <label htmlFor="password">{t.password}</label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
            {error && <p className="form-error" role="alert">{error}</p>}
            <button className="primary-button login-submit" disabled={busy}>
              {busy ? t.loggingIn : t.login}
              <ChevronLeft className="button-arrow" size={18} />
            </button>
          </form>
          <p className="login-help"><ShieldCheck size={15} /> {locale === "ar" ? "اتصال آمن ومشفّر" : "Secure, encrypted connection"}</p>
        </div>
      </section>
    </main>
  );
}

function App() {
  const [locale, setLocale] = useState<Locale>(() =>
    localStorage.getItem("midad-locale") === "en" ? "en" : "ar",
  );
  const t = copy[locale];
  const [token, setToken] = useState(() => localStorage.getItem("midad-token") || "");
  const [user, setUser] = useState<User | null>(null);
  const [page, setPage] = useState<Page>("dashboard");
  const [stats, setStats] = useState<Stats | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [availableReplacementAssets, setAvailableReplacementAssets] = useState<Asset[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [deviceRequests, setDeviceRequests] = useState<DeviceChangeRequest[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [groups, setGroups] = useState<WorkGroup[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [meta, setMeta] = useState<PageMeta | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [assetPage, setAssetPage] = useState(1);
  const [assetModal, setAssetModal] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [handoverRecord, setHandoverRecord] = useState<HandoverRecord | null>(null);
  const [assetSaving, setAssetSaving] = useState(false);
  const [assetError, setAssetError] = useState("");
  const [licenseSavingUser, setLicenseSavingUser] = useState<number | null>(null);
  const [licenseSavingAsset, setLicenseSavingAsset] = useState<number | null>(null);

  function changeLocale(nextLocale: Locale) {
    setLocale(nextLocale);
    localStorage.setItem("midad-locale", nextLocale);
  }

  const canManageAssets =
    user?.role === "ADMIN" ||
    user?.role === "IT_ENGINEER" ||
    user?.role === "IT_SUPPORT";
  const canSeeUsers = canManageAssets;
  const rtl = locale === "ar";

  const loadPage = useCallback(async () => {
    if (!token || !user) return;
    setLoading(true);
    setLoadError("");
    try {
      if (page === "dashboard") {
        const [nextStats, recent] = await Promise.all([
          api<Stats>("/api/dashboard/stats", token),
          api<{ data: Assignment[]; meta: PageMeta }>("/api/assignments?limit=5", token),
        ]);
        setStats(nextStats);
        setAssignments(recent.data);
        const inventory = await api<{ data: Asset[]; meta: PageMeta }>("/api/assets?limit=100", token);
        setAssets(inventory.data);
      } else if (page === "assets") {
        const params = new URLSearchParams({ page: String(assetPage), limit: "10" });
        if (query.trim()) params.set("search", query.trim());
        if (statusFilter) params.set("status", statusFilter);
        const result = await api<{ data: Asset[]; meta: PageMeta }>(
          `/api/assets?${params.toString()}`,
          token,
        );
        setAssets(result.data);
        setMeta(result.meta);
      } else if (page === "assignments") {
        const result = await api<{ data: Assignment[]; meta: PageMeta }>(
          "/api/assignments?limit=20",
          token,
        );
        setAssignments(result.data);
        setMeta(result.meta);
      } else if (page === "users") {
        const result = await api<{ data: User[]; meta: PageMeta }>(
          "/api/users?limit=20",
          token,
        );
        setUsers(result.data);
        setMeta(result.meta);
      } else if (page === "groups") {
        setGroups(await api<WorkGroup[]>("/api/users/groups", token));
      } else if (page === "departments") {
        setDepartments(await api<Department[]>("/api/departments", token));
      } else if (page === "profile") {
        setDeviceRequests(
          await api<DeviceChangeRequest[]>("/api/device-requests?scope=mine", token),
        );
      } else if (page === "deviceRequests") {
        const [requests, inventory] = await Promise.all([
          api<DeviceChangeRequest[]>("/api/device-requests", token),
          api<{ data: Asset[] }>("/api/assets?status=AVAILABLE&limit=100", token),
        ]);
        setDeviceRequests(requests);
        setAvailableReplacementAssets(inventory.data);
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes("401")) {
        logout();
      } else {
        setLoadError(error instanceof Error ? error.message : t.apiError);
      }
    } finally {
      setLoading(false);
    }
  }, [assetPage, page, query, statusFilter, token, user, t.apiError]);

  useEffect(() => {
    if (!token) return;
    let active = true;
    api<User>("/api/auth/me", token)
      .then((currentUser) => {
        if (active) setUser(currentUser);
      })
      .catch(() => {
        if (active) logout();
      });
    return () => {
      active = false;
    };
  }, [token]);

  useEffect(() => {
    if (!token || page !== "profile") return;
    api<User>("/api/auth/me", token)
      .then(setUser)
      .catch((error: unknown) => {
        setLoadError(error instanceof Error ? error.message : t.apiError);
      });
  }, [page, token, t.apiError]);

  useEffect(() => {
    void loadPage();
  }, [loadPage]);

  async function login(email: string, password: string) {
    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(
        response.status === 400 ? "INVALID_CREDENTIALS" : "LOGIN_SERVER_ERROR",
      );
    }
    localStorage.setItem("midad-token", result.token);
    setToken(result.token);
    setUser(await api<User>("/api/auth/me", result.token));
  }

  function logout() {
    localStorage.removeItem("midad-token");
    setToken("");
    setUser(null);
    setPage("dashboard");
  }

  async function createAsset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) return;
    const formData = new FormData(event.currentTarget);
    setAssetSaving(true);
    setAssetError("");
    try {
      const softwareLicenses = [
        ...new Set([
          ...formData.getAll("softwareLicenses").map(String),
          ...String(formData.get("otherSoftwareLicenses") || "")
            .split(",")
            .map((license) => license.trim())
            .filter(Boolean),
        ]),
      ];
      const asset = {
        name: formData.get("name"),
        serialNumber: formData.get("serialNumber"),
        category: formData.get("category"),
        status: formData.get("status") || "AVAILABLE",
        manufacturer: formData.get("manufacturer") || (selectedAsset ? null : undefined),
        model: formData.get("model") || (selectedAsset ? null : undefined),
        processor: formData.get("processor") || (selectedAsset ? null : undefined),
        memoryGb: formData.get("memoryGb")
          ? Number(formData.get("memoryGb"))
          : selectedAsset ? null : undefined,
        storageGb: formData.get("storageGb")
          ? Number(formData.get("storageGb"))
          : selectedAsset ? null : undefined,
        storageType: formData.get("storageType") || (selectedAsset ? null : undefined),
        operatingSystem: formData.get("operatingSystem") || (selectedAsset ? null : undefined),
        windowsEdition: formData.get("windowsEdition") || (selectedAsset ? null : undefined),
        windowsLicenseAssigned:
          formData.get("windowsLicenseAssigned") === "on",
        antivirusProduct: formData.get("antivirusProduct") || (selectedAsset ? null : undefined),
        softwareLicenses,
      };

      if (selectedAsset) {
        await api<Asset>(`/api/assets/${selectedAsset.id}`, token, {
          method: "PUT",
          body: JSON.stringify(asset),
        });
        setAssetModal(false);
        setSelectedAsset(null);
        await loadPage();
        return;
      }
      const result = await api<HandoverRecord>("/api/onboarding/device", token, {
        method: "POST",
        body: JSON.stringify({
          email: formData.get("employeeEmail"),
          password: formData.get("employeePassword"),
          employeeName: formData.get("employeeName"),
          jobTitle: formData.get("jobTitle"),
          issuedByName: formData.get("itResponsibleName"),
          asset,
        }),
      });
      setHandoverRecord(result);
      setAssetModal(false);
      setSelectedAsset(null);
      await loadPage();
    } catch (error) {
      setAssetError(
        error instanceof Error
          ? error.message
          : selectedAsset
            ? t.updateAssetError
            : t.createAssetError,
      );
    } finally {
      setAssetSaving(false);
    }
  }

  async function submitDeviceRequest(payload: {
    assetId: number;
    type: DeviceRequestType;
    message: string;
  }) {
    if (!token) return;
    const createdRequest = await api<DeviceChangeRequest>("/api/device-requests", token, {
      method: "POST",
      body: JSON.stringify(payload),
    });
    setDeviceRequests((current) => [createdRequest, ...current]);
  }

  async function reviewDeviceRequest(
    id: number,
    status: Exclude<DeviceRequestStatus, "PENDING">,
    resolutionNote?: string,
  ) {
    if (!token) return;
    const updatedRequest = await api<DeviceChangeRequest>(`/api/device-requests/${id}`, token, {
      method: "PATCH",
      body: JSON.stringify({ status, resolutionNote }),
    });
    setDeviceRequests((current) =>
      current.map((item) => item.id === id ? updatedRequest : item),
    );
  }

  async function replaceRequestedDevice(
    requestId: number,
    replacementAssetId: number,
    originalAssetStatus: Exclude<AssetStatus, "ASSIGNED">,
    issuedByName?: string,
    resolutionNote?: string,
  ) {
    if (!token) return;
    const updatedRequest = await api<DeviceChangeRequest>(
      "/api/assignments/replace-requested",
      token,
      {
        method: "POST",
        body: JSON.stringify({
          requestId,
          replacementAssetId,
          originalAssetStatus,
          issuedByName,
          resolutionNote,
        }),
      },
    );
    setDeviceRequests((current) =>
      current.map((item) => item.id === requestId ? updatedRequest : item),
    );
    setAvailableReplacementAssets((current) =>
      current.filter((asset) => asset.id !== replacementAssetId),
    );
  }

  async function toggleMicrosoft365License(target: User) {
    if (!token) return;
    setLicenseSavingUser(target.id);
    setLoadError("");
    try {
      const updated = await api<Pick<User, "id" | "microsoft365LicenseAssigned">>(
        `/api/users/${target.id}/licenses/microsoft-365`,
        token,
        {
          method: "PATCH",
          body: JSON.stringify({ assigned: !target.microsoft365LicenseAssigned }),
        },
      );
      setUsers((current) =>
        current.map((item) =>
          item.id === updated.id
            ? { ...item, microsoft365LicenseAssigned: updated.microsoft365LicenseAssigned }
            : item,
        ),
      );
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : t.apiError);
    } finally {
      setLicenseSavingUser(null);
    }
  }

  async function toggleWindowsLicense(target: Asset) {
    if (!token) return;
    setLicenseSavingAsset(target.id);
    setLoadError("");
    try {
      const updated = await api<Pick<Asset, "id" | "windowsLicenseAssigned">>(
        `/api/assets/${target.id}/licenses/windows`,
        token,
        {
          method: "PATCH",
          body: JSON.stringify({ assigned: !target.windowsLicenseAssigned }),
        },
      );
      setAssets((current) =>
        current.map((item) =>
          item.id === updated.id
            ? { ...item, windowsLicenseAssigned: updated.windowsLicenseAssigned }
            : item,
        ),
      );
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : t.apiError);
    } finally {
      setLicenseSavingAsset(null);
    }
  }

  const categorySummary = useMemo(() => {
    const counts = assets.reduce<Record<string, number>>((all, asset) => {
      all[asset.category] = (all[asset.category] || 0) + 1;
      return all;
    }, {});
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 4);
  }, [assets]);

  if (!token || !user) {
    return <Login locale={locale} onLogin={login} onChangeLocale={changeLocale} />;
  }

  const navGroups = [
    {
      label: t.overview,
      items: [{ key: "dashboard" as const, label: t.dashboard, icon: LayoutDashboard }],
    },
    {
      label: t.inventory,
      items: [
        { key: "assets" as const, label: t.assets, icon: Box },
        { key: "assignments" as const, label: t.assignments, icon: BriefcaseBusiness },
        ...(canManageAssets
          ? [{ key: "deviceRequests" as const, label: t.deviceRequests, icon: Monitor }]
          : []),
      ],
    },
    {
      label: t.organization,
      items: [
        ...(canSeeUsers
          ? [
              { key: "users" as const, label: t.users, icon: Users },
              { key: "groups" as const, label: t.groups, icon: Users },
              { key: "departments" as const, label: t.departments, icon: Building2 },
            ]
          : []),
      ],
    },
  ];

  return (
    <div className={`app-shell ${rtl ? "is-rtl" : "is-ltr"}`} dir={rtl ? "rtl" : "ltr"}>
      <aside className="sidebar">
        <a href="#" className="brand" onClick={(event) => { event.preventDefault(); setPage("dashboard"); }}>
          <span className="brand-mark"><Command size={21} /></span>
          <span className="brand-name">{t.brand}<small>{t.brandSub}</small></span>
          <span className="brand-chevron"><ChevronDown size={15} /></span>
        </a>
        <div className="side-divider" />
        <nav className="side-nav">
          {navGroups.map((group) => (
            <section className="nav-group" key={group.label}>
              <p className="nav-caption">{group.label}</p>
              {group.items.map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  className={`nav-link ${page === key ? "active" : ""}`}
                  aria-label={label}
                  title={label}
                  onClick={() => setPage(key)}
                >
                  <Icon size={18} strokeWidth={1.8} />
                  <span>{label}</span>
                  {key === "assets" && <span className="nav-count">{stats?.totalAssets ?? "—"}</span>}
                </button>
              ))}
            </section>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="support-card">
            <span className="support-icon"><CircleHelp size={17} /></span>
            <strong>{t.supportCard}</strong>
            <span>{t.supportText}</span>
            <button onClick={() => window.open("mailto:support@example.com")}>{t.contactSupport}<ChevronLeft size={14} /></button>
          </div>
          <div className="user-profile">
            <span className="avatar">{user.email.slice(0, 1).toUpperCase()}</span>
            <span className="user-info"><strong>{user.email.split("@")[0]}</strong><small>{roleName(user.role, t)}</small></span>
            <button className="profile-menu" aria-label={t.signOut} onClick={logout}><LogOut size={17} /></button>
          </div>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div className="breadcrumbs">
            <span>{t.brand}</span><ChevronLeft size={14} /><strong>{pageTitle(page, t)}</strong>
          </div>
          <div className="topbar-actions">
            <label className="global-search">
              <Search size={17} />
              <input placeholder={t.search} value={page === "assets" ? query : ""} onChange={(event) => { if (page === "assets") { setQuery(event.target.value); setAssetPage(1); } }} />
              <kbd>⌘ K</kbd>
            </label>
            <button className="locale-button" onClick={() => changeLocale(locale === "ar" ? "en" : "ar")}>
              {locale === "ar" ? "EN" : "عربي"}
            </button>
            <button className="icon-button mobile-logout" aria-label={t.signOut} title={t.signOut} onClick={logout}>
              <LogOut size={17} />
            </button>
            <button className="icon-button notification-button" aria-label="Notifications">
              <Bell size={18} /><i />
            </button>
            <button
              className="top-avatar profile-trigger"
              aria-label={t.profile}
              title={t.profile}
              onClick={() => setPage("profile")}
            >
              {user.email.slice(0, 1).toUpperCase()}
            </button>
          </div>
        </header>

        <div className="page-content">
          {loadError && (
            <div className="alert-error" role="alert">
              <span>{loadError}</span>
              <button onClick={() => void loadPage()}>{locale === "ar" ? "إعادة المحاولة" : "Retry"}</button>
            </div>
          )}
          {handoverRecord && (
            <HandoverReceipt
              record={handoverRecord}
              t={t}
              locale={locale}
              onClose={() => setHandoverRecord(null)}
            />
          )}
          {loading && !stats && page === "dashboard" ? (
            <div className="loading-state"><span className="spinner" />{t.loading}</div>
          ) : (
            <>
              {page === "dashboard" && (
                <Dashboard
                  t={t}
                  locale={locale}
                  stats={stats}
                  assets={assets}
                  assignments={assignments}
                  categories={categorySummary}
                  canManage={canManageAssets}
                  canSeeUsers={canSeeUsers}
                  onNavigate={setPage}
                  onAddAsset={() => setAssetModal(true)}
                />
              )}
              {page === "assets" && (
                <AssetsPage
                  t={t}
                  locale={locale}
                  assets={assets}
                  meta={meta}
                  statusFilter={statusFilter}
                  setStatusFilter={setStatusFilter}
                  page={assetPage}
                  setPage={setAssetPage}
                  loading={loading}
                  canManage={canManageAssets}
                  onAdd={() => { setSelectedAsset(null); setAssetError(""); setAssetModal(true); }}
                  onEdit={(asset) => { setSelectedAsset(asset); setAssetError(""); setAssetModal(true); }}
                  onToggleWindowsLicense={toggleWindowsLicense}
                  licenseSavingAsset={licenseSavingAsset}
                />
              )}
              {page === "assignments" && (
                <AssignmentsPage t={t} locale={locale} assignments={assignments} loading={loading} />
              )}
              {page === "users" && (
                <UsersPage
                  t={t}
                  users={users}
                  loading={loading}
                  canManage={canManageAssets}
                  onToggleLicense={toggleMicrosoft365License}
                  licenseSavingUser={licenseSavingUser}
                />
              )}
              {page === "groups" && (
                <GroupsPage t={t} groups={groups} loading={loading} />
              )}
              {page === "departments" && (
                <DepartmentsPage t={t} departments={departments} loading={loading} />
              )}
              {page === "profile" && (
                <ProfilePage
                  user={user}
                  t={t}
                  locale={locale}
                  onLogout={logout}
                  requests={deviceRequests}
                  onCreateRequest={submitDeviceRequest}
                />
              )}
              {page === "deviceRequests" && canManageAssets && (
                <DeviceRequestsPage
                  t={t}
                  locale={locale}
                  requests={deviceRequests}
                  onReview={reviewDeviceRequest}
                  availableAssets={availableReplacementAssets}
                  issuedByName={user.employeeName || undefined}
                  onReplace={replaceRequestedDevice}
                />
              )}
            </>
          )}
        </div>
        <footer className="app-footer">
          <span>© 2026 {t.brand} · {locale === "ar" ? "إدارة أصول أبسط" : "Simpler asset management"}</span>
          <span><span className="online-dot" />{locale === "ar" ? "جميع الأنظمة تعمل" : "All systems operational"}</span>
        </footer>
      </main>

      {assetModal && (
        <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && setAssetModal(false)}>
          <form className="asset-modal" onSubmit={createAsset}>
            <div className="modal-heading">
              <div><span className="modal-icon"><Box size={19} /></span><div><h2>{selectedAsset ? t.updateAsset : t.addNewAsset}</h2><p>{selectedAsset ? t.hardwareDetails : t.employeeOnly}</p></div></div>
              <button type="button" className="icon-button" aria-label={t.cancel} onClick={() => { setAssetModal(false); setSelectedAsset(null); }}><X size={19} /></button>
            </div>
            {!selectedAsset && (
              <>
                <div className="form-section-label">{t.employeeAccount}</div>
                <label>{t.employeeName}<input name="employeeName" required minLength={2} maxLength={120} /></label>
                <label>{t.jobTitle}<input name="jobTitle" required minLength={2} maxLength={120} /></label>
                <label>{t.itResponsibleName}<input name="itResponsibleName" defaultValue={user.employeeName || ""} required minLength={2} maxLength={120} /></label>
                <label>{t.employeeEmail}<input name="employeeEmail" type="email" autoComplete="off" required /></label>
                <label>{t.employeePassword}<input name="employeePassword" type="password" autoComplete="new-password" minLength={6} required /></label>
              </>
            )}
            <div className="form-section-label">{t.hardwareDetails}</div>
            <label>{t.name}<input name="name" required autoFocus defaultValue={selectedAsset?.name} /></label>
            <label>{t.serial}<input name="serialNumber" required defaultValue={selectedAsset?.serialNumber} /></label>
            <label>{t.category}<input name="category" required placeholder={locale === "ar" ? "مثال: لابتوب" : "e.g. Laptop"} defaultValue={selectedAsset?.category} /></label>
            <div className="form-section-label">{t.hardwareDetails}</div>
            <div className="form-two-column">
              <label>{t.manufacturer}<input name="manufacturer" defaultValue={selectedAsset?.manufacturer || ""} /></label>
              <label>{t.model}<input name="model" defaultValue={selectedAsset?.model || ""} /></label>
            </div>
            <label>{t.processor}<input name="processor" defaultValue={selectedAsset?.processor || ""} /></label>
            <div className="form-two-column">
              <label>{t.memory}<input name="memoryGb" type="number" min="0.1" step="0.01" defaultValue={selectedAsset?.memoryGb ?? ""} /></label>
              <label>{t.operatingSystem}<input name="operatingSystem" defaultValue={selectedAsset?.operatingSystem || ""} /></label>
            </div>
            <div className="form-two-column">
              <label>{t.storageCapacity}<input name="storageGb" type="number" min="1" step="1" defaultValue={selectedAsset?.storageGb ?? ""} /></label>
              <label>{t.storageType}<input name="storageType" placeholder="SSD / HDD / NVMe" defaultValue={selectedAsset?.storageType || ""} /></label>
            </div>
            <div className="form-two-column">
              <label>{t.windowsLicense}<input name="windowsEdition" defaultValue={selectedAsset?.windowsEdition || (selectedAsset ? "" : "Windows 11 Pro")} /></label>
              <label>{t.antivirus}<input name="antivirusProduct" defaultValue={selectedAsset?.antivirusProduct || (selectedAsset ? "" : "Kaspersky")} /></label>
            </div>
            {selectedAsset && (
              <label>{t.status}
                <select name="status" defaultValue={selectedAsset.status}>
                  <option value="AVAILABLE">{t.statusAvailable}</option>
                  <option value="ASSIGNED">{t.statusAssigned}</option>
                  <option value="MAINTENANCE">{t.statusMaintenance}</option>
                  <option value="RETIRED">{t.statusRetired}</option>
                </select>
              </label>
            )}
            <label className="checkbox-field">
              <input name="windowsLicenseAssigned" type="checkbox" defaultChecked={selectedAsset?.windowsLicenseAssigned ?? !selectedAsset} />
              {t.windowsLicense} — {t.licenseAssigned}
            </label>
            <div className="form-section-label">{t.softwareLicenses}</div>
            <p className="software-options-hint">{t.softwareOptionsHint}</p>
            <div className="software-license-options">
              {["Microsoft 365", "Kaspersky", "Adobe"].map((license) => (
                <label key={license}>
                  <input name="softwareLicenses" type="checkbox" value={license} defaultChecked={selectedAsset?.softwareLicenses.includes(license) ?? false} />
                  <span>{license}</span>
                </label>
              ))}
            </div>
            <label>
              {t.otherSoftwareLicenses}
              <input
                name="otherSoftwareLicenses"
                defaultValue={selectedAsset?.softwareLicenses.filter((license) => !["Microsoft 365", "Kaspersky", "Adobe"].includes(license)).join(", ") || ""}
                placeholder={locale === "ar" ? "مثال: AutoCAD, Zoom" : "e.g. AutoCAD, Zoom"}
              />
            </label>
            {assetError && <p className="form-error" role="alert">{assetError}</p>}
            <div className="modal-actions">
              <button type="button" className="secondary-button" onClick={() => { setAssetModal(false); setSelectedAsset(null); }}>{t.cancel}</button>
              <button className="primary-button" disabled={assetSaving}>{assetSaving ? t.saving : t.save}<Check size={16} /></button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

function HandoverReceipt({
  record,
  t,
  locale,
  onClose,
}: {
  record: HandoverRecord;
  t: (typeof copy)[Locale];
  locale: Locale;
  onClose: () => void;
}) {
  const { employee, asset, assignment } = record;
  const specifications = [
    { label: t.category, value: asset.category },
    { label: t.manufacturer, value: asset.manufacturer },
    { label: t.model, value: asset.model },
    { label: t.processor, value: asset.processor },
    { label: t.memory, value: asset.memoryGb ? `${asset.memoryGb} GB` : null },
    { label: t.storageCapacity, value: asset.storageGb ? `${asset.storageGb} GB` : null },
    { label: t.storageType, value: asset.storageType },
    { label: t.operatingSystem, value: asset.operatingSystem },
    { label: t.windowsLicense, value: asset.windowsEdition },
  ].filter((specification) => specification.value);
  const licenses = [
    ...(asset.softwareLicenses || []),
    `${t.windowsLicenseStatus}: ${asset.windowsLicenseAssigned ? t.licenseAssigned : t.licenseNotAssigned}`,
    asset.antivirusProduct
      ? `${t.antivirusProduct}: ${asset.antivirusProduct}`
      : null,
  ].filter((license): license is string => Boolean(license));

  return (
    <div className="modal-backdrop handover-print-modal" dir={locale === "ar" ? "rtl" : "ltr"}>
      <article className="handover-receipt-paper">
        <header className="handover-receipt-header">
          <div>
            <strong>{t.brand}</strong>
            <span>{t.brandSub}</span>
          </div>
          <div className="handover-form-number">
            <span>{t.handoverNumber}</span>
            <strong>HND-{String(assignment.id).padStart(6, "0")}</strong>
          </div>
        </header>
        <h1>{t.handoverTitle}</h1>
        <p className="handover-date">{t.handoverDate}: {formatDate(assignment.assignedAt, locale)}</p>

        <section className="handover-section">
          <h2>{t.employeeDetails}</h2>
          <div className="handover-data-grid">
            <ReceiptField label={t.employeeName} value={employee.employeeName} />
            <ReceiptField label={t.jobTitle} value={employee.jobTitle} />
            <ReceiptField label={t.employeeEmail} value={employee.email} />
            <ReceiptField label={t.department} value={employee.department?.name} />
          </div>
        </section>

        <section className="handover-section">
          <h2>{t.deviceDetails}</h2>
          <div className="handover-data-grid">
            <ReceiptField label={t.name} value={asset.name} />
            <ReceiptField label={t.serial} value={asset.serialNumber} />
            {specifications.map(({ label, value }) => (
              <ReceiptField key={label} label={label} value={value} />
            ))}
          </div>
        </section>

        <section className="handover-section">
          <h2>{t.installedLicenses}</h2>
          {licenses.length ? (
            <ul className="handover-license-list">
              {licenses.map((license) => <li key={license}>{license}</li>)}
            </ul>
          ) : (
            <p>{t.noLicensesListed}</p>
          )}
        </section>

        <p className="handover-acknowledgment">{t.handoverAcknowledgment}</p>

        <section className="handover-signatures">
          <div>
            <h2>{t.receiverSignature}</h2>
            <strong>{employee.employeeName || employee.email}</strong>
            <span>{t.signature}: __________________________</span>
            <span>{t.handoverDate}: ________________________</span>
          </div>
          <div>
            <h2>{t.itResponsible}</h2>
            <strong>{assignment.issuedByName || assignment.issuedBy?.employeeName || "—"}</strong>
            <span>{assignment.issuedBy?.email || "—"}</span>
            <span>{t.signature}: __________________________</span>
            <span>{t.handoverDate}: ________________________</span>
          </div>
        </section>
      </article>
      <div className="handover-receipt-actions">
        <button className="secondary-button" onClick={onClose}>{t.close}</button>
        <button className="primary-button" onClick={() => window.print()}>{t.printHandover}</button>
      </div>
    </div>
  );
}

function ReceiptField({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div className="handover-data-field">
      <span>{label}</span>
      <strong>{value || "—"}</strong>
    </div>
  );
}

function pageTitle(page: Page, t: (typeof copy)[Locale]) {
  return {
    dashboard: t.dashboard,
    assets: t.assets,
    assignments: t.assignments,
    users: t.users,
    groups: t.groups,
    departments: t.departments,
    profile: t.profile,
    deviceRequests: t.deviceRequests,
  }[page];
}

function ProfilePage({
  user,
  t,
  locale,
  onLogout,
  requests,
  onCreateRequest,
}: {
  user: User;
  t: (typeof copy)[Locale];
  locale: Locale;
  onLogout: () => void;
  requests: DeviceChangeRequest[];
  onCreateRequest: (payload: {
    assetId: number;
    type: DeviceRequestType;
    message: string;
  }) => Promise<void>;
}) {
  const assignments = user.assignments ?? [];
  const currentAssignments = assignments.filter((assignment) => !assignment.returnedAt);
  const [requestSaving, setRequestSaving] = useState(false);
  const [requestError, setRequestError] = useState("");
  const [requestSuccess, setRequestSuccess] = useState(false);
  const displayName = user.employeeName || user.email;

  async function submitRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    setRequestSaving(true);
    setRequestError("");
    setRequestSuccess(false);
    try {
      await onCreateRequest({
        assetId: Number(formData.get("assetId")),
        type: formData.get("type") as DeviceRequestType,
        message: String(formData.get("message") || ""),
      });
      form.reset();
      setRequestSuccess(true);
    } catch (error) {
      setRequestError(error instanceof Error ? error.message : t.requestError);
    } finally {
      setRequestSaving(false);
    }
  }

  return (
    <>
      <div className="welcome-row page-heading">
        <div>
          <span className="eyebrow">{t.personalInformation}</span>
          <h1>{t.profile}</h1>
          <p>{t.profileSubtitle}</p>
        </div>
        <button className="secondary-button profile-logout" onClick={onLogout}>
          <LogOut size={16} />{t.logoutFromAccount}
        </button>
      </div>

      <section className="panel personal-profile-panel">
        <div className="personal-profile-heading">
          <span className="personal-profile-avatar">{user.email.slice(0, 1).toUpperCase()}</span>
          <div>
            <h2>{displayName}</h2>
            <p>{roleName(user.role, t)}</p>
          </div>
        </div>
        <div className="personal-profile-details">
          <ReceiptField label={t.email} value={user.email} />
          <ReceiptField label={t.employeeName} value={user.employeeName} />
          <ReceiptField label={t.jobTitle} value={user.jobTitle} />
          <ReceiptField label={t.role} value={roleName(user.role, t)} />
          <ReceiptField label={t.department} value={user.department?.name} />
          <ReceiptField
            label={t.memberSince}
            value={user.createdAt ? formatDate(user.createdAt, locale) : null}
          />
          <ReceiptField
            label={t.microsoft365}
            value={user.microsoft365LicenseAssigned ? t.licenseAssigned : t.licenseNotAssigned}
          />
          <div className="handover-data-field profile-groups-field">
            <span>{t.registeredGroups}</span>
            <strong>
              {user.workGroups?.length
                ? user.workGroups.map(({ group }) => group.name).join(locale === "ar" ? "، " : ", ")
                : "—"}
            </strong>
          </div>
        </div>
      </section>

      <section className="personal-assignments-section">
        <div className="personal-section-heading">
          <div>
            <h2>{t.personalAssignments}</h2>
            <p>{assignments.length} · {t.assignments}</p>
          </div>
        </div>
        {assignments.length ? (
          <div className="personal-assignment-grid">
            {assignments.map((assignment) => (
              <article className="panel personal-assignment-card" key={assignment.id}>
                <div className="personal-assignment-heading">
                  <span className="table-asset-icon"><Monitor size={18} /></span>
                  <div>
                    <h3>{assignment.asset.name}</h3>
                    <p>{assignment.asset.category} · {assignment.asset.serialNumber}</p>
                  </div>
                  <span className={`badge ${assignment.returnedAt ? "badge-gray" : "badge-green"}`}>
                    <i />{assignment.returnedAt ? t.returned : t.active}
                  </span>
                </div>
                <div className="personal-assignment-details">
                  <ReceiptField label={t.manufacturer} value={assignment.asset.manufacturer} />
                  <ReceiptField label={t.model} value={assignment.asset.model} />
                  <ReceiptField label={t.processor} value={assignment.asset.processor} />
                  <ReceiptField label={t.memory} value={assignment.asset.memoryGb} />
                  <ReceiptField
                    label={t.storageCapacity}
                    value={assignment.asset.storageGb ? `${assignment.asset.storageGb} GB` : null}
                  />
                  <ReceiptField label={t.storageType} value={assignment.asset.storageType} />
                  <ReceiptField label={t.operatingSystem} value={assignment.asset.operatingSystem} />
                  <ReceiptField label={t.windowsLicense} value={assignment.asset.windowsEdition} />
                  <ReceiptField label={t.assignmentDate} value={formatDate(assignment.assignedAt, locale)} />
                  <ReceiptField label={t.created} value={formatDate(assignment.asset.createdAt, locale)} />
                  <ReceiptField
                    label={t.returnDate}
                    value={assignment.returnedAt ? formatDate(assignment.returnedAt, locale) : null}
                  />
                  <ReceiptField
                    label={t.issuedBy}
                    value={assignment.issuedByName || assignment.issuedBy?.employeeName || assignment.issuedBy?.email}
                  />
                  <ReceiptField
                    label={t.windowsLicenseStatus}
                    value={assignment.asset.windowsLicenseAssigned ? t.licenseAssigned : t.licenseNotAssigned}
                  />
                  <ReceiptField label={t.status} value={statusName(assignment.asset.status, t)} />
                  <ReceiptField label={t.antivirusProduct} value={assignment.asset.antivirusProduct} />
                </div>
                <div className="personal-license-list">
                  <span>{t.softwareLicenses}</span>
                  {assignment.asset.softwareLicenses.length ? (
                    assignment.asset.softwareLicenses.map((license) => <span className="license-chip" key={license}>{license}</span>)
                  ) : <strong>—</strong>}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="panel personal-assignment-empty">
            <Monitor size={22} />
            <p>{t.noPersonalAssignments}</p>
          </div>
        )}
      </section>

      {currentAssignments.length > 0 && (
        <section className="panel device-request-panel">
          <div className="personal-section-heading">
            <div><h2>{t.newDeviceRequest}</h2><p>{t.deviceRequestSubtitle}</p></div>
          </div>
          <form className="device-request-form" onSubmit={submitRequest}>
            <label>{t.currentDevice}
              <select name="assetId" required>
                {currentAssignments.map((assignment) => (
                  <option value={assignment.asset.id} key={assignment.id}>
                    {assignment.asset.name} · {assignment.asset.serialNumber}
                  </option>
                ))}
              </select>
            </label>
            <label>{t.requestType}
              <select name="type" defaultValue="UPGRADE_HARDWARE">
                <option value="UPGRADE_HARDWARE">{t.requestUpgrade}</option>
                <option value="REPLACE_DEVICE">{t.requestReplace}</option>
                <option value="OTHER">{t.requestOther}</option>
              </select>
            </label>
            <label className="request-message-field">{t.requestMessage}
              <textarea name="message" required minLength={5} maxLength={2000} rows={3} />
            </label>
            {requestError && <p className="form-error request-feedback" role="alert">{requestError}</p>}
            {requestSuccess && <p className="request-success request-feedback" role="status">{t.requestSent}</p>}
            <button className="primary-button" disabled={requestSaving}>
              {requestSaving ? t.saving : t.submitRequest}
            </button>
          </form>
        </section>
      )}

      <section className="personal-assignments-section">
        <div className="personal-section-heading"><div><h2>{t.yourRequests}</h2><p>{requests.length}</p></div></div>
        <DeviceRequestCards requests={requests} t={t} locale={locale} />
      </section>
    </>
  );
}

function DeviceRequestsPage({
  t,
  locale,
  requests,
  onReview,
  availableAssets,
  issuedByName,
  onReplace,
}: {
  t: (typeof copy)[Locale];
  locale: Locale;
  requests: DeviceChangeRequest[];
  onReview: (
    id: number,
    status: Exclude<DeviceRequestStatus, "PENDING">,
    resolutionNote?: string,
  ) => Promise<void>;
  availableAssets: Asset[];
  issuedByName?: string;
  onReplace: (
    requestId: number,
    replacementAssetId: number,
    originalAssetStatus: Exclude<AssetStatus, "ASSIGNED">,
    issuedByName?: string,
    resolutionNote?: string,
  ) => Promise<void>;
}) {
  const [notes, setNotes] = useState<Record<number, string>>({});
  const [replacementIds, setReplacementIds] = useState<Record<number, number>>({});
  const [originalAssetStatus, setOriginalAssetStatus] = useState<Record<number, Exclude<AssetStatus, "ASSIGNED">>>({});
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState("");

  async function replaceDevice(request: DeviceChangeRequest) {
    const replacementAssetId = replacementIds[request.id];
    if (!replacementAssetId) {
      setError(t.noAssets);
      return;
    }
    setError("");
    setBusyId(request.id);
    try {
      await onReplace(
        request.id,
        replacementAssetId,
        originalAssetStatus[request.id] || "MAINTENANCE",
        issuedByName,
        notes[request.id]?.trim(),
      );
    } catch (replaceError) {
      setError(replaceError instanceof Error ? replaceError.message : t.reviewRequestError);
    } finally {
      setBusyId(null);
    }
  }

  async function review(
    request: DeviceChangeRequest,
    status: Exclude<DeviceRequestStatus, "PENDING">,
  ) {
    const resolutionNote = notes[request.id]?.trim();
    if (status === "REJECTED" && (!resolutionNote || resolutionNote.length < 3)) {
      setError(t.resolutionNote);
      return;
    }

    setError("");
    setBusyId(request.id);
    try {
      await onReview(request.id, status, resolutionNote);
    } catch (reviewError) {
      setError(reviewError instanceof Error ? reviewError.message : t.reviewRequestError);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <>
      <div className="welcome-row page-heading">
        <div><span className="eyebrow">{t.inventory}</span><h1>{t.deviceRequests}</h1><p>{t.deviceRequestSubtitle}</p></div>
      </div>
      {error && <p className="form-error" role="alert">{error}</p>}
      <div className="device-request-list">
        {requests.length ? requests.map((request) => (
          <article className="panel device-request-card" key={request.id}>
            <div className="device-request-card-header">
              <div>
                <h2>{requestTypeLabel(request.type, t)}</h2>
                <p>{request.user.employeeName || request.user.email} · {request.asset?.name || "—"} · {formatDate(request.createdAt, locale)}</p>
              </div>
              <span className={`badge ${requestStatusClass(request.status)}`}><i />{requestStatusLabel(request.status, t)}</span>
            </div>
            <p className="device-request-message">{request.message}</p>
            {request.asset && (
              <p className="device-request-specs">
                {request.asset.serialNumber} · {request.asset.memoryGb ? `${request.asset.memoryGb} GB RAM` : "RAM —"} ·
                {" "}{request.asset.storageGb ? `${request.asset.storageGb} GB ${request.asset.storageType || ""}` : "Storage —"}
              </p>
            )}
            {request.resolutionNote && <p className="device-request-resolution">{request.resolutionNote}</p>}
            {request.status === "PENDING" && (
              <div className="device-request-review">
                <textarea
                  value={notes[request.id] || ""}
                  onChange={(event) => setNotes((current) => ({ ...current, [request.id]: event.target.value }))}
                  placeholder={t.resolutionNote}
                  rows={2}
                />
                <div>
                  <button className="secondary-button" disabled={busyId === request.id} onClick={() => void review(request, "REJECTED")}>{t.rejectRequest}</button>
                  <button className="primary-button" disabled={busyId === request.id} onClick={() => void review(request, "APPROVED")}>{t.approveRequest}</button>
                </div>
              </div>
            )}
            {request.status === "APPROVED" && (
              request.type === "REPLACE_DEVICE" ? (
                <div className="device-replacement-actions">
                  <select
                    aria-label={t.oldDeviceStatus}
                    value={originalAssetStatus[request.id] || "MAINTENANCE"}
                    onChange={(event) => setOriginalAssetStatus((current) => ({
                      ...current,
                      [request.id]: event.target.value as Exclude<AssetStatus, "ASSIGNED">,
                    }))}
                  >
                    <option value="AVAILABLE">{t.oldDeviceAvailable}</option>
                    <option value="MAINTENANCE">{t.oldDeviceMaintenance}</option>
                    <option value="RETIRED">{t.oldDeviceRetired}</option>
                  </select>
                  <select
                    aria-label={t.currentDevice}
                    value={replacementIds[request.id] || ""}
                    onChange={(event) => setReplacementIds((current) => ({
                      ...current,
                      [request.id]: Number(event.target.value),
                    }))}
                  >
                    <option value="">{t.replacementDevice}</option>
                    {availableAssets.map((asset) => (
                      <option key={asset.id} value={asset.id}>
                        {asset.name} · {asset.serialNumber}
                      </option>
                    ))}
                  </select>
                  <button
                    className="primary-button"
                    disabled={busyId === request.id || !availableAssets.length}
                    onClick={() => void replaceDevice(request)}
                  >
                    {t.completeRequest}
                  </button>
                </div>
              ) : (
                <button className="primary-button" disabled={busyId === request.id} onClick={() => void review(request, "COMPLETED")}>
                  {t.completeRequest}
                </button>
              )
            )}
          </article>
        )) : <div className="panel personal-assignment-empty"><p>{t.noDeviceRequests}</p></div>}
      </div>
    </>
  );
}

function DeviceRequestCards({
  requests,
  t,
  locale,
}: {
  requests: DeviceChangeRequest[];
  t: (typeof copy)[Locale];
  locale: Locale;
}) {
  if (!requests.length) {
    return <div className="panel personal-assignment-empty"><p>{t.noDeviceRequests}</p></div>;
  }

  return (
    <div className="device-request-list">
      {requests.map((request) => (
        <article className="panel device-request-card" key={request.id}>
          <div className="device-request-card-header">
            <div>
              <h2>{requestTypeLabel(request.type, t)}</h2>
              <p>{request.asset?.name || "—"} · {formatDate(request.createdAt, locale)}</p>
            </div>
            <span className={`badge ${requestStatusClass(request.status)}`}><i />{requestStatusLabel(request.status, t)}</span>
          </div>
          <p className="device-request-message">{request.message}</p>
          {request.resolutionNote && <p className="device-request-resolution">{request.resolutionNote}</p>}
        </article>
      ))}
    </div>
  );
}

function requestTypeLabel(type: DeviceRequestType, t: (typeof copy)[Locale]) {
  return {
    REPLACE_DEVICE: t.requestReplace,
    UPGRADE_HARDWARE: t.requestUpgrade,
    OTHER: t.requestOther,
  }[type];
}

function requestStatusLabel(status: DeviceRequestStatus, t: (typeof copy)[Locale]) {
  return {
    PENDING: t.requestPending,
    APPROVED: t.requestApproved,
    REJECTED: t.requestRejected,
    COMPLETED: t.requestCompleted,
  }[status];
}

function requestStatusClass(status: DeviceRequestStatus) {
  return {
    PENDING: "badge-amber",
    APPROVED: "badge-green",
    REJECTED: "badge-gray",
    COMPLETED: "badge-violet",
  }[status];
}

function Dashboard({
  t,
  locale,
  stats,
  assets,
  assignments,
  categories,
  canManage,
  canSeeUsers,
  onNavigate,
  onAddAsset,
}: {
  t: (typeof copy)[Locale];
  locale: Locale;
  stats: Stats | null;
  assets: Asset[];
  assignments: Assignment[];
  categories: [string, number][];
  canManage: boolean;
  canSeeUsers: boolean;
  onNavigate: (page: Page) => void;
  onAddAsset: () => void;
}) {
  const total = stats?.totalAssets || 0;
  const maintenance = assets.filter((asset) => asset.status === "MAINTENANCE").length;
  const retired = assets.filter((asset) => asset.status === "RETIRED").length;
  const used = stats?.assignedAssets || 0;
  const available = stats?.availableAssets || 0;
  const availableShare = total ? (available / total) * 100 : 0;
  const assignedShare = total ? (used / total) * 100 : 0;
  const maintenanceShare = total ? (maintenance / total) * 100 : 0;
  const availableEnd = availableShare;
  const assignedEnd = availableEnd + assignedShare;
  const maintenanceEnd = assignedEnd + maintenanceShare;
  const roleT = t;

  return (
    <>
      <div className="welcome-row">
        <div><span className="eyebrow">{t.today}</span><h1>{t.welcome}<span className="wave">✦</span></h1><p>{t.subtitle}</p></div>
        {canManage && <button className="primary-button" onClick={onAddAsset}><Plus size={17} />{t.addAsset}</button>}
      </div>
      <section className="stats-grid">
        <StatCard title={t.totalAssets} value={stats?.totalAssets} icon={Box} tint="violet" caption={t.tracked} />
        <StatCard title={t.available} value={stats?.availableAssets} icon={Check} tint="green" caption={t.availableAssets} />
        <StatCard title={t.assigned} value={stats?.assignedAssets} icon={BriefcaseBusiness} tint="amber" caption={t.inUse} />
        <StatCard title={t.teamMembers} value={stats?.totalUsers} icon={Users} tint="blue" caption={t.members} />
      </section>

      <section className="dashboard-grid">
        <article className="panel overview-panel">
          <div className="panel-header">
            <div><h2>{t.assetsOverview}</h2><p>{t.inventoryStatus}</p></div>
            <button className="quiet-button" onClick={() => onNavigate("assets")}>{t.viewAll}<ChevronLeft size={15} /></button>
          </div>
          <div className="overview-content">
            <div className="donut-wrap">
              <div className="donut-chart" style={{ "--available-end": `${availableEnd}%`, "--assigned-end": `${assignedEnd}%`, "--maintenance-end": `${maintenanceEnd}%` } as React.CSSProperties}>
                <div className="donut-center"><strong>{total}</strong><span>{t.totalAssets}</span></div>
              </div>
              <div className="legend">
                <Legend color="green" label={t.available} value={available} />
                <Legend color="amber" label={t.inUse} value={used} />
                <Legend color="blue" label={t.maintenance} value={maintenance} />
                <Legend color="gray" label={t.retired} value={retired} />
              </div>
            </div>
            <div className="category-block">
              <div className="category-heading"><span>{t.category}</span><span>{t.totalAssets}</span></div>
              {categories.length ? categories.map(([name, count], index) => (
                <div className="category-row" key={name}>
                  <span><i className={`category-dot c-${index}`} />{name}</span><strong>{count}</strong>
                  <div className="category-track"><i style={{ width: `${total ? Math.max(7, (count / total) * 100) : 0}%` }} /></div>
                </div>
              )) : <p className="empty-inline">{t.empty}</p>}
            </div>
          </div>
        </article>

        <article className="panel quick-panel">
          <div className="panel-header"><div><h2>{t.quickActions}</h2><p>{locale === "ar" ? "اختصارات لتنجز أسرع" : "Shortcuts to get things done"}</p></div><MoreHorizontal size={20} className="subtle-icon" /></div>
          {canManage && <button className="quick-action" onClick={onAddAsset}><span className="quick-icon violet-bg"><Plus size={18} /></span><span><strong>{t.addAsset}</strong><small>{locale === "ar" ? "سجّل جهازاً جديداً في المخزون" : "Register a new device"}</small></span><ChevronLeft size={16} /></button>}
          <button className="quick-action" onClick={() => onNavigate("assignments")}><span className="quick-icon amber-bg"><ArrowUpLeft size={18} /></span><span><strong>{t.assignAsset}</strong><small>{locale === "ar" ? "تابع العُهد المسلّمة للفريق" : "Review assets assigned to your team"}</small></span><ChevronLeft size={16} /></button>
          {canSeeUsers && <button className="quick-action" onClick={() => onNavigate("users")}><span className="quick-icon blue-bg"><Users size={18} /></span><span><strong>{t.manageTeam}</strong><small>{locale === "ar" ? "استعرض أعضاء مؤسستك" : "View your organization members"}</small></span><ChevronLeft size={16} /></button>}
          <div className="quick-footer"><Activity size={15} /><span>{t.availableAssets}: <strong>{available}</strong></span></div>
        </article>
      </section>

      <section className="panel activity-panel">
        <div className="panel-header">
          <div><h2>{t.recentActivity}</h2><p>{t.latestAssignments}</p></div>
          <button className="quiet-button" onClick={() => onNavigate("assignments")}>{t.viewAll}<ChevronLeft size={15} /></button>
        </div>
        <AssignmentTable assignments={assignments.slice(0, 5)} t={roleT} locale={locale} />
      </section>
    </>
  );
}

function StatCard({
  title,
  value,
  icon: Icon,
  tint,
  caption,
}: {
  title: string;
  value?: number;
  icon: typeof Box;
  tint: string;
  caption: string;
}) {
  return (
    <article className="stat-card">
      <div className="stat-top"><span>{title}</span><span className={`stat-icon ${tint}`}><Icon size={18} /></span></div>
      <div className="stat-value">{value ?? "—"}</div>
      <div className="stat-foot"><span>{caption}</span></div>
      <div className={`stat-spark spark-${tint}`}><i /><i /><i /><i /><i /><i /><i /></div>
    </article>
  );
}

function Legend({ color, label, value }: { color: string; label: string; value: number }) {
  return <div className="legend-item"><span><i className={`legend-dot ${color}`} />{label}</span><strong>{value}</strong></div>;
}

function AssignmentTable({
  assignments,
  t,
  locale,
}: {
  assignments: Assignment[];
  t: (typeof copy)[Locale];
  locale: Locale;
}) {
  return (
    <div className="table-scroll">
      <table>
        <thead><tr><th>{t.asset}</th><th>{t.assignedTo}</th><th>{t.date}</th><th>{t.status}</th><th /></tr></thead>
        <tbody>
          {assignments.length ? assignments.map((assignment) => (
            <tr key={assignment.id}>
              <td><span className="table-asset-icon"><Monitor size={17} /></span><span className="table-primary">{assignment.asset.name}<small>{assignment.asset.serialNumber}</small></span></td>
              <td><span className="person-cell"><span className="mini-avatar">{assignment.user.email.slice(0, 1).toUpperCase()}</span>{assignment.user.email}</span></td>
              <td>{formatDate(assignment.assignedAt, locale)}</td>
              <td><span className={`badge ${assignment.returnedAt ? "badge-gray" : "badge-green"}`}><i />{assignment.returnedAt ? t.returned : t.active}</span></td>
              <td><button className="row-more" aria-label={t.actions}><MoreHorizontal size={18} /></button></td>
            </tr>
          )) : <tr><td colSpan={5} className="table-empty">{t.noAssignments}</td></tr>}
        </tbody>
      </table>
    </div>
  );
}

function AssetsPage({
  t,
  locale,
  assets,
  meta,
  statusFilter,
  setStatusFilter,
  page,
  setPage,
  loading,
  canManage,
  onAdd,
  onEdit,
  onToggleWindowsLicense,
  licenseSavingAsset,
}: {
  t: (typeof copy)[Locale];
  locale: Locale;
  assets: Asset[];
  meta: PageMeta | null;
  statusFilter: string;
  setStatusFilter: (status: string) => void;
  page: number;
  setPage: (page: number) => void;
  loading: boolean;
  canManage: boolean;
  onAdd: () => void;
  onEdit: (asset: Asset) => void;
  onToggleWindowsLicense: (asset: Asset) => Promise<void>;
  licenseSavingAsset: number | null;
}) {
  return (
    <>
      <div className="welcome-row page-heading">
        <div><span className="eyebrow">{t.inventory}</span><h1>{t.allAssets}</h1><p>{t.assetsSub}</p></div>
        {canManage && <button className="primary-button" onClick={onAdd}><Plus size={17} />{t.addNewAsset}</button>}
      </div>
      <section className="panel assets-panel">
        <div className="asset-filters">
          <span className="result-count">{meta?.total ?? assets.length} {t.assets}</span>
          <label className="filter-select">
            <Settings2 size={16} />
            <select value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value); setPage(1); }}>
              <option value="">{t.allStatuses}</option>
              <option value="AVAILABLE">{t.statusAvailable}</option>
              <option value="ASSIGNED">{t.statusAssigned}</option>
              <option value="MAINTENANCE">{t.statusMaintenance}</option>
              <option value="RETIRED">{t.statusRetired}</option>
            </select>
            <ChevronDown size={14} />
          </label>
        </div>
        <div className="table-scroll">
          <table>
            <thead><tr><th>{t.asset}</th><th>{t.serial}</th><th>{t.hardwareDetails}</th><th>{t.windowsLicense}</th><th>{t.antivirus}</th><th>{t.softwareLicenses}</th><th>{t.status}</th><th>{t.created}</th><th /></tr></thead>
            <tbody>
              {assets.map((asset) => (
                <tr key={asset.id}>
                  <td><span className="table-asset-icon"><Laptop size={17} /></span><span className="table-primary">{asset.name}<small>AST-{String(asset.id).padStart(4, "0")}</small></span></td>
                  <td className="serial-cell">{asset.serialNumber}</td>
                  <td><span className="table-primary">{asset.category}<small>{[asset.manufacturer, asset.model].filter(Boolean).join(" · ") || "—"}</small><small>{asset.processor || "—"}{asset.memoryGb ? ` · ${asset.memoryGb} GB RAM` : ""}</small><small>{asset.storageGb ? `${asset.storageGb} GB ${asset.storageType || ""}` : "—"}{asset.operatingSystem ? ` · ${asset.operatingSystem}` : ""}</small></span></td>
                  <td>
                    <span className="table-primary">{asset.windowsEdition || "—"}
                      {canManage ? (
                        <button
                          className={`license-toggle ${asset.windowsLicenseAssigned ? "is-assigned" : ""}`}
                          aria-label={t.toggleLicense}
                          aria-pressed={asset.windowsLicenseAssigned}
                          disabled={licenseSavingAsset === asset.id}
                          onClick={() => void onToggleWindowsLicense(asset)}
                        >
                          {licenseSavingAsset === asset.id ? t.saving : asset.windowsLicenseAssigned ? t.licenseAssigned : t.licenseNotAssigned}
                        </button>
                      ) : <small>{asset.windowsLicenseAssigned ? t.licenseAssigned : t.licenseNotAssigned}</small>}
                    </span>
                  </td>
                  <td>{asset.antivirusProduct || "—"}</td>
                  <td>
                    {asset.softwareLicenses.length
                      ? <span className="software-license-list">{asset.softwareLicenses.join(", ")}</span>
                      : t.noSoftwareLicenses}
                  </td>
                  <td><StatusBadge status={asset.status} t={t} /></td>
                  <td>{formatDate(asset.createdAt, locale)}</td>
                  <td>{canManage && <button className="row-more" aria-label={t.updateAsset} title={t.updateAsset} onClick={() => onEdit(asset)}><Pencil size={16} /></button>}</td>
                </tr>
              ))}
              {!assets.length && <tr><td colSpan={9} className="table-empty">{loading ? t.loading : t.noAssets}</td></tr>}
            </tbody>
          </table>
        </div>
        <div className="pagination"><span>{t.pagination} <strong>{meta?.page ?? 1}</strong> {t.of} <strong>{meta?.totalPages ?? 1}</strong></span><div><button disabled={!meta || meta.page <= 1} onClick={() => setPage(Math.max(1, page - 1))}><ArrowDownLeft size={15} />{t.previous}</button><button disabled={!meta || meta.page >= meta.totalPages} onClick={() => setPage(page + 1)}>{t.next}<ArrowUpLeft size={15} /></button></div></div>
      </section>
    </>
  );
}

function StatusBadge({ status, t }: { status: AssetStatus; t: (typeof copy)[Locale] }) {
  const classes: Record<AssetStatus, string> = {
    AVAILABLE: "badge-green",
    ASSIGNED: "badge-violet",
    MAINTENANCE: "badge-amber",
    RETIRED: "badge-gray",
  };
  return <span className={`badge ${classes[status]}`}><i />{statusName(status, t)}</span>;
}

function AssignmentsPage({
  t,
  locale,
  assignments,
  loading,
}: {
  t: (typeof copy)[Locale];
  locale: Locale;
  assignments: Assignment[];
  loading: boolean;
}) {
  return (
    <>
      <div className="welcome-row page-heading"><div><span className="eyebrow">{t.inventory}</span><h1>{t.assignments}</h1><p>{t.latestAssignments}</p></div></div>
      <section className="panel activity-panel">
        <div className="panel-header"><div><h2>{t.recentActivity}</h2><p>{assignments.length} {t.assignments}</p></div></div>
        <AssignmentTable assignments={assignments} t={t} locale={locale} />
        {!assignments.length && loading && <div className="loading-state"><span className="spinner" />{t.loading}</div>}
      </section>
    </>
  );
}

function UsersPage({
  t,
  users,
  loading,
  canManage,
  onToggleLicense,
  licenseSavingUser,
}: {
  t: (typeof copy)[Locale];
  users: User[];
  loading: boolean;
  canManage: boolean;
  onToggleLicense: (user: User) => Promise<void>;
  licenseSavingUser: number | null;
}) {
  return (
    <>
      <div className="welcome-row page-heading"><div><span className="eyebrow">{t.organization}</span><h1>{t.users}</h1><p>{t.manageTeam}</p></div></div>
      <section className="panel assets-panel">
        <div className="table-scroll"><table><thead><tr><th>{t.user}</th><th>{t.role}</th><th>{t.department}</th><th>{t.microsoft365}</th></tr></thead>
          <tbody>{users.map((user) => <tr key={user.id}><td><span className="person-cell"><span className="mini-avatar">{user.email.slice(0, 1).toUpperCase()}</span><span className="table-primary">{user.email}<small>USR-{String(user.id).padStart(4, "0")}</small></span></span></td><td>{roleName(user.role, t)}</td><td>{user.department?.name || "—"}</td><td>
            {canManage ? (
              <button
                className={`license-toggle ${user.microsoft365LicenseAssigned ? "is-assigned" : ""}`}
                aria-label={`${t.toggleLicense}: ${user.email}`}
                aria-pressed={user.microsoft365LicenseAssigned}
                disabled={licenseSavingUser === user.id}
                onClick={() => void onToggleLicense(user)}
              >
                {licenseSavingUser === user.id ? t.saving : user.microsoft365LicenseAssigned ? t.licenseAssigned : t.licenseNotAssigned}
              </button>
            ) : <span className={`badge ${user.microsoft365LicenseAssigned ? "badge-green" : "badge-gray"}`}>{user.microsoft365LicenseAssigned ? t.licenseAssigned : t.licenseNotAssigned}</span>}
          </td></tr>)}
            {!users.length && <tr><td colSpan={4} className="table-empty">{loading ? t.loading : t.empty}</td></tr>}</tbody></table></div>
      </section>
    </>
  );
}

function GroupsPage({
  t,
  groups,
  loading,
}: {
  t: (typeof copy)[Locale];
  groups: WorkGroup[];
  loading: boolean;
}) {
  const groupNames: Record<WorkGroup["slug"], string> = {
    it: t.groupIt,
    managers: t.groupManagers,
    employees: t.groupEmployees,
  };

  return (
    <>
      <div className="welcome-row page-heading">
        <div><span className="eyebrow">{t.organization}</span><h1>{t.groups}</h1><p>{t.groupSubtitle}</p></div>
      </div>
      <section className="work-group-grid">
        {groups.map((group, index) => (
          <article className="panel work-group-card" key={group.id}>
            <div className="work-group-heading">
              <span className={`department-icon dept-${index % 4}`}><Users size={20} /></span>
              <span className="work-group-count">{group.users.length} {t.departmentCount}</span>
            </div>
            <h2>{groupNames[group.slug]}</h2>
            <div className="work-group-members">
              {group.users.map(({ user: member }) => (
                <div className="work-group-member" key={member.id}>
                  <span className="mini-avatar">{member.email.slice(0, 1).toUpperCase()}</span>
                  <span className="table-primary">{member.email}<small>{roleName(member.role, t)}</small></span>
                </div>
              ))}
              {!group.users.length && <p className="empty-inline">{loading ? t.loading : t.empty}</p>}
            </div>
          </article>
        ))}
        {!groups.length && <div className="panel empty-departments">{loading ? t.loading : t.empty}</div>}
      </section>
    </>
  );
}

function DepartmentsPage({
  t,
  departments,
  loading,
}: {
  t: (typeof copy)[Locale];
  departments: Department[];
  loading: boolean;
}) {
  return (
    <>
      <div className="welcome-row page-heading"><div><span className="eyebrow">{t.organization}</span><h1>{t.departments}</h1><p>{localeDepartmentSubtitle(t)}</p></div></div>
      <section className="department-grid">
        {departments.map((department, index) => (
          <article className="panel department-card" key={department.id}>
            <span className={`department-icon dept-${index % 4}`}><Building2 size={20} /></span>
            <h2>{department.name}</h2>
            <p>{department._count?.users ?? 0} {t.departmentCount}</p>
            <span className="dept-link">{t.department}<ChevronLeft size={14} /></span>
          </article>
        ))}
        {!departments.length && <div className="panel empty-departments">{loading ? t.loading : t.empty}</div>}
      </section>
    </>
  );
}

function localeDepartmentSubtitle(t: (typeof copy)[Locale]) {
  return t === copy.ar ? "الأقسام والفرق المسجلة في مؤسستك." : "Departments and teams in your organization.";
}

export default App;

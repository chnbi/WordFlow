// Centralized mock data for the application
// This file consolidates all mock data to avoid duplication

// ===========================================
// PROJECTS
// ===========================================
export const projects = [
    {
        id: '1',
        name: 'Yes 5g advanced',
        status: 'in-progress',
        progress: 55,
        sourceLanguage: 'English',
        targetLanguages: ['Bahasa Malaysia', 'Chinese'],
        totalRows: 156,
        translatedRows: 86,
        pendingReview: 12,
        team: [{ initials: 'LW' }, { initials: 'AK' }, { initials: 'SL' }],
        lastUpdated: 'Dec 25, 2024',
        color: 'bg-gradient-to-br from-blue-500 to-blue-600',
    },
    {
        id: '2',
        name: 'NUTP',
        status: 'completed',
        progress: 100,
        sourceLanguage: 'English',
        targetLanguages: ['Bahasa Malaysia', 'Chinese'],
        totalRows: 89,
        translatedRows: 89,
        pendingReview: 0,
        team: [{ initials: 'AK' }],
        lastUpdated: 'Dec 20, 2024',
        color: 'bg-gradient-to-br from-zinc-800 to-zinc-900',
    },
    {
        id: '3',
        name: 'iPhone17',
        status: 'draft',
        progress: 30,
        sourceLanguage: 'English',
        targetLanguages: ['Bahasa Malaysia', 'Chinese'],
        totalRows: 234,
        translatedRows: 70,
        pendingReview: 5,
        team: [{ initials: 'SL' }, { initials: 'BR' }],
        lastUpdated: 'Dec 18, 2024',
        color: 'bg-gradient-to-br from-violet-500 to-violet-600',
    },
]

// ===========================================
// PROJECT ROWS (for translation table)
// ===========================================
export const projectRows = {
    '1': [
        { id: 1, source: 'Yes 5g advanced', en: 'Yes 5g advanced', my: 'Yes 5g advanced', zh: '', status: 'completed' },
        { id: 2, source: 'Get started today', en: 'Get started today', my: 'Mulakan hari ini', zh: '', status: 'completed' },
        { id: 3, source: 'Premium features', en: 'Premium features', my: '', zh: '', status: 'pending' },
        { id: 4, source: 'Contact our support team', en: 'Contact our support team', my: 'Hubungi pasukan sokongan kami', zh: '', status: 'review' },
    ],
    '2': [
        { id: 1, source: 'National Union of Teachers', en: 'National Union of Teachers', my: 'Kesatuan Guru Kebangsaan', zh: '全国教师工会', status: 'completed' },
    ],
    '3': [
        { id: 1, source: 'Introducing iPhone 17', en: 'Introducing iPhone 17', my: '', zh: '', status: 'pending' },
    ],
}

// ===========================================
// GLOSSARY TERMS
// ===========================================
export const glossaryTerms = [
    { id: 1, english: "Dashboard", malay: "Papan Pemuka", chinese: "仪表板", category: "UI", status: "approved", dateModified: "Dec 20, 2024", remark: "" },
    { id: 2, english: "Settings", malay: "Tetapan", chinese: "设置", category: "UI", status: "approved", dateModified: "Dec 19, 2024", remark: "" },
    { id: 3, english: "Profile", malay: "Profil", chinese: "个人资料", category: "Account", status: "approved", dateModified: "Dec 18, 2024", remark: "" },
    { id: 4, english: "Submit", malay: "Hantar", chinese: "提交", category: "Actions", status: "approved", dateModified: "Dec 17, 2024", remark: "" },
    { id: 5, english: "Cancel", malay: "Batal", chinese: "取消", category: "Actions", status: "approved", dateModified: "Dec 16, 2024", remark: "" },
    { id: 6, english: "Privacy Policy", malay: "Dasar Privasi", chinese: "隐私政策", category: "Legal", status: "approved", dateModified: "Dec 15, 2024", remark: "" },
    { id: 7, english: "Terms of Service", malay: "Terma Perkhidmatan", chinese: "服务条款", category: "Legal", status: "approved", dateModified: "Dec 14, 2024", remark: "" },
    { id: 8, english: "Notification", malay: "Pemberitahuan", chinese: "通知", category: "UI", status: "approved", dateModified: "Dec 13, 2024", remark: "" },
    { id: 9, english: "Search", malay: "Cari", chinese: "搜索", category: "UI", status: "approved", dateModified: "Dec 12, 2024", remark: "" },
    { id: 10, english: "Log Out", malay: "Log Keluar", chinese: "退出登录", category: "Account", status: "approved", dateModified: "Dec 11, 2024", remark: "" },
]

// ===========================================
// PROMPT TEMPLATES  
// ===========================================
export const promptTemplates = [
    {
        id: 1,
        name: "Formal Business",
        description: "Professional tone for corporate communications, reports, and official documents.",
        prompt: "Translate the following text into {target_language}. Maintain a formal, professional tone suitable for corporate communications.",
        tags: ["Business", "Formal", "Corporate"],
        variables: ["target_language"],
        author: "System",
        iconName: "FileText",
        iconColor: "text-blue-600 dark:text-blue-400",
        iconBg: "bg-blue-100 dark:bg-blue-900/50",
        color: "bg-blue-50 dark:bg-blue-950/30",
    },
    {
        id: 2,
        name: "Marketing Copy",
        description: "Persuasive content for ads, promotions, and brand messaging.",
        prompt: "Translate the following marketing content into {target_language}. Prioritize emotional impact and natural flow.",
        tags: ["Marketing", "Creative", "Persuasive"],
        variables: ["target_language"],
        author: "System",
        iconName: "Megaphone",
        iconColor: "text-pink-600 dark:text-pink-400",
        iconBg: "bg-pink-100 dark:bg-pink-900/50",
        color: "bg-pink-50 dark:bg-pink-950/30",
    },
    {
        id: 3,
        name: "Technical Docs",
        description: "Precise language for software documentation and technical guides.",
        prompt: "Translate the following technical documentation into {target_language}. Keep all code snippets unchanged.",
        tags: ["Technical", "Documentation", "Software"],
        variables: ["target_language"],
        author: "System",
        iconName: "Code",
        iconColor: "text-violet-600 dark:text-violet-400",
        iconBg: "bg-violet-100 dark:bg-violet-900/50",
        color: "bg-violet-50 dark:bg-violet-950/30",
    },
    {
        id: 4,
        name: "Legal Contracts",
        description: "Accurate translations for contracts, policies, and legal documents.",
        prompt: "Translate the following legal text into {target_language}. Maintain the precise legal meaning and terminology.",
        tags: ["Legal", "Compliance", "Strict"],
        variables: ["target_language"],
        author: "System",
        iconName: "Scale",
        iconColor: "text-amber-600 dark:text-amber-400",
        iconBg: "bg-amber-100 dark:bg-amber-900/50",
        color: "bg-amber-50 dark:bg-amber-950/30",
    },
    {
        id: 5,
        name: "Social Media",
        description: "Friendly tone for social media posts and casual communications.",
        prompt: "Translate the following text into {target_language} in a casual, conversational tone.",
        tags: ["Social", "Casual", "Chat"],
        variables: ["target_language"],
        author: "System",
        iconName: "MessageSquare",
        iconColor: "text-emerald-600 dark:text-emerald-400",
        iconBg: "bg-emerald-100 dark:bg-emerald-900/50",
        color: "bg-emerald-50 dark:bg-emerald-950/30",
    },
]

// ===========================================
// STATS (computed from projects)
// ===========================================
export function getStats() {
    const totalProjects = projects.length
    const inProgress = projects.filter(p => p.status === 'in-progress').length
    const completed = projects.filter(p => p.status === 'completed').length
    const glossaryCount = glossaryTerms.length

    return {
        totalProjects,
        inProgress,
        completed,
        glossaryCount,
    }
}

// ===========================================
// HELPER: Get project by ID
// ===========================================
export function getProjectById(id) {
    return projects.find(p => p.id === id)
}

export function getProjectRows(projectId) {
    return projectRows[projectId] || []
}

# User Flow Analysis: Translation Wrapper

**Date**: January 3, 2026  
**Scope**: All pages, edge cases, and RBAC considerations

---

## Table of Contents
1. [Projects Flow](#1-projects-flow)
2. [Glossary Library Flow](#2-glossary-library-flow)
3. [Prompt Library Flow](#3-prompt-library-flow)
4. [Image Translation Flow](#4-image-translation-flow)
5. [Settings Flow](#5-settings-flow)
6. [Cross-Page Issues](#6-cross-page-issues)
7. [RBAC Analysis](#7-rbac-analysis)
8. [Summary Matrix](#8-summary-matrix)

---

## 1. Projects Flow

### Current Flow Diagram
```
[Home] → Click "Projects" → [Dashboard]
         ↓
[Dashboard] → Quick Actions:
              ├── "New Project" → ❌ No handler
              ├── "Import File" → [Import Dialog] → Creates project → Added to local state
              ├── "Use Template" → ❌ No handler
              └── "Settings" → Navigates to #settings
         ↓
[Dashboard] → Click project row → [Project Details] → Shows hardcoded data ❌
```

### Issues Identified

#### 1.1 Dashboard (`dashboard.jsx`)

| Issue | Severity | Description |
|-------|----------|-------------|
| **Separate local state** | 🔴 Critical | `initialProjects` (lines 17-62) is independent of `ProjectContext`. Changes made in Dashboard don't sync with Home or Sidebar. |
| **"New Project" does nothing** | 🟡 Medium | `handleQuickAction` only handles "import" and "settings" (lines 135-141). |
| **"Use Template" does nothing** | 🟡 Medium | No handler defined. |
| **Filter/Sort placeholders** | 🟠 Low | Filter and Sort buttons exist but have no functionality. |
| **Delete confirmation missing** | 🟡 Medium | Clicking delete instantly removes project without confirmation dialog. |

**Edge Cases Not Handled:**
- ❌ Empty project name during import
- ❌ Uploading non-Excel file (no validation beyond extension)
- ❌ Corrupted Excel file
- ❌ Excel file with no sheets
- ❌ Very large Excel files (>10MB, memory issues)
- ❌ Sheet with 0 rows (shows "0 rows" but imports anyway)
- ❌ Duplicate project names

#### 1.2 Project Import Dialog (`project-import-dialog.jsx`)

| Issue | Severity | Description |
|-------|----------|-------------|
| **No file size validation** | 🟡 Medium | Can attempt to load massive files causing browser freeze. |
| **No column mapping** | 🟡 Medium | Just counts rows, doesn't parse actual column structure (source/en/my/zh). |
| **No preview** | 🟠 Low | User can't see actual content before importing. |
| **Import doesn't parse data** | 🔴 Critical | Only metadata (name, rowCount) is passed. Actual rows are lost! |

**Missing Flow:**
```
Current:  Excel → Extract sheet names + row counts → Create project shell
Expected: Excel → Extract sheet names + rows → Parse columns → Map to translation structure → Store rows
```

#### 1.3 Project Details (`project-details.jsx`)

| Issue | Severity | Description |
|-------|----------|-------------|
| **100% hardcoded** | 🔴 Critical | Lines 8-18 define static `projectData`. URL parameter `/project/:id` is ignored. |
| **No route param parsing** | 🔴 Critical | Never extracts `projectId` from URL hash. |
| **Read-only table** | 🔴 Critical | Cannot edit translations inline. |
| **"Translate All" does nothing** | 🟡 Medium | Button exists but no handler. |
| **"Export" does nothing** | 🟡 Medium | Button exists but no handler. |
| **Typo in code** | 🟠 Bug | Line 77: `claslassName` instead of `className`. |

**Edge Cases Not Handled:**
- ❌ Non-existent project ID in URL
- ❌ Project with 0 rows
- ❌ Project with 1000+ rows (no pagination)
- ❌ Long text overflow in table cells
- ❌ RTL language support (if Arabic added later)

---

## 2. Glossary Library Flow

### Current Flow Diagram
```
[Home] → Click "Glossary" → [Glossary Library]
         ↓
[Glossary Library] → Actions:
                     ├── "Add Term" → [Glossary Term Dialog] → Save → Added to local state
                     ├── Edit term → [Glossary Term Dialog] → Save → Updated in local state
                     ├── Delete term → Removed immediately (no confirmation)
                     ├── Bulk select → Delete selected
                     ├── Filter by category tabs
                     ├── Search by term
                     └── Sort by column
```

### Issues Identified

#### 2.1 Glossary Library (`glossary-library.jsx`)

| Issue | Severity | Description |
|-------|----------|-------------|
| **Local state only** | 🔴 Critical | Uses `initialGlossaryData` (lines 17-267), not shared context. |
| **Not integrated with translation** | 🔴 Critical | Glossary terms are never used during actual translation. |
| **Download button no handler** | 🟡 Medium | Line 435: `<Download />` button does nothing. |
| **Filter button placeholder** | 🟠 Low | Line 429: Filter button exists but only category tabs work. |
| **No import from Excel** | 🟡 Medium | Unlike projects, glossary has no bulk import. |
| **No duplicate detection** | 🟡 Medium | Can add "Dashboard" multiple times. |

#### 2.2 Glossary Term Dialog (`glossary-term-dialog.jsx`)

| Issue | Severity | Description |
|-------|----------|-------------|
| **No validation** | 🟡 Medium | Can save with empty English term. |
| **Can save deprecated with empty translations** | 🟠 Low | Allows deprecated status with blank Malay/Chinese. |
| **No character limit** | 🟠 Low | Very long terms could break UI. |

**Edge Cases Not Handled:**
- ❌ Empty English term (required field should be enforced)
- ❌ Duplicate term (same English text)
- ❌ Special characters in terms (HTML, scripts)
- ❌ Very long remark text (no truncation in dialog)
- ❌ Bulk import (common enterprise requirement)
- ❌ Export to Excel for legal/compliance review

---

## 3. Prompt Library Flow

### Current Flow Diagram
```
[Home] → Click "Prompt Library" → [Prompt Library]
         ↓
[Prompt Library] → Actions:
                   ├── "New Prompt" → [Prompt Detail Dialog] → Save → Added to local state
                   ├── Edit prompt → [Prompt Detail Dialog] → Save → Updated
                   ├── Duplicate prompt → Cloned with "(Copy)" suffix
                   ├── "Use" prompt → console.log only ❌
                   ├── Filter tabs (All/System/My Prompts)
                   └── Search by name/tag
```

### Issues Identified

#### 3.1 Prompt Library (`prompt-library.jsx`)

| Issue | Severity | Description |
|-------|----------|-------------|
| **"Use" does nothing** | 🔴 Critical | Line 186: `onUse={() => console.log("Use prompt", template.id)}`. Core feature! |
| **Not connected to translation** | 🔴 Critical | Prompts are never sent to Gemini API. |
| **Local state only** | 🔴 Critical | Not persisted, resets on refresh. |
| **No delete function** | 🟡 Medium | `handleDelete` exists but not connected to UI. |
| **System prompts editable** | 🟡 Medium | Users can edit "System" prompts which should be read-only. |

#### 3.2 Prompt Detail Dialog (`prompt-detail-dialog.jsx`)

| Issue | Severity | Description |
|-------|----------|-------------|
| **No prompt testing** | 🟡 Medium | Can't preview translation with sample text. |
| **No validation** | 🟡 Medium | Can save empty prompts. |
| **Variable auto-detect only** | 🟠 Low | Variables detected but user can't manually add required ones. |

**Edge Cases Not Handled:**
- ❌ Empty prompt name
- ❌ Prompt with syntax errors in variables (e.g., `{unclosed`)
- ❌ Reserved variable names conflicting with system
- ❌ Prompt testing with sample input
- ❌ Version history for prompts
- ❌ Archiving instead of deleting

---

## 4. Image Translation Flow

### Current Flow Diagram
```
[Home] → Click "Image Translation" → [Image Translation Page]
         ↓
State Machine:
├── UPLOAD: Drop/select image
├── PREVIEW: Show image + "Extract Text" button
├── EXTRACTING: Fake progress bar (simulated)
├── EDITING: Show extracted lines
         ↓
Actions in EDITING:
├── Delete line → ❌ No handler
├── "Start Over" → Reset to UPLOAD
└── "Translate All" → ❌ No handler
```

### Issues Identified

#### 4.1 Image Translation (`image-translation.jsx`)

| Issue | Severity | Description |
|-------|----------|-------------|
| **Fake OCR** | 🔴 Critical | Lines 44-65: Uses `setInterval` to simulate, returns hardcoded mock data. |
| **"Translate All" does nothing** | 🔴 Critical | Button exists but no handler (line 222-226). |
| **Delete line does nothing** | 🟡 Medium | Trash icon on each line has no handler (line 201-203). |
| **No actual Gemini/Vision integration** | 🔴 Critical | No API calls anywhere. |
| **No language selection** | 🟡 Medium | Can't choose target languages. |
| **No save/export** | 🟡 Medium | Extracted text can't be saved or exported. |

**Edge Cases Not Handled:**
- ❌ Non-image file (e.g., renamed .exe to .jpg)
- ❌ Image with no text (OCR returns empty)
- ❌ Image >10MB (shows in UI but no actual enforcement)
- ❌ Corrupted/truncated image
- ❌ Image with mixed languages
- ❌ Handwritten text (OCR typically fails)
- ❌ Low-resolution image
- ❌ PDF files (common use case)

---

## 5. Settings Flow

### Current Flow Diagram
```
[Home] → Click "Settings" → [Settings Page]
         ↓
[Settings] → Display sections:
            ├── Profile → ❌ No sub-page
            ├── Security → ❌ No sub-page
            ├── Notifications → ❌ No sub-page
            ├── Appearance → ❌ No sub-page
            └── (Admin only) User Management → ❌ No sub-page
```

### Issues Identified

| Issue | Severity | Description |
|-------|----------|-------------|
| **All buttons are dead links** | 🟡 Medium | Lines 72-89: Buttons exist but navigate nowhere. |
| **No actual settings** | 🟡 Medium | Can't change theme, language, or any preference. |
| **Hardcoded email** | 🟠 Bug | Line 128: Shows "dev@example.com" instead of `user.email`. |
| **Admin section UI only** | 🟡 Medium | User Management shows for admin but has no functionality. |

**Edge Cases Not Handled:**
- ❌ Theme persistence (dark mode resets on refresh)
- ❌ Language preference for UI
- ❌ API key management for Gemini
- ❌ Notification preferences

---

## 6. Cross-Page Issues

### 6.1 Data Isolation

| Page | Uses Context? | Data Source |
|------|--------------|-------------|
| Home | ✅ Yes | `ProjectContext` |
| Dashboard | ❌ No | Local `initialProjects` |
| Project Details | ❌ No | Hardcoded `projectData` |
| Glossary | ❌ No | Local `initialGlossaryData` |
| Prompt Library | ❌ No | Local `initialTemplates` |
| Image Translation | ❌ No | Component-level state |
| Settings | ❌ No | Hardcoded sections |

**Result**: Adding a project in Dashboard won't show it in Home. Editing glossary won't persist. Complete data fragmentation.

### 6.2 Sidebar Project List

**File**: `app-sidebar.jsx` (lines 58-74)
```javascript
const navProjects = [
  { title: "Yes 5g advanced", url: "#project/1" },
  { title: "NUTP", url: "#project/2" },
  { title: "iPhone17", url: "#project/3" },
]
```

This is **hardcoded**. New projects won't appear in sidebar.

### 6.3 Breadcrumb Project Names

**File**: `App.jsx` (lines 50-54)
```javascript
const projectNames = {
  '1': 'Yes 5g advanced',
  '2': 'NUTP',
  '3': 'iPhone17',
}
```

Also **hardcoded**. Dynamic projects will show "Project #4" instead of actual name.

---

## 7. RBAC Analysis

### 7.1 Defined Permissions (`lib/permissions.js`)

| Action | Admin | Manager | Editor | Viewer |
|--------|-------|---------|--------|--------|
| MANAGE_USERS | ✅ | ❌ | ❌ | ❌ |
| MANAGE_CATEGORIES | ✅ | ✅ | ❌ | ❌ |
| CONFIGURE_SETTINGS | ✅ | ✅ | ❌ | ❌ |
| CREATE_PROJECT | ✅ | ✅ | ✅ | ❌ |
| EDIT_PROJECT | ✅ | ✅ | ✅ | ❌ |
| DELETE_PROJECT | ✅ | ✅ | ✅ | ❌ |
| CREATE_GLOSSARY | ✅ | ✅ | ✅ | ❌ |
| EDIT_GLOSSARY | ✅ | ✅ | ✅ | ❌ |
| DELETE_GLOSSARY | ✅ | ✅ | ✅ | ❌ |
| CREATE_PROMPT | ✅ | ✅ | ✅ | ❌ |
| VIEW_* | ✅ | ✅ | ✅ | ✅ |

### 7.2 RBAC Enforcement by Page

| Page | Checks Role? | Details |
|------|-------------|---------|
| Home | ❌ No | Anyone sees everything |
| Dashboard | ❌ No | Anyone can delete projects |
| Project Details | ❌ No | Anyone can edit (if it worked) |
| Glossary | ⚠️ Partial | Edit/Delete/Create buttons check `canDo()` |
| Prompt Library | ❌ No | Anyone can CRUD prompts |
| Image Translation | ❌ No | No role checks |
| Settings | ⚠️ Partial | Admin section visible to admin only |

### 7.3 RBAC Issues

| Issue | Severity | Description |
|-------|----------|-------------|
| **UI-only enforcement** | 🔴 Critical | Buttons are hidden but functions can be called directly. |
| **No server-side check** | 🔴 Critical | No API layer to enforce permissions. |
| **Viewer can import** | 🟡 Medium | Dashboard import available to all roles. |
| **Editor same as Manager** | 🟠 Low | Permission matrix shows identical permissions. |
| **No project-level access** | 🟡 Medium | Can't restrict access to specific projects. |
| **Role displayed but not enforced** | 🟡 Medium | Settings shows role selector but no difference in behavior. |

---

## 8. Summary Matrix

### Feature Completeness by Page

| Page | UI | Logic | Data | RBAC | API | Score |
|------|-----|-------|------|------|-----|-------|
| Home | ✅ | ✅ | ⚠️ | ❌ | ❌ | 3/5 |
| Dashboard | ✅ | ⚠️ | ❌ | ❌ | ❌ | 2/5 |
| Project Details | ✅ | ❌ | ❌ | ❌ | ❌ | 1/5 |
| Glossary | ✅ | ⚠️ | ❌ | ⚠️ | ❌ | 2.5/5 |
| Prompt Library | ✅ | ⚠️ | ❌ | ❌ | ❌ | 2/5 |
| Image Translation | ✅ | ❌ | ❌ | ❌ | ❌ | 1/5 |
| Settings | ✅ | ❌ | ❌ | ⚠️ | ❌ | 1.5/5 |

**Legend**: ✅ Complete | ⚠️ Partial | ❌ Missing

### Critical Path Blockers

1. **No data persistence** — Everything resets on page refresh
2. **No AI integration** — Core translation feature doesn't exist
3. **Hardcoded project data** — Project Details page is non-functional
4. **Glossary not integrated** — Terms exist but aren't used
5. **RBAC is cosmetic** — Permissions not enforced

---

## Recommendations

### Priority 1 (Blocking Core Functionality)
1. Connect all pages to `ProjectContext`
2. Make Project Details read actual project by ID
3. Store translation rows when importing Excel
4. Implement Gemini API service layer
5. Add inline editing to translation table

### Priority 2 (Essential Features)
6. Integrate glossary lookup during translation
7. Connect prompt templates to translation flow
8. Implement OCR with Google Cloud Vision
9. Add Firebase persistence
10. Enforce RBAC at function level

### Priority 3 (Quality & Polish)
11. Add confirmation dialogs for destructive actions
12. Implement validation on all forms
13. Add pagination for large datasets
14. Create sub-pages for Settings sections
15. Make sidebar project list dynamic

---

## Appendix: Edge Case Checklist

### Authentication
- [ ] Token expired mid-session
- [ ] Multiple tabs with different roles
- [ ] Session timeout handling

### Data
- [ ] Concurrent edits by multiple users
- [ ] Network failure during save
- [ ] Offline mode / reconnection

### Input Validation
- [ ] XSS prevention (script in translation)
- [ ] SQL injection (if using SQL backend)
- [ ] Max length for all text fields
- [ ] Unicode handling (emojis, special chars)

### File Handling
- [ ] Max file size enforcement
- [ ] Malformed Excel files
- [ ] Password-protected Excel
- [ ] CSV vs XLSX format
- [ ] Large images (>10MB)

### Translation
- [ ] Empty source text
- [ ] Source same as target language
- [ ] Translation memory conflicts
- [ ] Glossary term conflicts
- [ ] Rate limiting from Gemini API

# 🎯 ExamGen Frontend - Quick Start Guide

## 🚀 Application is LIVE!

**Development Server**: http://localhost:3000

---

## 📍 Navigation Guide

### Public Routes

1. **Landing Page** - `http://localhost:3000/`
   - View features and product overview
   - Click "Get Started" or "Sign Up"

2. **Login** - `http://localhost:3000/login`
   - Enter any email/password
   - Click "Login" → Redirects to dashboard

3. **Signup** - `http://localhost:3000/signup`
   - Fill registration form
   - Select department
   - Click "Create Account" → Redirects to dashboard

### Dashboard Routes (After Login)

4. **Overview** - `http://localhost:3000/dashboard`
   - View stats, recent activity, quick actions

5. **Upload** - `http://localhost:3000/dashboard/upload`
   - See upload interface and file list

6. **Library** - `http://localhost:3000/dashboard/library`
   - Browse 12 mock questions
   - Use search and filters

7. **Manual Selection** - `http://localhost:3000/dashboard/manual`
   - Add questions to selection
   - See total marks update
   - View progress bar

8. **Blueprint Builder** - `http://localhost:3000/dashboard/blueprint`
   - Add/remove sections
   - Set marks and question counts
   - See auto-calculated totals

9. **Auto Generate** - `http://localhost:3000/dashboard/auto`
   - Select blueprint
   - Click "Generate Paper"
   - View A4 preview

10. **Generated Papers** - `http://localhost:3000/dashboard/generated`
    - View table of 3 mock papers
    - See download/view actions

11. **Audit Logs** - `http://localhost:3000/dashboard/audit`
    - View activity history
    - See user actions and timestamps

---

## 🎨 UI Features to Explore

### Sidebar
- Click the **X** icon to collapse sidebar
- Click the **Menu** icon to expand
- Hover over menu items for smooth transitions

### Manual Selection
1. Go to Manual Selection page
2. Click **"Add"** on any question
3. Watch the right panel update
4. See total marks increase
5. View progress bar fill
6. Click **"Remove"** to deselect

### Blueprint Builder
1. Go to Blueprint Builder
2. Click **"Add Section"**
3. Change marks per question
4. Change number of questions
5. Watch totals auto-calculate
6. Click **trash icon** to remove section

### Auto Generate
1. Go to Auto Generate
2. Select "Mid-Term Examination Blueprint"
3. Click **"Generate Paper"**
4. Scroll down to see A4 preview
5. View formatted paper layout

---

## 🎯 Testing Checklist

- [ ] Visit landing page
- [ ] Click "Sign Up" button
- [ ] Fill signup form
- [ ] Verify redirect to dashboard
- [ ] Click each sidebar menu item
- [ ] Test sidebar collapse/expand
- [ ] Add questions in Manual Selection
- [ ] Build a blueprint
- [ ] Generate a paper
- [ ] View generated papers table
- [ ] Check audit logs
- [ ] Click logout

---

## 🎨 Color Palette Reference

- **Primary**: Navy Blue `#1e3a8a`
- **Secondary**: Indigo `#4f46e5`
- **Accent**: Emerald `#10b981`
- **Success**: Green `#22c55e`
- **Warning**: Amber `#f59e0b`
- **Danger**: Red `#ef4444`

---

## 📱 Responsive Testing

The application is fully responsive. Test on:
- Desktop (1920px+)
- Laptop (1366px)
- Tablet (768px)
- Mobile (375px)

---

## 🔧 Development Commands

```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint
```

---

## 📂 File Structure Quick Reference

```
apps/frontend/
├── app/
│   ├── page.tsx                 → Landing
│   ├── login/page.tsx           → Login
│   ├── signup/page.tsx          → Signup
│   └── dashboard/
│       ├── layout.tsx           → Layout
│       ├── page.tsx             → Overview
│       ├── upload/page.tsx      → Upload
│       ├── library/page.tsx     → Library
│       ├── manual/page.tsx      → Manual
│       ├── blueprint/page.tsx   → Blueprint
│       ├── auto/page.tsx        → Auto Gen
│       ├── generated/page.tsx   → Papers
│       └── audit/page.tsx       → Audit
├── components/ui/               → UI Components
├── lib/
│   ├── mockData.ts             → Mock Data
│   └── utils.ts                → Utilities
└── store/
    └── useSelectionStore.ts    → State
```

---

## 🎯 Key Interactions

### Question Selection Flow
1. Dashboard → Manual Selection
2. Browse questions
3. Click "Add" on desired questions
4. Watch right panel update
5. See total marks calculate
6. Click "Create Paper" when ready

### Paper Generation Flow
1. Dashboard → Blueprint Builder
2. Create blueprint with sections
3. Save blueprint
4. Dashboard → Auto Generate
5. Select saved blueprint
6. Click "Generate Paper"
7. View A4 preview
8. Download PDF/DOCX

---

## ✨ Production Features

✅ Smooth animations
✅ Hover effects
✅ Loading states
✅ Error handling UI
✅ Responsive design
✅ Accessible components
✅ Professional typography
✅ Consistent spacing
✅ Custom scrollbar
✅ Gradient backgrounds

---

**🎉 Ready to use! Open http://localhost:3000 in your browser**

# ExamGen Frontend

A production-level Next.js application for automated examination paper generation.

## 🚀 Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **UI Components**: Custom shadcn/ui-inspired components
- **Icons**: Lucide React

## 📁 Project Structure

```
apps/frontend/
├── app/
│   ├── page.tsx                    # Landing page
│   ├── login/page.tsx              # Login page
│   ├── signup/page.tsx             # Signup page
│   ├── dashboard/
│   │   ├── layout.tsx              # Dashboard layout with sidebar
│   │   ├── page.tsx                # Overview page
│   │   ├── upload/page.tsx         # Upload question bank
│   │   ├── library/page.tsx        # Question library
│   │   ├── manual/page.tsx         # Manual selection
│   │   ├── blueprint/page.tsx      # Blueprint builder
│   │   ├── auto/page.tsx           # Auto generate
│   │   ├── generated/page.tsx      # Generated papers
│   │   └── audit/page.tsx          # Audit logs
│   ├── layout.tsx                  # Root layout
│   └── globals.css                 # Global styles
├── components/
│   └── ui/
│       ├── button.tsx              # Button component
│       ├── card.tsx                # Card component
│       ├── input.tsx               # Input component
│       └── badge.tsx               # Badge component
├── lib/
│   ├── utils.ts                    # Utility functions
│   └── mockData.ts                 # Mock data
└── store/
    └── useSelectionStore.ts        # Zustand store
```

## 🎨 Design Theme

- **Type**: Academic / Examination System
- **Style**: Clean, professional, institutional SaaS
- **Color Palette**:
  - Primary: Navy Blue (#1e3a8a)
  - Secondary: Indigo
  - Accent: Emerald
  - Background: Light Gray
- **Typography**: Professional, minimalist

## 🌟 Features

### Landing Page (/)
- Fixed navbar with logo and auth buttons
- Hero section with CTA buttons
- Feature grid showcasing 6 key features
- Professional footer

### Authentication
- **Login** (`/login`): Email/password form with redirect to dashboard
- **Signup** (`/signup`): Registration form with department dropdown

### Dashboard (`/dashboard`)
- **Collapsible Sidebar**: Navigation menu with icons
- **Top Bar**: Page title, user avatar, logout button
- **Overview**: Stats cards, recent activity, quick actions
- **Upload**: Drag-drop area, file list, upload guidelines
- **Library**: Search/filter, question grid with checkboxes
- **Manual Selection**: Two-column layout with selection panel
- **Blueprint Builder**: Dynamic sections with calculations
- **Auto Generate**: Blueprint selection with A4 preview
- **Generated Papers**: Table view with download actions
- **Audit Logs**: Activity history with user tracking

## 🔧 State Management

### Zustand Store (`useSelectionStore`)
```typescript
- selectedQuestions: Question[]
- addQuestion(question)
- removeQuestion(questionId)
- clearSelection()
- totalMarks()
- isSelected(questionId)
```

## 📊 Mock Data

All pages use mock data from `lib/mockData.ts`:
- 12 sample questions
- 2 blueprint templates
- 3 generated papers
- 5 audit log entries

## 🚦 Getting Started

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Run development server**:
   ```bash
   npm run dev
   ```

3. **Open browser**:
   Navigate to `http://localhost:3000`

## 📱 Routes

| Route | Description |
|-------|-------------|
| `/` | Landing page |
| `/login` | Login page |
| `/signup` | Signup page |
| `/dashboard` | Dashboard overview |
| `/dashboard/upload` | Upload question banks |
| `/dashboard/library` | Browse questions |
| `/dashboard/manual` | Manual question selection |
| `/dashboard/blueprint` | Create blueprints |
| `/dashboard/auto` | Auto-generate papers |
| `/dashboard/generated` | View generated papers |
| `/dashboard/audit` | Audit logs |

## 🎯 Key Components

### UI Components
- **Button**: 4 variants (default, outline, ghost, destructive)
- **Card**: Modular card with header, content, footer
- **Input**: Styled form input
- **Badge**: Status badges with color variants

### Layout Components
- **Dashboard Layout**: Sidebar + topbar wrapper
- **Responsive Design**: Mobile-friendly grid layouts

## 🔐 Authentication Flow

1. User visits `/login` or `/signup`
2. Form submission (no real auth logic)
3. Redirect to `/dashboard`
4. Logout button redirects to `/login`

## 📝 Notes

- **Frontend Only**: No backend API calls
- **Mock Data**: All data is static/mocked
- **No Database**: No Supabase integration
- **Production UI**: Professional, polished design
- **Fully Responsive**: Works on all screen sizes

## 🎨 UI Quality Features

- Soft shadows and rounded corners
- Smooth transitions and hover effects
- Custom scrollbar styling
- Gradient backgrounds
- Professional color palette
- Consistent spacing and typography

## 🚀 Build for Production

```bash
npm run build
npm start
```

## 📦 Dependencies

```json
{
  "dependencies": {
    "next": "16.1.6",
    "react": "19.2.3",
    "react-dom": "19.2.3",
    "zustand": "^5.0.2",
    "@tanstack/react-query": "^5.62.11",
    "lucide-react": "^0.468.0",
    "clsx": "^2.1.1",
    "tailwind-merge": "^2.6.0"
  }
}
```

## 🎯 Future Enhancements

- Connect to backend API
- Real authentication with Supabase
- File upload functionality
- PDF generation
- Real-time collaboration
- Advanced filtering
- Export to multiple formats

---

**Built with ❤️ for educational institutions**

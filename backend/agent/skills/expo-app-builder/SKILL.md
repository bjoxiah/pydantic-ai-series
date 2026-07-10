---
name: expo-app-builder
description: Use this skill when building React Native screens, components, navigation, or any Expo app feature. Covers file structure, coding conventions, styling with twrnc, a built-in design system, state management, and content guidelines.
---

# Expo App Builder Skill

## File Structure

```
src/app/
├── _layout.tsx           # root layout with Stack navigator
├── index.tsx             # home screen
└── {feature}/
    └── index.tsx         # feature screens
src/components/           # reusable components
src/context/              # React Context providers
src/data/
    └── mock.ts           # realistic seed data
src/hooks/                # custom hooks
src/lib/
    └── tw.ts             # shared twrnc instance
src/constants/
    └── theme.ts          # design tokens (generated per app)
```

## Path alias — configure immediately after scaffold

The scaffold generates `"@/*": ["./*"]` (project root). Change it to `./src/*` so
`@/lib/tw` resolves to `src/lib/tw`, matching all import examples in this skill.

After scaffolding, overwrite `tsconfig.json` in the project root:
```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "paths": { "@/*": ["./src/*"] }
  }
}
```

**Always** import using `@/` from the `src/` root — never use `../` traversals or `@/src/` prefixes:
```ts
import tw from "@/lib/tw";           // ✅
import { theme } from "@/constants/theme"; // ✅
import tw from "../lib/tw";           // ❌
import tw from "@/src/lib/tw";        // ❌
```

## Package rules

The app is previewed as a **web build** (`expo export --platform web`) served in an iframe.
Only install packages that work in the Expo web target.

### ✅ Safe packages by category

**Styling:** `twrnc` — pure JS Tailwind, already set up, use this for everything

**Icons:** `@expo/vector-icons` — bundled in Expo, no install needed

**Date/time:** `date-fns` — formatting, parsing, relative time

**Utilities:** `lodash`, `uuid` — pure JS, always safe

**Images:** `expo-image` — optimised image component, web compatible

**Media:** `expo-av` — audio/video playback, basic web support

**File picking:** `expo-image-picker` — uses browser file input on web

**Graphics/SVG:** `react-native-svg` — install with `npx expo install react-native-svg`

**Animations:** `react-native-reanimated` v3+ has full web support.
  Install: `npx expo install react-native-reanimated`
  Required: add `plugins: ['react-native-reanimated/plugin']` to `babel.config.js`

**Expo SDK (no extra install):**
`expo-router`, `expo-status-bar`, `expo-font`, `expo-splash-screen`,
`expo-linking`, `expo-constants`, `expo-haptics`, `expo-blur`, `expo-linear-gradient`

**Charts/graphs:** Build with `View` + `Text` using width percentages and `twrnc` — fully compatible, looks great, zero deps. Do not install a chart library.

**Storage:** React Context + `useState` — in-memory, no persistence needed.

### ❌ Never install
- `react-native-gesture-handler` — requires native setup too complex for sandbox
- `@react-native-async-storage/async-storage` — native module
- `victory-native`, `react-native-chart-kit` — web-incompatible
- `expo-sqlite`, `expo-camera`, `expo-location`, `expo-sensors` — native only
- `react-native-maps` — native only
- Node.js built-ins (`fs`, `path`, `crypto`, `stream`) — no Node runtime in RN

## Coding Rules
- Use Expo Router for ALL navigation (file-based routing in src/app/)
- Use TypeScript for every file — no plain JS
- Use React Native core components: View, Text, TouchableOpacity, ScrollView, FlatList, TextInput
- Always wrap text in <Text> — never raw strings
- Never use <div>, <p>, <button>, <input> — always RN equivalents
- Always handle loading and error states
- Keep components small and focused

## Styling — twrnc only

Style every component using `twrnc`. Never use StyleSheet.create(), never
use inline style objects, never use className props.

```tsx
import tw from "@/lib/tw";

// correct
<View style={tw`flex-1 bg-white px-4 pt-6`}>
  <Text style={tw`text-xl font-semibold text-neutral-900`}>Title</Text>
</View>

// wrong — never do this
<View style={styles.container}>
<View className="flex-1 bg-white">
<View style={{ flex: 1, backgroundColor: 'white' }}>
```

### twrnc setup — two steps only
1. Install:
```bash
npx expo install twrnc
```

2. Create src/lib/tw.ts:
```ts
import tw from "twrnc";
export default tw;
```

3. Import in every screen and component:
```ts
import tw from "@/lib/tw";
```

That is all. twrnc is pure JavaScript — zero config needed.
NO babel.config.js changes. NO metro.config.js changes. NO tailwind.config.js.
Do NOT read, create, or modify metro.config.js for any twrnc-related reason.

## Design system — generate per app, then stay consistent

Before writing any screens, create src/constants/theme.ts based on the
approved plan's theme recommendation. Use it on every screen without exception.
Never mix themes or invent new values mid-build.

### Theme generation — do this first

**Light theme** (productivity, health, lifestyle, finance)
```ts
export const theme = {
  bg: "bg-white",
  bgSecondary: "bg-neutral-50",
  surface: "bg-white",
  border: "border-neutral-200",
  text: "text-neutral-900",
  textMuted: "text-neutral-500",
  textInverse: "text-white",
  accent: "bg-blue-600",
  accentText: "text-blue-600",
  accentFg: "text-white",
  danger: "bg-red-500",
  success: "bg-green-600",
} as const;
```

**Dark theme** (entertainment, sports, gaming, nighttime)
```ts
export const theme = {
  bg: "bg-neutral-950",
  bgSecondary: "bg-neutral-900",
  surface: "bg-neutral-800",
  border: "border-neutral-700",
  text: "text-neutral-50",
  textMuted: "text-neutral-400",
  textInverse: "text-neutral-950",
  accent: "bg-violet-500",
  accentText: "text-violet-400",
  accentFg: "text-white",
  danger: "bg-red-500",
  success: "bg-emerald-500",
} as const;
```

Accent color by category:
- Finance/banking → blue-600 / indigo-600
- Health/fitness → green-600 / emerald-600
- Entertainment/sports → violet-500 / purple-600
- Food/lifestyle → orange-500 / amber-500
- Travel → sky-500 / cyan-600
- Social → pink-500 / rose-500

### Component patterns using theme tokens
```tsx
import tw from "@/lib/tw";
import { theme } from "@/constants/theme";

// Screen container
<View style={tw`flex-1 ${theme.bg} px-5 pt-4`}>

// Primary button
<TouchableOpacity style={tw`${theme.accent} rounded-xl py-3.5 px-6 items-center`}>
  <Text style={tw`${theme.accentFg} font-semibold text-base`}>Label</Text>
</TouchableOpacity>

// Card
<View style={tw`${theme.surface} rounded-2xl p-4 border ${theme.border}`}>
  <Text style={tw`${theme.text} font-semibold text-base`}>Title</Text>
  <Text style={tw`${theme.textMuted} text-sm mt-1`}>Subtitle</Text>
</View>

// Text input
<TextInput
  style={tw`border ${theme.border} ${theme.surface} rounded-xl px-4 py-3 ${theme.text} text-base`}
  placeholderTextColor="#6b7280"
/>
```

## State Management

Use React Context + useState for shared state. Mock data lives in
`src/data/mock.ts` and is the initial state for every store.

### Mock data pattern
```ts
// src/data/mock.ts
export const WORKOUTS = [
  { id: "w1", title: "Push Day", date: "2024-10-12", duration: 52 },
  { id: "w2", title: "Pull Day", date: "2024-10-10", duration: 58 },
];
```

### Context pattern
```tsx
// src/context/WorkoutContext.tsx
import { createContext, useContext, useState } from "react";
import { WORKOUTS } from "@/data/mock";

const WorkoutContext = createContext<any>(null);

export function WorkoutProvider({ children }: { children: React.ReactNode }) {
  const [workouts, setWorkouts] = useState(WORKOUTS);
  const add = (w: any) => setWorkouts((prev) => [w, ...prev]);
  return (
    <WorkoutContext.Provider value={{ workouts, add }}>
      {children}
    </WorkoutContext.Provider>
  );
}

export const useWorkouts = () => useContext(WorkoutContext);
```

Wrap the root layout with providers:
```tsx
// src/app/_layout.tsx
import { WorkoutProvider } from "@/context/WorkoutContext";

export default function RootLayout() {
  return (
    <WorkoutProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </WorkoutProvider>
  );
}
```

### Rules
- useState for local screen state (form inputs, toggles)
- Context + useState for data shared across screens
- Mock data seeded in src/data/mock.ts — realistic, never placeholder

## Content — realistic, never placeholder

**No lorem ipsum. No "placeholder text". No "TODO". No "Sample item 1".**

Every screen must contain realistic content matching the actual app domain:
- Football app → real team names (Manchester City, Arsenal, Liverpool)
- Recipe app → real recipe names, real ingredients, real cook times
- Fitness app → real exercise names, real rep counts, real muscle groups
- Finance app → realistic account names, realistic amounts, realistic dates

For images, use Unsplash free URL API — no API key needed:
```tsx
<Image source={{ uri: "https://source.unsplash.com/800x600/?fitness,workout" }} />
```

## Navigation — mandatory on every screen

Every screen except true leaf/dead-end screens MUST have navigation:
```tsx
import { Link, useRouter } from "expo-router";

const router = useRouter();
router.push("/detail/123");
router.back();
```

NEVER leave a user stuck on a screen with no way to navigate.

## Git & GitHub Workflow

Git is set up immediately after scaffold — ALL feature work happens on the feature branch from the start.

Execute in this exact order, one tool call at a time:

### Phase 1 — right after scaffold + base deps

**Step 3.** Create `.gitignore` in the project root:
```
node_modules/
.expo/
dist/
.env
.env.local
*.log
.DS_Store
```
Then `git_init(project_path, "")` — sets up local git on `main` (no remote yet).

**Step 4.** `create_github_repo(repo_name)` → get `clone_url`.

**Step 5.** `git_commit(project_path, "chore: initial scaffold")` — commits scaffold files.

**Step 6.** `git_set_remote(project_path, clone_url)` then `git_push(project_path, "main")` — main is now the clean base on remote.

**Step 7.** `git_create_branch(project_path, "feature/<feature_branch_name>")` — all remaining work happens here.

### Phase 2 — after all screens built and `expo export` passes

**Step 10.** `git_commit(project_path, "feat: build <app-name>")` — stages and commits everything.

**Step 11.** `git_push(project_path, "feature/<feature_branch_name>")` — pushes feature branch.

**Step 12.** `create_pull_request(repo_name, "feature/<feature_branch_name>")` → returns `pr_url`.

Include `repo_url` (strip `.git` suffix from `clone_url`) and `pr_url` in your `BuildResult`.
If any git step fails, fix the cause and retry once — never skip.

## What to build
- All screens from the approved plan
- Consistent theme throughout
- Realistic content
- Full navigation wiring
- Complete, not a wireframe or skeleton
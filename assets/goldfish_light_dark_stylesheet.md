# Goldfish Web App Stylesheet Reference

## Brand feeling

Goldfish should feel warm, playful, musical, and slightly magical. The interface is clean and modern, but the orange fish mascot and handwritten accents keep it from feeling too corporate.

---

# Light Mode

## Colour palette

| Use | Colour | Hex |
|---|---:|---:|
| Page background | Warm ivory | `#FFF8EF` |
| Main surface | Soft white | `#FFFCF7` |
| Card background | Cream white | `#FFFDF9` |
| Sidebar background | Pale cream | `#FFF7ED` |
| Primary orange | Goldfish orange | `#F97316` |
| Deep orange | Button hover / strong accents | `#EA580C` |
| Soft orange fill | Active nav / clip highlight | `#FFE8D1` |
| Pale orange wash | Hero illustration background | `#FFF1E3` |
| Text primary | Ink navy | `#111827` |
| Text secondary | Slate grey | `#4B5563` |
| Text muted | Warm grey | `#8A8178` |
| Borders | Soft warm border | `#EADFD3` |
| Waveform inactive | Light grey | `#D8D1CA` |
| Success / sparkle accent | Golden orange | `#FB923C` |

## Typography

| Element | Suggested font | Style |
|---|---|---|
| Logo wordmark | `Playfair Display` | Serif, bold, orange |
| Main headline | `Playfair Display` | Serif, bold, high contrast |
| Body/UI text | `Inter` or `Nunito Sans` | Clean sans serif |
| Handwritten note | `Caveat` | Casual marker style |

## Font scale

```css
--font-logo: 32px;
--font-hero: 56px;
--font-section-title: 18px;
--font-card-title: 15px;
--font-body: 16px;
--font-small: 13px;
--font-caption: 12px;
```

## CSS variables

```css
:root {
  --background: #FFF8EF;
  --surface: #FFFCF7;
  --surface-card: #FFFDF9;
  --sidebar: #FFF7ED;

  --primary: #F97316;
  --primary-hover: #EA580C;
  --primary-soft: #FFE8D1;
  --primary-wash: #FFF1E3;

  --text-primary: #111827;
  --text-secondary: #4B5563;
  --text-muted: #8A8178;

  --border: #EADFD3;
  --waveform-muted: #D8D1CA;
  --sparkle: #FB923C;

  --shadow-soft: 0 12px 30px rgba(249, 115, 22, 0.08);
  --shadow-card: 0 8px 20px rgba(17, 24, 39, 0.05);

  --radius-small: 10px;
  --radius-medium: 16px;
  --radius-large: 24px;
}
```

## Component styling notes

### Sidebar

```css
.sidebar {
  background: var(--sidebar);
  border-right: 1px solid var(--border);
}

.nav-item.active {
  background: var(--primary-soft);
  color: var(--primary);
  border-radius: var(--radius-medium);
}
```

### Hero section

```css
.hero {
  background: linear-gradient(90deg, #FFFCF7 0%, #FFF4E8 100%);
  border-bottom: 1px solid var(--border);
}

.hero h1 {
  font-family: 'Playfair Display', serif;
  color: var(--text-primary);
  letter-spacing: -0.04em;
  line-height: 1.05;
}

.hero h1 .accent {
  color: var(--primary);
}
```

### Primary button

```css
.primary-button {
  background: linear-gradient(180deg, #FB923C 0%, #F97316 100%);
  color: white;
  border-radius: 14px;
  box-shadow: 0 8px 18px rgba(249, 115, 22, 0.25);
}

.primary-button:hover {
  background: var(--primary-hover);
}
```

### Cards

```css
.card {
  background: var(--surface-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-medium);
  box-shadow: var(--shadow-card);
}
```

### Waveform clips

```css
.waveform-muted {
  color: var(--waveform-muted);
}

.waveform-active {
  color: var(--primary);
}

.clip-highlight {
  background: rgba(249, 115, 22, 0.12);
  border-left: 2px solid var(--primary);
  border-right: 2px solid var(--primary);
}
```

---

# Dark Mode

## Colour palette

| Use | Colour | Hex |
|---|---:|---:|
| Page background | Near black blue | `#070B10` |
| Main surface | Charcoal navy | `#0D1117` |
| Card background | Deep graphite | `#11161D` |
| Sidebar background | Almost black | `#070A0E` |
| Primary orange | Goldfish orange | `#F97316` |
| Bright orange | Glow / active state | `#FB923C` |
| Deep orange | Button hover | `#EA580C` |
| Soft dark orange fill | Highlight background | `#2A160A` |
| Text primary | Warm white | `#F8F5F0` |
| Text secondary | Soft grey | `#C8C1B8` |
| Text muted | Dim grey | `#817A72` |
| Borders | Dark warm border | `#2A2F36` |
| Card border active | Burnt orange border | `#7C2D12` |
| Waveform inactive | Charcoal grey | `#4B5563` |
| Glow | Orange glow | `rgba(249, 115, 22, 0.32)` |

## CSS variables

```css
[data-theme='dark'] {
  --background: #070B10;
  --surface: #0D1117;
  --surface-card: #11161D;
  --sidebar: #070A0E;

  --primary: #F97316;
  --primary-hover: #EA580C;
  --primary-soft: #2A160A;
  --primary-wash: #1A0E07;

  --text-primary: #F8F5F0;
  --text-secondary: #C8C1B8;
  --text-muted: #817A72;

  --border: #2A2F36;
  --border-active: #7C2D12;
  --waveform-muted: #4B5563;
  --sparkle: #FB923C;

  --shadow-soft: 0 18px 40px rgba(249, 115, 22, 0.16);
  --shadow-card: 0 12px 30px rgba(0, 0, 0, 0.35);
  --glow-orange: 0 0 32px rgba(249, 115, 22, 0.32);
}
```

## Component styling notes

### Sidebar

```css
[data-theme='dark'] .sidebar {
  background: var(--sidebar);
  border-right: 1px solid var(--border);
}

[data-theme='dark'] .nav-item.active {
  background: rgba(249, 115, 22, 0.12);
  color: var(--primary);
  border: 1px solid rgba(249, 115, 22, 0.28);
}
```

### Hero section

```css
[data-theme='dark'] .hero {
  background: radial-gradient(circle at 75% 40%, rgba(249, 115, 22, 0.18), transparent 34%),
              linear-gradient(90deg, #0D1117 0%, #070B10 100%);
  border-bottom: 1px solid var(--border);
}

[data-theme='dark'] .hero h1 {
  color: var(--text-primary);
  text-shadow: 0 2px 18px rgba(0, 0, 0, 0.4);
}

[data-theme='dark'] .hero h1 .accent {
  color: var(--primary);
}
```

### Primary button

```css
[data-theme='dark'] .primary-button {
  background: linear-gradient(180deg, #FB923C 0%, #F97316 100%);
  color: white;
  box-shadow: var(--glow-orange);
}

[data-theme='dark'] .primary-button:hover {
  background: var(--primary-hover);
}
```

### Cards

```css
[data-theme='dark'] .card {
  background: linear-gradient(180deg, rgba(255,255,255,0.035), rgba(255,255,255,0.015));
  border: 1px solid var(--border);
  border-radius: var(--radius-medium);
  box-shadow: var(--shadow-card);
}

[data-theme='dark'] .card:hover {
  border-color: rgba(249, 115, 22, 0.35);
}
```

### Waveform clips

```css
[data-theme='dark'] .waveform-muted {
  color: var(--waveform-muted);
}

[data-theme='dark'] .waveform-active {
  color: var(--primary);
  filter: drop-shadow(0 0 8px rgba(249, 115, 22, 0.35));
}

[data-theme='dark'] .clip-highlight {
  background: rgba(249, 115, 22, 0.13);
  border-left: 2px solid var(--primary);
  border-right: 2px solid var(--primary);
}
```

---

# Shared layout rules

```css
.app-shell {
  min-height: 100vh;
  display: grid;
  grid-template-columns: 280px 1fr;
  background: var(--background);
  color: var(--text-primary);
  font-family: 'Inter', sans-serif;
}

.main-content {
  display: grid;
  grid-template-rows: auto 1fr;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: 0.85fr 1.15fr;
  gap: 24px;
  padding: 28px 32px;
}

.session-list,
.moment-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.session-row,
.moment-row {
  display: grid;
  align-items: center;
  gap: 16px;
  padding: 14px 16px;
  border-radius: var(--radius-medium);
}
```

---

# Recommended Google Fonts import

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Caveat:wght@500;600;700&family=Inter:wght@400;500;600;700&family=Playfair+Display:wght@600;700&display=swap" rel="stylesheet">
```

---

# Quick design judgement

The main risk is making the app too cute and losing the musician/pro audio feeling. Keep the mascot playful, but keep the dashboard structure sharp, spacious, and functional. The orange should be an accent, not the whole experience.

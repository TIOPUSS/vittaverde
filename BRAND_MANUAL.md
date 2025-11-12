# 🌿 Manual da Marca VittaVerde
## Brand Guidelines & Design System

> **Versão 1.0** | Atualizado em Outubro 2025  
> Plataforma de Intermediação de Importação Cannabis Medicinal

---

## 📋 Índice

1. [Identidade Visual](#identidade-visual)
2. [Paleta de Cores](#paleta-de-cores)
3. [Tipografia](#tipografia)
4. [Espaçamentos & Grid](#espaçamentos--grid)
5. [Componentes UI](#componentes-ui)
6. [Iconografia](#iconografia)
7. [Animações](#animações)
8. [Temas de Produtos](#temas-de-produtos)
9. [Modo Escuro](#modo-escuro)
10. [Acessibilidade](#acessibilidade)

---

## 🎨 Identidade Visual

### Logo & Marca
- **Nome**: VittaVerde
- **Slogan**: "Transforme sua Vida com Cannabis Medicinal"
- **Posicionamento**: Plataforma de intermediação de importação de produtos CBD legais no Brasil

### Valores da Marca
- 🌿 **Natural e Saudável**: Saúde e bem-estar através da cannabis medicinal
- 🔬 **Científico e Profissional**: Baseado em evidências e regulamentação
- 🤝 **Empático e Acolhedor**: Cuidado humanizado com os pacientes
- ✅ **Legal e Regulamentado**: Conformidade total com ANVISA (RDC 660/2022)

---

## 🎨 Paleta de Cores

### Cores Primárias da Marca

#### Verde VittaVerde (Principal)
```css
--vitta-green-primary: #059669    /* Emerald 600 */
--vitta-green-hover: #047857      /* Emerald 700 */
--vitta-green-light: #10b981      /* Emerald 500 */
--vitta-green-bg: #f0fdf4         /* Emerald 50 */
```
**Uso**: Botões primários, CTAs, elementos de destaque, logo

#### Verde Secundário (Teal/Esmeralda)
```css
--vitta-teal: #14b8a6             /* Teal 500 */
--vitta-emerald: #10b981          /* Emerald 500 */
```
**Uso**: Gradientes, elementos secundários, detalhes

### Cores do Sistema (Design System)

#### Backgrounds & Surfaces
```css
/* Light Mode */
--background: hsl(0 0% 100%)           /* #FFFFFF - White */
--foreground: hsl(222.2 84% 4.9%)      /* #020817 - Near Black */
--card: hsl(0 0% 100%)                 /* #FFFFFF - White */
--card-foreground: hsl(222.2 84% 4.9%) /* #020817 */

/* Dark Mode */
--background: hsl(222.2 84% 4.9%)      /* #020817 - Dark Blue */
--foreground: hsl(210 40% 98%)         /* #F8FAFC - Off White */
```

#### Cores de Interface

**Primary (Ações Principais)**
```css
/* Light Mode */
--primary: hsl(222.2 47.4% 11.2%)      /* #1E293B - Slate 800 */
--primary-foreground: hsl(210 40% 98%) /* #F8FAFC - Off White */

/* Dark Mode */
--primary: hsl(210 40% 98%)            /* #F8FAFC - Off White */
--primary-foreground: hsl(222.2 47.4% 11.2%) /* #1E293B */
```

**Secondary (Elementos Secundários)**
```css
/* Light Mode */
--secondary: hsl(210 40% 96%)          /* #F1F5F9 - Slate 100 */
--secondary-foreground: hsl(222.2 84% 4.9%) /* #020817 */

/* Dark Mode */
--secondary: hsl(217.2 32.6% 17.5%)    /* #1E293B - Slate 800 */
--secondary-foreground: hsl(210 40% 98%) /* #F8FAFC */
```

**Muted (Texto e Elementos Discretos)**
```css
/* Light Mode */
--muted: hsl(210 40% 96%)              /* #F1F5F9 - Slate 100 */
--muted-foreground: hsl(215.4 16.3% 46.9%) /* #64748B - Slate 500 */

/* Dark Mode */
--muted: hsl(217.2 32.6% 17.5%)        /* #1E293B */
--muted-foreground: hsl(215 20.2% 65.1%) /* #94A3B8 - Slate 400 */
```

**Destructive (Ações Destrutivas/Erros)**
```css
/* Light Mode */
--destructive: hsl(0 84.2% 60.2%)      /* #EF4444 - Red 500 */
--destructive-foreground: hsl(210 40% 98%) /* #F8FAFC */

/* Dark Mode */
--destructive: hsl(0 62.8% 30.6%)      /* #991B1B - Red 800 */
--destructive-foreground: hsl(210 40% 98%) /* #F8FAFC */
```

**Accent (Destaques e Realces)**
```css
/* Light Mode */
--accent: hsl(210 40% 96%)             /* #F1F5F9 - Slate 100 */
--accent-foreground: hsl(222.2 84% 4.9%) /* #020817 */

/* Dark Mode */
--accent: hsl(217.2 32.6% 17.5%)       /* #1E293B */
--accent-foreground: hsl(210 40% 98%)  /* #F8FAFC */
```

#### Bordas e Inputs
```css
/* Light Mode */
--border: hsl(214.3 31.8% 91.4%)       /* #E2E8F0 - Slate 200 */
--input: hsl(214.3 31.8% 91.4%)        /* #E2E8F0 */
--ring: hsl(222.2 84% 4.9%)            /* #020817 - Focus ring */

/* Dark Mode */
--border: hsl(217.2 32.6% 17.5%)       /* #1E293B */
--input: hsl(217.2 32.6% 17.5%)        /* #1E293B */
--ring: hsl(212.7 26.8% 83.9%)         /* #CBD5E1 - Slate 300 */
```

### Cores Funcionais

#### Status & Feedback
```css
/* Sucesso */
--success: #10b981                     /* Emerald 500 */
--success-light: #d1fae5               /* Emerald 100 */

/* Aviso */
--warning: #f59e0b                     /* Amber 500 */
--warning-light: #fef3c7               /* Amber 100 */

/* Erro */
--error: #ef4444                       /* Red 500 */
--error-light: #fee2e2                 /* Red 100 */

/* Informação */
--info: #3b82f6                        /* Blue 500 */
--info-light: #dbeafe                  /* Blue 100 */
```

#### Cores Neutras (Grays)
```css
--gray-50: #f9fafb
--gray-100: #f3f4f6
--gray-200: #e5e7eb
--gray-300: #d1d5db
--gray-400: #9ca3af
--gray-500: #6b7280
--gray-600: #4b5563
--gray-700: #374151
--gray-800: #1f2937
--gray-900: #111827
```

### Cores de Produtos (Universidades)

#### 🩺 Universidade Médica (Médicos)
```css
/* Gradientes */
background: linear-gradient(to right, #059669, #0d9488); /* Emerald → Teal */
background: linear-gradient(to right, #10b981, #14b8a6); /* Emerald 500 → Teal 500 */

/* Cores Sólidas */
--medico-primary: #059669              /* Emerald 600 */
--medico-secondary: #0d9488            /* Teal 600 */
--medico-light: #d1fae5                /* Emerald 100 */
```

#### 👤 Universidade Paciente (Pacientes)
```css
/* Gradientes */
background: linear-gradient(to right, #84cc16, #22c55e); /* Lime → Green */
background: linear-gradient(to right, #a3e635, #10b981); /* Lime 400 → Emerald 500 */

/* Cores Sólidas */
--paciente-primary: #22c55e            /* Green 500 */
--paciente-secondary: #84cc16          /* Lime 500 */
--paciente-light: #f7fee7              /* Lime 50 */
```

#### 💼 Universidade Vendedor (Equipe Comercial)
```css
/* Gradientes */
background: linear-gradient(to right, #3b82f6, #6366f1); /* Blue → Indigo */
background: linear-gradient(135deg, #0f172a, #1e3a8a, #4338ca); /* Slate → Blue → Indigo */

/* Cores Sólidas */
--vendedor-primary: #3b82f6            /* Blue 500 */
--vendedor-secondary: #6366f1          /* Indigo 500 */
--vendedor-dark: #1e293b               /* Slate 800 */
```

### CRM & Dashboard
```css
/* CRM Principal */
--crm-primary: #3b82f6                 /* Blue 500 */
--crm-secondary: #06b6d4               /* Cyan 500 */
--crm-gradient: linear-gradient(135deg, #3b82f6, #06b6d4);

/* Lead Scores */
--score-high: #22c55e                  /* Green 500 - 75+ */
--score-medium: #f59e0b                /* Yellow 500 - 50-74 */
--score-low: #f97316                   /* Orange 500 - 25-49 */
--score-very-low: #ef4444              /* Red 500 - <25 */
```

### Cores dos Stages do Kanban
```css
--stage-blue: #3b82f6                  /* Blue 500 */
--stage-indigo: #6366f1                /* Indigo 500 */
--stage-purple: #a855f7                /* Purple 500 */
--stage-pink: #ec4899                  /* Pink 500 */
--stage-orange: #f97316                /* Orange 500 */
--stage-yellow: #eab308                /* Yellow 500 */
--stage-green: #22c55e                 /* Green 500 */
--stage-emerald: #10b981               /* Emerald 500 */
--stage-cyan: #06b6d4                  /* Cyan 500 */
```

---

## 📝 Tipografia

### Família de Fontes

#### Fonte Principal
```css
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif;
```

**Inter** é uma fonte sans-serif moderna e legível, otimizada para interfaces digitais.

- **Importação**: Google Fonts
- **Pesos disponíveis**: 300, 400, 500, 600, 700, 800
- **Uso**: Todo o sistema (títulos, corpo de texto, botões, labels)

### Escala Tipográfica

#### Headings (Títulos)

```css
/* H1 - Hero Titles */
h1 {
  font-size: 3.5rem;        /* 56px */
  font-weight: 700;         /* Bold */
  line-height: 1.2;
  color: #111827;           /* Gray 900 */
}

/* Mobile */
@media (max-width: 768px) {
  h1 { font-size: 2.5rem; } /* 40px */
}

/* H2 - Section Titles */
h2 {
  font-size: 2.25rem;       /* 36px */
  font-weight: 700;
  line-height: 1.2;
  color: #111827;
}

/* Mobile */
@media (max-width: 768px) {
  h2 { font-size: 1.875rem; } /* 30px */
}

/* H3 - Subsection Titles */
h3 {
  font-size: 1.875rem;      /* 30px */
  font-weight: 700;
  line-height: 1.2;
  color: #111827;
}

/* H4 - Card Titles */
h4 {
  font-size: 1.5rem;        /* 24px */
  font-weight: 600;
  line-height: 1.3;
}

/* H5 - Small Headings */
h5 {
  font-size: 1.25rem;       /* 20px */
  font-weight: 600;
  line-height: 1.4;
}

/* H6 - Micro Headings */
h6 {
  font-size: 1rem;          /* 16px */
  font-weight: 600;
  line-height: 1.5;
}
```

#### Body Text (Corpo de Texto)

```css
/* Tamanho Base */
body {
  font-size: 16px;
  line-height: 1.6;
  color: #374151;           /* Gray 700 */
}

/* Large Text */
.text-lg {
  font-size: 1.125rem;      /* 18px */
  line-height: 1.75;
}

/* Base Text */
.text-base {
  font-size: 1rem;          /* 16px */
  line-height: 1.5;
}

/* Small Text */
.text-sm {
  font-size: 0.875rem;      /* 14px */
  line-height: 1.25;
}

/* Extra Small Text */
.text-xs {
  font-size: 0.75rem;       /* 12px */
  line-height: 1;
}
```

#### Pesos de Fonte (Font Weights)

```css
.font-light { font-weight: 300; }      /* Light */
.font-normal { font-weight: 400; }     /* Regular */
.font-medium { font-weight: 500; }     /* Medium */
.font-semibold { font-weight: 600; }   /* Semibold */
.font-bold { font-weight: 700; }       /* Bold */
.font-extrabold { font-weight: 800; }  /* Extra Bold */
```

#### Cores de Texto

```css
/* Primary Text */
.text-primary { color: #111827; }      /* Gray 900 */

/* Secondary Text */
.text-secondary { color: #374151; }    /* Gray 700 */

/* Muted Text */
.text-muted { color: #6b7280; }        /* Gray 500 */

/* Disabled Text */
.text-disabled { color: #9ca3af; }     /* Gray 400 */

/* Accent Text */
.text-accent { color: #059669; }       /* VittaVerde Green */
```

---

## 📐 Espaçamentos & Grid

### Sistema de Espaçamento (8px Base)

```css
/* Tailwind Spacing Scale */
--spacing-0: 0px;
--spacing-1: 0.25rem;      /* 4px */
--spacing-2: 0.5rem;       /* 8px */
--spacing-3: 0.75rem;      /* 12px */
--spacing-4: 1rem;         /* 16px */
--spacing-5: 1.25rem;      /* 20px */
--spacing-6: 1.5rem;       /* 24px */
--spacing-8: 2rem;         /* 32px */
--spacing-10: 2.5rem;      /* 40px */
--spacing-12: 3rem;        /* 48px */
--spacing-16: 4rem;        /* 64px */
--spacing-20: 5rem;        /* 80px */
--spacing-24: 6rem;        /* 96px */
```

### Containerização

```css
/* Max Width Containers */
.max-w-screen-sm: 640px;
.max-w-screen-md: 768px;
.max-w-screen-lg: 1024px;
.max-w-screen-xl: 1280px;
.max-w-screen-2xl: 1536px;

/* Page Container */
.max-w-\[1920px\]: 1920px;  /* Ultra-wide screens */
```

### Grid System

```css
/* 12-Column Grid */
.grid-cols-12 {
  grid-template-columns: repeat(12, minmax(0, 1fr));
}

/* Common Layouts */
.grid-cols-1: 1 column (mobile)
.grid-cols-2: 2 columns (tablet)
.grid-cols-3: 3 columns (desktop)
.grid-cols-4: 4 columns (wide desktop)

/* Gap */
.gap-4: 1rem (16px)
.gap-6: 1.5rem (24px)
.gap-8: 2rem (32px)
```

### Raio de Borda (Border Radius)

```css
--radius: 0.5rem;          /* 8px - Base */

.rounded-sm: calc(var(--radius) - 4px);  /* 4px */
.rounded-md: calc(var(--radius) - 2px);  /* 6px */
.rounded-lg: var(--radius);               /* 8px */
.rounded-xl: 12px;
.rounded-2xl: 16px;
.rounded-3xl: 24px;
.rounded-full: 9999px;
```

---

## 🧩 Componentes UI

### Botões

#### Botão Primário
```css
.btn-primary {
  background-color: #059669;     /* VittaVerde Green */
  color: white;
  border: none;
  border-radius: 6px;
  padding: 12px 24px;
  font-weight: 600;
  font-size: 16px;
  transition: background-color 0.2s ease;
}

.btn-primary:hover {
  background-color: #047857;     /* Darker Green */
}
```

#### Botão Outline
```css
.btn-outline {
  background-color: white;
  color: #059669;
  border: 1px solid #059669;
  border-radius: 6px;
  padding: 12px 24px;
  font-weight: 600;
  font-size: 16px;
  transition: all 0.2s ease;
}

.btn-outline:hover {
  background-color: #f0fdf4;     /* Light Green BG */
}
```

#### Tamanhos de Botões
```css
/* Small */
.btn-sm { padding: 8px 16px; font-size: 14px; }

/* Medium (Default) */
.btn-md { padding: 12px 24px; font-size: 16px; }

/* Large */
.btn-lg { padding: 16px 32px; font-size: 18px; }
```

### Cards

```css
.card {
  background: white;
  border: 1px solid #e5e7eb;     /* Gray 200 */
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
}

/* Mobile */
@media (max-width: 768px) {
  .card { padding: 20px; }
}
```

### Inputs & Forms

```css
/* Input Field */
input, textarea, select {
  border: 1px solid #e2e8f0;     /* Slate 200 */
  border-radius: 6px;
  padding: 10px 14px;
  font-size: 16px;
  transition: border-color 0.2s;
}

input:focus {
  outline: 2px solid #3b82f6;    /* Blue 500 */
  outline-offset: 2px;
  border-color: #3b82f6;
}

/* Label */
label {
  font-weight: 500;
  font-size: 14px;
  color: #374151;                /* Gray 700 */
  margin-bottom: 6px;
  display: block;
}
```

### Badges & Tags

```css
/* Success Badge */
.badge-success {
  background: #d1fae5;           /* Emerald 100 */
  color: #065f46;                /* Emerald 800 */
  padding: 4px 12px;
  border-radius: 9999px;
  font-size: 14px;
  font-weight: 500;
}

/* Warning Badge */
.badge-warning {
  background: #fef3c7;           /* Amber 100 */
  color: #92400e;                /* Amber 800 */
}

/* Error Badge */
.badge-error {
  background: #fee2e2;           /* Red 100 */
  color: #991b1b;                /* Red 800 */
}
```

### Sombras (Shadows)

```css
/* Card Shadow */
box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);

/* Medium Shadow */
box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);

/* Large Shadow */
box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);

/* XL Shadow */
box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);

/* Glow Effect */
box-shadow: 0 0 20px rgba(5, 150, 105, 0.4);
```

---

## 🎭 Iconografia

### Biblioteca de Ícones
- **Lucide React**: Ícones principais do sistema
- **React Icons (Simple Icons)**: Logos de empresas e marcas

### Tamanhos de Ícones

```css
.icon-xs { width: 12px; height: 12px; }
.icon-sm { width: 16px; height: 16px; }
.icon-md { width: 20px; height: 20px; }   /* Default */
.icon-lg { width: 24px; height: 24px; }
.icon-xl { width: 32px; height: 32px; }
.icon-2xl { width: 48px; height: 48px; }
```

### Ícones Principais do Sistema

- **Home**: `Home`
- **Usuários**: `Users`, `User`, `UserCircle`
- **Produtos**: `Pill`, `Leaf`, `Package`
- **Pedidos**: `ShoppingCart`, `ShoppingBag`
- **ANVISA**: `Shield`, `FileCheck`, `CheckCircle`
- **Médicos**: `Stethoscope`, `Heart`, `Activity`
- **Dashboard**: `LayoutDashboard`, `BarChart3`, `PieChart`
- **Configurações**: `Settings`, `Cog`
- **Busca**: `Search`
- **Notificações**: `Bell`
- **Menu**: `Menu`, `X`

---

## ✨ Animações

### Keyframes Disponíveis

```css
/* Float Animation */
@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
}
.animate-float { animation: float 6s ease-in-out infinite; }

/* Fade In */
@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
.animate-fade-in { animation: fade-in 0.6s ease-out; }

/* Pulse Glow */
@keyframes pulse-glow {
  0%, 100% {
    box-shadow: 0 0 5px rgba(34, 197, 94, 0.2);
  }
  50% {
    box-shadow: 0 0 20px rgba(34, 197, 94, 0.4);
  }
}
.animate-pulse-glow { animation: pulse-glow 2s ease-in-out infinite; }

/* Shimmer Effect */
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
.animate-shimmer {
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
  background-size: 200% 100%;
  animation: shimmer 2s infinite;
}

/* Bounce Subtle */
@keyframes bounce-subtle {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-2px); }
}
.animate-bounce-subtle { animation: bounce-subtle 2s ease-in-out infinite; }

/* Slide In */
@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
.animate-slideIn { animation: slideIn 0.6s ease-out forwards; }
```

### Transições Comuns

```css
/* Hover Transitions */
transition: all 0.2s ease;
transition: background-color 0.2s ease;
transition: transform 0.3s ease;
transition: opacity 0.3s ease;

/* Scale on Hover */
.hover\:scale-105:hover {
  transform: scale(1.05);
}

/* Translate Up on Hover */
.hover\:-translate-y-2:hover {
  transform: translateY(-0.5rem);
}
```

---

## 🎨 Temas de Produtos

### 1. Universidade Médica 🩺

**Paleta**: Emerald → Teal (Verde Profissional)

```css
/* Hero Background */
background: linear-gradient(to right, 
  rgba(5, 150, 105, 0.2),    /* Emerald 600 */
  rgba(13, 148, 136, 0.2)    /* Teal 600 */
);

/* CTA Buttons */
background: linear-gradient(to right, #10b981, #14b8a6);

/* Accent Color */
color: #059669;              /* Emerald 600 */
```

### 2. Universidade Paciente 👤

**Paleta**: Lime → Green (Verde Esperança)

```css
/* Hero Background */
background: linear-gradient(to right, 
  rgba(132, 204, 22, 0.2),   /* Lime 500 */
  rgba(34, 197, 94, 0.2)     /* Green 500 */
);

/* CTA Buttons */
background: linear-gradient(to right, #84cc16, #22c55e);

/* Accent Color */
color: #22c55e;              /* Green 500 */
```

### 3. Universidade Vendedor 💼

**Paleta**: Blue → Indigo (Azul Profissional)

```css
/* Hero Background */
background: linear-gradient(135deg, 
  #0f172a,                   /* Slate 900 */
  #1e3a8a,                   /* Blue 800 */
  #4338ca                    /* Indigo 700 */
);

/* CTA Buttons */
background: linear-gradient(to right, #3b82f6, #6366f1);

/* Accent Color */
color: #3b82f6;              /* Blue 500 */
```

### 4. CRM & Comercial 📊

**Paleta**: Blue → Cyan (Azul Corporativo)

```css
/* Background Gradient */
background: linear-gradient(135deg, #3b82f6, #06b6d4);

/* Primary */
--crm-primary: #3b82f6;      /* Blue 500 */
--crm-secondary: #06b6d4;    /* Cyan 500 */
```

---

## 🌙 Modo Escuro

### Ativação
```typescript
darkMode: ["class"]          // Controlado por classe CSS
```

### Paleta Dark Mode

```css
.dark {
  --background: hsl(222.2 84% 4.9%);        /* #020817 - Dark Blue */
  --foreground: hsl(210 40% 98%);           /* #F8FAFC - Off White */
  
  --card: hsl(222.2 84% 4.9%);
  --card-foreground: hsl(210 40% 98%);
  
  --primary: hsl(210 40% 98%);              /* Inverted */
  --primary-foreground: hsl(222.2 47.4% 11.2%);
  
  --border: hsl(217.2 32.6% 17.5%);         /* #1E293B - Slate 800 */
  --input: hsl(217.2 32.6% 17.5%);
  
  --destructive: hsl(0 62.8% 30.6%);        /* Darker Red */
}
```

### Uso no Código

```tsx
/* Adicione a classe 'dark' ao elemento raiz */
<html className="dark">

/* Use variantes dark: no Tailwind */
<div className="bg-white dark:bg-slate-900 text-black dark:text-white">
```

---

## ♿ Acessibilidade

### Focus States

```css
.focus-visible {
  outline: 2px solid #3b82f6;    /* Blue 500 */
  outline-offset: 2px;
}

/* Focus para VittaVerde */
.focus\:ring-vitta:focus {
  outline: 2px solid #059669;    /* Emerald 600 */
  outline-offset: 2px;
}
```

### Contraste de Cores

Todas as combinações de cores seguem **WCAG 2.1 Level AA**:
- Texto normal: mínimo 4.5:1
- Texto grande (18px+): mínimo 3:1
- Componentes UI: mínimo 3:1

### Textos Alternativos

```tsx
/* Sempre forneça alt text para imagens */
<img src="/logo.svg" alt="Logo VittaVerde" />

/* Use aria-label para ícones */
<button aria-label="Fechar modal">
  <X className="h-5 w-5" />
</button>
```

### Navegação por Teclado

- Todos os elementos interativos são acessíveis via Tab
- Modais capturam foco e retornam ao fechar
- Dropdowns navegáveis com setas ↑↓

---

## 📦 Componentes Visuais Especiais

### Glassmorphism (Vidro Fosco)

```css
.glass {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 24px;
}

/* Dark Mode */
.dark .glass {
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.1);
}
```

### Efeito de Brilho Interativo

```css
.interactive-btn {
  position: relative;
  overflow: hidden;
}

.interactive-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
  transition: left 0.5s;
}

.interactive-btn:hover::before {
  left: 100%;
}
```

### Blur Orbs (Esferas Desfocadas)

```css
/* Hero Orbs */
.orb-green {
  position: absolute;
  width: 288px;
  height: 288px;
  background: rgba(16, 185, 129, 0.3);  /* Emerald 500 */
  border-radius: 9999px;
  filter: blur(64px);
  animation: pulse 4s ease-in-out infinite;
}
```

---

## 📋 Checklist de Consistência

Ao criar novos componentes, verifique:

- [ ] Usa cores da paleta definida (variáveis CSS)
- [ ] Tipografia segue a escala (Inter font)
- [ ] Espaçamento segue o sistema 8px
- [ ] Border radius usa valores padrão
- [ ] Animações usam transitions suaves
- [ ] Focus states são visíveis
- [ ] Funciona em modo escuro
- [ ] Contraste WCAG AA compliance
- [ ] Responsivo (mobile, tablet, desktop)
- [ ] Acessível via teclado

---

## 🎯 Recursos de Referência

### Ferramentas de Design
- **Tailwind CSS**: Framework CSS utility-first
- **Shadcn/ui**: Componentes React + Radix UI
- **Lucide Icons**: Biblioteca de ícones SVG
- **Google Fonts**: Inter font family

### Paletas de Cores Online
- [Coolors.co](https://coolors.co) - Gerador de paletas
- [Tailwind Colors](https://tailwindcss.com/docs/customizing-colors) - Referência oficial
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/) - Teste de contraste

### Exportação de Assets
```bash
# Logo SVG: /public/logo.svg
# Favicon: /public/favicon.ico
# OpenGraph: /public/og-image.png
```

---

**Versão**: 1.0  
**Última Atualização**: Outubro 2025  
**Responsável**: Equipe VittaVerde  
**Contato**: design@vittaverde.com.br

---

*Este manual deve ser consultado sempre que novos componentes ou páginas forem criados para garantir consistência visual em toda a plataforma VittaVerde.*

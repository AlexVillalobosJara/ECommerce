export interface ColorPalette {
    name: string;
    description: string;
    primary: string;
    secondary: string;
    success?: string;
    danger?: string;
    warning?: string;
    info?: string;
    muted?: string;
    // Component colors
    header_bg_color?: string;
    header_text_color?: string;
    hero_text_color?: string;
    hero_btn_bg_color?: string;
    hero_btn_text_color?: string;
    cta_text_color?: string;
    cta_btn_bg_color?: string;
    cta_btn_text_color?: string;
    footer_bg_color?: string;
    footer_text_color?: string;
    primary_btn_text_color?: string;
}

export const BASIC_PALETTES: ColorPalette[] = [
    {
        name: "Classic Black & White",
        description: "Minimalismo atemporal",
        primary: "#000000",
        secondary: "#FFFFFF",
        success: "#10B981",
        danger: "#EF4444",
        warning: "#F59E0B",
        info: "#3B82F6",
        muted: "#94A3B8",
        header_bg_color: "#000000",
        header_text_color: "#FFFFFF",
        hero_text_color: "#FFFFFF",
        hero_btn_bg_color: "#000000",
        hero_btn_text_color: "#FFFFFF",
        cta_text_color: "#000000",
        cta_btn_bg_color: "#000000",
        cta_btn_text_color: "#FFFFFF",
        footer_bg_color: "#000000",
        footer_text_color: "#FFFFFF",
        primary_btn_text_color: "#FFFFFF",
    },
    {
        name: "Ocean Blue",
        description: "Confianza y profesionalismo",
        primary: "#0EA5E9",
        secondary: "#F0F9FF",
        success: "#10B981",
        danger: "#EF4444",
        warning: "#F59E0B",
        info: "#06B6D4",
        muted: "#94A3B8",
    },
    {
        name: "Forest Green",
        description: "Sostenibilidad y crecimiento",
        primary: "#10B981",
        secondary: "#ECFDF5",
        success: "#059669",
        danger: "#DC2626",
        warning: "#F59E0B",
        info: "#0EA5E9",
        muted: "#9CA3AF",
    },
    {
        name: "Modern Slate",
        description: "Minimalismo y sofisticación",
        primary: "#475569",
        secondary: "#F8FAFC",
        success: "#10B981",
        danger: "#DC2626",
        warning: "#F59E0B",
        info: "#0EA5E9",
        muted: "#94A3B8",
    },
    {
        name: "Midnight Blue",
        description: "Elegancia corporativa",
        primary: "#1E40AF",
        secondary: "#EFF6FF",
        success: "#059669",
        danger: "#DC2626",
        warning: "#D97706",
        info: "#3B82F6",
        muted: "#94A3B8",
    },
    {
        name: "Electric Violet",
        description: "Innovación y creatividad",
        primary: "#8B5CF6",
        secondary: "#F5F3FF",
        success: "#10B981",
        danger: "#EF4444",
        warning: "#F59E0B",
        info: "#3B82F6",
        muted: "#94A3B8",
    },
    {
        name: "Sunset Orange",
        description: "Energía y creatividad",
        primary: "#F97316",
        secondary: "#FFF7ED",
        success: "#10B981",
        danger: "#DC2626",
        warning: "#FBBF24",
        info: "#3B82F6",
        muted: "#A3A3A3",
    },
    {
        name: "Royal Purple",
        description: "Elegancia y lujo",
        primary: "#9333EA",
        secondary: "#FAF5FF",
        success: "#10B981",
        danger: "#E11D48",
        warning: "#F59E0B",
        info: "#8B5CF6",
        muted: "#94A3B8",
    },
    {
        name: "Rose Gold",
        description: "Belleza y feminidad",
        primary: "#EC4899",
        secondary: "#FDF2F8",
        success: "#10B981",
        danger: "#BE185D",
        warning: "#F59E0B",
        info: "#A855F7",
        muted: "#9CA3AF",
    },
    {
        name: "Deep Indigo",
        description: "Tecnología e innovación",
        primary: "#4F46E5",
        secondary: "#EEF2FF",
        success: "#10B981",
        danger: "#DC2626",
        warning: "#F59E0B",
        info: "#6366F1",
        muted: "#94A3B8",
    },
    {
        name: "Emerald Teal",
        description: "Frescura y modernidad",
        primary: "#14B8A6",
        secondary: "#F0FDFA",
        success: "#059669",
        danger: "#DC2626",
        warning: "#F59E0B",
        info: "#06B6D4",
        muted: "#94A3B8",
    },
    {
        name: "Amber Gold",
        description: "Calidez y optimismo",
        primary: "#F59E0B",
        secondary: "#FFFBEB",
        success: "#10B981",
        danger: "#DC2626",
        warning: "#FBBF24",
        info: "#3B82F6",
        muted: "#A3A3A3",
    },
    {
        name: "Cherry Red",
        description: "Pasión y energía",
        primary: "#DC2626",
        secondary: "#FEF2F2",
        success: "#10B981",
        danger: "#B91C1C",
        warning: "#F59E0B",
        info: "#3B82F6",
        muted: "#9CA3AF",
    },
    {
        name: "Lime Fresh",
        description: "Vitalidad y naturaleza",
        primary: "#84CC16",
        secondary: "#F7FEE7",
        success: "#65A30D",
        danger: "#DC2626",
        warning: "#F59E0B",
        info: "#0EA5E9",
        muted: "#A3A3A3",
    },
    {
        name: "Lavender Dream",
        description: "Serenidad y calma",
        primary: "#A78BFA",
        secondary: "#F5F3FF",
        success: "#10B981",
        danger: "#E11D48",
        warning: "#F59E0B",
        info: "#8B5CF6",
        muted: "#A1A1AA",
    },
    {
        name: "Coral Sunset",
        description: "Calidez moderna",
        primary: "#FB7185",
        secondary: "#FFF1F2",
        success: "#10B981",
        danger: "#E11D48",
        warning: "#F59E0B",
        info: "#F472B6",
        muted: "#9CA3AF",
    },
    {
        name: "Turquoise Wave",
        description: "Frescura tropical",
        primary: "#06B6D4",
        secondary: "#ECFEFF",
        success: "#14B8A6",
        danger: "#DC2626",
        warning: "#F59E0B",
        info: "#0EA5E9",
        muted: "#94A3B8",
    }
];

// Premium palettes are now managed via the database and loaded from the API.

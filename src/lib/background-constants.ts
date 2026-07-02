export interface BackgroundIconConfig {
  icon: "github" | "gitlab" | "brand-anthropic" | "code" | "terminal" | "stack-3" | "layers" | "brain-circuit" | "code-xml" | "chart-line" | "chart-bar" | "message-circle";
  top?: string;
  left?: string;
  right?: string;
  bottom?: string;
  size: number; // 80px to 140px
  rotation: number; // -8deg to 8deg
}

export interface PageBackgroundConfig {
  icons: BackgroundIconConfig[];
  glowBlob: {
    top?: string;
    left?: string;
    right?: string;
    bottom?: string;
    transform?: string;
  };
}

export const BACKGROUND_CONFIGS: Record<string, PageBackgroundConfig> = {
  overview: {
    icons: [
      { icon: "github", left: "6%", top: "14%", size: 100, rotation: -6 },
      { icon: "gitlab", right: "10%", top: "22%", size: 120, rotation: 5 },
      { icon: "brain-circuit", left: "14%", bottom: "22%", size: 130, rotation: 8 },
      { icon: "layers", right: "8%", bottom: "16%", size: 90, rotation: -4 },
    ],
    glowBlob: { left: "15%", top: "10%" },
  },
  repositories: {
    icons: [
      { icon: "github", left: "8%", top: "18%", size: 110, rotation: -5 },
      { icon: "gitlab", right: "12%", top: "14%", size: 95, rotation: 7 },
      { icon: "stack-3", left: "16%", bottom: "24%", size: 140, rotation: -3 },
    ],
    glowBlob: { left: "20%", top: "15%" },
  },
  graph: {
    icons: [
      { icon: "brain-circuit", left: "5%", top: "16%", size: 130, rotation: 4 },
      { icon: "layers", right: "9%", top: "25%", size: 100, rotation: -7 },
      { icon: "code-xml", left: "12%", bottom: "20%", size: 115, rotation: 6 },
    ],
    glowBlob: { left: "50%", top: "40%", transform: "translate(-50%, -50%)" },
  },
  insights: {
    icons: [
      { icon: "chart-line", left: "7%", top: "12%", size: 120, rotation: -6 },
      { icon: "chart-bar", right: "10%", top: "20%", size: 110, rotation: 5 },
      { icon: "code", left: "14%", bottom: "16%", size: 100, rotation: 8 },
    ],
    glowBlob: { left: "25%", top: "20%" },
  },
  chat: {
    icons: [
      { icon: "message-circle", left: "6%", top: "18%", size: 110, rotation: 6 },
      { icon: "brain-circuit", right: "12%", top: "14%", size: 130, rotation: -8 },
      { icon: "brand-anthropic", left: "10%", bottom: "22%", size: 120, rotation: 5 },
    ],
    glowBlob: { left: "50%", top: "35%", transform: "translate(-50%, -50%)" },
  },
};

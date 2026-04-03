import { injectGlobal } from "@gtkx/css";

export const injectStyles = () => {
  injectGlobal`
    @keyframes stripes {
      to { background-position: 40px 0; }
    }
    progressbar.downloading > trough > progress {
      background-image: linear-gradient(
        -45deg,
        rgba(255, 255, 255, 0.15) 25%,
        transparent 25%,
        transparent 50%,
        rgba(255, 255, 255, 0.15) 50%,
        rgba(255, 255, 255, 0.15) 75%,
        transparent 75%,
        transparent
      );
      background-size: 40px 40px;
      animation: stripes 2s linear infinite;
    }
  `;
};

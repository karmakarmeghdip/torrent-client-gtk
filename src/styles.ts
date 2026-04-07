import { injectGlobal } from "@gtkx/css";

export const injectStyles = () => {
  injectGlobal`
    window {
      min-width: 600px;
      min-height: 400px;
    }
  `;
};

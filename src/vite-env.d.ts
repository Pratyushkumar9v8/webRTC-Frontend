/// <reference types="vite/client" />

interface Window {
  google?: {
    accounts: {
      id: {
        initialize: (config: {
          client_id: string;
          callback: (response: { credential?: string }) => void;
        }) => void;
        renderButton: (
          parent: HTMLElement,
          options: {
            theme?: "outline" | "filled_blue" | "filled_black";
            size?: "large" | "medium" | "small";
            width?: number;
            shape?: "rectangular" | "pill" | "circle" | "square";
            text?: "signin_with" | "signup_with" | "continue_with" | "signin";
          },
        ) => void;
      };
    };
  };
}

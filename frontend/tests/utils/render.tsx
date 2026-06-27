import type { ReactElement, ReactNode } from "react";
import { render as rtlRender } from "@testing-library/react";

type ProvidersProps = {
  children: ReactNode;
};

const AllProviders = ({ children }: ProvidersProps) => {
  return children;
};

const render = (ui: ReactElement, options?: Parameters<typeof rtlRender>[1]) =>
  rtlRender(ui, { wrapper: AllProviders, ...options });

export * from "@testing-library/react";
export { render };

import { fireEvent, render, screen } from "../utils/render";
import RegisterPage from "../../src/app/(public)/register/page";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

describe("RegisterPage", () => {
  it("reveals steps only after completing prior step", () => {
    render(<RegisterPage />);

    expect(screen.getByText(/step 1: sign up/i)).toBeInTheDocument();
    expect(screen.queryByText(/step 2: choose your role/i)).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/full name/i), {
      target: { value: "Alex Morgan" },
    });
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "alex@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: "supersecret" },
    });

    fireEvent.click(screen.getByRole("button", { name: /continue to role/i }));

    expect(screen.getByText(/step 2: choose your role/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /continue to kyc/i }));

    expect(screen.getByText(/step 3: verification & kyc/i)).toBeInTheDocument();
  });
});

import { render, screen } from "../utils/render";
import { act } from "react-dom/test-utils";
import Toast from "../../src/components/Toast";

describe("Toast", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it("renders nothing when message is null", () => {
    const onClear = jest.fn();
    const { container } = render(<Toast message={null} onClear={onClear} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders the message and clears after timeout", () => {
    const onClear = jest.fn();
    render(<Toast message="Saved!" onClear={onClear} />);

    expect(screen.getByRole("status")).toHaveTextContent("Saved!");
    expect(onClear).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(2800);
    });

    expect(onClear).toHaveBeenCalledTimes(1);
  });
});

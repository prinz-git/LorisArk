import { act, render, screen } from "../utils/render";
import Toast from "../../src/components/Toast";

describe("Toast", () => {
  beforeAll(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  afterAll(() => {
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

  it("passes through data-testid for targeting", () => {
    render(<Toast message="Saved!" onClear={jest.fn()} data-testid="toast" />);
    expect(screen.getByTestId("toast")).toHaveTextContent("Saved!");
  });
});

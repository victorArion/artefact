/** @jest-environment jsdom */
import { expect, jest, test } from "@jest/globals";
import { fireEvent, render, screen } from "@testing-library/react";
const refresh = jest.fn();
jest.doMock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));
const { default: TaskLoadError } = jest.requireActual<typeof import("@/components/task/loadError")>("@/components/task/loadError");

test("shows an accessible error and retries through the router", () => {
  const reset = jest.fn();
  render(<TaskLoadError message="Falha ao carregar" reset={reset} />);
  expect(screen.getByRole("alert").textContent).toContain("Falha ao carregar");
  fireEvent.click(screen.getByRole("button", { name: "Tentar novamente" }));
  expect(refresh).toHaveBeenCalled();
  expect(reset).toHaveBeenCalled();
});

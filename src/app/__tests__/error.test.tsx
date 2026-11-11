/** @jest-environment jsdom */

import { expect, jest, test } from "@jest/globals";
import { fireEvent, render, screen, within } from "@testing-library/react";

const refresh = jest.fn();
jest.doMock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));
const { default: AppError } = jest.requireActual<typeof import("@/app/error")>("@/app/error");

test("offers a retry that refreshes the route and resets the error boundary", () => {
  const reset = jest.fn();
  render(<AppError reset={reset} />);

  const alert = within(screen.getByRole("main")).getByRole("alert");
  expect(alert.textContent).toContain("Não foi possível exibir a página.");
  fireEvent.click(within(alert).getByRole("button", { name: "Tentar novamente" }));
  expect(refresh).toHaveBeenCalledTimes(1);
  expect(reset).toHaveBeenCalledTimes(1);
});

/** @jest-environment jsdom */

import { expect, jest, test } from "@jest/globals";
import { render, screen, within } from "@testing-library/react";

jest.doMock("@/components/task/editLoader", () => ({
  __esModule: true,
  default: ({ id }: { id: string }) => <p>{id}</p>,
}));
const { default: EditTaskPage } = jest.requireActual<typeof import("@/app/tasks/[id]/edit/page")>(
  "@/app/tasks/[id]/edit/page",
);

test("passes the route ID to the edit loader inside the main landmark", async () => {
  const id = "b6c7f4ca-1d77-49c5-8d48-9a3e76a14178";
  render(await EditTaskPage({ params: Promise.resolve({ id }) }));

  expect(within(screen.getByRole("main")).getByText(id)).toBeTruthy();
});

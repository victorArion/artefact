import { expect, test } from "@jest/globals";
import { renderToStaticMarkup } from "react-dom/server";
import RootLayout, { metadata } from "@/app/layout";

test("sets the document language and renders route content in the body", () => {
  const html = renderToStaticMarkup(<RootLayout><main>Conteúdo da rota</main></RootLayout>);

  expect(html).toContain('<html lang="pt-BR">');
  expect(html).toMatch(/<body>[\s\S]*<main>Conteúdo da rota<\/main>[\s\S]*<\/body>/);
  expect(metadata).toMatchObject({
    title: "Artefact",
    description: "Um gerenciador de tarefas simples",
  });
});

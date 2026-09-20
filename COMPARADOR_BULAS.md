# Comparador de Bulas — extensão do DBULÁRIO original

Esta branch parte da `main` do repositório `Diorgerb/dbulario`. **Não substitui o site por um projeto independente.** Preserva Home, Medicamentos, Sobre, FAQ, Contato, os componentes, a identidade visual, o `StatusBulasANVISA.csv` original e os routers já existentes.

## Testar no VS Code (Windows)

1. Baixe o ZIP desta branch pelo botão **Code → Download ZIP** no GitHub, ou faça `git checkout feature/comparador-bulas-browser-fetch` na sua cópia do projeto.
2. Abra **a raiz do repositório original** no VS Code.
3. No terminal, execute:

```bash
npm install
npx playwright install chromium
npm run dev
```

O projeto original inicia pelo script `server/_core/index.ts`. Use o endereço informado pelo terminal (normalmente `http://localhost:3000`). Acesse `/comparar-bulas`. Não utilize o endereço `localhost:5173` do pacote independente anterior como referência automática.

Se usar pnpm com o lockfile antigo, atualize-o uma vez com `pnpm install --no-frozen-lockfile` e versione o `pnpm-lock.yaml` antes de configurar um build CI/Vercel. A atualização do lockfile não foi executada nesta branch porque este ambiente não dispõe de acesso à instalação completa das dependências.

## Navegação

- `/medicamentos` mantém a tabela original e acrescenta **Comparar**, sem substituir seus dados.
- `/comparar-bulas` contém busca por nome, empresa ou registro e a aba **Últimas atualizações**, todas a partir do CSV existente.
- `/comparar-bulas/117660036` seleciona o produto correspondente a partir da base.
- O link público correto é `https://consultas.anvisa.gov.br/#/bulario/detalhe/1220881?numeroRegistro=117660036`. A URL pública não é a API JSON.

## Por que o fetch está no navegador?

O `server/lib/bula-diff/browser-anvisa.ts` abre um Chromium via Playwright, navega ao domínio `consultas.anvisa.gov.br` e executa `fetch()` por `page.evaluate()` na **mesma origem**. Essa requisição é diferente do `fetch` do Node usado na versão anterior. O backend recebe o histórico e os PDFs resultantes; o frontend só recebe o JSON do diff. Uma chamada `fetch` diretamente do React, hospedado em domínio diferente, pode ser bloqueada por CORS.

O método não garante superar qualquer bloqueio da ANVISA. Se o portal apresentar um desafio ou recusar a sessão, o sistema retorna um erro. Não são utilizadas credenciais privadas nem técnicas para burlar autenticação.

## Comparação e armazenamento

A API tRPC `bulaDiff.compare` aceita `{ idProduto, registrationNumber, type }`. Verifica a correspondência com o CSV, consulta o histórico, seleciona VP ou VPS, baixa a versão atual e procura a última versão cujo SHA-256 do PDF seja diferente. PDFs são mantidos somente em memória e descartados após a requisição. Textos estruturados, diffs e um índice de histórico são armazenados para evitar downloads e extrações desnecessários em consultas repetidas.

- **Local sem banco:** JSONs em `data/bula-diffs/`, ignorados pelo Git.
- **Com `DATABASE_URL` MySQL:** tabelas `dbulario_bula_versions`, `dbulario_bula_comparisons` e `dbulario_bula_snapshots`, criadas na primeira consulta se o usuário tiver permissão para DDL.
- **Vercel:** o armazenamento persistente exige `DATABASE_URL`; `/tmp` não é tratado como armazenamento permanente.

## Pendências de homologação e produção

Este código foi integrado à branch original, mas **não foi validado contra uma execução real da ANVISA neste ambiente**. O teste precisa cobrir um medicamento com VP e VPS, um caso com múltiplas apresentações, uma republicação idêntica e um PDF sem texto extraível. A extração automática pode divergir em tabelas, imagens e formatação — sempre confira o PDF oficial.

**A implantação do Chromium na Vercel não está resolvida automaticamente.** A função serverless padrão pode não ter binário, memória ou duração suficientes. Após homologação local, a opção robusta é mover apenas o processador Playwright/PDF para um worker com Chromium, deixando busca, interface, cache e tRPC no DBULÁRIO. Não publique como funcionalidade pronta antes desse teste de produção.

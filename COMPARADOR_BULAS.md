# Comparador de bulas — extensão do DBULÁRIO original

Esta branch preserva o projeto `Diorgerb/dbulario` e acrescenta `/comparar-bulas` com pesquisa na base CSV, atualizações recentes e comparação da bula atual com a edição anterior de PDF diferente. A `main` não é alterada.

## Teste local no VS Code (Windows)

```bash
npm install
npx playwright install chromium
npm run dev
```

Abra a porta exibida no terminal (normalmente `http://localhost:3000/comparar-bulas`). O frontend e a API usam a mesma aplicação Express/Vite. O registro é identificado no CSV; a consulta ao histórico e aos PDFs só acontece após escolher **Mostrar o que mudou**.

## Diagnóstico detalhado da consulta pelo navegador

Se a comparação falhar, rode o diagnóstico no terminal **da mesma máquina que executa o servidor**:

```bash
npx tsx scripts/diagnose-bulario-anvisa.ts 1220881 117660036
```

O diagnóstico informa em que etapa ocorreu a falha: (1) iniciar o navegador e abrir o detalhe; (2) consultar histórico por `page.evaluate(fetch)` na origem da ANVISA; (3) baixar e validar um PDF. Nenhum PDF é salvo pelo diagnóstico, e identificadores temporários não são registrados.

Para visualizar a janela do Chromium enquanto testa no PowerShell:

```powershell
$env:ANVISA_HEADLESS="false"
npx tsx scripts/diagnose-bulario-anvisa.ts 1220881 117660036
```

Para voltar ao modo sem janela: `Remove-Item Env:ANVISA_HEADLESS`. Opcionalmente pode-se definir `ANVISA_BROWSER_CHANNEL=msedge` para usar o Microsoft Edge instalado localmente, desde que a versão seja compatível com o Playwright.

**Interpretação das falhas:**

- `BROWSER_UNAVAILABLE`: o processo que executa o backend não conseguiu iniciar o navegador; verifique a instalação no ambiente correto.
- `ANVISA_NAVIGATION_FAILED`: falha ao abrir a página de detalhe do produto.
- `ANVISA_ACCESS_DENIED` (HTTP 401/403 ou página de restrição): a ANVISA recusou a sessão naquele ambiente; não atribua isso automaticamente à indisponibilidade geral do portal.
- `ANVISA_RATE_LIMITED` (429): aguarde; não execute requisições repetidas em sequência.
- `ANVISA_FETCH_FAILED`: a chamada dentro da página não foi concluída; examine a conectividade e os logs.
- `ANVISA_INVALID_RESPONSE`: o histórico não veio no formato esperado; pode haver mudança de API ou resposta de bloqueio.
- `ANVISA_INVALID_PDF`: o retorno não é PDF válido.

Os detalhes técnicos ficam no terminal do servidor sob `[BULA_DIFF]`, enquanto a interface apresenta orientações compreensíveis ao usuário.

## O que significa "fetch pelo navegador"

`server/lib/bula-diff/browser-anvisa.ts` abre Chromium pelo Playwright **no ambiente que executa o backend**. Abre `https://consultas.anvisa.gov.br/#/bulario/detalhe/{idProduto}?numeroRegistro={registro}` e executa `fetch()` via `page.evaluate()` na origem da ANVISA. Isso não significa que o Chrome do visitante seja usado. Fazer `fetch()` no React hospedado em `dbulario.vercel.app` constitui uma requisição entre origens e depende da configuração CORS da ANVISA. O Playwright também não garante que a origem da infraestrutura seja autorizada.

## Armazenamento e falhas temporárias

Os PDFs são processados em memória; o conteúdo extraído e as comparações são armazenados em JSON (local) ou MySQL (`DATABASE_URL`). Se uma consulta à ANVISA falhar **e existir resultado previamente salvo**, o sistema o retorna com `stale: true` e uma advertência visível de que não foi possível confirmar a versão mais recente. Nunca apresenta um resultado antigo como atual sem aviso. Sem resultado salvo, a falha é informada e a interface mantém o link para o PDF oficial.

## Produção Vercel: pendência operacional importante

O `vercel.json` atual **não provisiona um executável do Chromium**. Instalar o Playwright no VS Code não instala o navegador da função remota. Esta branch corrige os erros de classificação, a página inicial da ANVISA e o uso de resultados armazenados, mas **não configura automaticamente a execução Chromium em produção**. Antes de disponibilizar a comparação na Vercel, implante um ambiente de processamento com navegador e armazenamento persistente (por exemplo, um worker autorizado separado) ou configure, empacote e teste o navegador na função Vercel conforme os limites do seu plano. É necessário validar acesso real à ANVISA a partir do ambiente escolhido. A configuração local funcional não é prova de produção.

O `pnpm-lock.yaml` da branch base também precisa ser atualizado após `pnpm install --no-frozen-lockfile` porque novas dependências foram acrescentadas ao `package.json`. Essa atualização não foi concluída neste ambiente.

## Limites da comparação

O comparador identifica diferenças no texto extraído. Alguns PDFs, tabelas, imagens, múltiplas apresentações e alterações de layout podem não ser representados corretamente. Confira a bula oficial antes de tomar decisões regulatórias ou assistenciais.

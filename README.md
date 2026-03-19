# 📊 DBulário

Plataforma de monitoramento e inteligência regulatória para o Bulário Eletrônico da ANVISA.

---

## 🚀 Visão Geral

O **DBulário** é uma solução que automatiza a coleta, estruturação e análise de dados do Bulário Eletrônico da ANVISA, permitindo o acompanhamento contínuo de atualizações de bulas de medicamentos.

A ferramenta transforma dados públicos dispersos em informação estruturada, rastreável e acionável para equipes de Assuntos Regulatórios.

---

## 🎯 Objetivo

Eliminar processos manuais e aumentar a eficiência no monitoramento regulatório, proporcionando:

- Visibilidade centralizada das atualizações de bula  
- Rastreabilidade de alterações  
- Redução de risco regulatório  
- Ganho de produtividade operacional  

---

## ⚠️ Problema

O acompanhamento do Bulário da ANVISA apresenta limitações:

- Navegação manual e descentralizada  
- Dificuldade em identificar atualizações recentes  
- Baixa escalabilidade para múltiplos produtos ou empresas  

---

## 💡 Solução

O DBulário automatiza todo o fluxo:

1. Coleta dados diretamente do Bulário  
2. Estrura as informações em formato analítico  
3. Identifica alterações recentes  
4. Permite filtros personalizados  
5. Disponibiliza dados para consulta e análise  

---

## ⚙️ Funcionalidades

- 📥 Coleta automatizada de bulas  
- 🔄 Monitoramento diário de atualizações  
- 📊 Estruturação em CSV / base de dados  
- 🔍 Filtros por:
  - Empresa (CNPJ)
  - Produto
  - Número de registro  
- 🧠 Identificação de medicamentos de referência atualizados  
- 📈 Histórico de alterações  
- 🌐 Interface web para visualização  

---

## 🧱 Estrutura dos Dados

| Campo           | Descrição                         |
|-----------------|----------------------------------|
| idProduto       | Identificador do produto         |
| numeroRegistro  | Registro ANVISA                  |
| nomeProduto     | Nome do medicamento              |
| expediente      | Código do expediente             |
| razaoSocial     | Empresa detentora                |
| cnpj            | CNPJ                             |
| data            | Data do evento                   |
| numProcesso     | Número do processo               |
| dataAtualizacao | Última atualização identificada  |

---

## 🔄 Fluxo de Processamento

```mermaid
flowchart LR
A[Bulário ANVISA] --> B[Coleta automatizada]
B --> C[Tratamento de dados]
C --> D[Estruturação (CSV/DB)]
D --> E[Aplicação de filtros]
E --> F[Interface Web / Insights]
```

---

## 🌐 Acesso

🔗 https://dbulario.vercel.app/

---

## 📦 Casos de Uso

- Monitoramento regulatório contínuo  
- Inteligência competitiva  
- Auditorias e compliance  
- Suporte a submissões regulatórias  
- Análise de mercado farmacêutico  

---

## 🛠️ Stack

- **Frontend:** Next.js / React  
- **Backend:** Node.js  
- **Data Processing:** Python (ETL / scraping)  
- **Deploy:** Vercel  
- **Armazenamento:** CSV / Banco de dados  

---

## 📈 Diferenciais

- Automação completa do processo  
- Dados estruturados e prontos para análise  
- Escalável para múltiplas empresas  
- Baseado em dados públicos  
- Foco em produtividade regulatória  

---

## 🤝 Contribuição

1. Fork do projeto  
2. Criação de branch (`feature/nome-da-feature`)  
3. Commit das alterações  
4. Abertura de Pull Request  



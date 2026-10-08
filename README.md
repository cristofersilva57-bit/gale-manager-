# Gale Manager V1

Aplicativo web local para cálculo de Gale e gestão de risco em operações de opções binárias.

## Recursos

- Banca inicial padrão: **R$ 100,00**
- Entrada inicial padrão: **R$ 5,00**
- Payout ajustável
- Limite de Gale 0 a 4
- Cálculo do próximo valor pelo payout
- Stop-loss e stop-win
- Registro de WIN/LOSS
- Controle de banca, P&L e taxa de acerto
- Histórico salvo no `localStorage`
- Layout responsivo para desktop e celular

## Como usar

1. Abra `index.html` no navegador.
2. Ajuste banca, entrada, payout e limites.
3. Use **REGISTRAR WIN** ou **REGISTRAR LOSS** somente após o resultado real da operação.
4. O app calcula o próximo nível do ciclo.

## Publicar no GitHub Pages

1. Crie um repositório no GitHub, por exemplo `gale-manager`.
2. Envie `index.html`, `styles.css`, `app.js` e `README.md`.
3. No GitHub, abra **Settings → Pages**.
4. Em **Build and deployment**, selecione **Deploy from a branch**.
5. Selecione a branch `main` e a pasta `/root`.
6. Salve. O GitHub Pages publicará o app.

## Observação

Este aplicativo é uma ferramenta de cálculo e gerenciamento. Ele não prevê a próxima vela, não executa ordens e não garante recuperação de perdas ou lucro. O cálculo assume um modelo de payout em que o lucro líquido é `entrada × payout`.


## V2 — Soros de 5 níveis
A V2 substitui a lógica de Gale por um ciclo Soros de 5 níveis: WIN soma o lucro à entrada seguinte; LOSS reinicia no nível 1; após o 5º WIN, o ciclo é encerrado e reinicia na entrada inicial.

# 🚀 Guia de Deploy no Vercel - PoloCoin

Este projeto está 100% configurado e pronto para deploy no **Vercel**, combinando o Frontend estático moderno com a API Node.js/Express rodando via **Serverless Functions** (`/api/index.js`).

---

## ⚡ Método 1: Deploy Rápido via GitHub (Recomendado)

1. **Envie o código para o seu repositório no GitHub**:
   ```bash
   git add .
   git commit -m "feat: configuracao vercel e modernizacao frontend"
   git push origin main
   ```

2. **Acesse o Vercel**:
   - Entre em [vercel.com](https://vercel.com) e faça login.
   - Clique em **"Add New..."** -> **"Project"**.
   - Conecte sua conta do GitHub e selecione o repositório do **PoloCoin**.

3. **Configure as Variáveis de Ambiente (Environment Variables)**:
   - Na tela de configuração do projeto no Vercel, abra a seção **"Environment Variables"**.
   - Adicione as variáveis do Supabase:
     - `SUPABASE_URL`: sua URL do projeto Supabase (ex: `https://seu-projeto.supabase.co`)
     - `SUPABASE_ANON_KEY`: sua chave pública (`anon`) ou `service_role` do Supabase.

4. **Deploy**:
   - Não é necessário alterar **Framework Preset** (deixe em *Other*).
   - O comando de build já está definido como `echo 'Build complete'`.
   - Clique em **"Deploy"**! 🎉
   - Em menos de 1 minuto, seu sistema estará online com link HTTPS próprio.

---

## 💻 Método 2: Deploy Direto via Vercel CLI (Linha de Comando)

Se preferir fazer deploy direto do terminal sem Git:

1. Instale ou execute a Vercel CLI:
   ```bash
   npx vercel
   ```

2. Siga as instruções do terminal:
   - Faça login na sua conta Vercel.
   - Confirme o nome do projeto e configurações (basta apertar Enter para as opções padrão).

3. Para subir em produção:
   ```bash
   npx vercel --prod
   ```

---

## 📁 Estrutura Configurada para a Vercel

- **`vercel.json`**: Configura os rewrites para que todas as chamadas de API (`/login`, `/alunos`, `/turmas`, etc.) sejam roteadas para a Serverless Function do Express, enquanto os arquivos estáticos (`/app`, `/components`, `/const`, `/utils`, `/index.html`) são entregues de forma ultra-rápida via CDN global da Vercel.
- **`api/index.js`**: Ponto de entrada das Serverless Functions que executa a aplicação Express sem necessidade de servidor dedicado ligado 24/7.
- **`server.js`**: Agora exporta a instância `app` do Express com suporte dinâmico tanto para execução local (`node server.js` ouvindo na porta 3000) quanto para a Vercel.
- **`.vercelignore`**: Garante que arquivos desnecessários (como backups `.sql` e dumps locais) não sejam incluídos no pacote de produção.
- **`services/avatarService.js`**: Usa automaticamente a pasta temporária `/tmp` em ambientes serverless, evitando erros de sistema de arquivos somente leitura.

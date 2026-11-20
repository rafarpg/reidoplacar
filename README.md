# ReiDoPlacar

Bolão de palpites de futebol com ligas, 8 times fixos e 7 rodadas.
Feito com Node.js + Express, MySQL e HTML/CSS/JS puro.


## O que precisa ter instalado

- Node.js 20 ou mais novo (https://nodejs.org). O npm já vem junto.
- MySQL 8 ou XAMPP (https://www.apachefriends.org), que traz MySQL/MariaDB e phpMyAdmin.
- Git (https://git-scm.com).

Para conferir:

    node -v
    npm -v
    git --version


## Como rodar na sua máquina

1. Baixe o projeto e entre na pasta:

       git clone <URL-DO-REPOSITORIO>
       cd reidoplacar

2. Instale as dependências:

       npm install

3. Crie o banco de dados (veja "Banco de dados" abaixo).

4. Crie o arquivo .env copiando o exemplo:

       cp .env.example .env

   (no Prompt de Comando do Windows: copy .env.example .env)

   Abra o .env e ajuste:

       PORT=3000
       DB_HOST=localhost
       DB_PORT=3306
       DB_USER=root
       DB_PASSWORD=          (no XAMPP o root vem sem senha)
       DB_NAME=reidoplacar
       JWT_SECRET=qualquer-texto-grande-e-secreto

   Para gerar um JWT_SECRET:

       node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"

5. Inicie o servidor:

       npm start

   Ou, para reiniciar sozinho a cada alteração no código:

       npm run dev

6. Abra http://localhost:3000 no navegador.

   Para conferir se o banco conectou: http://localhost:3000/api/saude
   deve mostrar {"ok":true,"banco":"ok"}.


## Banco de dados

Tudo o que o banco precisa está em um arquivo só: db/banco.sql.
Ele cria as 7 tabelas e cadastra os 8 times.

Atenção: importar o arquivo apaga as tabelas que já existirem. Use para
criar o banco do zero ou quando quiser zerar tudo.

Opção A - pelo phpMyAdmin (XAMPP):

1. Ligue o Apache e o MySQL no painel do XAMPP.
2. Abra http://localhost/phpmyadmin.
3. Clique em "Novo", crie o banco "reidoplacar" (agrupamento utf8mb4_general_ci).
4. Com o banco selecionado, vá na aba "Importar", escolha db/banco.sql e clique em "Importar".

Opção B - pelo terminal:

    mysql -u root -p -e "CREATE DATABASE reidoplacar CHARACTER SET utf8mb4"
    mysql -u root -p reidoplacar < db/banco.sql

(sem senha no root, tire o -p)


## Comandos do Git

Configurar seu nome e e-mail (só uma vez por máquina):

    git config --global user.name "Seu Nome"
    git config --global user.email "seu@email.com"

Baixar o projeto (primeira vez):

    git clone <URL-DO-REPOSITORIO>

Ver o que mudou:

    git status
    git diff

Salvar alterações (commit):

    git add .
    git commit -m "Descreva o que mudou"

Enviar para o GitHub (push):

    git push

Pegar as alterações dos colegas (pull):

    git pull

Ver o histórico:

    git log --oneline

Trabalhar em uma branch separada:

    git checkout -b nome-da-branch      (cria e entra na branch)
    git push -u origin nome-da-branch   (envia a branch pela primeira vez)
    git checkout main                   (volta para a main)
    git merge nome-da-branch            (traz as mudanças da branch para a main)

Desfazer alterações em um arquivo que ainda não foi commitado:

    git restore nome-do-arquivo

Subir um projeto que ainda não está no GitHub (só uma vez):

1. Crie um repositório vazio no GitHub (sem README).
2. Na pasta do projeto:

       git remote add origin <URL-DO-REPOSITORIO>
       git branch -M main
       git push -u origin main

Nunca faça commit do arquivo .env (ele tem senhas). Ele já está no .gitignore.


## Deploy no Railway

1. Em railway.com, entre com o GitHub e crie um projeto vazio.
2. Adicione um banco: + New > Database > MySQL.
3. Adicione o app: + New > GitHub Repo > reidoplacar.
4. No serviço do app, aba Variables, crie:

       DB_HOST=${{MySQL.MYSQLHOST}}
       DB_PORT=${{MySQL.MYSQLPORT}}
       DB_USER=${{MySQL.MYSQLUSER}}
       DB_PASSWORD=${{MySQL.MYSQLPASSWORD}}
       DB_NAME=${{MySQL.MYSQLDATABASE}}
       JWT_SECRET=um-texto-grande-e-secreto

   Não crie PORT, o Railway define sozinho.
5. Para importar o banco: + New > Template > phpMyAdmin, com as variáveis
   PMA_HOST=${{MySQL.MYSQLHOST}} e PMA_PORT=${{MySQL.MYSQLPORT}}.
   Gere um domínio para ele, entre com MYSQLUSER/MYSQLPASSWORD, selecione
   o banco "railway" e importe db/banco.sql.
6. No serviço do app: Settings > Networking > Generate Domain.
7. Teste: https://<seu-app>.up.railway.app/api/saude deve mostrar {"ok":true,"banco":"ok"}.

Cada push na main publica o site sozinho.

(function () {
  const usuario = sessao.usuario();
  const h = document.createElement('header');

  const logo = document.createElement('img');
  logo.src = '/img/logo.png';
  logo.alt = 'ReiDoPlacar';
  const inicio = document.createElement('a');
  inicio.href = '/minhas-ligas.html';
  inicio.appendChild(logo);

  const espaco = document.createElement('span');
  espaco.className = 'espaco';
  const nome = document.createElement('a');
  nome.href = '/perfil.html';
  nome.className = 'btn-usuario';
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('width', '18');
  svg.setAttribute('height', '18');
  svg.setAttribute('fill', 'currentColor');
  const cabeca = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  cabeca.setAttribute('cx', '12');
  cabeca.setAttribute('cy', '8');
  cabeca.setAttribute('r', '4');
  const ombros = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  ombros.setAttribute('d', 'M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7z');
  svg.append(cabeca, ombros);
  const texto = document.createElement('span');
  texto.textContent = usuario ? usuario.nome : '';
  nome.append(svg, texto);
  const sair = document.createElement('button');
  sair.className = 'btn-sair';
  sair.textContent = 'Sair';
  sair.onclick = () => { sessao.sair(); location.href = '/index.html'; };

  h.append(inicio, espaco, nome, sair);
  const menu = document.createElement('nav');
  menu.className = 'menu';
  [['Minhas ligas', '/minhas-ligas.html'], ['Ligas públicas', '/ligas.html'], ['Criar liga', '/criar-liga.html']]
    .forEach(([texto, url]) => {
      const a = document.createElement('a');
      a.href = url;
      a.textContent = texto;
      if (location.pathname === url) a.className = 'ativa';
      menu.appendChild(a);
    });

  document.body.prepend(menu);
  document.body.prepend(h);
})();

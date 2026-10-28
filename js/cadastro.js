const form = document.getElementById('cadastroForm');
const nomeInput = document.getElementById('nome');
const emailInput = document.getElementById('email');
const senhaInput = document.getElementById('senha');
const confirmarInput = document.getElementById('confirmar');
const termosInput = document.getElementById('termos');

const nomeError = document.getElementById('nomeError');
const emailError = document.getElementById('emailError');
const senhaError = document.getElementById('senhaError');
const confirmarError = document.getElementById('confirmarError');
const termosError = document.getElementById('termosError');

const feedback = document.getElementById('feedback');
const btn = document.getElementById('btnCadastrar');
const toggles = document.querySelectorAll('.toggle-pass');
const forcaBarra = document.getElementById('forcaBarra');
const forcaTexto = document.getElementById('forcaTexto');


const MODO_TESTE = true;

const esperar = (ms) => new Promise((r) => setTimeout(r, ms));


const conviteBanner = document.getElementById('conviteBanner');
const NOMES_CARGO = { professor: 'professor', coordenacao: 'coordenação' };
const convite = (new URLSearchParams(window.location.search).get('convite') || '').trim();

function bloquearFormulario(mensagem) {
  conviteBanner.textContent = mensagem;
  conviteBanner.classList.add('show');
  conviteBanner.style.background = '#fee2e2';
  conviteBanner.style.color = '#991b1b';
  form.querySelectorAll('input, button').forEach((el) => (el.disabled = true));
}

async function verificarConvite() {
  if (!convite) return; 

  try {
    const resposta = MODO_TESTE
      ? { ok: true, json: async () => ({ valido: true, cargo: 'professor' }) }
      : await fetch('/api/convites/' + encodeURIComponent(convite));
    const dados = await resposta.json().catch(() => ({}));

    if (!resposta.ok || !dados.valido) {
      bloquearFormulario(dados.mensagem || 'Este convite é inválido, já foi usado ou expirou. Peça um novo à coordenação.');
      return;
    }

    const cargo = NOMES_CARGO[dados.cargo] || dados.cargo;
    conviteBanner.textContent = 'Você foi convidado para entrar como ' + cargo + '.';
    conviteBanner.classList.add('show');

    if (dados.email) {
      emailInput.value = dados.email;
      emailInput.readOnly = true;
    }
  } catch (e) {
    bloquearFormulario('Não foi possível verificar o convite. Tente novamente em instantes.');
  }
}

verificarConvite();

toggles.forEach((botao) => {
  botao.addEventListener('click', () => {
    const input = document.getElementById(botao.dataset.alvo);
    const mostrando = input.type === 'text';
    input.type = mostrando ? 'password' : 'text';
    botao.textContent = mostrando ? 'Mostrar' : 'Ocultar';
    botao.setAttribute('aria-label', mostrando ? 'Mostrar senha' : 'Ocultar senha');
  });
});

function calcularForca(senha) {
  let pontos = 0;
  if (senha.length >= 8) pontos++;
  if (senha.length >= 12) pontos++;
  if (/[a-z]/.test(senha) && /[A-Z]/.test(senha)) pontos++;
  if (/\d/.test(senha)) pontos++;
  if (/[^A-Za-z0-9]/.test(senha)) pontos++;
  return pontos; 
}

senhaInput.addEventListener('input', () => {
  const senha = senhaInput.value;
  if (!senha) {
    forcaBarra.style.width = '0';
    forcaTexto.textContent = '';
    return;
  }
  const pontos = calcularForca(senha);
  const niveis = [
    { texto: 'Muito fraca', cor: '#dc2626' },
    { texto: 'Fraca', cor: '#ea580c' },
    { texto: 'Razoável', cor: '#ca8a04' },
    { texto: 'Boa', cor: '#65a30d' },
    { texto: 'Forte', cor: '#16a34a' },
    { texto: 'Muito forte', cor: '#15803d' }
  ];
  const nivel = niveis[pontos];
  forcaBarra.style.width = ((pontos + 1) / 6 * 100) + '%';
  forcaBarra.style.background = nivel.cor;
  forcaTexto.textContent = 'Força da senha: ' + nivel.texto;
});

function erro(input, elementoErro, mensagem) {
  elementoErro.textContent = mensagem;
  if (input) input.classList.add('invalid');
}

function validar() {
  let ok = true;
  const nome = nomeInput.value.trim();
  const email = emailInput.value.trim();
  const senha = senhaInput.value;
  const confirmar = confirmarInput.value;

  [nomeError, emailError, senhaError, confirmarError, termosError].forEach((el) => (el.textContent = ''));
  [nomeInput, emailInput, senhaInput, confirmarInput].forEach((el) => el.classList.remove('invalid'));

  if (!nome) {
    erro(nomeInput, nomeError, 'Informe seu nome.'); ok = false;
  } else if (nome.length < 3) {
    erro(nomeInput, nomeError, 'O nome deve ter pelo menos 3 caracteres.'); ok = false;
  }

  if (!email) {
    erro(emailInput, emailError, 'Informe seu e-mail.'); ok = false;
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    erro(emailInput, emailError, 'E-mail inválido.'); ok = false;
  }

  if (!senha) {
    erro(senhaInput, senhaError, 'Crie uma senha.'); ok = false;
  } else if (senha.length < 8) {
    erro(senhaInput, senhaError, 'A senha deve ter pelo menos 8 caracteres.'); ok = false;
  } else if (!/[A-Za-z]/.test(senha) || !/\d/.test(senha)) {
    erro(senhaInput, senhaError, 'Use letras e números na senha.'); ok = false;
  }

  if (!confirmar) {
    erro(confirmarInput, confirmarError, 'Confirme sua senha.'); ok = false;
  } else if (senha !== confirmar) {
    erro(confirmarInput, confirmarError, 'As senhas não coincidem.'); ok = false;
  }

  if (!termosInput.checked) {
    termosError.textContent = 'Você precisa aceitar os termos para continuar.'; ok = false;
  }

  return ok;
}

function mostrarFeedback(msg, tipo) {
  feedback.textContent = msg;
  feedback.className = 'form-feedback ' + tipo;
}

// Envio do formulário
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  feedback.className = 'form-feedback';
  if (!validar()) return;

  btn.disabled = true;
  btn.textContent = 'Criando conta...';

  try {
    let resposta;
    if (MODO_TESTE) {
      await esperar(600);
      resposta = { ok: true, json: async () => ({}) };
    } else {
      resposta = await fetch('/api/cadastro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: nomeInput.value.trim(),
          email: emailInput.value.trim(),
          senha: senhaInput.value,
          convite: convite || undefined 
        })
      });
    }

    if (!resposta.ok) {
      const dados = await resposta.json().catch(() => ({}));
      throw new Error(dados.mensagem || 'Não foi possível criar a conta. Tente novamente.');
    }

    mostrarFeedback('Conta criada com sucesso! ', 'success');
    const linkLogin = document.createElement('a');
    linkLogin.href = 'login.html';
    linkLogin.textContent = 'Ir para o login';
    feedback.appendChild(document.createElement('br'));
    feedback.appendChild(linkLogin);

    btn.textContent = 'Conta criada!';

  } catch (err) {
    mostrarFeedback(err.message || 'Erro ao conectar. Tente novamente.', 'error');
    btn.disabled = false;
    btn.textContent = 'Criar conta';
  }
});
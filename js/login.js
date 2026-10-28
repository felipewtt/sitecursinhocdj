const form = document.getElementById('loginForm');
const emailInput = document.getElementById('email');
const senhaInput = document.getElementById('senha');
const emailError = document.getElementById('emailError');
const senhaError = document.getElementById('senhaError');
const feedback = document.getElementById('feedback');
const btn = document.getElementById('btnEntrar');
const toggle = document.getElementById('togglePass');
const lembrar = document.getElementById('lembrar');
const cargoError = document.getElementById('cargoError');

// Cargos aceitos e página para onde todos vão depois de entrar
const CARGOS_VALIDOS = ['aluno', 'professor', 'coordenacao'];
const PAGINA_INICIAL = 'index.html';

// ===== MODO DE TESTE =====
// true  = simula o servidor (qualquer e-mail/senha válidos entram). Só para testar a tela.
// false = usa o back-end de verdade. DEIXE false QUANDO O SITE FOR PARA O AR.
const MODO_TESTE = true;

async function enviarLogin(corpo) {
  if (MODO_TESTE) {
    await new Promise((r) => setTimeout(r, 600));
    return { ok: true, status: 200, json: async () => ({ cargo: corpo.cargo }) };
  }
  // ===== TROQUE PELA URL DO SEU BACK-END =====
  return fetch('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(corpo)
  });
}

function cargoSelecionado() {
  const marcado = document.querySelector('input[name="cargo"]:checked');
  return marcado ? marcado.value : '';
}

// Preenche o e-mail e o cargo se o usuário marcou "Lembrar de mim" antes
// (nunca guarde a senha no navegador por conta própria)
try {
  const salvo = localStorage.getItem('emailLembrado');
  if (salvo) { emailInput.value = salvo; lembrar.checked = true; }

  const cargoSalvo = localStorage.getItem('cargoLembrado');
  const radio = cargoSalvo && document.querySelector('input[name="cargo"][value="' + cargoSalvo + '"]');
  if (radio) radio.checked = true;
} catch (e) {}

// Mostrar / ocultar senha
toggle.addEventListener('click', () => {
  const mostrando = senhaInput.type === 'text';
  senhaInput.type = mostrando ? 'password' : 'text';
  toggle.textContent = mostrando ? 'Mostrar' : 'Ocultar';
  toggle.setAttribute('aria-label', mostrando ? 'Mostrar senha' : 'Ocultar senha');
});

// Validação dos campos
function validar() {
  let ok = true;
  const email = emailInput.value.trim();
  const senha = senhaInput.value;

  cargoError.textContent = '';
  emailError.textContent = '';
  senhaError.textContent = '';
  emailInput.classList.remove('invalid');
  senhaInput.classList.remove('invalid');

  if (!CARGOS_VALIDOS.includes(cargoSelecionado())) {
    cargoError.textContent = 'Selecione como deseja entrar.';
    ok = false;
  }

  if (!email) {
    emailError.textContent = 'Informe seu e-mail.';
    emailInput.classList.add('invalid'); ok = false;
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    emailError.textContent = 'E-mail inválido.';
    emailInput.classList.add('invalid'); ok = false;
  }

  if (!senha) {
    senhaError.textContent = 'Informe sua senha.';
    senhaInput.classList.add('invalid'); ok = false;
  } else if (senha.length < 6) {
    senhaError.textContent = 'A senha deve ter pelo menos 6 caracteres.';
    senhaInput.classList.add('invalid'); ok = false;
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
  btn.textContent = 'Entrando...';

  const cargo = cargoSelecionado();

  try {
    const resposta = await enviarLogin({
      email: emailInput.value.trim(),
      senha: senhaInput.value,
      cargo: cargo
    });

    if (resposta.status === 403) {
      const dados = await resposta.json().catch(() => ({}));
      throw new Error(dados.mensagem || 'Você não tem permissão para entrar como ' + cargo + '.');
    }

    if (!resposta.ok) {
      const dados = await resposta.json().catch(() => ({}));
      throw new Error(dados.mensagem || 'E-mail ou senha incorretos.');
    }

    // O servidor devolve o cargo REAL da conta, e é ele quem manda.
    // Se for diferente do escolhido na tela, não deixa entrar.
    const dados = await resposta.json().catch(() => ({}));
    if (dados.cargo !== cargo) {
      throw new Error('Esta conta não está cadastrada como ' + cargo + '.');
    }

    // Lembrar e-mail e cargo (nunca a senha)
    try {
      if (lembrar.checked) {
        localStorage.setItem('emailLembrado', emailInput.value.trim());
        localStorage.setItem('cargoLembrado', cargo);
      } else {
        localStorage.removeItem('emailLembrado');
        localStorage.removeItem('cargoLembrado');
      }
    } catch (e) {}

    mostrarFeedback('Login realizado com sucesso! Redirecionando...', 'success');
    setTimeout(() => { window.location.href = PAGINA_INICIAL; }, 1000);

  } catch (erro) {
    mostrarFeedback(erro.message || 'Erro ao conectar. Tente novamente.', 'error');
    btn.disabled = false;
    btn.textContent = 'Entrar';
  }
});
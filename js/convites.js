const form = document.getElementById('conviteForm');
const emailInput = document.getElementById('emailConvidado');
const validadeSelect = document.getElementById('validade');
const emailError = document.getElementById('emailError');
const feedback = document.getElementById('feedback');
const btn = document.getElementById('btnGerar');
const resultado = document.getElementById('resultado');
const linkInput = document.getElementById('linkConvite');
const btnCopiar = document.getElementById('btnCopiar');
const validadeTexto = document.getElementById('validadeTexto');

function mostrarFeedback(msg, tipo) {
  feedback.textContent = msg;
  feedback.className = 'form-feedback ' + tipo;
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  feedback.className = 'form-feedback';
  resultado.classList.remove('show');
  emailError.textContent = '';
  emailInput.classList.remove('invalid');

  // O e-mail é opcional: se preenchido, o convite só funciona para ele
  const email = emailInput.value.trim();
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    emailError.textContent = 'E-mail inválido.';
    emailInput.classList.add('invalid');
    return;
  }

  btn.disabled = true;
  btn.textContent = 'Gerando...';

  try {
    // ===== TROQUE PELA URL DO SEU BACK-END =====
    // O servidor precisa confirmar que quem chama esta rota é da coordenação.
    const resposta = await fetch('/api/convites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cargo: 'professor',
        email: email || undefined,
        validadeDias: Number(validadeSelect.value)
      })
    });

    if (resposta.status === 401 || resposta.status === 403) {
      throw new Error('Apenas a coordenação pode gerar convites. Faça login novamente.');
    }
    if (!resposta.ok) {
      const dados = await resposta.json().catch(() => ({}));
      throw new Error(dados.mensagem || 'Não foi possível gerar o convite.');
    }

    const dados = await resposta.json();
    const link = window.location.origin + '/cadastro.html?convite=' + encodeURIComponent(dados.codigo);

    linkInput.value = link;
    validadeTexto.textContent = 'Válido por ' + validadeSelect.value + ' dia(s), uso único'
      + (email ? ', somente para ' + email : '') + '.';
    resultado.classList.add('show');
    btnCopiar.textContent = 'Copiar';
  } catch (err) {
    mostrarFeedback(err.message || 'Erro ao conectar. Tente novamente.', 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Gerar convite';
  }
});

btnCopiar.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(linkInput.value);
  } catch (e) {
    linkInput.select();
    document.execCommand('copy');
  }
  btnCopiar.textContent = 'Copiado!';
});

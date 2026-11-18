const CONFIRM_PRODUCTION = 'production';

export function fail(message) {
  console.error(message);
  process.exit(1);
}

export function readArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith('--')) {
      fail(`Argumento no reconocido: ${token}`);
    }
    const key = token.slice(2);
    const value = argv[i + 1];
    if (!value || value.startsWith('--')) {
      fail(`Falta el valor de --${key}`);
    }
    if (Object.prototype.hasOwnProperty.call(args, key)) {
      fail(`--${key} está repetido.`);
    }
    args[key] = value;
    i += 1;
  }
  return args;
}

export function requireProduction(args) {
  if (args.confirm !== CONFIRM_PRODUCTION) {
    fail(
      'Tienes que pasar --confirm production para usar el backend real.',
    );
  }
}

export function requireSecret() {
  if (process.argv.includes('--secret')) {
    fail('El secreto va en ACCOUNT_PROVISION_SECRET, no en el comando.');
  }
  const secret = process.env.ACCOUNT_PROVISION_SECRET ?? '';
  if (secret.trim().length < 32) {
    fail(
      'Define ACCOUNT_PROVISION_SECRET en esta consola, con al menos 32 caracteres, igual que en Railway.',
    );
  }
  return secret;
}

export function resolveEndpoint(raw, pathname) {
  let url;
  try {
    url = new URL(raw);
  } catch {
    fail('La URL del backend no es válida.');
  }
  if (url.protocol !== 'https:') {
    fail('La URL tiene que usar https.');
  }
  if (url.username || url.password) {
    fail('La URL no puede incluir usuario ni contraseña.');
  }

  const path = url.pathname.replace(/\/+$/, '');
  if (path === '') {
    url.pathname = pathname;
  } else if (path !== pathname) {
    fail(
      'Usa la URL base del backend, sin ruta. Ejemplo: https://tu-servicio.up.railway.app',
    );
  }
  url.search = '';
  url.hash = '';
  return url.toString();
}

export async function postAccountCommand(endpoint, secret, body) {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-account-provision-secret': secret,
    },
    body: JSON.stringify(body),
  });

  const text = await response.text();
  let payload = text;
  try {
    payload = JSON.stringify(JSON.parse(text), null, 2);
  } catch {
    payload = text;
  }

  if (!response.ok) {
    console.error(`El backend respondió ${response.status}.`);
    console.error(payload);
    process.exit(1);
  }

  return { status: response.status, payload };
}

export { CONFIRM_PRODUCTION };

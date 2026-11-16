/**
 * Crea una cuenta en el backend desplegado, sin datos de Stripe.
 *
 * PowerShell:
 *   $env:ACCOUNT_PROVISION_SECRET = "<el mismo valor de Railway, 32+ caracteres>"
 *   npm run account:provision -- --url https://<host-de-railway> --confirm production --name "Gimnasio" --type coach --email owner@gmail.com
 *
 * Después:
 *   Remove-Item Env:ACCOUNT_PROVISION_SECRET
 *
 * La cuenta queda sin contraseña y con requiresPasswordChange en true.
 * Stripe queda vacío. El dueño crea su contraseña al entrar.
 *
 * --type: coach | studio | pro | business | personalized
 * --branch es opcional.
 * La contraseña y el secreto no se aceptan como argumentos.
 */

const ACCOUNT_TYPES = new Set([
  'coach',
  'studio',
  'pro',
  'business',
  'personalized',
]);
const CONFIRM_PRODUCTION = 'production';

function fail(message) {
  console.error(message);
  process.exit(1);
}

function readArgs(argv) {
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

function resolveEndpoint(raw) {
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
    url.pathname = '/accounts/provision';
  } else if (path !== '/accounts/provision') {
    fail(
      'Usa la URL base del backend, sin ruta. Ejemplo: https://tu-servicio.up.railway.app',
    );
  }
  url.search = '';
  url.hash = '';
  return url.toString();
}

const args = readArgs(process.argv);
if (args.password) {
  fail(
    'Esta cuenta se crea sin contraseña. No pases --password.',
  );
}
if (args.secret) {
  fail('El secreto va en ACCOUNT_PROVISION_SECRET, no en el comando.');
}
if (args.confirm !== CONFIRM_PRODUCTION) {
  fail(
    'Tienes que pasar --confirm production para crear la cuenta en el backend real.',
  );
}
if (!args.url || !args.name || !args.type || !args.email) {
  fail(
    'Faltan datos. Requeridos: --url, --confirm production, --name, --type, --email.',
  );
}
if (!ACCOUNT_TYPES.has(args.type)) {
  fail(
    '--type tiene que ser coach, studio, pro, business o personalized.',
  );
}

const secret = process.env.ACCOUNT_PROVISION_SECRET ?? '';
if (secret.trim().length < 32) {
  fail(
    'Define ACCOUNT_PROVISION_SECRET en esta consola, con al menos 32 caracteres, igual que en Railway.',
  );
}

const endpoint = resolveEndpoint(args.url);
const body = {
  name: args.name,
  type: args.type,
  email: args.email,
  confirm: CONFIRM_PRODUCTION,
};
if (args.branch) {
  body.branch = args.branch;
}

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

console.log(
  `Cuenta creada (${response.status}). Quedó sin contraseña, con cambio de contraseña pendiente, y sin datos de Stripe.`,
);
console.log(payload);
console.log(
  'Borra el secreto de esta consola: Remove-Item Env:ACCOUNT_PROVISION_SECRET',
);

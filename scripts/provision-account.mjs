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
 */

import {
  CONFIRM_PRODUCTION,
  fail,
  postAccountCommand,
  readArgs,
  requireProduction,
  requireSecret,
  resolveEndpoint,
} from './account-remote-command.mjs';

const ACCOUNT_TYPES = new Set([
  'coach',
  'studio',
  'pro',
  'business',
  'personalized',
]);

const args = readArgs(process.argv);
if (args.password) {
  fail('Esta cuenta se crea sin contraseña. No pases --password.');
}
requireProduction(args);
if (!args.url || !args.name || !args.type || !args.email) {
  fail(
    'Faltan datos. Requeridos: --url, --confirm production, --name, --type, --email.',
  );
}
if (!ACCOUNT_TYPES.has(args.type)) {
  fail('--type tiene que ser coach, studio, pro, business o personalized.');
}

const secret = requireSecret();
const endpoint = resolveEndpoint(args.url, '/accounts/provision');
const body = {
  name: args.name,
  type: args.type,
  email: args.email,
  confirm: CONFIRM_PRODUCTION,
};
if (args.branch) {
  body.branch = args.branch;
}

const result = await postAccountCommand(endpoint, secret, body);
console.log(
  `Cuenta creada (${result.status}). Quedó sin contraseña, con cambio de contraseña pendiente, y sin datos de Stripe.`,
);
console.log(result.payload);
console.log(
  'Borra el secreto de esta consola: Remove-Item Env:ACCOUNT_PROVISION_SECRET',
);

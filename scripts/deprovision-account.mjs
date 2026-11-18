/**
 * Da de baja una cuenta en el backend desplegado.
 * El correo y el nombre tienen que coincidir con la cuenta vigente.
 *
 * PowerShell:
 *   $env:ACCOUNT_PROVISION_SECRET = "<el mismo valor de Railway, 32+ caracteres>"
 *   npm run account:deprovision -- --url https://<host-de-railway> --confirm production --name "Gimnasio" --email owner@gmail.com
 *
 * Después:
 *   Remove-Item Env:ACCOUNT_PROVISION_SECRET
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

const args = readArgs(process.argv);
requireProduction(args);
if (!args.url || !args.name || !args.email) {
  fail(
    'Faltan datos. Requeridos: --url, --confirm production, --name, --email.',
  );
}

const secret = requireSecret();
const endpoint = resolveEndpoint(args.url, '/accounts/deprovision');
const result = await postAccountCommand(endpoint, secret, {
  name: args.name,
  email: args.email,
  confirm: CONFIRM_PRODUCTION,
});

console.log(`Cuenta dada de baja (${result.status}).`);
console.log(result.payload);
console.log(
  'Borra el secreto de esta consola: Remove-Item Env:ACCOUNT_PROVISION_SECRET',
);

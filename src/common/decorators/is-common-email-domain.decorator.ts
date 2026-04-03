import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';

const ALLOWED_DOMAINS = new Set([
  'gmail.com',
  'outlook.com',
  'hotmail.com',
  'yahoo.com',
  'icloud.com',
  'aol.com',
  'protonmail.com',
]);

@ValidatorConstraint({ name: 'isCommonEmailDomain', async: false })
export class IsCommonEmailDomainConstraint
  implements ValidatorConstraintInterface
{
  validate(value: string, _args: ValidationArguments): boolean {
    if (typeof value !== 'string' || !value.includes('@')) {
      return false;
    }
    const at = value.lastIndexOf('@');
    const local = value.slice(0, at);
    const domain = value.slice(at + 1).toLowerCase();
    if (!local || !domain) {
      return false;
    }
    return ALLOWED_DOMAINS.has(domain);
  }

  defaultMessage(): string {
    return 'Please use a common email provider (e.g., Gmail, Outlook).';
  }
}

export function IsCommonEmailDomain(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsCommonEmailDomainConstraint,
    });
  };
}

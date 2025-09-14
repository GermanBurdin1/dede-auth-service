import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';

export function NoHtml(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'noHtml',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any) {
          if (typeof value !== 'string') return true;
          
          // Проверяем на наличие HTML тегов
          const htmlRegex = /<[^>]*>/g;
          return !htmlRegex.test(value);
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} не должно содержать HTML теги`;
        },
      },
    });
  };
}
